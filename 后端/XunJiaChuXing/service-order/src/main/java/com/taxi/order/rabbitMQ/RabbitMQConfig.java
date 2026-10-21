package com.taxi.order.rabbitMQ;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 队列声明：启动时若不存在则自动创建
 */
@Configuration
public class RabbitMQConfig {

    public static final String TRAVEL_TOPIC = "travel-topic";
    public static final String ERR_ORDER_HANDLE_TOPIC = "errOrderHandle-topic";

    /**
     * 派单队列（持久化）
     */
    @Bean
    public Queue travelTopicQueue() {
        return new Queue(TRAVEL_TOPIC, true);
    }

    /**
     * 异常订单处理队列（持久化）
     */
    @Bean
    public Queue errOrderHandleTopicQueue() {
        return new Queue(ERR_ORDER_HANDLE_TOPIC, true);
    }
}
