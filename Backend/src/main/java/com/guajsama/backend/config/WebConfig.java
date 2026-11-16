package com.guajsama.backend.config;

import com.guajsama.backend.interceptor.CollegeAdminInterceptor;
import com.guajsama.backend.interceptor.LoginInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final LoginInterceptor loginInterceptor;
    private final CollegeAdminInterceptor collegeAdminInterceptor;

    public WebConfig(LoginInterceptor loginInterceptor, CollegeAdminInterceptor collegeAdminInterceptor) {
        this.loginInterceptor = loginInterceptor;
        this.collegeAdminInterceptor = collegeAdminInterceptor;
    }

    private static final String CONTROLLER_PREFIX = "/api/v1";

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        //登录接口不拦截
        registry.addInterceptor(loginInterceptor).excludePathPatterns(
                CONTROLLER_PREFIX + "/user/login"
        ).order(0);

        registry.addInterceptor(collegeAdminInterceptor).addPathPatterns(
                CONTROLLER_PREFIX + "/college-admin"
        );
    }


    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix(
                CONTROLLER_PREFIX,
                C -> C.isAnnotationPresent(RestController.class)
        );
    }
}
