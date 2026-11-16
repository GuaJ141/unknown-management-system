package com.guajsama.backend.interceptor;

import com.guajsama.backend.utils.JwtUtils;
import com.guajsama.backend.utils.RedisUtil;
import com.guajsama.backend.utils.ThreadLocalUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;

import static jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED;

@Component
public class LoginInterceptor implements HandlerInterceptor {
    private final RedisUtil redisUtil;

    public LoginInterceptor(RedisUtil redisUtil) {
        this.redisUtil = redisUtil;
    }

    //controller方法执行前，返回true->放行， 返回false->拦截
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        //获取头部中的token
        String token = request.getHeader("Authorization");
        try {
            //验证token，获取token中的数据
            Map<String, Object> claims =  JwtUtils.parseToken(token);

            //Redis验证token
            String redisToken = (String) redisUtil.getUrlStringTemplate().get("auth:"+claims.get("id"));
            if (redisToken == null || !redisToken.equals(token)){ //键不存在或者值为null
                throw new RuntimeException();
            }

            //存入TheadLocal中
            ThreadLocalUtils.set(claims);

            //放行
            return true;
        } catch (Exception e) {
            response.setStatus(SC_UNAUTHORIZED); //http响应码401
            //不放行
            return false;
        }
    }

    //preHandle，postHandle都执行完后执行/ controller方法执行后
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, @Nullable Exception ex) throws Exception {
        //清空ThreadLocal中的数据，防止内存泄漏
        ThreadLocalUtils.remove();
    }


}
