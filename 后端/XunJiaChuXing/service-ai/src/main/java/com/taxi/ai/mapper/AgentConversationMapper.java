package com.taxi.ai.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.taxi.api.dto.AgentConversation;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AgentConversationMapper extends BaseMapper<AgentConversation> {
}
