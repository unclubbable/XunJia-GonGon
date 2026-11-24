package com.taxi.websocket.session;

import com.taxi.api.util.WsMessageUtils;
import com.taxi.common.util.SsePrefixUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.websocket.CloseReason;
import javax.websocket.Session;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 单实例 WebSocket 会话池：注册、异步推送、踢人、同 key 替换。
 */
@Slf4j
@Component
public class WebSocketSessionHub {

    private final ConcurrentHashMap<String, Session> sessions = new ConcurrentHashMap<>();

    public String key(Long userId, String identity) {
        return SsePrefixUtils.generatorSseKey(userId, identity);
    }

    /**
     * 注册新连接；若同 key 已有旧连接，静默关闭旧连接（方案 B）。
     * 注意：此处不发 FORCE_LOGOUT——避免「同 token 多 Tab / 刷新重连」误清 localStorage。
     * 账号被挤下线只走登录侧 /kick（方案 A）。
     */
    public void register(Long userId, String identity, Session session) {
        String k = key(userId, identity);
        Session previous = sessions.put(k, session);
        if (previous != null && previous.isOpen() && previous != session) {
            log.info("同 key 顶替旧连接（静默）：{}", k);
            closeQuietly(previous, "replaced");
        }
        log.info("WebSocket 注册成功：{}，当前在线={}", k, sessions.size());
    }

    /**
     * 仅当 map 中仍是该 session 时移除，避免踢人后误删新连接。
     */
    public void unregister(Long userId, String identity, Session session) {
        String k = key(userId, identity);
        boolean removed = sessions.remove(k, session);
        if (removed) {
            log.info("WebSocket 注销：{}", k);
        }
    }

    public boolean isOnline(Long userId, String identity) {
        Session session = sessions.get(key(userId, identity));
        return session != null && session.isOpen();
    }

    /**
     * 异步推送文本；兼容裸 JSON 与统一信封。
     */
    public String pushAsync(Long userId, String identity, String content) {
        String k = key(userId, identity);
        Session session = sessions.get(k);
        if (session == null) {
            return "用户不在线";
        }
        if (!session.isOpen()) {
            sessions.remove(k, session);
            return "用户已离线";
        }
        try {
            session.getAsyncRemote().sendText(content, result -> {
                if (result.isOK()) {
                    log.info("推送成功：{} len={}", k, content == null ? 0 : content.length());
                } else {
                    log.error("推送失败：{}", k, result.getException());
                    sessions.remove(k, session);
                    try {
                        session.close();
                    } catch (IOException ignored) {
                        // ignore
                    }
                }
            });
            return "推送成功";
        } catch (Exception e) {
            sessions.remove(k, session);
            log.error("推送异常：{}", k, e);
            return "推送异常";
        }
    }

    /**
     * 按身份广播给所有在线 Session（key 形如 userId$identity）。
     */
    public String broadcastByIdentity(String identity, String content) {
        if (identity == null || identity.isEmpty()) {
            return "identity 为空";
        }
        String suffix = SsePrefixUtils.sperator + identity;
        List<Map.Entry<String, Session>> targets = new ArrayList<>();
        for (Map.Entry<String, Session> e : sessions.entrySet()) {
            if (e.getKey() != null && e.getKey().endsWith(suffix)) {
                targets.add(e);
            }
        }
        if (targets.isEmpty()) {
            return "无在线用户 identity=" + identity;
        }
        int ok = 0;
        for (Map.Entry<String, Session> e : targets) {
            String result = pushAsyncByKey(e.getKey(), e.getValue(), content);
            if ("推送成功".equals(result)) {
                ok++;
            }
        }
        return "广播完成 identity=" + identity + " 目标=" + targets.size() + " 成功=" + ok;
    }

    private String pushAsyncByKey(String k, Session session, String content) {
        if (session == null) {
            return "用户不在线";
        }
        if (!session.isOpen()) {
            sessions.remove(k, session);
            return "用户已离线";
        }
        try {
            session.getAsyncRemote().sendText(content, result -> {
                if (result.isOK()) {
                    log.info("推送成功：{} len={}", k, content == null ? 0 : content.length());
                } else {
                    log.error("推送失败：{}", k, result.getException());
                    sessions.remove(k, session);
                    try {
                        session.close();
                    } catch (IOException ignored) {
                        // ignore
                    }
                }
            });
            return "推送成功";
        } catch (Exception e) {
            sessions.remove(k, session);
            log.error("推送异常：{}", k, e);
            return "推送异常";
        }
    }

    /**
     * 踢下线：可选先发 FORCE_LOGOUT。
     */
    public String kick(Long userId, String identity, boolean sendForceLogout) {
        String k = key(userId, identity);
        Session session = sessions.get(k);
        if (session == null) {
            return "用户不在线";
        }
        if (sendForceLogout) {
            forceLogoutAndClose(session, k);
        } else {
            closeQuietly(session, "kicked");
        }
        sessions.remove(k, session);
        return "踢出成功";
    }

    private void forceLogoutAndClose(Session session, String keyForLog) {
        if (session == null || !session.isOpen()) {
            return;
        }
        try {
            // 同步发送踢人包，尽量保证对端先收到再断连
            session.getBasicRemote().sendText(WsMessageUtils.forceLogoutOtherLogin());
        } catch (Exception e) {
            log.warn("发送 FORCE_LOGOUT 失败 key={}", keyForLog, e);
        }
        closeQuietly(session, "OTHER_LOGIN");
    }

    private void closeQuietly(Session session, String reason) {
        try {
            session.close(new CloseReason(CloseReason.CloseCodes.NORMAL_CLOSURE, reason));
        } catch (Exception e) {
            log.debug("关闭 session 异常: {}", e.getMessage());
        }
    }
}
