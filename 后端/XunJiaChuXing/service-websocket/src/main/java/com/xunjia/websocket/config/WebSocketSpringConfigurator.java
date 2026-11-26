package com.xunjia.websocket.config;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import javax.websocket.server.ServerEndpointConfig;

/**
 * 替代 SpringConfigurator：Boot 嵌入式 Tomcat 下 ContextLoader 常拿不到 root WAC，
 * 握手时会报 Failed to find the root WebApplicationContext。
 * Tomcat 会对 Configurator 做 new，故用静态 ApplicationContext 取 Endpoint Bean。
 */
@Component
public class WebSocketSpringConfigurator extends ServerEndpointConfig.Configurator
        implements ApplicationContextAware {

    private static volatile ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        WebSocketSpringConfigurator.context = applicationContext;
    }

    @Override
    public <T> T getEndpointInstance(Class<T> endpointClass) throws InstantiationException {
        if (context == null) {
            throw new IllegalStateException("WebSocket ApplicationContext 未初始化");
        }
        return context.getBean(endpointClass);
    }
}
