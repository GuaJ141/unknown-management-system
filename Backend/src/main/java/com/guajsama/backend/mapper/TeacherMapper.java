package com.guajsama.backend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface TeacherMapper {
    @Select("""
            SELECT t.id AS teacherId
            FROM teacher t
            JOIN user_account u ON u.id = t.user_id
            WHERE t.user_id = #{userId} AND t.college_id = u.college_id
              AND u.role = 2 AND u.status = 1
            """)
    Map<String, Object> findTeacherByUserId(@Param("userId") Long userId);

    @Select("""
            SELECT t.id AS teacherId
            FROM teacher t
            JOIN user_account u ON u.id = t.user_id
            WHERE t.user_id = #{userId} AND t.name = #{name} AND t.id_card = #{idCard}
              AND t.college_id = u.college_id AND u.role = 2 AND u.status = 1
            """)
    Long verifyTeacherIdentity(@Param("userId") Long userId,
                               @Param("name") String name,
                               @Param("idCard") String idCard);

    @Update("""
            UPDATE user_account
            SET phone = #{phone}
            WHERE id = #{userId} AND role = 2 AND status = 1
            """)
    int updatePhone(@Param("userId") Long userId, @Param("phone") String phone);

    @Update("""
            UPDATE user_account
            SET password_hash = #{passwordHash}, must_change_password = 0
            WHERE id = #{userId} AND role = 2 AND status = 1
            """)
    int updatePassword(@Param("userId") Long userId, @Param("passwordHash") String passwordHash);

    @Select("""
            SELECT DISTINCT cl.id AS classId, cl.class_name AS className, cl.grade,
                   YEAR(cl.enrollment_year) AS enrollmentYear,
                   YEAR(cl.graduation_year) AS graduationYear, cl.status AS classStatus,
                   s.id AS studentId, s.student_no AS studentNo, s.name AS studentName
            FROM course c
            JOIN course_selection cs ON cs.course_id = c.id AND cs.status = 1
            JOIN student s ON s.id = cs.student_id
            LEFT JOIN `class` cl ON cl.id = s.class_id AND cl.college_id = s.college_id
            WHERE c.teacher_id = #{teacherId} AND c.id = #{courseId}
            ORDER BY cl.class_name, s.student_no
            """)
    List<Map<String, Object>> findClassStudents(@Param("teacherId") Long teacherId,
                                                @Param("courseId") Long courseId);

    @Select("""
            SELECT c.id AS courseId, c.course_code AS courseCode, c.name AS courseName,
                   c.credit, c.hours, c.assess_type AS assessType, c.teacher_id AS teacherId,
                   c.course_type AS courseType, c.status
            FROM course c
            WHERE c.teacher_id = #{teacherId}
            ORDER BY c.course_code
            """)
    List<Map<String, Object>> findCoursesByTeacherId(@Param("teacherId") Long teacherId);

    @Select("""
            SELECT s.id AS studentId, s.student_no AS studentNo, s.name AS studentName,
                   cl.id AS classId, cl.class_name AS className,
                   c.id AS courseId, c.course_code AS courseCode, c.name AS courseName,
                   t.id AS teacherId, t.name AS teacherName,
                   cs.score, cs.grade_point AS gradePoint,
                   cs.score_updated_at AS scoreUpdatedAt
            FROM course_selection cs
            JOIN student s ON s.id = cs.student_id
            JOIN `class` cl ON cl.id = s.class_id
            JOIN course c ON c.id = cs.course_id
            JOIN teacher t ON t.id = c.teacher_id
            WHERE s.class_id = #{classId}
              AND c.id = #{courseId}
              AND c.teacher_id = #{teacherId}
              AND cs.status = 1
              AND (#{adminUserId} IS NULL OR EXISTS (
                  SELECT 1
                  FROM user_account admin_account
                  WHERE admin_account.id = #{adminUserId} AND admin_account.role = 3
                    AND admin_account.status = 1
                    AND admin_account.college_id = t.college_id
              ))
            ORDER BY s.student_no
            """)
    List<Map<String, Object>> findScoresByClassCourseAndTeacher(@Param("classId") Long classId,
                                                                  @Param("courseId") Long courseId,
                                                                  @Param("teacherId") Long teacherId,
                                                                  @Param("adminUserId") Long adminUserId);

    @Select("""
            SELECT sch.id AS scheduleId, c.id AS courseId, c.course_code AS courseCode,
                   c.name AS courseName, sch.class_id AS classId, sch.teacher_id AS teacherId,
                   t.name AS teacherName, sch.semester, sch.weekday, sch.section,
                   sch.start_week AS startWeek, sch.end_week AS endWeek, sch.location
            FROM course_schedule sch
            JOIN course c ON c.id = sch.course_id
            LEFT JOIN teacher t ON t.id = sch.teacher_id
            WHERE sch.teacher_id = #{teacherId}
            ORDER BY sch.weekday, sch.section, c.course_code
            """)
    List<Map<String, Object>> findSchedule(@Param("teacherId") Long teacherId);

    @Select("""
            SELECT sch.id AS scheduleId, sch.course_id AS courseId, c.course_code AS courseCode,
                   c.name AS courseName, sch.class_id AS classId, sch.teacher_id AS teacherId,
                   t.name AS teacherName, sch.semester, sch.weekday, sch.section, sch.start_week AS startWeek,
                   sch.end_week AS endWeek, sch.location
            FROM course_schedule sch
            JOIN course c ON c.id = sch.course_id
            JOIN teacher t ON t.id = sch.teacher_id
            WHERE sch.teacher_id = #{teacherId} AND sch.semester = #{semester}
              AND (#{adminUserId} IS NULL OR EXISTS (
                  SELECT 1
                  FROM user_account admin_account
                  WHERE admin_account.id = #{adminUserId} AND admin_account.role = 3
                    AND admin_account.status = 1
                    AND admin_account.college_id = t.college_id
              ))
            ORDER BY sch.weekday, sch.section, c.course_code
            """)
    List<Map<String, Object>> findScheduleByTeacherAndSemester(@Param("teacherId") Long teacherId,
                                                                @Param("semester") String semester,
                                                                @Param("adminUserId") Long adminUserId);

    @Select("""
            SELECT id
            FROM course
            WHERE id = #{courseId} AND teacher_id = #{teacherId}
            """)
    Long findCourseForTeacher(@Param("courseId") Long courseId,
                              @Param("teacherId") Long teacherId);

    @Select("""
            SELECT id
            FROM course_selection
            WHERE student_id = #{studentId} AND course_id = #{courseId} AND status = 1
            """)
    Long findActiveSelection(@Param("studentId") Long studentId,
                             @Param("courseId") Long courseId);

    @Update("""
            UPDATE course_selection cs
            JOIN course c ON c.id = cs.course_id
            SET cs.score = #{score}, cs.score_teacher_id = #{teacherId},
                cs.score_updated_at = CURRENT_TIMESTAMP
            WHERE cs.student_id = #{studentId} AND cs.course_id = #{courseId}
              AND cs.status = 1 AND cs.score IS NULL AND c.teacher_id = #{teacherId}
            """)
    int enterScore(@Param("teacherId") Long teacherId,
                   @Param("courseId") Long courseId,
                   @Param("studentId") Long studentId,
                   @Param("score") BigDecimal score);

    @Update("""
            UPDATE course_selection cs
            JOIN course c ON c.id = cs.course_id
            SET cs.score = #{score}, cs.score_teacher_id = #{teacherId},
                cs.score_updated_at = CURRENT_TIMESTAMP
            WHERE cs.student_id = #{studentId} AND cs.course_id = #{courseId}
              AND cs.status = 1 AND cs.score IS NOT NULL AND c.teacher_id = #{teacherId}
            """)
    int updateScore(@Param("teacherId") Long teacherId,
                    @Param("courseId") Long courseId,
                    @Param("studentId") Long studentId,
                    @Param("score") BigDecimal score);

    @Update("""
            UPDATE course_selection cs
            JOIN course c ON c.id = cs.course_id
            SET cs.score = NULL, cs.grade_point = NULL,
                cs.score_teacher_id = NULL, cs.score_updated_at = NULL
            WHERE cs.student_id = #{studentId} AND cs.course_id = #{courseId}
              AND cs.status = 1 AND cs.score IS NOT NULL AND c.teacher_id = #{teacherId}
            """)
    int deleteScore(@Param("teacherId") Long teacherId,
                    @Param("courseId") Long courseId,
                    @Param("studentId") Long studentId);
}
