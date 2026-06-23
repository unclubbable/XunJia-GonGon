package com.taxi.gatewebdriver.filters;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.json.JSONUtil;
import com.taxi.common.ThreadLoad.TokenResult;
import com.taxi.common.constant.TokenConstants;
import com.taxi.gatewebdriver.JWTPathclass.InPath;
import com.taxi.common.util.JwtUtils;
import com.taxi.common.util.RedisPrefixUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Component
public class JWTFilter implements GlobalFilter, Ordered {
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private InPath inPath;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();     //路径匹配器
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        log.debug("访问路径："+request.getPath().toString());
        if (isExclude(request.getPath().toString())){
            log.debug("不需要拦截--放行");
            return chain.filter(exchange);
        }

        // 判断结果
        boolean result = true;

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
        }
        // 返回结果
        if (!result){
//            PrintWriter out = response.getWriter();
//            out.print(JSONObject.fromObject(Result.fail(null, ResultCodeEnum.TOKEN_ERROR)).toString());
            log.error("token验证失败");
            ServerHttpResponse response = exchange.getResponse();
            response.setRawStatusCode(401);
            return response.setComplete();
        }

        ServerWebExchange build = exchange.mutate().request(
                builder -> builder
                        .header("tokenResult", JSONUtil.toJsonStr(tokenResult))
        ).build();
        log.debug("tokenResult:"+JSONUtil.toJsonStr(tokenResult));
        return chain.filter(build);
    }
    private boolean isExclude(String antPath) {
        for (String pathPattern : inPath.getInpath()) {
            if(antPathMatcher.match(pathPattern, antPath)){
                return true;
            }
        }
        return false;
    }

    @Override
    public int getOrder() {
        return 1;
    }
}
