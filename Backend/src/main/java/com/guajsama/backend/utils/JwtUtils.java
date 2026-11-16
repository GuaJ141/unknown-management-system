package com.guajsama.backend.utils;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

import java.time.Instant;
import java.util.Date;
import java.util.Map;

//token工具类
public class JwtUtils {
    public static final long EXPIRATION = 1000 * 60 * 60 * 3; //token过期时间(3h)
    private static final String S_KEY = "eb032c24c65b4fc6897ed65ecf93da8e"; //密钥
    private static final int EXPIRATION_FOREVER = 1000 * 60 * 60 * 100;

    //生成token
    public static String genToken(Map<String, Object> claims){
        String token = JWT.create()
                .withClaim("claims", claims) //添加载荷
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION)) //添加过期时间
                .withIssuedAt(Instant.now())
                .sign(Algorithm.HMAC256(S_KEY)); //指定算法，配置秘钥

        return token;
    }

    //验证token，并返回业务信息
    public static Map<String, Object> parseToken(String token){
        return JWT.require(Algorithm.HMAC256(S_KEY))
                .build()
                .verify(token)
                .getClaim("claims")
                .asMap();
    }
}
