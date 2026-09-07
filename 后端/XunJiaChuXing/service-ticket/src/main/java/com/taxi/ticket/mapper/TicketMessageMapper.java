package com.taxi.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.taxi.api.dto.TicketMessage;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TicketMessageMapper extends BaseMapper<TicketMessage> {
}
