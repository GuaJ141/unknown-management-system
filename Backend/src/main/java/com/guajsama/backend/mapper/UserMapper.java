package com.guajsama.backend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface UserMapper {
    @Select("""
            SELECT id AS userId, login_no AS loginNo, password_hash AS passwordHash,
                   role, must_change_password AS mustChangePassword
            FROM user_account
            WHERE status = 1 AND (login_no = #{login_no} OR phone = #{login_no})
            LIMIT 2
            """)
    List<Map<String, Object>> findActiveAccountsByLoginNo(@Param("login_no") String loginNo);
}
