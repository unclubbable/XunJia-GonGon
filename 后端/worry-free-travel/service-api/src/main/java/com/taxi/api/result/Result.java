package com.taxi.api.result;

import lombok.Data;
import lombok.experimental.Accessors;

/**
 * 全局统一返回结果类
 */
@Data
@Accessors(chain = true) // 允许链式调用
public class Result<T> {

    private Integer code;

    private String message;

    private T data;

    public Result() {}

    private static <T> Result<T> build(T body, ResultCodeEnum resultCodeEnum) {
        Result<T> result = new Result<T>();
        result.setCode(resultCodeEnum.getCode());
        result.setMessage(resultCodeEnum.getMessage());
        if (body != null) {
            result.setData(body);
        }
        return result;
    }

    public static <T> Result<T> build(T body) {
        return build(body, ResultCodeEnum.SUCCESS);
    }

    public static <T> Result<T> build(Integer code, String message) {
        return build(null, code, message);
    }

    public static <T> Result<T> build(T body, Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        if (body != null) {
            result.setData(body);
        }
        return result;
    }

    public static <T> Result<T> ok() {
        return ok(null);
    }

    public static <T> Result<T> ok(T data) {
        return build(data, ResultCodeEnum.SUCCESS);
    }

    public static <T> Result<T> fail() {
        return fail(null);
    }
    public static <T> Result<T> fail(T data,ResultCodeEnum resultCodeEnum){
        return build(data, resultCodeEnum);
    }
    public static <T> Result<T> fail(Integer c,String m) {
        Result<T> result = new Result<>();
        result.code=c;
        result.message=m;
        return result;
    }

    public static <T> Result<T> fail(T data) {
        return build(data, ResultCodeEnum.FAIL);
    }

    public Result<T> message(String msg) {
        this.setMessage(msg);
        return this;
    }

    public Result<T> code(Integer code) {
        this.setCode(code);
        return this;
    }

    public boolean isOk() {
        return this.getCode() == ResultCodeEnum.SUCCESS.getCode();
    }
}
