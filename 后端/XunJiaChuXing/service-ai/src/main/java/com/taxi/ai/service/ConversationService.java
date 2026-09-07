package com.taxi.ai.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.taxi.api.constant.AgentConstants;
import com.taxi.api.dto.AgentConversation;
import com.taxi.ai.mapper.AgentConversationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Date;
import java.util.UUID;

@Service
public class ConversationService {

    @Autowired
    private AgentConversationMapper conversationMapper;

    /**
     * 获取或创建 ACTIVE 会话。newThread=true 时关闭旧会话并新建。
     */
    public AgentConversation getOrCreate(String userType,
                                         Long userId,
                                         String agentScene,
                                         Long bizId,
                                         String title,
                                         boolean newThread) {
        if (!StringUtils.hasText(userType) || userId == null || !StringUtils.hasText(agentScene)) {
            throw new IllegalArgumentException("userType/userId/agentScene required");
        }

        if (newThread) {
            closeActive(userType, userId, agentScene, bizId);
            return create(userType, userId, agentScene, bizId, title);
        }

        AgentConversation existing = findActive(userType, userId, agentScene, bizId);
        if (existing != null) {
            return existing;
        }
        return create(userType, userId, agentScene, bizId, title);
    }

    public AgentConversation findActive(String userType, Long userId, String agentScene, Long bizId) {
        LambdaQueryWrapper<AgentConversation> qw = new LambdaQueryWrapper<>();
        qw.eq(AgentConversation::getUserType, userType)
                .eq(AgentConversation::getUserId, userId)
                .eq(AgentConversation::getAgentScene, agentScene)
                .eq(AgentConversation::getStatus, AgentConstants.STATUS_ACTIVE)
                .orderByDesc(AgentConversation::getId)
                .last("LIMIT 1");
        if (bizId == null) {
            qw.isNull(AgentConversation::getBizId);
        } else {
            qw.eq(AgentConversation::getBizId, bizId);
        }
        return conversationMapper.selectOne(qw);
    }

    public void touch(Long conversationId) {
        if (conversationId == null) {
            return;
        }
        AgentConversation patch = new AgentConversation();
        patch.setId(conversationId);
        patch.setLastMsgAt(new Date());
        patch.setGmtModified(new Date());
        conversationMapper.updateById(patch);
    }

    private void closeActive(String userType, Long userId, String agentScene, Long bizId) {
        AgentConversation active = findActive(userType, userId, agentScene, bizId);
        if (active == null) {
            return;
        }
        AgentConversation patch = new AgentConversation();
        patch.setId(active.getId());
        patch.setStatus(AgentConstants.STATUS_CLOSED);
        patch.setGmtModified(new Date());
        conversationMapper.updateById(patch);
    }

    private AgentConversation create(String userType, Long userId, String agentScene, Long bizId, String title) {
        Date now = new Date();
        AgentConversation row = new AgentConversation();
        row.setThreadId(UUID.randomUUID().toString().replace("-", ""));
        row.setUserType(userType);
        row.setUserId(userId);
        row.setAgentScene(agentScene);
        row.setBizId(bizId);
        row.setTitle(title);
        row.setStatus(AgentConstants.STATUS_ACTIVE);
        row.setLastMsgAt(now);
        row.setGmtCreate(now);
        row.setGmtModified(now);
        conversationMapper.insert(row);
        return row;
    }
}
