package com.guajsama.backend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CommonMapper {
    @Select("""
            SELECT semester
            FROM semester
            ORDER BY semester
            """)
    List<String> findSemesters();
}
