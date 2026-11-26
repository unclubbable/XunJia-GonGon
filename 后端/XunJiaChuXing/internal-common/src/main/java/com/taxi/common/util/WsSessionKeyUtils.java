package com.taxi.common.util;

/** WebSocket 会话 key：userId + identity */
public final class WsSessionKeyUtils {

    public static final String SEPARATOR = "$";

    private WsSessionKeyUtils() {}

    public static String sessionKey(Long userId, String identity) {
        return userId + SEPARATOR + identity;
    }
}
