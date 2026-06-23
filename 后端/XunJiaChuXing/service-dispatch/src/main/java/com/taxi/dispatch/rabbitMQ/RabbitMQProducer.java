package com.taxi.dispatch.rabbitMQ;

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

    /**
     * 初始化：配置消息确认回调
     */
    @PostConstruct
    public void init() {
        // 消息发送到交换机成功/失败回调
        rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
            if (ack) {
                log.info("消息成功发送到 RabbitMQ 交换机");
            } else {
                log.error("消息发送到交换机失败，原因：{}", cause);
            }
        });

        // 消息路由到队列失败回调（冗余保障）
        rabbitTemplate.setReturnCallback((message, replyCode, replyText, exchange, routingKey) -> {
            log.error("消息路由到队列失败，路由键：{}，消息：{}", routingKey, new String(message.getBody()));
        });
    }

    /**
     * 异步发送消息
     * @param routingKey （RabbitMQ路由键）
     * @param message 消息内容
     */
    //所有队列，都会自动绑定到默认交换机上，绑定的 routingKey = 队列自己的名字
    public void sendMessage(String routingKey, String message) {
        // RabbitMQ 默认交换机
        String defaultExchange = "";

        // 异步发送消息
        rabbitTemplate.convertAndSend(defaultExchange, routingKey, message);
        log.info("消息已发出，路由键(对应Topic)：{}，消息内容：{}", routingKey, message);
    }
}