package com.xunjia.api.response;

import com.xunjia.api.dto.OrderRefund;
import com.xunjia.api.dto.Ticket;
import com.xunjia.api.dto.TicketMessage;
import lombok.Data;

import java.util.List;

@Data
public class TicketDetailVO {

    private Ticket ticket;

    private List<TicketMessage> messages;

    private OrderRefund refund;
}
