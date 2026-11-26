package com.xunjia.order.rabbitMQ;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;

/**
 * RabbitMQ 生产者
 */
@Component
@Slf4j
public class RabbitMQProducer {

    @Resource
    private RabbitTemplate rabbitTemplate;

    @PostConstruct
    public void init() {
        rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
            if (ack) {
                log.info("消息成功发送到 RabbitMQ 交换机");
            } else {
                log.error("消息发送到交换机失败，原因：{}", cause);
            }
        });

        rabbitTemplate.setReturnCallback((message, replyCode, replyText, exchange, routingKey) -> {
            log.error("消息路由到队列失败，路由键：{}，消息：{}", routingKey, new String(message.getBody()));
        });
    }

    /**
     * 发到默认交换机（routingKey = 队列名）。用于 travel-topic / err / travel-retry-wait。
     */
    public void sendMessage(String routingKey, String message) {
        String defaultExchange = "";
        rabbitTemplate.convertAndSend(defaultExchange, routingKey, message);
        log.info("消息已发出，路由键(对应Topic)：{}，消息内容：{}", routingKey, message);
    }

    /** 投递到延迟等待队列，TTL 到期后进入 travel-retry */
    public void sendDispatchRetryDelay(String messageJson) {
        sendMessage(RabbitMQConfig.TRAVEL_RETRY_WAIT, messageJson);
    }
}
