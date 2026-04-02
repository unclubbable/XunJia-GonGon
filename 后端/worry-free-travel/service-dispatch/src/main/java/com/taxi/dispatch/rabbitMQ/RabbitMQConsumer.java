package com.taxi.dispatch.rabbitMQ;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taxi.api.dto.OrderInfo;
import com.taxi.dispatch.service.DispatchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import com.rabbitmq.client.Channel;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
@Slf4j
public class RabbitMQConsumer {

    @Autowired
    private DispatchService dispatchService;

    @Autowired
    private RabbitMQProducer rabbitMQProducer;

    // 线程池配置 和你原来完全一样
    private int coreSize = 2 * Runtime.getRuntime().availableProcessors();
    private final ExecutorService executorService = Executors.newFixedThreadPool(coreSize);

    // 参数：messages=批量消息  |  channel=手动确认工具
    @RabbitListener(queues = "travel-topic")
    public void consumer(String messages, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {


        // 丢线程池异步处理
        executorService.execute(() -> {
            try {
                log.info("收到订单：{}", messages);
                consumeMsg(messages);
                // ======================
                channel.basicAck(deliveryTag, false);
            } catch (Exception e) {
                log.error("消费失败", e);
                try {
                    // 失败了，不重试，直接丢死信队列
                    channel.basicNack(deliveryTag, false, false);
                    rabbitMQProducer.sendMessage("errOrderHandle-topic", messages);
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }
        });
    }

    // ====================== 业务方法 ======================
    public void consumeMsg(String msg) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            OrderInfo orderInfo = objectMapper.readValue(msg, OrderInfo.class);
            log.info("开始处理订单：{}", orderInfo);
            dispatchService.disPatch(orderInfo);
        } catch (Exception e) {
            log.error("消费失败", e);
            // 失败消息发到失败队列
            rabbitMQProducer.sendMessage("errOrderHandle-topic", msg);
        }
    }
}