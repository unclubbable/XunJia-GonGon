package com.xunjia.api.response;

import lombok.Data;

@Data
public class AdminTokenResponse {
    private String token;
    /** boss_user.id，WS connect / assigneeId 使用 */
    private Integer userId;
    private String username;
}
