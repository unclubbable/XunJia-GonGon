package com.taxi.api.request;

import lombok.Data;

/**
 * 踢掉指定用户的 WebSocket 连接（单点登录等）。
 */
@Data
public class KickRequest {

    private Long userId;

    private String identity;

    /** 是否先发送 FORCE_LOGOUT 再关闭，默认 true */
    private Boolean sendForceLogout = true;
}
