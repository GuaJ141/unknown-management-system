package com.guajsama.backend.interceptor;

import com.github.pagehelper.Page;
import com.guajsama.backend.utils.ThreadLocalUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;

@Component
public class CollegeAdminInterceptor implements HandlerInterceptor {

    private final int ADMIN_ROLE = 3;
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        Map<String, Object> map = ThreadLocalUtils.get();
        int role = (int)map.get("role");

        if(role != ADMIN_ROLE) {
            return false;
        }

        return true;
    }
}
