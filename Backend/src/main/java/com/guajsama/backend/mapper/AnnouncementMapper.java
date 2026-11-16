package com.guajsama.backend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface AnnouncementMapper {
    @Select("""
            SELECT college_id AS collegeId, role
            FROM user_account
            WHERE id = #{userId} AND status = 1 AND role IN (1, 2, 3)
            """)
    Map<String, Object> findActiveAnnouncementViewer(@Param("userId") Long userId);

    @Select("""
            SELECT a.id, a.title, a.content, a.publish_time AS publishTime
            FROM announcement a
            WHERE a.status = 1 AND (a.college_id IS NULL OR a.college_id = #{collegeId})
            ORDER BY a.publish_time DESC, a.id DESC
            """)
    List<Map<String, Object>> findAnnouncements(@Param("collegeId") Long collegeId);
}
