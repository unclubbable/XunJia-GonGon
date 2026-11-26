package com.xunjia.api.Client;

import com.xunjia.api.dto.Ticket;
import com.xunjia.api.request.TicketCreateRequest;
import com.xunjia.api.request.TicketMessageRequest;
import com.xunjia.api.request.TicketProcessRequest;
import com.xunjia.api.request.TicketRefundCreateRequest;
import com.xunjia.api.response.TicketDetailVO;
import com.xunjia.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient("service-ticket")
public interface ServiceTicketClient {

    @PostMapping("/ticket/create")
    Result<Ticket> create(@RequestBody TicketCreateRequest request);

    @GetMapping("/ticket/detail")
    Result<TicketDetailVO> detail(@RequestParam("ticketId") Long ticketId);

    @PostMapping("/ticket/reply")
    Result reply(@RequestBody TicketMessageRequest request);

    @PostMapping("/ticket/resolve")
    Result resolve(@RequestBody TicketProcessRequest request);

    @PostMapping("/ticket/refund/create")
    Result refundCreate(@RequestBody TicketRefundCreateRequest request);

    /** 保存 AI 协查草稿到工单字段 */
    @PostMapping("/ticket/ai/save-draft")
    Result saveAiDraft(@RequestParam("ticketId") Long ticketId,
                       @RequestParam(value = "aiSummary", required = false) String aiSummary,
                       @RequestParam(value = "aiSuggestionJson", required = false) String aiSuggestionJson);
}
