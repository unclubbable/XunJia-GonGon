package com.xunjia.api.dto.ws;

import lombok.Data;

/**
 * 管理端（及可复用）被挤下线 payload。
 */
@Data
public class ForceLogoutPayload {

    /** 如 OTHER_LOGIN */
    private String reason;

    public static ForceLogoutPayload otherLogin() {
        ForceLogoutPayload p = new ForceLogoutPayload();
        p.setReason("OTHER_LOGIN");
        return p;
    }
}
