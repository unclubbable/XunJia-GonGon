package com.taxi.verificationcode.RadditMQListener;

import com.taxi.verificationcode.utils.Sample;
import net.bytebuddy.implementation.bind.annotation.BindingPriority;
import org.springframework.amqp.core.ExchangeTypes;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RabbitMQConsumer {
    @Autowired
    private Sample sample;
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "verificationcode.queues",durable = "true"),
            exchange = @Exchange(value = "verificationcode.push",type = ExchangeTypes.DIRECT)))
    public void consume(String msg){
        String[] split = msg.split("-");
        try {
            sample.push(split[0],split[2],split[1]);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
