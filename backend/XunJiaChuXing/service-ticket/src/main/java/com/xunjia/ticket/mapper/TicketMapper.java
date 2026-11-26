package com.xunjia.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xunjia.api.dto.Ticket;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TicketMapper extends BaseMapper<Ticket> {
}
