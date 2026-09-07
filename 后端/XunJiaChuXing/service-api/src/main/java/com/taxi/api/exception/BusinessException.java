package com.taxi.api.exception;

import com.taxi.api.result.ResultCodeEnum;
import lombok.Getter;

/**
 * 业务异常，由全局异常处理器统一转换为 Result 响应
 */
@Getter
public class BusinessException extends RuntimeException {

    private final Integer code;


    public BusinessException(ResultCodeEnum resultCodeEnum) {
        super(resultCodeEnum.getMessage());
        this.code = resultCodeEnum.getCode();
    }

    public BusinessException(ResultCodeEnum resultCodeEnum, String message) {
        super(message);
        this.code = resultCodeEnum.getCode();
    }

    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }
}
