package com.taxi.order.rabbitMQ;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.Channel;
import com.taxi.api.dto.OrderInfo;
import com.taxi.order.service.DispatchService;
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

    private int coreSize = 2 * Runtime.getRuntime().availableProcessors();
    private final ExecutorService executorService = new ThreadPoolExecutor(
            coreSize,
            coreSize,
            0,
            TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(100),
            new ThreadPoolExecutor.AbortPolicy()
    );

    @RabbitListener(queues = "travel-topic")
    public void consumer(String messages, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        executorService.execute(() -> {
            try {
                log.info("收到订单：{}", messages);
                consumeMsg(messages);
                channel.basicAck(deliveryTag, false);
            } catch (Exception e) {
                log.error("消费失败", e);
                try {
                    channel.basicNack(deliveryTag, false, false);
                    rabbitMQProducer.sendMessage("errOrderHandle-topic", messages);
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }
        });
    }

    public void consumeMsg(String msg) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            OrderInfo orderInfo = objectMapper.readValue(msg, OrderInfo.class);
            log.info("开始处理订单：{}", orderInfo);
            dispatchService.disPatch(orderInfo);
        } catch (Exception e) {
            log.error("消费失败", e);
            rabbitMQProducer.sendMessage("errOrderHandle-topic", msg);
        }
    }
}
