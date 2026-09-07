package com.taxi.api.request;

import lombok.Data;

@Data
public class PushRequest {

    // 用户ID
    private Long userId;
    // 推送平台
    private String identity;
    // 推送内容
    private String content;

}
