package com.taxi.api.Client;

import com.taxi.api.request.PushRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


@FeignClient("service-sse-push")
public interface ServiceSsePushClient {
    @PostMapping("/push")
    public String push(@RequestBody PushRequest pushRequest);

    @GetMapping("/connect")
    public SseEmitter connect(@RequestParam Long userId, @RequestParam String identity);
}