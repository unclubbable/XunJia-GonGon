package com.taxi.common.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTCreator;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.taxi.common.constant.TokenConstants;
import com.taxi.common.ThreadLoad.TokenResult;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;


public class JwtUtils {
    //sign 盐
    private static final String SIGN = "TAXIfd!cx@#$$";
    private static final String JWT_KEY_PHONE="passengerPhone";
    //乘客是1，司机是2
    private static final String JWT_KEY_IDENTITY="identity";

    //token类型
    private static final String JWT_TOKEN_TYPE="tokenType";

    private static final String JWT_TOKEN_TIME="tokenTime";

    //生成token
    public static String generatorToken(String phone,String identity,String tokenType) {

        JWTCreator.Builder builder = JWT.create();
        Map<String,String> map=new HashMap<>();
        map.put(JWT_KEY_PHONE,phone);
        map.put(JWT_KEY_IDENTITY,identity);
        map.put(JWT_TOKEN_TYPE,tokenType);

        //token 时间
        map.put(JWT_TOKEN_TIME,Calendar.getInstance().getTime().toString());

        //整合map
        map.forEach(
                (k, v) -> {
                    builder.withClaim(k, v);  // 函数式接口 BiConsumer / lambda
                }
        );
        //生成token
        return builder.sign(Algorithm.HMAC256(SIGN));
    }

    //解析token
    public static TokenResult parseToken(String token){
            JWTVerifier verifier = JWT.require(Algorithm.HMAC256(SIGN)).build();
            DecodedJWT jwt = verifier.verify(token);
            String phone = jwt.getClaim(JWT_KEY_PHONE).asString();
            String identity = jwt.getClaim(JWT_KEY_IDENTITY).asString();
            TokenResult result = new TokenResult();
            result.setPhone(phone);
            result.setIdentity(identity);
            return result;
    }

    /**
     * 主要判断token是否异常
     * @param token
     * @return
     */
    public static TokenResult checkToken(String token){
        //解析token
        TokenResult tokenResult = null;
        try {
            tokenResult = JwtUtils.parseToken(token);
        }catch (Exception e) {

        }
        return tokenResult;
    }

    public static void main(String[] args) {
        String s = generatorToken("17757195155","1", TokenConstants.ACCESS_TOKEN_TYPE);
        System.out.println("s = " + s);
//        String s = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXNzZW5nZXJQaG9uZSI6IjE3NzU3MTk1MTU1IiwiZXhwIjoxNjk1ODgyMTg5fQ.DPEgx5MSArRRu2e8HZYAUoQwRFfJeLBAyH1kBvrua2A";
//        System.out.println("s = " + s);
//        TokenResult tokenResult = parseToken(s);
//        System.out.println("tokenResult = " + tokenResult);
    }
}
