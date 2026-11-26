package com.xunjia.order.rabbitMQ;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.Channel;
import com.xunjia.api.dto.OrderInfo;
import com.xunjia.order.service.DispatchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class RabbitMQConsumer {

    @Autowired
    private DispatchService dispatchService;

    @Autowired
    private RabbitMQProducer rabbitMQProducer;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final int coreSize = 2 * Runtime.getRuntime().availableProcessors();
    private final ExecutorService executorService = new ThreadPoolExecutor(
            coreSize,
            coreSize,
            0,
            TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(100),
            new ThreadPoolExecutor.AbortPolicy()
    );

    @RabbitListener(queues = RabbitMQConfig.TRAVEL_TOPIC)
    public void consumeTravel(String messages, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        handleAsync(messages, channel, deliveryTag, true);
    }

    @RabbitListener(queues = RabbitMQConfig.TRAVEL_RETRY)
    public void consumeTravelRetry(String messages, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        handleAsync(messages, channel, deliveryTag, false);
    }

    private void handleAsync(String messages, Channel channel, long deliveryTag, boolean firstAttemptDefault) {
        executorService.execute(() -> {
            try {
                log.info("收到派单消息 firstQueue={} body={}", firstAttemptDefault, messages);
                consumeDispatch(messages, firstAttemptDefault);
                channel.basicAck(deliveryTag, false);
            } catch (Exception e) {
                log.error("派单消费失败", e);
                try {
                    channel.basicNack(deliveryTag, false, false);
                    rabbitMQProducer.sendMessage(RabbitMQConfig.ERR_ORDER_HANDLE_TOPIC, messages);
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }
        });
    }

    /**
     * 兼容：旧消息为纯 OrderInfo JSON；新消息为 {@link DispatchMessage}。
     */
    void consumeDispatch(String msg, boolean firstAttemptDefault) throws Exception {
        JsonNode root = objectMapper.readTree(msg);
        Long orderId;
        int retryCount;
        OrderInfo snapshot = null;

        if (root.has("orderId") || root.has("retryCount") || root.has("orderSnapshot")) {
            DispatchMessage dm = objectMapper.treeToValue(root, DispatchMessage.class);
            orderId = dm.getOrderId();
            retryCount = dm.getRetryCount();
            snapshot = dm.getOrderSnapshot();
            if (orderId == null && snapshot != null) {
                orderId = snapshot.getId();
            }
        } else {
            // 历史 travel-topic：整段 OrderInfo
            snapshot = objectMapper.treeToValue(root, OrderInfo.class);
            orderId = snapshot.getId();
            retryCount = firstAttemptDefault ? 0 : 0;
        }

        if (orderId == null) {
            throw new IllegalArgumentException("派单消息缺少 orderId");
        }
        dispatchService.handleDispatch(orderId, retryCount, snapshot);
    }
}
