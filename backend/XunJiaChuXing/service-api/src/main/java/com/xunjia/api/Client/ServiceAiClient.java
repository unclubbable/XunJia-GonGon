package com.xunjia.api.Client;

import com.xunjia.api.request.TicketAiAssistRequest;
import com.xunjia.api.request.TicketAiChatRequest;
import com.xunjia.api.response.TicketAiAssistVO;
import com.xunjia.api.response.TicketAiChatVO;
import com.xunjia.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient("service-ai")
public interface ServiceAiClient {

    @PostMapping("/ai/ticket/assist")
    Result<TicketAiAssistVO> ticketAssist(@RequestBody TicketAiAssistRequest request);

    @PostMapping("/ai/ticket/chat")
    Result<TicketAiChatVO> ticketChat(@RequestBody TicketAiChatRequest request);
}
