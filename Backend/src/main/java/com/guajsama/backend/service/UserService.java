package com.guajsama.backend.service;

import com.guajsama.backend.module.dto.LoginRequest;
import com.guajsama.backend.module.vo.LoginResponse;

public interface UserService {
    LoginResponse login(LoginRequest request);
}
