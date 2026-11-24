package com.taxi.websocket.endpoint;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.taxi.api.constant.WsMessageType;
import com.taxi.websocket.auth.WebSocketAuthService;
import com.taxi.websocket.session.WebSocketSessionHub;
import lombok.extern.slf4j.Slf4j;
import com.taxi.websocket.config.WebSocketSpringConfigurator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.websocket.CloseReason;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.util.List;
import java.util.Map;

/**
 * WebSocket 连接入口。查询参数：token（必填）。
 */
@Slf4j
@Component
@ServerEndpoint(value = "/connect/{userId}/{identity}", configurator = WebSocketSpringConfigurator.class)
public class WebSocketEndpoint {

    @Autowired
    private WebSocketSessionHub sessionHub;

    @Autowired
    private WebSocketAuthService authService;

    @OnOpen
    public void onOpen(Session session,
                       @PathParam("userId") Long userId,
                       @PathParam("identity") String identity) {
        String token = extractToken(session);
        String deny = authService.authenticate(userId, identity, token);
        if (deny != null) {
            log.warn("WebSocket 鉴权失败 userId={} identity={} reason={}", userId, identity, deny);
            try {
                session.close(new CloseReason(CloseReason.CloseCodes.VIOLATED_POLICY, deny));
            } catch (Exception e) {
                log.debug("关闭未授权连接失败: {}", e.getMessage());
            }
            return;
        }
        sessionHub.register(userId, identity, session);
    }

    @OnClose
    public void onClose(Session session,
                        @PathParam("userId") Long userId,
                        @PathParam("identity") String identity) {
        sessionHub.unregister(userId, identity, session);
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        log.error("WebSocket 异常 sessionId={}", session == null ? null : session.getId(), throwable);
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        try {
            JSONObject msgObj = JSONUtil.parseObj(message);
            if ("heartBeat".equals(msgObj.getStr("type"))) {
                session.getAsyncRemote().sendText("{\"type\":\"" + WsMessageType.PONG.getCode() + "\"}");
                return;
            }
            log.info("收到客户端业务消息：{}", message);
        } catch (Exception e) {
            log.info("收到客户端消息：{}", message);
        }
    }

    private String extractToken(Session session) {
        Map<String, List<String>> params = session.getRequestParameterMap();
        if (params == null) {
            return null;
        }
        List<String> tokens = params.get("token");
        if (tokens == null || tokens.isEmpty()) {
            return null;
        }
        return tokens.get(0);
    }
}
