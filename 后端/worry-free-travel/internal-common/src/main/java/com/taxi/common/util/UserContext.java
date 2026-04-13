package com.taxi.common.util;

import com.taxi.common.ThreadLoad.TokenResult;

public class UserContext {
    private static final ThreadLocal<TokenResult> tl = new ThreadLocal<>();

    /**
     * 保存当前登录用户信息到ThreadLocal
     */
    public static void setUser(TokenResult tokenResult) {
        tl.set(tokenResult);
    }

    /**
     * 获取当前登录用户信息
     */
    public static TokenResult getUser() {
        return tl.get();
    }

    /**
     * 移除当前登录用户信息
     */
    public static void removeUser(){
        tl.remove();
    }
}
