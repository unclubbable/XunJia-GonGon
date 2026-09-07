package com.taxi.api.constant;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * 工单枚举常量
 */
public final class TicketConstants {

    private TicketConstants() {
    }

    /** 来源：乘客 */
    public static final int SOURCE_PASSENGER = 1;
    /** 来源：司机 */
    public static final int SOURCE_DRIVER = 2;

    public static final String STATUS_OPEN = "OPEN";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_PENDING_USER = "PENDING_USER";
    public static final String STATUS_RESOLVED = "RESOLVED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    public static final int SENDER_PASSENGER = 1;
    public static final int SENDER_DRIVER = 2;
    public static final int SENDER_ADMIN = 3;
    public static final int SENDER_SYSTEM = 4;

    public static final int MSG_TEXT = 1;
    public static final int MSG_EVENT = 2;

    public static final String CONTENT_SOURCE_HUMAN = "HUMAN";
    public static final String CONTENT_SOURCE_AI = "AI_ASSISTED";

    /** 乘客类型 */
    public static final String CAT_DETOUR = "DETOUR";
    public static final String CAT_OVERCHARGE = "OVERCHARGE";
    public static final String CAT_ATTITUDE = "ATTITUDE";
    public static final String CAT_CANCEL_DISPUTE = "CANCEL_DISPUTE";
    public static final String CAT_UNPAID_DISPUTE = "UNPAID_DISPUTE";
    public static final String CAT_OTHER = "OTHER";

    /** 司机类型 */
    public static final String CAT_CHANGE_CITY = "CHANGE_CITY";
    public static final String CAT_CHANGE_PROFILE = "CHANGE_PROFILE";
    public static final String CAT_ORDER_ISSUE = "ORDER_ISSUE";
    public static final String CAT_RULE_QA = "RULE_QA";
    public static final String CAT_SALARY_QA = "SALARY_QA";
    public static final String CAT_BIND_VEHICLE = "BIND_VEHICLE";

    public static final Set<String> PASSENGER_CATEGORIES = Set.of(
            CAT_DETOUR, CAT_OVERCHARGE, CAT_ATTITUDE, CAT_CANCEL_DISPUTE, CAT_UNPAID_DISPUTE, CAT_OTHER
    );

    public static final Set<String> DRIVER_CATEGORIES = Set.of(
            CAT_CHANGE_CITY, CAT_CHANGE_PROFILE, CAT_BIND_VEHICLE,
            CAT_ORDER_ISSUE, CAT_RULE_QA, CAT_SALARY_QA, CAT_OTHER
    );

    /** 管理端支持「通过并执行」的司机工单类型 */
    public static final Set<String> EXECUTABLE_DRIVER_CATEGORIES = Set.of(
            CAT_CHANGE_CITY, CAT_CHANGE_PROFILE, CAT_BIND_VEHICLE
    );

    /** 必须关联订单的类型 */
    public static final Set<String> ORDER_REQUIRED_CATEGORIES = Set.of(
            CAT_DETOUR, CAT_OVERCHARGE, CAT_ATTITUDE, CAT_CANCEL_DISPUTE, CAT_UNPAID_DISPUTE, CAT_ORDER_ISSUE
    );

    public static final Set<String> ACTIVE_STATUSES = Set.of(
            STATUS_OPEN, STATUS_IN_PROGRESS, STATUS_PENDING_USER
    );

    public static final String REFUND_PENDING = "PENDING";
    /** @deprecated 旧数据兼容，新流程不再写入；执行态等同 PENDING */
    public static final String REFUND_APPROVED = "APPROVED";
    public static final String REFUND_REJECTED = "REJECTED";
    public static final String REFUND_REFUNDING = "REFUNDING";
    public static final String REFUND_REFUNDED = "REFUNDED";
    public static final String REFUND_FAILED = "FAILED";

    public static final String REFUND_CHANNEL_MANUAL = "MANUAL";
    public static final String REFUND_CHANNEL_ALIPAY = "ALIPAY";

    /** 同订单「进行中」：不可再新建退款单（FAILED 仍属同一笔，可重试） */
    public static final Set<String> REFUND_OPEN_STATUSES = Set.of(
            REFUND_PENDING, REFUND_APPROVED, REFUND_REFUNDING, REFUND_FAILED
    );

    /** 可执行（手动/支付宝）：待执行、退款中可重试、失败可重试、旧 APPROVED */
    public static final Set<String> REFUND_EXECUTABLE_STATUSES = Set.of(
            REFUND_PENDING, REFUND_APPROVED, REFUND_REFUNDING, REFUND_FAILED
    );

    /** 可驳回登记（退款中不允许驳回，避免渠道已受理） */
    public static final Set<String> REFUND_REJECTABLE_STATUSES = Set.of(
            REFUND_PENDING, REFUND_APPROVED, REFUND_FAILED
    );

    /** order_info.refund_status */
    public static final int ORDER_REFUND_NONE = 0;
    public static final int ORDER_REFUND_PROCESSING = 1;
    public static final int ORDER_REFUND_PARTIAL = 2;
    public static final int ORDER_REFUND_FULL = 3;

    public static final Map<String, String> CATEGORY_TITLE;

    static {
        Map<String, String> map = new HashMap<>();
        map.put(CAT_DETOUR, "绕路投诉");
        map.put(CAT_OVERCHARGE, "多收费投诉");
        map.put(CAT_ATTITUDE, "态度投诉");
        map.put(CAT_CANCEL_DISPUTE, "取消纠纷");
        map.put(CAT_UNPAID_DISPUTE, "未支付争议");
        map.put(CAT_CHANGE_CITY, "申请修改运营城市");
        map.put(CAT_CHANGE_PROFILE, "申请修改个人信息");
        map.put(CAT_BIND_VEHICLE, "绑定/换绑车辆");
        map.put(CAT_ORDER_ISSUE, "订单问题反馈");
        map.put(CAT_RULE_QA, "平台准则咨询");
        map.put(CAT_SALARY_QA, "工资组成咨询");
        map.put(CAT_OTHER, "其他反馈");
        CATEGORY_TITLE = Collections.unmodifiableMap(map);
    }
}
