package com.xunjia.api.request;

import lombok.Data;

/**
 * 按身份广播：推给当前在线的该 identity 全部 Session。
 */
@Data
public class BroadcastRequest {

    /** 身份：1乘客 2司机 3运营 */
    private String identity;

    private String content;
}
