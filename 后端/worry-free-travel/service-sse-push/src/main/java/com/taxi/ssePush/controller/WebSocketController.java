package com.taxi.ssePush.controller;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.taxi.api.request.PushRequest;
import com.taxi.common.util.SsePrefixUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/")
@Slf4j
public class WebSocketController {

    // 在线用户池
    public static final ConcurrentHashMap<String, Session> WEB_SOCKET_MAP = new ConcurrentHashMap<>();

    // ====================== 推送接口
    @PostMapping("/push")
    public String push(@RequestBody PushRequest pushRequest) {
        log.info("连接用户池"+JSONUtil.toJsonStr(WEB_SOCKET_MAP));
        log.info("用户ID：{}，身份：{}，推送内容：{}", pushRequest.getUserId(), pushRequest.getIdentity(), pushRequest.getContent());
        Long userId = pushRequest.getUserId();
        String identity = pushRequest.getIdentity();
        String content = pushRequest.getContent();
        String key = SsePrefixUtils.generatorSseKey(userId, identity);

        try {
            if (WEB_SOCKET_MAP.containsKey(key)) {
                Session session = WEB_SOCKET_MAP.get(key);
                if (session.isOpen()) {
                    session.getBasicRemote().sendText(content);
                    log.info("推送成功：{} -> {}", key, content);
                } else {
                    WEB_SOCKET_MAP.remove(key);
                    return "用户已离线";
                }
            } else {
                return "用户不在线";
            }
        } catch (IOException e) {
            WEB_SOCKET_MAP.remove(key);
            log.error("推送失败", e);
            return "推送异常";
        }
        return "推送成功";
    }

    // ====================== WebSocket 连接入口
    @ServerEndpoint("/connect/{userId}/{identity}")
    @Slf4j
    @RestController
    public static class WebSocketConnect {

        @OnOpen
        public void onOpen(Session session, @PathParam("userId") Long userId, @PathParam("identity") String identity) {
            String key = SsePrefixUtils.generatorSseKey(userId, identity);
            WEB_SOCKET_MAP.put(key, session);
            log.info("WebSocket 连接成功：{}", key);
        }

        @OnClose
        public void onClose(Session session, @PathParam("userId") Long userId, @PathParam("identity") String identity) {
            String key = SsePrefixUtils.generatorSseKey(userId, identity);
            WEB_SOCKET_MAP.remove(key);
            log.info("WebSocket 断开连接：{}", key);
        }

        @OnError
        public void onError(Session session, Throwable throwable) {
            log.error("WebSocket 异常", throwable);
        }

        /**
         * 处理前端消息（心跳+普通消息）
         */
        @OnMessage
        public void onMessage(String message, Session session) {
            try {
                // 1. 解析前端消息
                JSONObject msgObj = JSONUtil.parseObj(message);
                // 2. 判断是否为心跳包
                if ("heartBeat".equals(msgObj.getStr("type"))) {
                    // 心跳包：不打印日志，直接回复心跳（保持连接）
                    session.getBasicRemote().sendText("{\"type\":\"pong\"}");
                    return;
                }
                // 3. 普通消息：打印日志
                log.info("收到客户端业务消息：{}", message);
            } catch (Exception e) {
                // 非JSON格式消息，正常打印
                log.info("收到客户端消息：{}", message);
            }
        }
    }
}