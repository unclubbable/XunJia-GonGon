package com.taxi.gateweb.filters;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.json.JSONUtil;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.common.ThreadLoad.TokenResult;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.TokenConstants;
import com.taxi.gateweb.JWTPathclass.InPath;
import com.taxi.common.util.JwtUtils;
import com.taxi.common.util.RedisPrefixUtils;
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

    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private InPath inPath;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();     //路径匹配器
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String requestPath = request.getURI().getPath();
        log.debug("访问路径："+requestPath);
        if (isExclude(requestPath)){
            log.debug("不需要拦截--放行");
            return chain.filter(exchange);
        }

        // 判断结果
        boolean result = true;
        ResultCodeEnum errorCode = ResultCodeEnum.TOKEN_ERROR;

        List<String> headers = request.getHeaders().get("Authorization");
        String token = null;
        if (!CollUtil.isEmpty( headers)){
            token = headers.get(0);
        }
        // 解析token
        TokenResult tokenResult = JwtUtils.checkToken(token);

        if (tokenResult == null){
            result = false;
        }else{
            // 拼接key
            String phone = tokenResult.getPhone();
            String identity = tokenResult.getIdentity();

            String tokenKey = RedisPrefixUtils.generatorTokenKey(phone,identity, TokenConstants.ACCESS_TOKEN_TYPE);
            // 从redis中取出token
            String tokenRedis = stringRedisTemplate.opsForValue().get(tokenKey);
            if ((StringUtils.isBlank(tokenRedis))  || (!token.trim().equals(tokenRedis.trim()))){
                result = false;
            }
            // 按根路径校验身份，避免司机/乘客 token 互相访问
            if (result && !matchIdentity(requestPath, identity)) {
                log.error("身份与访问路径不匹配，path={} identity={}", requestPath, identity);
                result = false;
                errorCode = ResultCodeEnum.TOKEN_IDENTITY_MISMATCH;
            }
        }
        // 返回结果
        if (!result){
            log.error("token验证失败, code={}", errorCode.getCode());
            return unauthorized(exchange.getResponse(), errorCode);
        }

        ServerWebExchange build = exchange.mutate().request(
                builder -> builder
                        .header("tokenResult", JSONUtil.toJsonStr(tokenResult))
        ).build();
        log.debug("tokenResult:"+JSONUtil.toJsonStr(tokenResult));
        return chain.filter(build);
    }

    /**
     * 返回统一 Result JSON 格式的 401 响应
     */
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
            if(antPathMatcher.match(pathPattern, antPath)){
                return true;
            }
        }
        return false;
    }

    /**
     * 司机根路径只允许司机身份，乘客根路径只允许乘客身份
     */
    private boolean matchIdentity(String path, String identity) {
        if (path.startsWith(DRIVER_PREFIX)) {
            return IdentityConstant.DRIVER_IDENTITY.equals(identity);
        }
        if (path.startsWith(PASSENGER_PREFIX)) {
            return IdentityConstant.PASSENGER_IDENTITY.equals(identity);
        }
        return true;
    }

    @Override
    public int getOrder() {
        return 1;
    }
}
