package com.taxi.api.response;

import com.taxi.api.dto.OrderRefund;
import com.taxi.api.dto.Ticket;
import com.taxi.api.dto.TicketMessage;
import lombok.Data;

import java.util.List;

@Data
public class TicketDetailVO {

    private Ticket ticket;

    private List<TicketMessage> messages;

    private OrderRefund refund;
}
