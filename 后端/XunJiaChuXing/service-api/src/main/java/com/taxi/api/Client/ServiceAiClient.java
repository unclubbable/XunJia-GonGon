package com.taxi.api.Client;

import com.taxi.api.request.TicketAiAssistRequest;
import com.taxi.api.request.TicketAiChatRequest;
import com.taxi.api.response.TicketAiAssistVO;
import com.taxi.api.response.TicketAiChatVO;
import com.taxi.api.result.Result;
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
