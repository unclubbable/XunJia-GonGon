package com.xunjia.order.rabbitMQ;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 队列声明：应用启动时若不存在则自动创建（MQ 重启后由本服务再次声明）。
 * <p>
 * 派单延迟重试：TTL + 死信（无需 delayed-message 插件）。
 * travel-retry-wait（TTL 20s，无消费者）到期 → DLX → travel-retry → 再消费搜车。
 */
@Configuration
public class RabbitMQConfig {

    public static final String TRAVEL_TOPIC = "travel-topic";
    public static final String ERR_ORDER_HANDLE_TOPIC = "errOrderHandle-topic";

    /** 延迟等待队列（无消费者，仅作 20s 定时） */
    public static final String TRAVEL_RETRY_WAIT = "travel-retry-wait";
    /** 延迟到期后的重试消费队列 */
    public static final String TRAVEL_RETRY = "travel-retry";
    public static final String TRAVEL_RETRY_EXCHANGE = "travel-retry-exchange";

    /** 单轮搜车间隔（毫秒），与原 Thread.sleep(20s) 对齐 */
    public static final int DISPATCH_RETRY_DELAY_MS = 20_000;
    /** 最多搜车轮次（每轮内部仍扩环 2→5km），与 README「约 5 轮」对齐 */
    public static final int MAX_DISPATCH_ATTEMPTS = 5;

    @Bean
    public Queue travelTopicQueue() {
        return QueueBuilder.durable(TRAVEL_TOPIC).build();
    }

    @Bean
    public Queue errOrderHandleTopicQueue() {
        return QueueBuilder.durable(ERR_ORDER_HANDLE_TOPIC).build();
    }

    @Bean
    public DirectExchange travelRetryExchange() {
        return new DirectExchange(TRAVEL_RETRY_EXCHANGE, true, false);
    }

    @Bean
    public Queue travelRetryQueue() {
        return QueueBuilder.durable(TRAVEL_RETRY).build();
    }

    @Bean
    public Binding travelRetryBinding() {
        return BindingBuilder.bind(travelRetryQueue()).to(travelRetryExchange()).with(TRAVEL_RETRY);
    }

    /**
     * 等待队列：消息存活 20s 后经死信交换机进入 travel-retry。
     */
    @Bean
    public Queue travelRetryWaitQueue() {
        return QueueBuilder.durable(TRAVEL_RETRY_WAIT)
                .ttl(DISPATCH_RETRY_DELAY_MS)
                .deadLetterExchange(TRAVEL_RETRY_EXCHANGE)
                .deadLetterRoutingKey(TRAVEL_RETRY)
                .build();
    }
}
