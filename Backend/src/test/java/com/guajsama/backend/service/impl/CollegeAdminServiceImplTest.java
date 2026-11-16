package com.guajsama.backend.service.impl;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.guajsama.backend.mapper.CollegeAdminMapper;
import com.guajsama.backend.module.dto.BatchAssignStudentClassRequest;
import com.guajsama.backend.module.dto.BatchStudentRegistrationRequest;
import com.guajsama.backend.module.dto.BatchTeacherRegistrationRequest;
import com.guajsama.backend.module.dto.CreateAnnouncementRequest;
import com.guajsama.backend.module.dto.CreateCourseScheduleRequest;
import com.guajsama.backend.module.dto.SemesterRequest;
import com.guajsama.backend.module.dto.CourseSelectionBatchRequest;
import com.guajsama.backend.module.dto.StudentRegistrationRequest;
import com.guajsama.backend.module.dto.TeacherRegistrationRequest;
import com.guajsama.backend.module.dto.UpdateClassRequest;
import com.guajsama.backend.module.dto.UpdateCourseScheduleRequest;
import com.guajsama.backend.module.dto.UpdateStudentRequest;
import com.guajsama.backend.module.dto.UpdateTeacherRequest;
import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.utils.RedisUtil;
import com.guajsama.backend.utils.ThreadLocalUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

class CollegeAdminServiceImplTest {
    private CollegeAdminMapper collegeAdminMapper;
    private CollegeAdminServiceImpl collegeAdminService;
    private RedisUtil redisUtil;
    private int year;

    @BeforeEach
    void setUp() {
        collegeAdminMapper = mock(CollegeAdminMapper.class);
        redisUtil = mock(RedisUtil.class);
        collegeAdminService = new CollegeAdminServiceImpl(collegeAdminMapper, redisUtil);
        year = LocalDate.now(ZoneId.of("Asia/Shanghai")).getYear();
        ThreadLocalUtils.set(Map.of("id", 1L));
        when(collegeAdminMapper.findAdminByUserId(1L)).thenReturn(Map.of("collegeId", 2L));
        when(collegeAdminMapper.findMaxAccountNumberSuffix(year)).thenReturn(0);
        when(collegeAdminMapper.findAccountNumberSequenceValueForUpdate(year)).thenReturn(0);
        when(collegeAdminMapper.updateAccountNumberSequence(year, 1)).thenReturn(1);
        when(collegeAdminMapper.findAccountIdByLoginNo(year + "000001")).thenReturn(10L);
        when(collegeAdminMapper.insertAccount(anyString(), anyString(), anyString(), anyLong(), anyInt()))
                .thenReturn(1);
    }

    @AfterEach
    void tearDown() {
        ThreadLocalUtils.remove();
    }

    @Test
    void registerTeachersGeneratesAndReturnsTeacherNumber() {
        when(collegeAdminMapper.insertTeacher(anyLong(), anyString(), anyString(), anyString(), anyLong()))
                .thenReturn(1);
        BatchTeacherRegistrationRequest request = new BatchTeacherRegistrationRequest(List.of(
                new TeacherRegistrationRequest("张老师", "11010519491231002X", "13800000000")
        ));

        List<String> numbers = collegeAdminService.registerTeachers(request);

        assertEquals(List.of(year + "000001"), numbers);
        verify(collegeAdminMapper).insertAccount(eq(year + "000001"), eq("13800000000"),
                anyString(), eq(2L), eq(2));
    }

    @Test
    void registerStudentsGeneratesAndReturnsStudentNumber() {
        when(collegeAdminMapper.insertStudent(anyLong(), anyString(), anyString(), anyString(), anyLong(),
                any(), any(), anyInt(), anyInt(), anyInt()))
                .thenReturn(1);
        BatchStudentRegistrationRequest request = new BatchStudentRegistrationRequest(List.of(
                new StudentRegistrationRequest("李同学", "11010519491231002X", "13900000000",
                        0, LocalDate.of(2004, 5, 21), 2026, 2030, 4)
        ));

        List<String> numbers = collegeAdminService.registerStudents(request);

        assertEquals(List.of(year + "000001"), numbers);
        verify(collegeAdminMapper).insertAccount(eq(year + "000001"), eq("13900000000"),
                anyString(), eq(2L), eq(1));
        verify(collegeAdminMapper).insertStudent(eq(10L), eq(year + "000001"), eq("李同学"),
                eq("11010519491231002X"), eq(2L), eq(0), eq(LocalDate.of(2004, 5, 21)),
                eq(2026), eq(2030), eq(4));
    }

    @Test
    void createAnnouncementUsesCurrentAdminAndCollege() {
        when(collegeAdminMapper.insertAnnouncement("公告标题", "公告内容", 1L, 2L, 1)).thenReturn(1);

        collegeAdminService.createAnnouncement(new CreateAnnouncementRequest(" 公告标题 ", " 公告内容 ", 1));

        verify(collegeAdminMapper).insertAnnouncement("公告标题", "公告内容", 1L, 2L, 1);
    }

    @Test
    void updateAnnouncementOnlyUpdatesAnnouncementInCurrentAdminCollege() {
        when(collegeAdminMapper.findAnnouncementInCollege(5L, 2L)).thenReturn(5L);
        when(collegeAdminMapper.updateAnnouncement(5L, 2L, "新标题", "新内容", 0)).thenReturn(1);

        collegeAdminService.updateAnnouncement(5L, new CreateAnnouncementRequest(" 新标题 ", " 新内容 ", 0));

        verify(collegeAdminMapper).updateAnnouncement(5L, 2L, "新标题", "新内容", 0);
    }

    @Test
    void updateStudentOnlyUpdatesStudentInCurrentCollege() {
        when(collegeAdminMapper.findStudentAccountInCollege(5L, 2L))
                .thenReturn(Map.of("studentId", 5L, "userId", 8L));
        when(collegeAdminMapper.updateStudent(5L, 2L, "学生", "13800000000",
                1, LocalDate.of(2005, 1, 1), 2024, 2028, 4)).thenReturn(1);

        collegeAdminService.updateStudent(5L, new UpdateStudentRequest(
                " 学生 ", "13800000000", 1, LocalDate.of(2005, 1, 1), 2024, 2028, 4));

        verify(collegeAdminMapper).updateStudent(5L, 2L, "学生", "13800000000",
                1, LocalDate.of(2005, 1, 1), 2024, 2028, 4);
    }

    @Test
    void deactivateStudentPreservesRecordAndDecrementsClassCount() {
        when(collegeAdminMapper.findStudentAccountInCollege(5L, 2L))
                .thenReturn(Map.of("studentId", 5L, "classId", 3L));
        when(collegeAdminMapper.deactivateStudent(5L, 2L)).thenReturn(1);
        when(collegeAdminMapper.decrementClassStudentCount(3L, 2L)).thenReturn(1);

        collegeAdminService.deactivateStudent(5L);

        verify(collegeAdminMapper).deactivateStudent(5L, 2L);
        verify(collegeAdminMapper).decrementClassStudentCount(3L, 2L);
    }

    @Test
    void updateTeacherChangesOnlyTeacherInCurrentCollege() {
        when(collegeAdminMapper.findTeacherInCollege(5L, 2L)).thenReturn(5L);
        when(collegeAdminMapper.updateTeacher(5L, 2L, "教师", "13800000000"))
                .thenReturn(1);

        collegeAdminService.updateTeacher(5L, new UpdateTeacherRequest(" 教师 ", "13800000000"));

        verify(collegeAdminMapper).updateTeacher(5L, 2L, "教师", "13800000000");
    }

    @Test
    void createSelectionBatchSchedulesRedisExpirationByBatchId() {
        LocalDateTime start = LocalDateTime.now().plusMinutes(1);
        LocalDateTime end = start.plusHours(2);
        when(collegeAdminMapper.insertSelectionBatch("选课批次", 2L, start, end, 1, 1L))
                .thenReturn(1);
        when(collegeAdminMapper.findLastInsertedSelectionBatchId()).thenReturn(9L);

        collegeAdminService.createSelectionBatch(
                new CourseSelectionBatchRequest("选课批次", start, end, 1));

        verify(redisUtil).setString(eq("course_selection_batch:9"), eq("9"), anyLong());
    }

    @Test
    void createSemesterTrimsNameAndStoresIt() {
        when(collegeAdminMapper.findSemesterIdByName("2026-2027-1")).thenReturn(null);
        when(collegeAdminMapper.insertSemester("2026-2027-1")).thenReturn(1);

        collegeAdminService.createSemester(new SemesterRequest(" 2026-2027-1 "));

        verify(collegeAdminMapper).insertSemester("2026-2027-1");
    }

    @Test
    void updateSemesterRenamesExistingScheduleReferences() {
        when(collegeAdminMapper.findSemesterName(3L)).thenReturn("2026-2027-1");
        when(collegeAdminMapper.findSemesterIdByName("2026-2027-2")).thenReturn(null);
        when(collegeAdminMapper.updateSemester(3L, "2026-2027-2")).thenReturn(1);

        collegeAdminService.updateSemester(3L, new SemesterRequest("2026-2027-2"));

        verify(collegeAdminMapper).renameScheduledSemester("2026-2027-1", "2026-2027-2");
    }

    @Test
    void deleteSemesterRejectsExistingScheduleReferences() {
        when(collegeAdminMapper.findSemesterName(3L)).thenReturn("2026-2027-1");
        when(collegeAdminMapper.countSchedulesBySemester("2026-2027-1")).thenReturn(1);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.deleteSemester(3L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(collegeAdminMapper, never()).deleteSemester(3L);
    }

    @Test
    void updateAnnouncementRejectsAnnouncementOutsideCurrentAdminCollege() {
        when(collegeAdminMapper.findAnnouncementInCollege(5L, 2L)).thenReturn(null);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.updateAnnouncement(5L,
                        new CreateAnnouncementRequest("新标题", "新内容", 1)));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(collegeAdminMapper, never()).updateAnnouncement(anyLong(), anyLong(), anyString(), anyString(),
                anyInt());
    }

    @Test
    void deleteAnnouncementUsesCurrentAdminCollege() {
        when(collegeAdminMapper.deleteAnnouncement(5L, 2L)).thenReturn(1);

        collegeAdminService.deleteAnnouncement(5L);

        verify(collegeAdminMapper).deleteAnnouncement(5L, 2L);
    }

    @Test
    void deleteCourseDeletesCourseInCurrentAdminCollege() {
        when(collegeAdminMapper.findCourseInCollege(8L, 2L)).thenReturn(8L);
        when(collegeAdminMapper.deleteCourse(8L, 2L)).thenReturn(1);

        collegeAdminService.deleteCourse(8L);

        verify(collegeAdminMapper).deleteCourse(8L, 2L);
    }

    @Test
    void deleteCourseRejectsCourseOutsideCurrentAdminCollege() {
        when(collegeAdminMapper.findCourseInCollege(8L, 2L)).thenReturn(null);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.deleteCourse(8L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(collegeAdminMapper, never()).deleteCourse(anyLong(), anyLong());
    }

    @Test
    void deleteCourseReturnsConflictWhenCourseHasSelections() {
        when(collegeAdminMapper.findCourseInCollege(8L, 2L)).thenReturn(8L);
        when(collegeAdminMapper.deleteCourse(8L, 2L))
                .thenThrow(new DataIntegrityViolationException("foreign key constraint"));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.deleteCourse(8L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    }

    @Test
    void deleteSelectionBatchUsesCurrentAdminCollege() {
        when(collegeAdminMapper.deleteSelectionBatch(3L, 2L)).thenReturn(1);

        collegeAdminService.deleteSelectionBatch(3L);

        verify(collegeAdminMapper).deleteSelectionBatch(3L, 2L);
    }

    @Test
    void deleteSelectionBatchRejectsBatchOutsideCurrentAdminCollege() {
        when(collegeAdminMapper.deleteSelectionBatch(3L, 2L)).thenReturn(0);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.deleteSelectionBatch(3L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }

    @Test
    void getTeachersReturnsOnlyMapperResultsForCurrentAdminCollege() {
        List<Map<String, Object>> teachers = List.of(Map.of(
                "teacherId", 5L,
                "teacherNo", "2026000005",
                "teacherName", "张老师",
                "phone", "13800000000"));
        when(collegeAdminMapper.findTeachersByCollege(2L)).thenReturn(teachers);

        try {
            PageInfo<Map<String, Object>> result = collegeAdminService.getTeachers(1, 10);

            assertEquals(teachers, result.getList());
            verify(collegeAdminMapper).findTeachersByCollege(2L);
        } finally {
            PageHelper.clearPage();
        }
    }

    @Test
    void getClassScheduleUsesCurrentAdminCollege() {
        List<Map<String, Object>> schedule = List.of(Map.of(
                "scheduleId", 18L,
                "classId", 10L,
                "semester", "2026-2027-1"));
        when(collegeAdminMapper.findClassSchedule(10L, "2026-2027-1", 2L)).thenReturn(schedule);

        assertEquals(schedule, collegeAdminService.getClassSchedule(10L, "2026-2027-1"));

        verify(collegeAdminMapper).findClassSchedule(10L, "2026-2027-1", 2L);
    }

    @Test
    void createCourseScheduleUsesCurrentAdminCollegeAndRequestFields() {
        when(collegeAdminMapper.findCourseInCollege(8L, 2L)).thenReturn(8L);
        when(collegeAdminMapper.findClassForUpdate(10L, 2L)).thenReturn(10L);
        when(collegeAdminMapper.findTeacherInCollege(5L, 2L)).thenReturn(5L);
        when(collegeAdminMapper.insertCourseSchedule(8L, 10L, 5L, "2026-2027-1",
                1, 1, 6, 11, "B2教学楼", 2L)).thenReturn(1);
        CreateCourseScheduleRequest request = new CreateCourseScheduleRequest(
                8L, 10L, 5L, "2026-2027-1", 1, 1, 6, 11, "B2教学楼");

        collegeAdminService.createCourseSchedule(request);

        verify(collegeAdminMapper).insertCourseSchedule(8L, 10L, 5L, "2026-2027-1",
                1, 1, 6, 11, "B2教学楼", 2L);
    }

    @Test
    void createCourseScheduleRejectsEndWeekBeforeStartWeek() {
        CreateCourseScheduleRequest request = new CreateCourseScheduleRequest(
                8L, 10L, 5L, "2026-2027-1", 1, 1, 11, 6, "B2教学楼");

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.createCourseSchedule(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(collegeAdminMapper, never()).insertCourseSchedule(anyLong(), anyLong(), anyLong(),
                anyString(), anyInt(), anyInt(), anyInt(), anyInt(), anyString(), anyLong());
    }

    @Test
    void updateCourseScheduleChangesFieldsWithoutChangingTeacherOrSemester() {
        when(collegeAdminMapper.findCourseScheduleInCollege(18L, 2L)).thenReturn(18L);
        when(collegeAdminMapper.findCourseInCollege(8L, 2L)).thenReturn(8L);
        when(collegeAdminMapper.findClassForUpdate(10L, 2L)).thenReturn(10L);
        when(collegeAdminMapper.updateCourseSchedule(18L, 2L, 8L, 10L,
                1, 1, 6, 11, "B2教学楼")).thenReturn(1);
        UpdateCourseScheduleRequest request = new UpdateCourseScheduleRequest(
                8L, 10L, 1, 1, 6, 11, "B2教学楼");

        collegeAdminService.updateCourseSchedule(18L, request);

        verify(collegeAdminMapper).updateCourseSchedule(18L, 2L, 8L, 10L,
                1, 1, 6, 11, "B2教学楼");
    }

    @Test
    void updateCourseScheduleRejectsEndWeekBeforeStartWeek() {
        UpdateCourseScheduleRequest request = new UpdateCourseScheduleRequest(
                8L, 10L, 1, 1, 11, 6, "B2教学楼");

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.updateCourseSchedule(18L, request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(collegeAdminMapper, never()).updateCourseSchedule(anyLong(), anyLong(), anyLong(),
                anyLong(), anyInt(), anyInt(), anyInt(), anyInt(), anyString());
    }

    @Test
    void deleteCourseScheduleUsesCurrentAdminCollege() {
        when(collegeAdminMapper.deleteCourseSchedule(18L, 2L)).thenReturn(1);

        collegeAdminService.deleteCourseSchedule(18L);

        verify(collegeAdminMapper).deleteCourseSchedule(18L, 2L);
    }

    @Test
    void registerStudentsRejectsExhaustedYearSequence() {
        when(collegeAdminMapper.findMaxAccountNumberSuffix(year)).thenReturn(999_999);
        when(collegeAdminMapper.findAccountNumberSequenceValueForUpdate(year)).thenReturn(999_999);
        BatchStudentRegistrationRequest request = new BatchStudentRegistrationRequest(List.of(
                new StudentRegistrationRequest("李同学", "11010519491231002X", "13900000000",
                        0, LocalDate.of(2004, 5, 21), 2026, 2030, 4)
        ));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.registerStudents(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    }

    @Test
    void registerStudentsRejectsInconsistentGraduationYearAndDuration() {
        BatchStudentRegistrationRequest request = new BatchStudentRegistrationRequest(List.of(
                new StudentRegistrationRequest("李同学", "11010519491231002X", "13900000000",
                        0, LocalDate.of(2004, 5, 21), 2026, 2031, 4)
        ));

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.registerStudents(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(collegeAdminMapper, never()).insertAccount(anyString(), anyString(), anyString(), anyLong(),
                anyInt());
    }

    @Test
    void assignStudentsToClassAssignsAllStudentsInTheAdminCollege() {
        BatchAssignStudentClassRequest request = new BatchAssignStudentClassRequest(20L, List.of(10L, 11L));
        when(collegeAdminMapper.findClassInCollege(20L, 2L)).thenReturn(20L);
        when(collegeAdminMapper.findStudentInCollege(10L, 2L)).thenReturn(10L);
        when(collegeAdminMapper.findStudentInCollege(11L, 2L)).thenReturn(11L);
        when(collegeAdminMapper.assignStudentClass(10L, 20L, 2L)).thenReturn(1);
        when(collegeAdminMapper.assignStudentClass(11L, 20L, 2L)).thenReturn(1);
        when(collegeAdminMapper.incrementClassStudentCount(20L, 2L)).thenReturn(1);

        collegeAdminService.assignStudentsToClass(request);

        verify(collegeAdminMapper).assignStudentClass(10L, 20L, 2L);
        verify(collegeAdminMapper).assignStudentClass(11L, 20L, 2L);
        verify(collegeAdminMapper, times(2)).incrementClassStudentCount(20L, 2L);
    }

    @Test
    void assignStudentsToClassRejectsOutOfCollegeStudentBeforeUpdatingAnyStudent() {
        BatchAssignStudentClassRequest request = new BatchAssignStudentClassRequest(20L, List.of(10L, 11L));
        when(collegeAdminMapper.findClassInCollege(20L, 2L)).thenReturn(20L);
        when(collegeAdminMapper.findStudentInCollege(10L, 2L)).thenReturn(10L);
        when(collegeAdminMapper.findStudentInCollege(11L, 2L)).thenReturn(null);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.assignStudentsToClass(request));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(collegeAdminMapper, never()).assignStudentClass(anyLong(), anyLong(), anyLong());
    }

    @Test
    void assignStudentsToClassRejectsAlreadyAssignedStudentBeforeUpdatingAnyStudent() {
        BatchAssignStudentClassRequest request = new BatchAssignStudentClassRequest(20L, List.of(10L));
        when(collegeAdminMapper.findClassInCollege(20L, 2L)).thenReturn(20L);
        when(collegeAdminMapper.findStudentInCollege(10L, 2L)).thenReturn(null);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.assignStudentsToClass(request));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(collegeAdminMapper, never()).assignStudentClass(anyLong(), anyLong(), anyLong());
    }

    @Test
    void assignStudentsToClassFailsWhenClassCountCannotBeIncremented() {
        BatchAssignStudentClassRequest request = new BatchAssignStudentClassRequest(20L, List.of(10L));
        when(collegeAdminMapper.findClassInCollege(20L, 2L)).thenReturn(20L);
        when(collegeAdminMapper.findStudentInCollege(10L, 2L)).thenReturn(10L);
        when(collegeAdminMapper.assignStudentClass(10L, 20L, 2L)).thenReturn(1);
        when(collegeAdminMapper.incrementClassStudentCount(20L, 2L)).thenReturn(0);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.assignStudentsToClass(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    }

    @Test
    void assignStudentsToClassRejectsDuplicateStudentIds() {
        BatchAssignStudentClassRequest request = new BatchAssignStudentClassRequest(20L, List.of(10L, 10L));
        when(collegeAdminMapper.findClassInCollege(20L, 2L)).thenReturn(20L);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.assignStudentsToClass(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(collegeAdminMapper, never()).findStudentInCollege(anyLong(), anyLong());
        verify(collegeAdminMapper, never()).assignStudentClass(anyLong(), anyLong(), anyLong());
    }

    @Test
    void getClassesUsesTheCurrentAdminCollege() {
        List<Map<String, Object>> classes = List.of(Map.of(
                "classId", 20L,
                "className", "软件工程 2026 级 1 班",
                "studentCount", 30,
                "status", 1
        ));
        when(collegeAdminMapper.findClassesByCollege(2L)).thenReturn(classes);

        assertEquals(classes, collegeAdminService.getClasses());
        verify(collegeAdminMapper).findClassesByCollege(2L);
    }

    @Test
    void updateClassChangesOnlyClassInCurrentAdminCollege() {
        UpdateClassRequest request = new UpdateClassRequest(" 新班级 ", " 2026 ",
                2026, 2030, 1);
        when(collegeAdminMapper.findClassForUpdate(20L, 2L)).thenReturn(20L);
        when(collegeAdminMapper.updateClass(20L, 2L, "新班级", "2026",
                2026, 2030, 1)).thenReturn(1);

        collegeAdminService.updateClass(20L, request);

        verify(collegeAdminMapper).updateClass(20L, 2L, "新班级", "2026",
                2026, 2030, 1);
    }

    @Test
    void updateClassRejectsClassOutsideCurrentAdminCollege() {
        when(collegeAdminMapper.findClassForUpdate(20L, 2L)).thenReturn(null);

        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.updateClass(20L,
                        new UpdateClassRequest("班级", "2026", 2026, 2030, 1)));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(collegeAdminMapper, never()).updateClass(anyLong(), anyLong(), anyString(), anyString(),
                anyInt(), anyInt(), anyInt());
    }

    @Test
    void updateClassRejectsInvalidYearRange() {
        StudentServiceException exception = assertThrows(StudentServiceException.class,
                () -> collegeAdminService.updateClass(20L,
                        new UpdateClassRequest("班级", "2026", 2030, 2026, 1)));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(collegeAdminMapper, never()).findClassForUpdate(anyLong(), anyLong());
    }

    @Test
    void updateClassAllowsNoOpUpdateWhenClassStillExists() {
        UpdateClassRequest request = new UpdateClassRequest("班级", "2026", 2026, 2030, 1);
        when(collegeAdminMapper.findClassForUpdate(20L, 2L)).thenReturn(20L);
        when(collegeAdminMapper.updateClass(20L, 2L, "班级", "2026", 2026, 2030, 1))
                .thenReturn(0);

        collegeAdminService.updateClass(20L, request);

        verify(collegeAdminMapper).updateClass(20L, 2L, "班级", "2026", 2026, 2030, 1);
    }
}
