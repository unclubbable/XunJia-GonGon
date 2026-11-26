package com.xunjia.api.constant;

/**
 * WebSocket 统一消息类型（信封 type 字段）。
 * 新推送必须带 type；旧裸 JSON 由前端启发式兼容。
 */
public enum WsMessageType {

    /** 服务端心跳回复（与现网 {"type":"pong"} 一致） */
    PONG("pong"),

    /** 派单等订单业务通知 */
    ORDER_DISPATCH("ORDER_DISPATCH"),
    ORDER_STATUS("ORDER_STATUS"),
    PAY_INFO("PAY_INFO"),

    /** 司机位置推送给乘客 */
    LOCATION_UPDATE("LOCATION_UPDATE"),

    /** 工单聊天消息 */
    TICKET_MESSAGE("TICKET_MESSAGE"),
    /** 工单状态/系统事件 */
    TICKET_STATUS("TICKET_STATUS"),
    /** 新工单创建（广播给在线运营） */
    TICKET_CREATED("TICKET_CREATED"),

    /** 单点登录：旧端被挤下线 */
    FORCE_LOGOUT("FORCE_LOGOUT"),

    /** 预留 */
    SYSTEM_NOTICE("SYSTEM_NOTICE");

    private final String code;

    WsMessageType(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static WsMessageType fromCode(String code) {
        if (code == null || code.isEmpty()) {
            return null;
        }
        for (WsMessageType t : values()) {
            if (t.code.equals(code)) {
                return t;
            }
        }
        return null;
    }
}
