package com.guajsama.backend.service.impl;

import com.guajsama.backend.mapper.StudentMapper;
import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.utils.RedisUtil;
import com.guajsama.backend.utils.ThreadLocalUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentServiceImplTest {
    private StudentMapper studentMapper;
    private StudentServiceImpl studentService;

    @BeforeEach
    void setUp() {
        studentMapper = mock(StudentMapper.class);
        studentService = new StudentServiceImpl(studentMapper, mock(RedisUtil.class));
        ThreadLocalUtils.set(Map.of("id", 100L));
        when(studentMapper.findStudentByUserId(100L))
                .thenReturn(Map.of("studentId", 200L, "collegeId", 300L, "classId", 500L));
        when(studentMapper.countOpenSelectionBatches(300L)).thenReturn(1);
        when(studentMapper.findSelectableCourse(400L, 300L)).thenReturn(400L);
    }

    @AfterEach
    void clearThreadLocal() {
        ThreadLocalUtils.remove();
    }

    @Test
    void selectCourseInsertsSelectionWithCourseTeacher() {
        when(studentMapper.findSelection(200L, 400L)).thenReturn(null);
        when(studentMapper.insertSelection(200L, 400L, 300L)).thenReturn(1);

        studentService.selectCourse(400L);

        verify(studentMapper).insertSelection(200L, 400L, 300L);
    }

    @Test
    void selectCourseFailsWhenCourseHasNoTeacher() {
        when(studentMapper.findSelection(200L, 400L)).thenReturn(null);
        when(studentMapper.insertSelection(200L, 400L, 300L)).thenReturn(0);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> studentService.selectCourse(400L));
        assertEquals("课程授课教师不存在，无法选课", exception.getMessage());
    }

    @Test
    void studentCanQueryOnlyTheirOwnClassSchedule() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 1));
        when(studentMapper.findScheduleByStudentAndSemester(200L, "2026-2027-1"))
                .thenReturn(java.util.List.of());

        studentService.getScheduleByClassAndSemester(null, "2026-2027-1");

        verify(studentMapper).findScheduleByStudentAndSemester(200L, "2026-2027-1");
    }

    @Test
    void studentCannotQueryAnotherClassSchedule() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 1));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> studentService.getScheduleByClassAndSemester(501L, "2026-2027-1"));

        assertEquals("学生只能查询所在班级的课表", exception.getMessage());
    }

    @Test
    void adminCanQueryAnyClassSchedule() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 3));
        when(studentMapper.findScheduleByClassAndSemester(501L, "2026-2027-1", 100L))
                .thenReturn(java.util.List.of());

        studentService.getScheduleByClassAndSemester(501L, "2026-2027-1");

        verify(studentMapper).findScheduleByClassAndSemester(501L, "2026-2027-1", 100L);
    }

    @Test
    void adminMustProvideClassIdToQuerySchedule() {
        ThreadLocalUtils.set(Map.of("id", 100L, "role", 3));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> studentService.getScheduleByClassAndSemester(null, "2026-2027-1"));

        assertEquals("学院管理员查询时必须提供班级ID", exception.getMessage());
    }
}
