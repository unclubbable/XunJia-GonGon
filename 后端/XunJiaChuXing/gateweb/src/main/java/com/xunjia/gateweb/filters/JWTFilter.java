package com.xunjia.gateweb.filters;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.json.JSONUtil;
import com.xunjia.api.result.Result;
import com.xunjia.api.result.ResultCodeEnum;
import com.xunjia.common.model.TokenResult;
import com.xunjia.common.constant.IdentityConstant;
import com.xunjia.common.constant.TokenConstants;
import com.xunjia.gateweb.auth.InPath;
import com.xunjia.common.util.JwtUtils;
import com.xunjia.common.util.RedisPrefixUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Component
public class JWTFilter implements GlobalFilter, Ordered {
    private static final String DRIVER_PREFIX = "/driver-user";
    private static final String PASSENGER_PREFIX = "/passenger-user";
    private static final String BOSS_PREFIX = "/boss-user";

    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private InPath inPath;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String requestPath = request.getURI().getPath();
        log.debug("访问路径：" + requestPath);
        if (isExclude(requestPath)) {
            log.debug("不需要拦截--放行");
            return chain.filter(exchange);
        }

        boolean result = true;
        ResultCodeEnum errorCode = ResultCodeEnum.TOKEN_ERROR;

        String token = resolveToken(request);
        TokenResult tokenResult = JwtUtils.checkToken(token);

        if (tokenResult == null) {
            result = false;
        } else {
            String phone = tokenResult.getPhone();
            String identity = tokenResult.getIdentity();

            String tokenKey = RedisPrefixUtils.generatorTokenKey(phone, identity, TokenConstants.ACCESS_TOKEN_TYPE);
            String tokenRedis = stringRedisTemplate.opsForValue().get(tokenKey);
            if ((StringUtils.isBlank(tokenRedis)) || (!token.trim().equals(tokenRedis.trim()))) {
                result = false;
                // JWT 仍能解析但 Redis 已是新 token → 多半被挤下线
                if (StringUtils.isNotBlank(tokenRedis)) {
                    errorCode = ResultCodeEnum.TOKEN_REPLACED;
                }
            }
            if (result && !matchIdentity(requestPath, identity)) {
                log.warn("身份与访问路径不匹配，path={} identity={}", requestPath, identity);
                result = false;
                errorCode = ResultCodeEnum.TOKEN_IDENTITY_MISMATCH;
            }
        }

        if (!result) {
            log.warn("token验证失败, code={}", errorCode.getCode());
            return unauthorized(exchange.getResponse(), errorCode);
        }

        ServerWebExchange build = exchange.mutate().request(
                builder -> builder.header("tokenResult", JSONUtil.toJsonStr(tokenResult))
        ).build();
        log.debug("tokenResult:" + JSONUtil.toJsonStr(tokenResult));
        return chain.filter(build);
    }

    /** 兼容 Authorization 与管理端历史头 X-Token */
    private String resolveToken(ServerHttpRequest request) {
        List<String> headers = request.getHeaders().get("Authorization");
        if (!CollUtil.isEmpty(headers) && StringUtils.isNotBlank(headers.get(0))) {
            return headers.get(0);
        }
        List<String> xToken = request.getHeaders().get("X-Token");
        if (!CollUtil.isEmpty(xToken) && StringUtils.isNotBlank(xToken.get(0))) {
            return xToken.get(0);
        }
        return null;
    }

    private Mono<Void> unauthorized(ServerHttpResponse response, ResultCodeEnum errorCode) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        Result<Void> result = Result.fail(errorCode);
        byte[] bytes = JSONUtil.toJsonStr(result).getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    private boolean isExclude(String antPath) {
        if (inPath.getInpath() == null) {
            return false;
        }
        for (String pathPattern : inPath.getInpath()) {
            if (antPathMatcher.match(pathPattern, antPath)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchIdentity(String path, String identity) {
        if (path.startsWith(DRIVER_PREFIX)) {
            return IdentityConstant.DRIVER_IDENTITY.equals(identity);
        }
        if (path.startsWith(PASSENGER_PREFIX)) {
            return IdentityConstant.PASSENGER_IDENTITY.equals(identity);
        }
        if (path.startsWith(BOSS_PREFIX)) {
            return IdentityConstant.ADMIN_IDENTITY.equals(identity);
        }
        return true;
    }

    @Override
    public int getOrder() {
        return 1;
    }
}
