package com.taxi.api.Client;

import com.taxi.api.request.BroadcastRequest;
import com.taxi.api.request.KickRequest;
import com.taxi.api.request.PushRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


@FeignClient("service-websocket")
public interface ServiceSsePushClient {
    @PostMapping("/push")
    public String push(@RequestBody PushRequest pushRequest);

    /** 踢掉在线连接（方案 A：登录挤下线） */
    @PostMapping("/kick")
    public String kick(@RequestBody KickRequest kickRequest);

    /** 按身份广播给所有在线连接 */
    @PostMapping("/broadcast")
    public String broadcast(@RequestBody BroadcastRequest broadcastRequest);

    @GetMapping("/connect")
    public SseEmitter connect(@RequestParam Long userId, @RequestParam String identity);
}