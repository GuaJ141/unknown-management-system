package com.guajsama.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Map;

@Mapper
public interface StudentMapper {
    @Select("""
            SELECT s.id AS studentId, s.user_id AS userId, u.college_id AS collegeId,
                   s.class_id AS classId
            FROM student s
            JOIN user_account u ON u.id = s.user_id
            WHERE s.user_id = #{userId} AND s.college_id = u.college_id
              AND u.role = 1 AND u.status = 1
            """)
    Map<String, Object> findStudentByUserId(@Param("userId") Long userId);

    @Select("""
            SELECT s.id AS studentId
            FROM student s
            JOIN user_account u ON u.id = s.user_id
            WHERE s.user_id = #{userId} AND s.name = #{name} AND s.id_card = #{idCard}
              AND s.college_id = u.college_id AND u.role = 1 AND u.status = 1
            """)
    Long verifyStudentIdentity(@Param("userId") Long userId,
                               @Param("name") String name,
                               @Param("idCard") String idCard);

    @Update("""
            UPDATE user_account
            SET phone = #{phone}
            WHERE id = #{userId} AND role = 1 AND status = 1
            """)
    int updatePhone(@Param("userId") Long userId, @Param("phone") String phone);

    @Update("""
            UPDATE user_account
            SET password_hash = #{passwordHash}, must_change_password = 0
            WHERE id = #{userId} AND role = 1 AND status = 1
            """)
    int updatePassword(@Param("userId") Long userId, @Param("passwordHash") String passwordHash);

    @Select("""
            SELECT c.id AS courseId, c.course_code AS courseCode, c.name AS courseName,
                   c.credit, c.hours, c.assess_type AS assessType, c.course_type AS courseType,
                   t.name AS teacherName
            FROM course c
            LEFT JOIN teacher t ON t.id = c.teacher_id
            WHERE c.status = 1 AND c.open_college_id = #{collegeId}
            ORDER BY c.course_code
            """)
    List<Map<String, Object>> findAvailableCourses(@Param("collegeId") Long collegeId);

    @Select("""
            SELECT COUNT(*)
            FROM course_selection_batch b
            WHERE b.status = 1
              AND CURRENT_TIMESTAMP BETWEEN b.start_time AND b.end_time
              AND (b.college_id IS NULL OR b.college_id = #{collegeId})
            """)
    int countOpenSelectionBatches(@Param("collegeId") Long collegeId);

    @Select("""
            SELECT id
            FROM course
            WHERE id = #{courseId} AND status = 1 AND open_college_id = #{collegeId}
            """)
    Long findSelectableCourse(@Param("courseId") Long courseId, @Param("collegeId") Long collegeId);

    @Select("""
            SELECT id, status
            FROM course_selection
            WHERE student_id = #{studentId} AND course_id = #{courseId}
            """)
    Map<String, Object> findSelection(@Param("studentId") Long studentId,
                                      @Param("courseId") Long courseId);

    @Insert("""
            INSERT INTO course_selection (student_id, course_id, status, teacher_name)
            SELECT #{studentId}, c.id, 1, t.name
            FROM course c
            JOIN teacher t ON t.id = c.teacher_id
            WHERE c.id = #{courseId} AND c.status = 1 AND c.open_college_id = #{collegeId}
            """)
    int insertSelection(@Param("studentId") Long studentId,
                        @Param("courseId") Long courseId,
                        @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE course_selection cs
            JOIN course c ON c.id = cs.course_id
            JOIN teacher t ON t.id = c.teacher_id
            SET cs.status = 1, cs.select_time = CURRENT_TIMESTAMP, cs.teacher_name = t.name
            WHERE cs.id = #{selectionId} AND cs.status = 2 AND c.status = 1
            """)
    int reactivateSelection(@Param("selectionId") Long selectionId);

    @Select("""
            SELECT c.id AS courseId, c.course_code AS courseCode, c.name AS courseName,
                   c.credit, c.course_type AS courseType, cs.teacher_name AS teacherName,
                   cs.select_time AS selectTime
            FROM course_selection cs
            JOIN course c ON c.id = cs.course_id
            WHERE cs.student_id = #{studentId} AND cs.status = 1
            ORDER BY cs.select_time DESC
            """)
    List<Map<String, Object>> findCourseSelections(@Param("studentId") Long studentId);

    @Select("""
            SELECT sch.id AS scheduleId, c.id AS courseId, c.course_code AS courseCode,
                   c.name AS courseName, sch.class_id AS classId, sch.teacher_id AS teacherId,
                   cs.teacher_name AS teacherName, sch.semester, sch.weekday, sch.section,
                   sch.start_week AS startWeek, sch.end_week AS endWeek, sch.location
            FROM course_selection cs
            JOIN course c ON c.id = cs.course_id
            JOIN student s ON s.id = cs.student_id
            JOIN course_schedule sch ON sch.course_id = c.id AND sch.class_id = s.class_id
            WHERE cs.student_id = #{studentId} AND cs.status = 1
            ORDER BY sch.weekday, sch.section, c.course_code
            """)
    List<Map<String, Object>> findSchedule(@Param("studentId") Long studentId);

    @Select("""
            SELECT sch.id AS scheduleId, sch.course_id AS courseId, c.course_code AS courseCode,
                   c.name AS courseName, sch.class_id AS classId, sch.teacher_id AS teacherId,
                   t.name AS teacherName, sch.semester, sch.weekday, sch.section,
                   sch.start_week AS startWeek, sch.end_week AS endWeek, sch.location
            FROM student s
            JOIN course_schedule sch ON sch.class_id = s.class_id
            JOIN course c ON c.id = sch.course_id
            LEFT JOIN teacher t ON t.id = sch.teacher_id
            WHERE s.id = #{studentId} AND sch.semester = #{semester}
            ORDER BY sch.weekday, sch.section, c.course_code
            """)
    List<Map<String, Object>> findScheduleByStudentAndSemester(@Param("studentId") Long studentId,
                                                                @Param("semester") String semester);

    @Select("""
            SELECT sch.id AS scheduleId, sch.course_id AS courseId, c.course_code AS courseCode,
                   c.name AS courseName, sch.class_id AS classId, sch.teacher_id AS teacherId,
                   t.name AS teacherName, sch.semester, sch.weekday, sch.section,
                   sch.start_week AS startWeek, sch.end_week AS endWeek, sch.location
            FROM course_schedule sch
            JOIN course c ON c.id = sch.course_id
            JOIN `class` cl ON cl.id = sch.class_id
            LEFT JOIN teacher t ON t.id = sch.teacher_id
            WHERE sch.class_id = #{classId} AND sch.semester = #{semester}
              AND (#{adminUserId} IS NULL OR EXISTS (
                  SELECT 1
                  FROM user_account admin_account
                  WHERE admin_account.id = #{adminUserId} AND admin_account.role = 3
                    AND admin_account.status = 1
                    AND admin_account.college_id = cl.college_id
              ))
            ORDER BY sch.weekday, sch.section, c.course_code
            """)
    List<Map<String, Object>> findScheduleByClassAndSemester(@Param("classId") Long classId,
                                                              @Param("semester") String semester,
                                                              @Param("adminUserId") Long adminUserId);

    @Select("""
            SELECT c.id AS courseId, c.course_code AS courseCode, c.name AS courseName,
                   c.credit, cs.score, cs.grade_point AS gradePoint,
                   cs.score_updated_at AS scoreUpdatedAt
            FROM course_selection cs
            JOIN course c ON c.id = cs.course_id
            WHERE cs.student_id = #{studentId} AND cs.status = 1 AND cs.score IS NOT NULL
            ORDER BY cs.score_updated_at DESC
            """)
    List<Map<String, Object>> findScores(@Param("studentId") Long studentId);

    @Select("""
            SELECT cl.id AS classId, cl.class_name AS className, cl.grade,
                   cl.enrollment_year AS enrollmentYear,
                   cl.graduation_year AS graduationYear, cl.status AS classStatus,
                   col.id AS collegeId, col.name AS collegeName,
                   s.student_no AS studentNo, s.name AS studentName
            FROM student s
            LEFT JOIN `class` cl ON cl.id = s.class_id AND cl.college_id = s.college_id
            JOIN college col ON col.id = s.college_id
            WHERE s.id = #{studentId}
            """)
    Map<String, Object> findClassInfo(@Param("studentId") Long studentId);

}
