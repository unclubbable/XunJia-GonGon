package com.taxi.common.util;

/**
 * 数字验证码生成工具（本地生成，无需远程服务）
 */
public final class VerificationCodeUtils {

    private VerificationCodeUtils() {
    }

    /**
     * 生成指定位数的数字验证码（首位不为 0）
     *
     * @param size 位数，例如 6
     * @return 数字验证码
     */
    public static int generateNumberCode(int size) {
        if (size < 1) {
            throw new IllegalArgumentException("验证码位数必须大于 0");
        }
        return (int) ((Math.random() * 9 + 1) * Math.pow(10, size - 1));
    }
}
