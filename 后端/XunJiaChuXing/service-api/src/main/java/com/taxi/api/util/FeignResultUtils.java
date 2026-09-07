package com.taxi.api.util;

import com.taxi.api.exception.BusinessException;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;

/** Feign 返回校验，空/失败直接抛 */
public final class FeignResultUtils {

    private FeignResultUtils() {}

    /** ok 取 data，否则抛业务异常 */
    public static <T> T checkAndGet(Result<T> result) {
        if (result == null) {
            throw new BusinessException(ResultCodeEnum.INTERNAL_ERROR, "远程调用返回为空");
        }
        if (!result.isOk()) {
            throw new BusinessException(result.getCode(), result.getMessage());
        }
        return result.getData();
    }

    /** 失败时用默认错误码 */
    public static <T> T checkAndGet(Result<T> result, ResultCodeEnum defaultError) {
        if (result == null) {
            throw new BusinessException(defaultError);
        }
        if (!result.isOk()) {
            throw new BusinessException(result.getCode(), result.getMessage());
        }
        return result.getData();
    }
}
