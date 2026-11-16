package com.guajsama.backend;

import com.guajsama.backend.utils.EncryptUtils;
import com.guajsama.backend.utils.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.HashMap;
import java.util.Map;

@SpringBootTest
class BackendApplicationTests {

    @Test
    void contextLoads() {
        String pwd = EncryptUtils.getMd5String("114514");
        System.out.println("pwd = " + pwd);
    }

}
