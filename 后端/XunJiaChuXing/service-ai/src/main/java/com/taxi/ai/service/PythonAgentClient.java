package com.taxi.ai.service;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.taxi.api.exception.BusinessException;
import com.taxi.api.result.ResultCodeEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class PythonAgentClient {

    @Autowired
    private RestTemplate agentRestTemplate;

    @Value("${agent.python-base-url:http://127.0.0.1:18080}")
    private String pythonBaseUrl;

    public JSONObject ticketAssist(Map<String, Object> payload) {
        return postJson("/v1/ticket/assist", payload);
    }

    public JSONObject ticketChat(Map<String, Object> payload) {
        return postJson("/v1/ticket/chat", payload);
    }

    private JSONObject postJson(String path, Map<String, Object> payload) {
        String url = pythonBaseUrl.replaceAll("/$", "") + path;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        try {
            ResponseEntity<String> resp = agentRestTemplate.postForEntity(url, entity, String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw new BusinessException(ResultCodeEnum.AI_AGENT_UNAVAILABLE, "Python Agent 返回异常");
            }
            return JSONUtil.parseObj(resp.getBody());
        } catch (RestClientException ex) {
            log.error("call python agent {} failed: {}", path, ex.getMessage());
            throw new BusinessException(ResultCodeEnum.AI_AGENT_UNAVAILABLE,
                    "无法连接 Python Agent，请确认已启动 :18080");
        }
    }
}
