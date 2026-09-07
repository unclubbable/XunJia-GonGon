package com.taxi.ticket.controller;

import com.taxi.api.dto.OrderRefund;
import com.taxi.api.dto.Ticket;
import com.taxi.api.request.TicketCreateRequest;
import com.taxi.api.request.TicketAiAssistRequest;
import com.taxi.api.request.TicketAiChatRequest;
import com.taxi.api.request.TicketMessageRequest;
import com.taxi.api.request.TicketProcessRequest;
import com.taxi.api.request.TicketRefundCreateRequest;
import com.taxi.api.request.TicketRefundExecuteRequest;
import com.taxi.api.request.TicketRefundRejectRequest;
import com.taxi.api.response.TicketDetailVO;
import com.taxi.api.result.Result;
import com.taxi.ticket.service.TicketService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ticket")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @ApiOperation("创建工单（乘客/司机）")
    @PostMapping("/create")
    public Result<Ticket> create(@Validated @RequestBody TicketCreateRequest request) {
        return ticketService.create(request);
    }

    @ApiOperation("我的工单列表（乘客/司机）")
    @GetMapping("/my-list")
    public Result<Map<String, Object>> myList(@RequestParam(defaultValue = "1") int page,
                                              @RequestParam(defaultValue = "10") int limit,
                                              @RequestParam(required = false) String status) {
        return ticketService.myList(page, limit, status);
    }

    @ApiOperation("工单详情（乘客/司机，仅本人）")
    @GetMapping("/my-detail")
    public Result<TicketDetailVO> myDetail(@RequestParam Long ticketId) {
        return ticketService.detail(ticketId, false);
    }

    @ApiOperation("撤销工单（仅 OPEN）")
    @PostMapping("/cancel")
    public Result cancel(@RequestParam Long ticketId) {
        return ticketService.cancel(ticketId);
    }

    @ApiOperation("用户补充说明")
    @PostMapping("/append-message")
    public Result appendMessage(@Validated @RequestBody TicketMessageRequest request) {
        return ticketService.appendMessage(request);
    }

    @ApiOperation("管理端工单列表")
    @GetMapping("/list")
    public Result<Map<String, Object>> list(@RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "10") int limit,
                                            @RequestParam(required = false) Integer source,
                                            @RequestParam(required = false) String category,
                                            @RequestParam(required = false) String status,
                                            @RequestParam(required = false) String phone,
                                            @RequestParam(required = false) Long orderId) {
        return ticketService.adminList(page, limit, source, category, status, phone, orderId);
    }

    @ApiOperation("管理端工单详情")
    @GetMapping("/detail")
    public Result<TicketDetailVO> detail(@RequestParam Long ticketId) {
        return ticketService.detail(ticketId, true);
    }

    @ApiOperation("受理工单")
    @PostMapping("/accept")
    public Result accept(@Validated @RequestBody TicketProcessRequest request) {
        return ticketService.accept(request);
    }

    @ApiOperation("运营回复")
    @PostMapping("/reply")
    public Result reply(@Validated @RequestBody TicketMessageRequest request) {
        return ticketService.reply(request);
    }

    @ApiOperation("结案")
    @PostMapping("/resolve")
    public Result resolve(@Validated @RequestBody TicketProcessRequest request) {
        return ticketService.resolve(request);
    }

    @ApiOperation("驳回")
    @PostMapping("/reject")
    public Result reject(@Validated @RequestBody TicketProcessRequest request) {
        return ticketService.reject(request);
    }

    @ApiOperation("通过并执行（改城市/改资料）")
    @PostMapping("/approve-execute")
    public Result approveExecute(@Validated @RequestBody TicketProcessRequest request) {
        return ticketService.approveAndExecute(request);
    }

    @ApiOperation("登记退款单")
    @PostMapping("/refund/create")
    public Result createRefund(@Validated @RequestBody TicketRefundCreateRequest request) {
        return ticketService.createRefund(request);
    }

    @ApiOperation("执行退款（手动确认 / 支付宝）")
    @PostMapping("/refund/execute")
    public Result executeRefund(@Validated @RequestBody TicketRefundExecuteRequest request) {
        return ticketService.executeRefund(request);
    }

    @ApiOperation("驳回退款登记")
    @PostMapping("/refund/reject")
    public Result rejectRefund(@Validated @RequestBody TicketRefundRejectRequest request) {
        return ticketService.rejectRefund(request);
    }

    @ApiOperation("退款单列表")
    @GetMapping("/refund/list")
    public Result<Map<String, Object>> refundList(@RequestParam(defaultValue = "1") int page,
                                                  @RequestParam(defaultValue = "10") int limit,
                                                  @RequestParam(required = false) String status,
                                                  @RequestParam(required = false) Long orderId) {
        return ticketService.refundList(page, limit, status, orderId);
    }

    @ApiOperation("退款单详情")
    @GetMapping("/refund/detail")
    public Result<OrderRefund> refundDetail(@RequestParam Long refundId) {
        return ticketService.refundDetail(refundId);
    }

    @ApiOperation("AI协查（经 service-ai → Python）")
    @PostMapping("/ai/assist")
    public Result aiAssist(@RequestBody TicketAiAssistRequest request) {
        return ticketService.aiAssist(request);
    }

    @ApiOperation("AI协议/工单问答")
    @PostMapping("/ai/chat")
    public Result aiChat(@RequestBody TicketAiChatRequest request) {
        return ticketService.aiChat(request);
    }

    @ApiOperation("保存AI协查草稿字段")
    @PostMapping("/ai/save-draft")
    public Result saveAiDraft(@RequestParam Long ticketId,
                              @RequestParam(required = false) String aiSummary,
                              @RequestParam(required = false) String aiSuggestionJson) {
        return ticketService.saveAiDraft(ticketId, aiSummary, aiSuggestionJson);
    }
}
