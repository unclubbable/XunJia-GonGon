package com.taxi.ai.service;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.taxi.api.Client.ServiceTicketClient;
import com.taxi.api.constant.AgentConstants;
import com.taxi.api.dto.AgentConversation;
import com.taxi.api.dto.Ticket;
import com.taxi.api.exception.BusinessException;
import com.taxi.api.request.TicketAiAssistRequest;
import com.taxi.api.request.TicketAiChatRequest;
import com.taxi.api.response.TicketAiAssistVO;
import com.taxi.api.response.TicketAiChatVO;
import com.taxi.api.response.TicketDetailVO;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.api.util.FeignResultUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class TicketAssistService {

    @Autowired
    private ConversationService conversationService;
    @Autowired
    private PythonAgentClient pythonAgentClient;
    @Autowired
    private ServiceTicketClient serviceTicketClient;

    public TicketAiAssistVO assist(TicketAiAssistRequest request) {
        if (request == null || request.getTicketId() == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "ticketId 不能为空");
        }

        Long operatorId = request.getOperatorId() == null ? 1L : request.getOperatorId();
        String operatorName = StringUtils.hasText(request.getOperatorName()) ? request.getOperatorName() : "admin";
        boolean newThread = Boolean.TRUE.equals(request.getNewThread());

        TicketDetailVO detail = FeignResultUtils.checkAndGet(
                serviceTicketClient.detail(request.getTicketId()),
                ResultCodeEnum.PARAM_ERROR
        );
        Ticket ticket = detail.getTicket();
        if (ticket == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "工单不存在");
        }

        String title = "工单协查-" + (StringUtils.hasText(ticket.getTicketNo())
                ? ticket.getTicketNo()
                : String.valueOf(ticket.getId()));

        AgentConversation conversation = conversationService.getOrCreate(
                AgentConstants.USER_ADMIN,
                operatorId,
                AgentConstants.SCENE_TICKET_ASSIST,
                ticket.getId(),
                title,
                newThread
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("thread_id", conversation.getThreadId());
        payload.put("ticket_id", ticket.getId());
        payload.put("user_type", AgentConstants.USER_ADMIN);
        payload.put("user_id", operatorId);
        payload.put("operator_name", operatorName);
        payload.put("agent_scene", AgentConstants.SCENE_TICKET_ASSIST);
        payload.put("ticket", JSONUtil.parseObj(JSONUtil.toJsonStr(ticket)));
        payload.put("messages", detail.getMessages());

        JSONObject py = pythonAgentClient.ticketAssist(payload);
        conversationService.touch(conversation.getId());

        TicketAiAssistVO vo = new TicketAiAssistVO();
        vo.setTicketId(ticket.getId());
        vo.setThreadId(conversation.getThreadId());
        vo.setConversationId(conversation.getId());
        vo.setPhase(py.getInt("phase", 1));
        vo.setEcho(py.getBool("echo", true));
        vo.setMessage(py.getStr("message"));
        vo.setAiSummary(py.getStr("summary"));
        Object suggestion = py.get("suggestion");
        if (suggestion != null) {
            vo.setAiSuggestionJson(suggestion instanceof String
                    ? (String) suggestion
                    : JSONUtil.toJsonStr(suggestion));
        }

        // 空跑结果写回工单 AI 字段
        try {
            Result saveResult = serviceTicketClient.saveAiDraft(
                    ticket.getId(),
                    vo.getAiSummary(),
                    vo.getAiSuggestionJson()
            );
            if (saveResult != null && !saveResult.isOk()) {
                log.warn("save ai draft failed: {} {}", saveResult.getCode(), saveResult.getMessage());
            }
        } catch (Exception ex) {
            log.warn("save ai draft skipped: {}", ex.getMessage());
        }

        return vo;
    }

    public TicketAiChatVO chat(TicketAiChatRequest request) {
        if (request == null || !StringUtils.hasText(request.getQuestion())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "question 不能为空");
        }
        Long operatorId = request.getOperatorId() == null ? 1L : request.getOperatorId();
        String operatorName = StringUtils.hasText(request.getOperatorName()) ? request.getOperatorName() : "admin";
        boolean newThread = Boolean.TRUE.equals(request.getNewThread());

        Long ticketId = request.getTicketId();
        String title = "协议问答";
        String ticketContext = "";
        String audience = request.getAudience();

        if (ticketId != null) {
            TicketDetailVO detail = FeignResultUtils.checkAndGet(
                    serviceTicketClient.detail(ticketId),
                    ResultCodeEnum.PARAM_ERROR
            );
            Ticket ticket = detail.getTicket();
            if (ticket == null) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "工单不存在");
            }
            title = "工单问答-" + (StringUtils.hasText(ticket.getTicketNo())
                    ? ticket.getTicketNo()
                    : String.valueOf(ticket.getId()));
            ticketContext = "ticketNo=" + ticket.getTicketNo()
                    + ", category=" + ticket.getCategory()
                    + ", status=" + ticket.getStatus()
                    + ", content=" + ticket.getContent();
            if (!StringUtils.hasText(audience)) {
                if (Integer.valueOf(1).equals(ticket.getSource())) {
                    audience = "passenger";
                } else if (Integer.valueOf(2).equals(ticket.getSource())) {
                    audience = "driver";
                }
            }
        }

        String scene = ticketId == null ? AgentConstants.SCENE_POLICY_QA : AgentConstants.SCENE_TICKET_ASSIST;
        AgentConversation conversation = conversationService.getOrCreate(
                AgentConstants.USER_ADMIN,
                operatorId,
                scene,
                ticketId,
                title,
                newThread
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("thread_id", conversation.getThreadId());
        payload.put("ticket_id", ticketId);
        payload.put("question", request.getQuestion().trim());
        payload.put("user_type", AgentConstants.USER_ADMIN);
        payload.put("user_id", operatorId);
        payload.put("operator_name", operatorName);
        payload.put("audience", audience);
        payload.put("ticket_context", ticketContext);
        payload.put("history", request.getHistory());

        JSONObject py = pythonAgentClient.ticketChat(payload);
        conversationService.touch(conversation.getId());

        TicketAiChatVO vo = new TicketAiChatVO();
        vo.setTicketId(ticketId);
        vo.setThreadId(conversation.getThreadId());
        vo.setConversationId(conversation.getId());
        vo.setPhase(py.getInt("phase", 3));
        vo.setRefused(py.getBool("refused", false));
        vo.setAnswer(py.getStr("answer"));
        vo.setMessage(py.getStr("message"));
        Object citations = py.get("citations");
        if (citations != null) {
            @SuppressWarnings({"unchecked", "rawtypes"})
            java.util.List<Map<String, Object>> list =
                    (java.util.List) JSONUtil.toList(JSONUtil.parseArray(JSONUtil.toJsonStr(citations)), Map.class);
            vo.setCitations(list);
        }
        return vo;
    }
}
