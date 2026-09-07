package com.taxi.api.constant;

/**
 * Agent 会话常量（Java service-ai 与业务方共用）
 */
public final class AgentConstants {

    private AgentConstants() {
    }

    public static final String USER_ADMIN = "ADMIN";
    public static final String USER_PASSENGER = "PASSENGER";
    public static final String USER_DRIVER = "DRIVER";

    public static final String SCENE_TICKET_ASSIST = "TICKET_ASSIST";
    public static final String SCENE_POLICY_QA = "POLICY_QA";
    public static final String SCENE_NAV_QA = "NAV_QA";
    public static final String SCENE_DRIVER_QA = "DRIVER_QA";

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_CLOSED = "CLOSED";
}
