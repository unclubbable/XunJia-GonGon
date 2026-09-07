package com.taxi.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.taxi.api.dto.Ticket;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TicketMapper extends BaseMapper<Ticket> {
}
