package com.guajsama.backend.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface CollegeAdminMapper {
    @Select("""
            SELECT id AS semesterId, semester
            FROM semester
            ORDER BY semester, id
            """)
    List<Map<String, Object>> findSemesters();

    @Select("""
            SELECT semester
            FROM semester
            WHERE id = #{semesterId}
            """)
    String findSemesterName(@Param("semesterId") Long semesterId);

    @Select("""
            SELECT id
            FROM semester
            WHERE semester = #{semester}
            """)
    Long findSemesterIdByName(@Param("semester") String semester);

    @Select("""
            SELECT COUNT(*)
            FROM course_schedule
            WHERE semester = #{semester}
            """)
    int countSchedulesBySemester(@Param("semester") String semester);

    @Insert("""
            INSERT INTO semester (semester)
            VALUES (#{semester})
            """)
    int insertSemester(@Param("semester") String semester);

    @Update("""
            UPDATE semester
            SET semester = #{semester}
            WHERE id = #{semesterId}
            """)
    int updateSemester(@Param("semesterId") Long semesterId,
                       @Param("semester") String semester);

    @Update("""
            UPDATE course_schedule
            SET semester = #{newSemester}
            WHERE semester = #{oldSemester}
            """)
    int renameScheduledSemester(@Param("oldSemester") String oldSemester,
                                @Param("newSemester") String newSemester);

    @Delete("""
            DELETE FROM semester
            WHERE id = #{semesterId}
            """)
    int deleteSemester(@Param("semesterId") Long semesterId);

    @Select("""
            SELECT u.college_id AS collegeId
            FROM user_account u
            WHERE u.id = #{userId} AND u.role = 3 AND u.status = 1
            """)
    Map<String, Object> findAdminByUserId(@Param("userId") Long userId);

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
              AND cl.college_id = #{collegeId}
            ORDER BY sch.weekday, sch.section, c.course_code
            """)
    List<Map<String, Object>> findClassSchedule(@Param("classId") Long classId,
                                                @Param("semester") String semester,
                                                @Param("collegeId") Long collegeId);

    @Insert("""
            INSERT INTO course_schedule (course_id, class_id, teacher_id, semester, weekday, section,
                                         start_week, end_week, location)
            SELECT c.id, cl.id, t.id, #{semester}, #{weekday}, #{section},
                   #{startWeek}, #{endWeek}, #{location}
            FROM course c
            JOIN `class` cl ON cl.id = #{classId}
            JOIN teacher t ON t.id = #{teacherId}
            WHERE c.id = #{courseId} AND c.open_college_id = #{collegeId}
              AND cl.college_id = #{collegeId} AND t.college_id = #{collegeId}
            """)
    int insertCourseSchedule(@Param("courseId") Long courseId,
                             @Param("classId") Long classId,
                             @Param("teacherId") Long teacherId,
                             @Param("semester") String semester,
                             @Param("weekday") Integer weekday,
                             @Param("section") Integer section,
                             @Param("startWeek") Integer startWeek,
                             @Param("endWeek") Integer endWeek,
                             @Param("location") String location,
                             @Param("collegeId") Long collegeId);

    @Select("""
            SELECT sch.id
            FROM course_schedule sch
            JOIN `class` cl ON cl.id = sch.class_id
            WHERE sch.id = #{scheduleId} AND cl.college_id = #{collegeId}
            """)
    Long findCourseScheduleInCollege(@Param("scheduleId") Long scheduleId,
                                    @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE course_schedule sch
            JOIN `class` old_class ON old_class.id = sch.class_id
            JOIN course c ON c.id = #{courseId}
            JOIN `class` new_class ON new_class.id = #{classId}
            SET sch.course_id = c.id, sch.class_id = new_class.id,
                sch.weekday = #{weekday}, sch.section = #{section},
                sch.start_week = #{startWeek}, sch.end_week = #{endWeek},
                sch.location = #{location}
            WHERE sch.id = #{scheduleId}
              AND old_class.college_id = #{collegeId}
              AND c.open_college_id = #{collegeId}
              AND new_class.college_id = #{collegeId}
            """)
    int updateCourseSchedule(@Param("scheduleId") Long scheduleId,
                             @Param("collegeId") Long collegeId,
                             @Param("courseId") Long courseId,
                             @Param("classId") Long classId,
                             @Param("weekday") Integer weekday,
                             @Param("section") Integer section,
                             @Param("startWeek") Integer startWeek,
                             @Param("endWeek") Integer endWeek,
                             @Param("location") String location);

    @Delete("""
            DELETE sch
            FROM course_schedule sch
            JOIN `class` cl ON cl.id = sch.class_id
            WHERE sch.id = #{scheduleId} AND cl.college_id = #{collegeId}
            """)
    int deleteCourseSchedule(@Param("scheduleId") Long scheduleId,
                             @Param("collegeId") Long collegeId);

    @Insert("""
            INSERT INTO announcement (title, content, publisher_user_id, college_id, status)
            VALUES (#{title}, #{content}, #{userId}, #{collegeId}, #{status})
            """)
    int insertAnnouncement(@Param("title") String title,
                           @Param("content") String content,
                           @Param("userId") Long userId,
                           @Param("collegeId") Long collegeId,
                           @Param("status") Integer status);

    @Select("""
            SELECT id FROM announcement
            WHERE id = #{announcementId} AND college_id = #{collegeId}
            """)
    Long findAnnouncementInCollege(@Param("announcementId") Long announcementId,
                                  @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE announcement
            SET title = #{title}, content = #{content}, status = #{status}
            WHERE id = #{announcementId} AND college_id = #{collegeId}
            """)
    int updateAnnouncement(@Param("announcementId") Long announcementId,
                           @Param("collegeId") Long collegeId,
                           @Param("title") String title,
                           @Param("content") String content,
                           @Param("status") Integer status);

    @Delete("""
            DELETE FROM announcement
            WHERE id = #{announcementId} AND college_id = #{collegeId}
            """)
    int deleteAnnouncement(@Param("announcementId") Long announcementId,
                           @Param("collegeId") Long collegeId);

    @Select("""
            SELECT COALESCE(MAX(CAST(SUBSTRING(login_no, 5, 6) AS UNSIGNED)), 0)
            FROM user_account
            WHERE login_no REGEXP CONCAT('^', #{year}, '[0-9]{6}$')
            """)
    int findMaxAccountNumberSuffix(@Param("year") int year);

    @Insert("""
            INSERT INTO account_number_sequence (generation_year, `last_value`)
            VALUES (#{year}, #{initialValue})
            ON DUPLICATE KEY UPDATE
                `last_value` = GREATEST(account_number_sequence.`last_value`, #{initialValue})
            """)
    int initializeAccountNumberSequence(@Param("year") int year, @Param("initialValue") int initialValue);

    @Select("""
            SELECT `last_value`
            FROM account_number_sequence
            WHERE generation_year = #{year}
            FOR UPDATE
            """)
    Integer findAccountNumberSequenceValueForUpdate(@Param("year") int year);

    @Update("""
            UPDATE account_number_sequence
            SET `last_value` = #{value}
            WHERE generation_year = #{year}
            """)
    int updateAccountNumberSequence(@Param("year") int year, @Param("value") int value);

    @Insert("""
            INSERT INTO user_account (login_no, phone, password_hash, college_id, role,
                                      must_change_password, status)
            VALUES (#{loginNo}, #{phone}, #{passwordHash}, #{collegeId}, #{role}, 1, 1)
            """)
    int insertAccount(@Param("loginNo") String loginNo,
                      @Param("phone") String phone,
                      @Param("passwordHash") String passwordHash,
                      @Param("collegeId") Long collegeId,
                      @Param("role") int role);

    @Select("SELECT id FROM user_account WHERE login_no = #{loginNo}")
    Long findAccountIdByLoginNo(@Param("loginNo") String loginNo);

    @Insert("""
            INSERT INTO teacher (user_id, teacher_no, name, id_card, college_id)
            VALUES (#{userId}, #{teacherNo}, #{name}, #{idCard}, #{collegeId})
            """)
    int insertTeacher(@Param("userId") Long userId,
                      @Param("teacherNo") String teacherNo,
                      @Param("name") String name,
                      @Param("idCard") String idCard,
                      @Param("collegeId") Long collegeId);

    @Insert("""
            INSERT INTO student (user_id, student_no, name, id_card, college_id, gender, birth,
                                 enrollment_year, graduation_year, study_duration)
            VALUES (#{userId}, #{studentNo}, #{name}, #{idCard}, #{collegeId}, #{gender}, #{birth},
                    #{enrollmentYear}, #{graduationYear}, #{studyDuration})
            """)
    int insertStudent(@Param("userId") Long userId,
                      @Param("studentNo") String studentNo,
                      @Param("name") String name,
                      @Param("idCard") String idCard,
                      @Param("collegeId") Long collegeId,
                      @Param("gender") Integer gender,
                      @Param("birth") LocalDate birth,
                      @Param("enrollmentYear") Integer enrollmentYear,
                      @Param("graduationYear") Integer graduationYear,
                      @Param("studyDuration") Integer studyDuration);

    @Select("""
            SELECT s.id
            FROM student s
            JOIN user_account u ON u.id = s.user_id
            WHERE s.id = #{studentId} AND s.college_id = #{collegeId}
              AND s.class_id IS NULL
              AND u.college_id = #{collegeId} AND u.role = 1 AND u.status = 1
            """)
    Long findStudentInCollege(@Param("studentId") Long studentId, @Param("collegeId") Long collegeId);

    @Select("""
            SELECT s.id AS studentId, s.student_no AS studentNo, s.name AS studentName
            FROM student s
            JOIN user_account u ON u.id = s.user_id
            WHERE s.college_id = #{collegeId} AND u.college_id = #{collegeId}
              AND s.class_id IS NULL AND u.role = 1 AND u.status = 1
            ORDER BY s.student_no
            """)
    List<Map<String, Object>> findStudentsWithoutClass(@Param("collegeId") Long collegeId);

    @Select("""
            SELECT s.id AS studentId, s.student_no AS studentNo, s.name AS studentName,
                   u.phone, s.gender, s.birth,
                   s.enrollment_year AS enrollmentYear,
                   s.graduation_year AS graduationYear, s.study_duration AS studyDuration,
                   cl.id AS classId, cl.class_name AS className, cl.grade,
                   cl.enrollment_year AS classEnrollmentYear,
                   cl.graduation_year AS classGraduationYear, cl.status AS classStatus
            FROM student s
            JOIN user_account u ON u.id = s.user_id
            LEFT JOIN `class` cl ON cl.id = s.class_id AND cl.college_id = s.college_id
            WHERE s.college_id = #{collegeId} AND u.college_id = #{collegeId}
              AND u.role = 1 AND u.status = 1
            ORDER BY s.student_no
            """)
    List<Map<String, Object>> findStudentsByCollege(@Param("collegeId") Long collegeId);

    @Select("""
            SELECT s.id AS studentId, s.user_id AS userId, s.class_id AS classId
            FROM student s
            JOIN user_account u ON u.id = s.user_id
            WHERE s.id = #{studentId} AND s.college_id = #{collegeId}
              AND u.college_id = #{collegeId} AND u.role = 1 AND u.status = 1
            """)
    Map<String, Object> findStudentAccountInCollege(@Param("studentId") Long studentId,
                                                    @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE student s
            JOIN user_account u ON u.id = s.user_id
            SET s.name = #{name}, s.gender = #{gender}, s.birth = #{birth},
                s.enrollment_year = #{enrollmentYear},
                s.graduation_year = #{graduationYear},
                s.study_duration = #{studyDuration}, u.phone = #{phone}
            WHERE s.id = #{studentId} AND s.college_id = #{collegeId}
              AND u.college_id = #{collegeId} AND u.role = 1 AND u.status = 1
            """)
    int updateStudent(@Param("studentId") Long studentId,
                      @Param("collegeId") Long collegeId,
                      @Param("name") String name,
                      @Param("phone") String phone,
                      @Param("gender") Integer gender,
                      @Param("birth") LocalDate birth,
                      @Param("enrollmentYear") Integer enrollmentYear,
                      @Param("graduationYear") Integer graduationYear,
                      @Param("studyDuration") Integer studyDuration);

    @Update("""
            UPDATE user_account u
            JOIN student s ON s.user_id = u.id
            SET u.status = 0
            WHERE s.id = #{studentId} AND s.college_id = #{collegeId}
              AND u.college_id = #{collegeId} AND u.role = 1 AND u.status = 1
            """)
    int deactivateStudent(@Param("studentId") Long studentId,
                          @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE `class`
            SET student_count = GREATEST(student_count - 1, 0)
            WHERE id = #{classId} AND college_id = #{collegeId}
            """)
    int decrementClassStudentCount(@Param("classId") Long classId,
                                   @Param("collegeId") Long collegeId);

    @Select("""
            SELECT t.id AS teacherId, t.teacher_no AS teacherNo, t.name AS teacherName, u.phone
            FROM teacher t
            JOIN user_account u ON u.id = t.user_id
            WHERE t.college_id = #{collegeId} AND u.college_id = #{collegeId}
              AND u.role = 2 AND u.status = 1
            ORDER BY t.teacher_no
            """)
    List<Map<String, Object>> findTeachersByCollege(@Param("collegeId") Long collegeId);

    @Update("""
            UPDATE teacher t
            JOIN user_account u ON u.id = t.user_id
            SET t.name = #{name}, u.phone = #{phone}
            WHERE t.id = #{teacherId} AND t.college_id = #{collegeId}
              AND u.college_id = #{collegeId} AND u.role = 2 AND u.status = 1
            """)
    int updateTeacher(@Param("teacherId") Long teacherId,
                      @Param("collegeId") Long collegeId,
                      @Param("name") String name,
                      @Param("phone") String phone);

    @Update("""
            UPDATE user_account u
            JOIN teacher t ON t.user_id = u.id
            SET u.status = 0
            WHERE t.id = #{teacherId} AND t.college_id = #{collegeId}
              AND u.college_id = #{collegeId} AND u.role = 2 AND u.status = 1
            """)
    int deactivateTeacher(@Param("teacherId") Long teacherId,
                          @Param("collegeId") Long collegeId);

    @Select("""
            SELECT id FROM `class`
            WHERE id = #{classId} AND college_id = #{collegeId} AND status = 1
            """)
    Long findClassInCollege(@Param("classId") Long classId, @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE student s
            JOIN `class` cl ON cl.id = #{classId}
            JOIN user_account u ON u.id = s.user_id
            SET s.class_id = cl.id
            WHERE s.id = #{studentId} AND s.college_id = #{collegeId}
              AND s.class_id IS NULL
              AND cl.college_id = #{collegeId} AND cl.status = 1
              AND u.college_id = #{collegeId} AND u.role = 1 AND u.status = 1
            """)
    int assignStudentClass(@Param("studentId") Long studentId,
                           @Param("classId") Long classId,
                           @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE `class`
            SET student_count = COALESCE(student_count, 0) + 1
            WHERE id = #{classId} AND college_id = #{collegeId} AND status = 1
            """)
    int incrementClassStudentCount(@Param("classId") Long classId,
                                   @Param("collegeId") Long collegeId);

    @Insert("""
            INSERT INTO `class` (class_name, college_id, grade, student_count,
                                 enrollment_year, graduation_year, status)
            VALUES (#{className}, #{collegeId}, #{grade}, 0,
                    #{enrollmentYear}, #{graduationYear}, #{status})
            """)
    int insertClass(@Param("className") String className,
                    @Param("collegeId") Long collegeId,
                    @Param("grade") String grade,
                    @Param("enrollmentYear") Integer enrollmentYear,
                    @Param("graduationYear") Integer graduationYear,
                    @Param("status") Integer status);

    @Select("""
            SELECT id FROM `class`
            WHERE id = #{classId} AND college_id = #{collegeId}
            """)
    Long findClassForUpdate(@Param("classId") Long classId, @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE `class`
            SET class_name = #{className}, grade = #{grade},
                enrollment_year = #{enrollmentYear}, graduation_year = #{graduationYear},
                status = #{status}
            WHERE id = #{classId} AND college_id = #{collegeId}
            """)
    int updateClass(@Param("classId") Long classId,
                    @Param("collegeId") Long collegeId,
                    @Param("className") String className,
                    @Param("grade") String grade,
                    @Param("enrollmentYear") Integer enrollmentYear,
                    @Param("graduationYear") Integer graduationYear,
                    @Param("status") Integer status);

    @Select("""
            SELECT cl.id AS classId, cl.class_name AS className, cl.grade,
                   cl.student_count AS studentCount,
                   cl.enrollment_year AS enrollmentYear,
                   cl.graduation_year AS graduationYear, cl.status
            FROM `class` cl
            WHERE cl.college_id = #{collegeId}
            ORDER BY cl.enrollment_year DESC, cl.class_name, cl.id
            """)
    List<Map<String, Object>> findClassesByCollege(@Param("collegeId") Long collegeId);

    @Select("""
            SELECT c.id AS courseId, c.course_code AS courseCode, c.name AS courseName,
                   c.credit, c.hours, c.assess_type AS assessType, c.teacher_id AS teacherId,
                   t.name AS teacherName, c.course_type AS courseType, c.status
            FROM course c
            LEFT JOIN teacher t ON t.id = c.teacher_id
            WHERE c.open_college_id = #{collegeId}
            ORDER BY c.course_code
            """)
    List<Map<String, Object>> findCourses(@Param("collegeId") Long collegeId);

    @Select("""
            SELECT t.id FROM teacher t
            JOIN user_account u ON u.id = t.user_id
            WHERE t.id = #{teacherId} AND t.college_id = #{collegeId}
              AND u.college_id = #{collegeId}
              AND u.role = 2 AND u.status = 1
            """)
    Long findTeacherInCollege(@Param("teacherId") Long teacherId, @Param("collegeId") Long collegeId);

    @Insert("""
            INSERT INTO course (course_code, name, credit, hours, assess_type, open_college_id,
                                teacher_id, course_type, status)
            VALUES (#{courseCode}, #{name}, #{credit}, #{hours}, #{assessType}, #{collegeId},
                    #{teacherId}, #{courseType}, #{status})
            """)
    int insertCourse(@Param("courseCode") String courseCode,
                     @Param("name") String name,
                     @Param("credit") BigDecimal credit,
                     @Param("hours") Integer hours,
                     @Param("assessType") String assessType,
                     @Param("collegeId") Long collegeId,
                     @Param("teacherId") Long teacherId,
                     @Param("courseType") Integer courseType,
                     @Param("status") Integer status);

    @Select("""
            SELECT id FROM course
            WHERE id = #{courseId} AND open_college_id = #{collegeId}
            """)
    Long findCourseInCollege(@Param("courseId") Long courseId, @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE course
            SET course_code = #{courseCode}, name = #{name}, credit = #{credit}, hours = #{hours},
                assess_type = #{assessType}, teacher_id = #{teacherId}, course_type = #{courseType},
                status = #{status}
            WHERE id = #{courseId} AND open_college_id = #{collegeId}
            """)
    int updateCourse(@Param("courseId") Long courseId,
                     @Param("collegeId") Long collegeId,
                     @Param("courseCode") String courseCode,
                     @Param("name") String name,
                     @Param("credit") BigDecimal credit,
                     @Param("hours") Integer hours,
                     @Param("assessType") String assessType,
                     @Param("teacherId") Long teacherId,
                     @Param("courseType") Integer courseType,
                     @Param("status") Integer status);

    @Delete("""
            DELETE FROM course
            WHERE id = #{courseId} AND open_college_id = #{collegeId}
            """)
    int deleteCourse(@Param("courseId") Long courseId, @Param("collegeId") Long collegeId);

    @Select("""
            SELECT id, batch_name AS batchName, start_time AS startTime,
                   end_time AS endTime, status
            FROM course_selection_batch
            WHERE college_id = #{collegeId}
            ORDER BY start_time DESC, id DESC
            """)
    List<Map<String, Object>> findSelectionBatches(@Param("collegeId") Long collegeId);

    @Insert("""
            INSERT INTO course_selection_batch (batch_name, college_id, start_time, end_time, status, created_by)
            VALUES (#{batchName}, #{collegeId}, #{startTime}, #{endTime}, #{status}, #{userId})
            """)
    int insertSelectionBatch(@Param("batchName") String batchName,
                             @Param("collegeId") Long collegeId,
                             @Param("startTime") LocalDateTime startTime,
                             @Param("endTime") LocalDateTime endTime,
                             @Param("status") Integer status,
                             @Param("userId") Long userId);

    @Select("SELECT LAST_INSERT_ID()")
    Long findLastInsertedSelectionBatchId();

    @Select("""
            SELECT id FROM course_selection_batch
            WHERE id = #{batchId} AND college_id = #{collegeId}
            """)
    Long findSelectionBatchInCollege(@Param("batchId") Long batchId, @Param("collegeId") Long collegeId);

    @Update("""
            UPDATE course_selection_batch
            SET batch_name = #{batchName}, start_time = #{startTime},
                end_time = #{endTime}, status = #{status}
            WHERE id = #{batchId} AND college_id = #{collegeId}
            """)
    int updateSelectionBatch(@Param("batchId") Long batchId,
                             @Param("collegeId") Long collegeId,
                             @Param("batchName") String batchName,
                             @Param("startTime") LocalDateTime startTime,
                             @Param("endTime") LocalDateTime endTime,
                             @Param("status") Integer status);

    @Update("""
            UPDATE course_selection_batch
            SET status = 0
            WHERE id = #{batchId} AND status = 1 AND end_time <= CURRENT_TIMESTAMP
            """)
    int setSelectionBatchToStatusZero(@Param("batchId") Long batchId);

    @Delete("""
            DELETE FROM course_selection_batch
            WHERE id = #{batchId} AND college_id = #{collegeId}
            """)
    int deleteSelectionBatch(@Param("batchId") Long batchId,
                             @Param("collegeId") Long collegeId);

    //@Update("""
    //        UPDATE course_selection_batch set status = 0 where id = #{batchId}
    //        """)
    //int setSelectBatchToStatusZero(@Param("batchId") Long batchId);
}
