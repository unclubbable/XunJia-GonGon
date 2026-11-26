package com.taxi.ticket.notify;

import com.taxi.api.Client.ServiceWsPushClient;
import com.taxi.api.constant.TicketConstants;
import com.taxi.api.dto.Ticket;
import com.taxi.api.dto.TicketMessage;
import com.taxi.api.dto.ws.TicketWsPayload;
import com.taxi.api.request.BroadcastRequest;
import com.taxi.api.request.PushRequest;
import com.taxi.api.util.WsMessageUtils;
import com.taxi.common.constant.IdentityConstant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 工单实时通知：先落库，事务提交后再推；失败只打日志。
 */
@Slf4j
@Component
public class TicketWsNotify {

    @Autowired
    private ServiceWsPushClient pushClient;

    /** 新工单创建 → 广播给所有在线运营 */
    public void afterCreated(Ticket ticket) {
        runAfterCommit(() -> {
            TicketWsPayload p = toPayload(ticket, null);
            p.setTitle(ticket.getTitle());
            p.setCategory(ticket.getCategory());
            p.setSource(ticket.getSource());
            p.setContent(ticket.getContent());
            broadcastToAdmins(WsMessageUtils.ticketCreated(p), ticket.getId());
        });
    }

    /** 用户补充说明 → 推处理人 */
    public void afterUserAppend(Ticket ticket, TicketMessage msg) {
        runAfterCommit(() -> pushToAssignee(ticket, WsMessageUtils.ticketMessage(toPayload(ticket, msg))));
    }

    /** 运营回复 → 推当事人 */
    public void afterAdminReply(Ticket ticket, TicketMessage msg) {
        runAfterCommit(() -> pushToParty(ticket, WsMessageUtils.ticketMessage(toPayload(ticket, msg))));
    }

    /**
     * 状态/系统事件 → 推当事人 + 处理人（有则推）。
     * 运营自己操作时本地已更新，仍推 assignee 便于多端；无 assignee 则只推当事人。
     */
    public void afterStatusChange(Ticket ticket, TicketMessage msg) {
        runAfterCommit(() -> {
            String content = WsMessageUtils.ticketStatus(toPayload(ticket, msg));
            pushToParty(ticket, content);
            pushToAssignee(ticket, content);
        });
    }

    /**
     * 用户撤销（通常仍为 OPEN→CANCELLED、无 assignee）→ 必须广播运营，避免处理中毫无感知。
     */
    public void afterCancelled(Ticket ticket, TicketMessage msg) {
        runAfterCommit(() -> {
            TicketWsPayload p = toPayload(ticket, msg);
            p.setTitle(ticket.getTitle());
            p.setCategory(ticket.getCategory());
            p.setSource(ticket.getSource());
            String content = WsMessageUtils.ticketStatus(p);
            broadcastToAdmins(content, ticket.getId());
            pushToAssignee(ticket, content);
        });
    }

    private TicketWsPayload toPayload(Ticket ticket, TicketMessage msg) {
        TicketWsPayload p = new TicketWsPayload();
        p.setTicketId(ticket.getId());
        p.setTicketNo(ticket.getTicketNo());
        p.setStatus(ticket.getStatus());
        if (msg != null) {
            p.setMessageId(msg.getId());
            p.setSenderType(msg.getSenderType());
            p.setSenderName(msg.getSenderName());
            p.setContent(msg.getContent());
            p.setMsgType(msg.getMsgType());
        }
        return p;
    }

    private void pushToParty(Ticket ticket, String content) {
        if (ticket == null) {
            return;
        }
        Long userId = null;
        String identity = null;
        if (ObjectsEqualsSource(ticket, TicketConstants.SOURCE_PASSENGER)) {
            userId = ticket.getPassengerId();
            identity = IdentityConstant.PASSENGER_IDENTITY;
        } else if (ObjectsEqualsSource(ticket, TicketConstants.SOURCE_DRIVER)) {
            userId = ticket.getDriverId();
            identity = IdentityConstant.DRIVER_IDENTITY;
        }
        if (userId == null) {
            log.warn("工单推送跳过当事人：ticketId={} source={} 无 partyId",
                    ticket.getId(), ticket.getSource());
            return;
        }
        doPush(userId, identity, content, ticket.getId(), "party");
    }

    private void pushToAssignee(Ticket ticket, String content) {
        if (ticket == null || ticket.getAssigneeId() == null) {
            log.debug("工单推送跳过处理人：ticketId={} 无 assignee", ticket == null ? null : ticket.getId());
            return;
        }
        doPush(ticket.getAssigneeId().longValue(), IdentityConstant.ADMIN_IDENTITY, content,
                ticket.getId(), "assignee");
    }

    private void doPush(Long userId, String identity, String content, Long ticketId, String role) {
        try {
            PushRequest req = new PushRequest();
            req.setUserId(userId);
            req.setIdentity(identity);
            req.setContent(content);
            String result = pushClient.push(req);
            log.info("工单WS推送 ticketId={} role={} userId={} identity={} result={}",
                    ticketId, role, userId, identity, result);
        } catch (Exception e) {
            log.error("工单WS推送失败 ticketId={} role={} userId={} identity={}",
                    ticketId, role, userId, identity, e);
        }
    }

    private void broadcastToAdmins(String content, Long ticketId) {
        try {
            BroadcastRequest req = new BroadcastRequest();
            req.setIdentity(IdentityConstant.ADMIN_IDENTITY);
            req.setContent(content);
            String result = pushClient.broadcast(req);
            log.info("工单WS广播运营 ticketId={} result={}", ticketId, result);
        } catch (Exception e) {
            log.error("工单WS广播运营失败 ticketId={}", ticketId, e);
        }
    }

    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    safeRun(action);
                }
            });
        } else {
            safeRun(action);
        }
    }

    private void safeRun(Runnable action) {
        try {
            action.run();
        } catch (Exception e) {
            log.error("工单WS afterCommit 执行异常", e);
        }
    }

    private static boolean ObjectsEqualsSource(Ticket ticket, int source) {
        return ticket.getSource() != null && ticket.getSource() == source;
    }
}
