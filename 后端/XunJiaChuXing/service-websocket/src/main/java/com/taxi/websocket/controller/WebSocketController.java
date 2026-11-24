package com.taxi.websocket.controller;

import cn.hutool.json.JSONUtil;
import com.taxi.api.request.BroadcastRequest;
import com.taxi.api.request.KickRequest;
import com.taxi.api.request.PushRequest;
import com.taxi.websocket.session.WebSocketSessionHub;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
@Slf4j
public class WebSocketController {

    @Autowired
    private WebSocketSessionHub sessionHub;

    @PostMapping("/push")
    public String push(@RequestBody PushRequest pushRequest) {
        String content = pushRequest.getContent();
        log.info("推送请求 userId={} identity={} contentLen={}",
                pushRequest.getUserId(),
                pushRequest.getIdentity(),
                content == null ? 0 : content.length());
        return sessionHub.pushAsync(
                pushRequest.getUserId(),
                pushRequest.getIdentity(),
                content);
    }

    /**
     * 登录挤下线等场景：踢掉旧 WS（可先发 FORCE_LOGOUT）。
     */
    @PostMapping("/kick")
    public String kick(@RequestBody KickRequest kickRequest) {
        log.info("踢人请求 {}", JSONUtil.toJsonStr(kickRequest));
        boolean sendForceLogout = kickRequest.getSendForceLogout() == null
                || Boolean.TRUE.equals(kickRequest.getSendForceLogout());
        return sessionHub.kick(
                kickRequest.getUserId(),
                kickRequest.getIdentity(),
                sendForceLogout);
    }

    /** 按身份广播（新工单通知运营等） */
    @PostMapping("/broadcast")
    public String broadcast(@RequestBody BroadcastRequest request) {
        String content = request.getContent();
        log.info("广播请求 identity={} contentLen={}",
                request.getIdentity(),
                content == null ? 0 : content.length());
        return sessionHub.broadcastByIdentity(request.getIdentity(), content);
    }
}
