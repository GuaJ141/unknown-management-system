package com.guajsama.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guajsama.backend.mapper.UserMapper;
import com.guajsama.backend.module.dto.LoginRequest;
import com.guajsama.backend.module.vo.LoginResponse;
import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.utils.EncryptUtils;
import com.guajsama.backend.utils.JwtUtils;
import com.guajsama.backend.utils.RedisUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceImplTest {
    private UserMapper userMapper;
    private RedisUtil redisUtil;
    private RedisUtil.StringTemplate redisTemplate;
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userMapper = mock(UserMapper.class);
        redisUtil = mock(RedisUtil.class);
        redisTemplate = mock(RedisUtil.StringTemplate.class);
        when(redisUtil.getUrlStringTemplate()).thenReturn(redisTemplate);
        userService = new UserServiceImpl(userMapper, redisUtil);
    }

    @Test
    void loginRequestAcceptsDocumentedLoginNoField() throws Exception {
        LoginRequest request = new ObjectMapper().readValue(
                """
                        {"login_no":"20260001","password":"123456"}
                        """,
                LoginRequest.class);

        assertEquals("20260001", request.loginNo());
    }

    @Test
    void loginRequestAcceptsCamelCaseLoginNoField() throws Exception {
        LoginRequest request = new ObjectMapper().readValue(
                """
                        {"loginNo":"20260001","password":"123456"}
                        """,
                LoginRequest.class);

        assertEquals("20260001", request.loginNo());
    }

    @Test
    void loginWithPhoneReturnsTokenAndStoresSession() {
        String passwordHash = EncryptUtils.getMd5String("123456");
        when(userMapper.findActiveAccountsByLoginNo("13800000000"))
                .thenReturn(List.of(Map.of(
                        "userId", 42L,
                        "loginNo", "20260001",
                        "passwordHash", passwordHash,
                        "role", 1,
                        "mustChangePassword", 1
                )));

        LoginResponse response = userService.login(new LoginRequest(" 13800000000 ", "123456"));

        assertEquals(42L, response.userId());
        assertEquals(1, response.role());
        assertTrue(response.mustChangePassword());
        assertEquals("20260001", response.loginNo());
        assertEquals(42L, ((Number) JwtUtils.parseToken(response.token()).get("id")).longValue());
        verify(redisTemplate).set("auth:42", response.token(), JwtUtils.EXPIRATION);
    }

    @Test
    void loginResponseSerializesLoginNoField() throws Exception {
        LoginResponse response = new LoginResponse("token", 42L, 1, true, "20260001");

        assertEquals("20260001",
                new ObjectMapper().readTree(new ObjectMapper().writeValueAsString(response))
                        .get("login_no").asText());
    }

    @Test
    void loginWithInvalidPasswordReturnsUnauthorized() {
        when(userMapper.findActiveAccountsByLoginNo("student"))
                .thenReturn(List.of(Map.of(
                        "userId", 42L,
                        "loginNo", "student",
                        "passwordHash", EncryptUtils.getMd5String("correct"),
                        "role", 1,
                        "mustChangePassword", 0
                )));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> userService.login(new LoginRequest("student", "wrong")));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("账号或密码错误", exception.getMessage());
    }
}
