package com.xunjia.api.dto.ws;

import com.xunjia.api.constant.WsMessageType;
import lombok.Data;

/**
 * WebSocket 统一信封。PushRequest.content 应为本结构的 JSON。
 */
@Data
public class WsEnvelope<T> {

    /** 见 {@link WsMessageType#getCode()} */
    private String type;

    /** 服务端发送时间戳（毫秒） */
    private Long ts;

    private T payload;

    public static <T> WsEnvelope<T> of(WsMessageType type, T payload) {
        WsEnvelope<T> envelope = new WsEnvelope<>();
        envelope.setType(type.getCode());
        envelope.setTs(System.currentTimeMillis());
        envelope.setPayload(payload);
        return envelope;
    }
}
