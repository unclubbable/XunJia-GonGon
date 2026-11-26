package com.xunjia.api.config;

import com.xunjia.api.exception.GlobalExceptionHandler;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Import;

/**
 * service-api 自动配置，注册全局异常处理器
 */
@AutoConfiguration
@Import(GlobalExceptionHandler.class)
public class ApiAutoConfiguration {
}
