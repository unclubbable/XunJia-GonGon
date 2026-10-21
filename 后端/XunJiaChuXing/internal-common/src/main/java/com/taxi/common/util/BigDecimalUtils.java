package com.taxi.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class BigDecimalUtils {

    private static final int MONEY_SCALE = 2;

    public static BigDecimal add(BigDecimal v1, BigDecimal v2) {
        return nullToZero(v1).add(nullToZero(v2));
    }

    public static BigDecimal divide(int v1, int v2) {
        if (v2 <= 0) {
            throw new IllegalArgumentException("除数非法");
        }
        return BigDecimal.valueOf(v1).divide(BigDecimal.valueOf(v2), MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal divide(BigDecimal v1, BigDecimal v2) {
        if (v2 == null || v2.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("除数非法");
        }
        return nullToZero(v1).divide(v2, MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal multiply(BigDecimal v1, BigDecimal v2) {
        return nullToZero(v1).multiply(nullToZero(v2)).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal substract(BigDecimal v1, BigDecimal v2) {
        return nullToZero(v1).subtract(nullToZero(v2));
    }

    /** 金额统一保留两位小数（四舍五入） */
    public static BigDecimal money(BigDecimal v) {
        return nullToZero(v).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private static BigDecimal nullToZero(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
