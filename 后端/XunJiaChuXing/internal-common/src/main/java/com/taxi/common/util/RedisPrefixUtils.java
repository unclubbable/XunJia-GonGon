package com.taxi.common.util;


public class RedisPrefixUtils {
    //乘客的验证码前缀
    private static final String VERIFICATION_CODE_PREFIX="passenger-verification-code-";

    //司机的验证码前缀
    private static final String VERIFICATION_CODE_DRIVER="driver-verification-code-";

    private static final String TOKEN_PREFIX="token-";

    //黑名单设备号
    public static final String BLACK_DEVICE_CODE_PREFIX="black-device-";
    /**
     * 根据手机号生成key
     * @param passengerPhone 手机号
     * @return
     */
    public static String generatorPassengerKeyByPhone(String passengerPhone,String identity){
        return VERIFICATION_CODE_PREFIX+identity+"-"+passengerPhone;
    }

    public static String generatorDriverKeyByPhone(String driverPhone,String identity){
        return VERIFICATION_CODE_DRIVER+identity+"-"+driverPhone;
    }

    /**
     * 根据手机号和身份标识,生成token
     * @param phone
     * @param identity
     * @return
     */
    public static String generatorTokenKey(String phone,String identity,String tokenType){
        return TOKEN_PREFIX+phone+"-"+identity+"-"+tokenType;
    }
}
