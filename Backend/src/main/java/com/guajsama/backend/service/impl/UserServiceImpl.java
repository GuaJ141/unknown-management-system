package com.guajsama.backend.service.impl;

import com.guajsama.backend.mapper.UserMapper;
import com.guajsama.backend.module.dto.LoginRequest;
import com.guajsama.backend.module.vo.LoginResponse;
import com.guajsama.backend.service.UserService;
import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.utils.EncryptUtils;
import com.guajsama.backend.utils.JwtUtils;
import com.guajsama.backend.utils.RedisUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {
    private static final String INVALID_CREDENTIALS_MESSAGE = "账号或密码错误";

    private final UserMapper userMapper;
    private final RedisUtil redisUtil;

    public UserServiceImpl(UserMapper userMapper, RedisUtil redisUtil) {
        this.userMapper = userMapper;
        this.redisUtil = redisUtil;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        List<Map<String, Object>> accounts =
                userMapper.findActiveAccountsByLoginNo(request.loginNo().trim());
        if (accounts.size() != 1) {
            throw invalidCredentials();
        }

        Map<String, Object> account = accounts.get(0);
        Object passwordHash = account.get("passwordHash");
        if (!(passwordHash instanceof String hash) || !EncryptUtils.verify(request.password(), hash)) {
            throw invalidCredentials();
        }

        long userId = numberValue(account.get("userId"));
        int role = (int) numberValue(account.get("role"));
        boolean mustChangePassword = numberValue(account.get("mustChangePassword")) == 1;
        String loginNo = (String) account.get("loginNo");
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", userId);
        claims.put("username", loginNo);
        claims.put("role", role);

        String token = JwtUtils.genToken(claims);
        redisUtil.getUrlStringTemplate().set("auth:" + userId, token, JwtUtils.EXPIRATION);
        return new LoginResponse(token, userId, role, mustChangePassword, loginNo);
    }

    private StudentServiceException invalidCredentials() {
        return new StudentServiceException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS_MESSAGE);
    }

    private long numberValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new IllegalStateException("数据库返回了无效的数字字段");
    }
}
