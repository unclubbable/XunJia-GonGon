package com.taxi.api.util;

import cn.hutool.json.JSONUtil;
import com.taxi.api.constant.WsMessageType;
import com.taxi.api.dto.ws.ForceLogoutPayload;
import com.taxi.api.dto.ws.TicketWsPayload;
import com.taxi.api.dto.ws.WsEnvelope;

/**
 * 组装 PushRequest.content 用的 WS 信封 JSON。
 */
public final class WsMessageUtils {

    private WsMessageUtils() {
    }

    public static String toJson(WsMessageType type, Object payload) {
        return JSONUtil.toJsonStr(WsEnvelope.of(type, normalizePayload(payload)));
    }

    public static String ticketMessage(TicketWsPayload payload) {
        return toJson(WsMessageType.TICKET_MESSAGE, payload);
    }

    public static String ticketStatus(TicketWsPayload payload) {
        return toJson(WsMessageType.TICKET_STATUS, payload);
    }

    public static String ticketCreated(TicketWsPayload payload) {
        return toJson(WsMessageType.TICKET_CREATED, payload);
    }

    public static String forceLogoutOtherLogin() {
        return toJson(WsMessageType.FORCE_LOGOUT, ForceLogoutPayload.otherLogin());
    }

    public static String orderDispatch(Object payload) {
        return toJson(WsMessageType.ORDER_DISPATCH, payload);
    }

    public static String orderStatus(Object payload) {
        return toJson(WsMessageType.ORDER_STATUS, payload);
    }

    public static String payInfo(Object payload) {
        return toJson(WsMessageType.PAY_INFO, payload);
    }

    public static String locationUpdate(Object payload) {
        return toJson(WsMessageType.LOCATION_UPDATE, payload);
    }

    /** hutool / net.sf.json / Map / Bean → 可序列化结构 */
    private static Object normalizePayload(Object payload) {
        if (payload == null) {
            return null;
        }
        if (payload instanceof CharSequence) {
            String s = payload.toString().trim();
            if (s.isEmpty()) {
                return s;
            }
            try {
                return JSONUtil.parse(s);
            } catch (Exception e) {
                return s;
            }
        }
        try {
            return JSONUtil.parse(JSONUtil.toJsonStr(payload));
        } catch (Exception e) {
            return payload;
        }
    }
}
