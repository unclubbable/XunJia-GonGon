package com.xunjia.ai.controller;

import com.xunjia.api.request.TicketAiAssistRequest;
import com.xunjia.api.request.TicketAiChatRequest;
import com.xunjia.api.response.TicketAiAssistVO;
import com.xunjia.api.response.TicketAiChatVO;
import com.xunjia.api.result.Result;
import com.xunjia.ai.service.TicketAssistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Api(tags = "AI工单助手")
@RestController
@RequestMapping("/ai")
public class AiTicketController {

    @Autowired
    private TicketAssistService ticketAssistService;

    @ApiOperation("工单AI协查")
    @PostMapping("/ticket/assist")
    public Result<TicketAiAssistVO> ticketAssist(@Validated @RequestBody TicketAiAssistRequest request) {
        return Result.ok(ticketAssistService.assist(request));
    }

    @ApiOperation("协议/工单多轮问答（RAG）")
    @PostMapping("/ticket/chat")
    public Result<TicketAiChatVO> ticketChat(@Validated @RequestBody TicketAiChatRequest request) {
        return Result.ok(ticketAssistService.chat(request));
    }
}
