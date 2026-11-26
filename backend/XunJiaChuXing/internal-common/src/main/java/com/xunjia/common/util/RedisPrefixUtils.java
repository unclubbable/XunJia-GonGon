package com.xunjia.common.util;


public class RedisPrefixUtils {
    //乘客的验证码前缀
    private static final String VERIFICATION_CODE_PREFIX="passenger-verification-code-";

    //司机的验证码前缀
    private static final String VERIFICATION_CODE_DRIVER="driver-verification-code-";

    private static final String TOKEN_PREFIX="token-";

    //黑名单设备号
    public static final String BLACK_DEVICE_CODE_PREFIX="black-device-";
    /** 验证码 redis key */
    public static String generatorPassengerKeyByPhone(String passengerPhone,String identity){
        return VERIFICATION_CODE_PREFIX+identity+"-"+passengerPhone;
    }

    public static String generatorDriverKeyByPhone(String driverPhone,String identity){
        return VERIFICATION_CODE_DRIVER+identity+"-"+driverPhone;
    }

    /** token redis key */
    public static String generatorTokenKey(String phone,String identity,String tokenType){
        return TOKEN_PREFIX+phone+"-"+identity+"-"+tokenType;
    }

    /**
     * 管理端 username → 数字 userId 映射（WS 建连校验用，登录时写入）。
     * 例：admin-uid-admin → "1"
     */
    public static String generatorAdminUidKey(String username) {
        return "admin-uid-" + username;
    }
}
