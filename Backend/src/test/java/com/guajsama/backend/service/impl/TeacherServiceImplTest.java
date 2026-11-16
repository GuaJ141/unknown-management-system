package com.guajsama.backend.service.impl;

import com.guajsama.backend.mapper.TeacherMapper;
import com.guajsama.backend.module.dto.EnterScoreRequest;
import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.utils.RedisUtil;
import com.guajsama.backend.utils.ThreadLocalUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TeacherServiceImplTest {
    private TeacherMapper teacherMapper;
    private TeacherServiceImpl teacherService;

    @BeforeEach
    void setUp() {
        teacherMapper = mock(TeacherMapper.class);
        teacherService = new TeacherServiceImpl(teacherMapper, mock(RedisUtil.class));
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 2));
        when(teacherMapper.findTeacherByUserId(100L)).thenReturn(Map.of("teacherId", 200L));
    }

    @AfterEach
    void clearThreadLocal() {
        ThreadLocalUtils.remove();
    }

    @Test
    void teacherCanQueryOwnSchedule() {
        when(teacherMapper.findScheduleByTeacherAndSemester(200L, "2026-2027-1", null))
                .thenReturn(List.of());

        teacherService.getScheduleByTeacherAndSemester(null, "2026-2027-1");

        verify(teacherMapper).findScheduleByTeacherAndSemester(200L, "2026-2027-1", null);
    }

    @Test
    void teacherCannotQueryAnotherTeachersSchedule() {
        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> teacherService.getScheduleByTeacherAndSemester(201L, "2026-2027-1"));

        assertEquals("教师只能查询自己的课表", exception.getMessage());
    }

    @Test
    void studentCannotQueryTeacherSchedule() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 1));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> teacherService.getScheduleByTeacherAndSemester(200L, "2026-2027-1"));

        assertEquals("当前账户无权查询教师课表", exception.getMessage());
    }

    @Test
    void adminCanQueryAnyTeacherSchedule() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 3));
        when(teacherMapper.findScheduleByTeacherAndSemester(201L, "2026-2027-1", 100L))
                .thenReturn(List.of());

        teacherService.getScheduleByTeacherAndSemester(201L, "2026-2027-1");

        verify(teacherMapper).findScheduleByTeacherAndSemester(201L, "2026-2027-1", 100L);
    }

    @Test
    void adminMustProvideTeacherIdToQuerySchedule() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 3));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> teacherService.getScheduleByTeacherAndSemester(null, "2026-2027-1"));

        assertEquals("学院管理员查询时必须提供教师ID", exception.getMessage());
    }

    @Test
    void teacherCanQueryStudentsForOwnCourse() {
        when(teacherMapper.findCourseForTeacher(2L, 200L)).thenReturn(2L);
        when(teacherMapper.findClassStudents(200L, 2L)).thenReturn(List.of());

        teacherService.getClassStudents(2L);

        verify(teacherMapper).findClassStudents(200L, 2L);
    }

    @Test
    void teacherCannotQueryStudentsForAnotherTeachersCourse() {
        when(teacherMapper.findCourseForTeacher(2L, 200L)).thenReturn(null);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> teacherService.getClassStudents(2L));

        assertEquals("课程不存在或不属于当前教师", exception.getMessage());
    }

    @Test
    void teacherCanQueryOwnCourseScores() {
        when(teacherMapper.findScoresByClassCourseAndTeacher(1L, 2L, 200L, null))
                .thenReturn(List.of());

        teacherService.getScoresByClassCourseAndTeacher(1L, 2L, 200L);

        verify(teacherMapper).findScoresByClassCourseAndTeacher(1L, 2L, 200L, null);
    }

    @Test
    void teacherCannotQueryAnotherTeachersScores() {
        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> teacherService.getScoresByClassCourseAndTeacher(1L, 2L, 201L));

        assertEquals("教师只能查询本人课程成绩", exception.getMessage());
    }

    @Test
    void adminCanQueryScoresWithinCollege() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 3));
        when(teacherMapper.findScoresByClassCourseAndTeacher(1L, 2L, 201L, 100L))
                .thenReturn(List.of());

        teacherService.getScoresByClassCourseAndTeacher(1L, 2L, 201L);

        verify(teacherMapper).findScoresByClassCourseAndTeacher(1L, 2L, 201L, 100L);
    }

    @Test
    void studentCannotQueryScores() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 1));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> teacherService.getScoresByClassCourseAndTeacher(1L, 2L, 200L));

        assertEquals("当前账户无权查询学生成绩", exception.getMessage());
    }

    @Test
    void teacherCanEnterScoreForActiveStudentInOwnCourse() {
        when(teacherMapper.findCourseForTeacher(1L, 200L)).thenReturn(1L);
        when(teacherMapper.findActiveSelection(2L, 1L)).thenReturn(3L);
        when(teacherMapper.enterScore(200L, 1L, 2L, new BigDecimal("85.5"))).thenReturn(1);

        teacherService.enterScore(1L, new EnterScoreRequest(2L, new BigDecimal("85.5")));

        verify(teacherMapper).enterScore(200L, 1L, 2L, new BigDecimal("85.5"));
    }

    @Test
    void enteringExistingScoreReturnsConflict() {
        when(teacherMapper.findCourseForTeacher(1L, 200L)).thenReturn(1L);
        when(teacherMapper.findActiveSelection(2L, 1L)).thenReturn(3L);
        when(teacherMapper.enterScore(200L, 1L, 2L, new BigDecimal("85.5"))).thenReturn(0);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> teacherService.enterScore(1L, new EnterScoreRequest(2L, new BigDecimal("85.5"))));

        assertEquals("成绩已录入，请使用修改成绩接口", exception.getMessage());
    }

    @Test
    void teacherCanUpdateExistingScore() {
        when(teacherMapper.findCourseForTeacher(1L, 200L)).thenReturn(1L);
        when(teacherMapper.findActiveSelection(2L, 1L)).thenReturn(3L);
        when(teacherMapper.updateScore(200L, 1L, 2L, new BigDecimal("90.0"))).thenReturn(1);

        teacherService.updateScore(1L, new EnterScoreRequest(2L, new BigDecimal("90.0")));

        verify(teacherMapper).updateScore(200L, 1L, 2L, new BigDecimal("90.0"));
    }

    @Test
    void teacherCanDeleteExistingScore() {
        when(teacherMapper.findCourseForTeacher(1L, 200L)).thenReturn(1L);
        when(teacherMapper.findActiveSelection(2L, 1L)).thenReturn(3L);
        when(teacherMapper.deleteScore(200L, 1L, 2L)).thenReturn(1);

        teacherService.deleteScore(1L, 2L);

        verify(teacherMapper).deleteScore(200L, 1L, 2L);
    }
}
