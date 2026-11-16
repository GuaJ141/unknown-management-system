package com.guajsama.backend.controller;

import com.github.pagehelper.PageInfo;
import com.guajsama.backend.module.dto.BatchAssignStudentClassRequest;
import com.guajsama.backend.module.dto.BatchStudentRegistrationRequest;
import com.guajsama.backend.module.dto.BatchTeacherRegistrationRequest;
import com.guajsama.backend.module.dto.CreateAnnouncementRequest;
import com.guajsama.backend.module.dto.CreateClassRequest;
import com.guajsama.backend.module.dto.CreateCourseScheduleRequest;
import com.guajsama.backend.module.dto.CourseRequest;
import com.guajsama.backend.module.dto.CourseSelectionBatchRequest;
import com.guajsama.backend.module.dto.UpdateClassRequest;
import com.guajsama.backend.module.dto.UpdateCourseScheduleRequest;
import com.guajsama.backend.module.dto.SemesterRequest;
import com.guajsama.backend.module.dto.UpdateStudentRequest;
import com.guajsama.backend.module.dto.UpdateTeacherRequest;
import com.guajsama.backend.module.vo.ApiResponse;
import com.guajsama.backend.service.CollegeAdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/college-admin")
@Validated
public class CollegeAdminController {
    private final CollegeAdminService collegeAdminService;

    //注入Service
    public CollegeAdminController(CollegeAdminService collegeAdminService) {
        this.collegeAdminService = collegeAdminService;
    }

    //批量注册教师账号
    @PostMapping("/teachers/batch")
    public ApiResponse<List<String>> registerTeachers(@Valid @RequestBody BatchTeacherRegistrationRequest request) {
        return ApiResponse.success(collegeAdminService.registerTeachers(request));
    }

    //批量注册学生账号
    @PostMapping("/students/batch")
    public ApiResponse<List<String>> registerStudents(@Valid @RequestBody BatchStudentRegistrationRequest request) {
        return ApiResponse.success(collegeAdminService.registerStudents(request));
    }

    //将本学院学生加到学院班级
    @PutMapping("/students/class")
    public ApiResponse<Void> assignStudentsToClass(@Valid @RequestBody BatchAssignStudentClassRequest request) {
        collegeAdminService.assignStudentsToClass(request);
        return ApiResponse.completed();
    }

    //查询未分配班级的学生
    @GetMapping("/students/unassigned-class")
    public ApiResponse<List<Map<String, Object>>> getStudentsWithoutClass() {
        return ApiResponse.success(collegeAdminService.getStudentsWithoutClass());
    }

    //分页查询本学院学生信息
    @GetMapping("/students")
    public ApiResponse<PageInfo<Map<String, Object>>> getStudents(
            @RequestParam(defaultValue = "1") @Min(1) int pageNum,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        return ApiResponse.success(collegeAdminService.getStudents(pageNum, pageSize));
    }

    //分页查询本学院教师信息
    @GetMapping("/teachers")
    public ApiResponse<PageInfo<Map<String, Object>>> getTeachers(
            @RequestParam(defaultValue = "1") @Min(1) int pageNum,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        return ApiResponse.success(collegeAdminService.getTeachers(pageNum, pageSize));
    }

    @PutMapping("/students/{studentId}")
    public ApiResponse<Void> updateStudent(
            @PathVariable("studentId") @Positive Long studentId,
            @Valid @RequestBody UpdateStudentRequest request) {
        collegeAdminService.updateStudent(studentId, request);
        return ApiResponse.completed();
    }

    @DeleteMapping("/students/{studentId}")
    public ApiResponse<Void> deactivateStudent(
            @PathVariable("studentId") @Positive Long studentId) {
        collegeAdminService.deactivateStudent(studentId);
        return ApiResponse.completed();
    }

    @PutMapping("/teachers/{teacherId}")
    public ApiResponse<Void> updateTeacher(
            @PathVariable("teacherId") @Positive Long teacherId,
            @Valid @RequestBody UpdateTeacherRequest request) {
        collegeAdminService.updateTeacher(teacherId, request);
        return ApiResponse.completed();
    }

    @DeleteMapping("/teachers/{teacherId}")
    public ApiResponse<Void> deactivateTeacher(
            @PathVariable("teacherId") @Positive Long teacherId) {
        collegeAdminService.deactivateTeacher(teacherId);
        return ApiResponse.completed();
    }

    //新增班级
    @PostMapping("/classes")
    public ApiResponse<Void> createClass(@Valid @RequestBody CreateClassRequest request) {
        collegeAdminService.createClass(request);
        return ApiResponse.completed();
    }

    //编辑班级
    @PutMapping("/classes/{classId}")
    public ApiResponse<Void> updateClass(@PathVariable("classId") @Positive Long classId,
                                         @Valid @RequestBody UpdateClassRequest request) {
        collegeAdminService.updateClass(classId, request);
        return ApiResponse.completed();
    }

    //创建学院公告
    @PostMapping("/announcements")
    public ApiResponse<Void> createAnnouncement(@Valid @RequestBody CreateAnnouncementRequest request) {
        collegeAdminService.createAnnouncement(request);
        return ApiResponse.completed();
    }

    //编辑学院公告
    @PutMapping("/announcements/{announcementId}")
    public ApiResponse<Void> updateAnnouncement(
            @PathVariable("announcementId") @Positive Long announcementId,
            @Valid @RequestBody CreateAnnouncementRequest request) {
        collegeAdminService.updateAnnouncement(announcementId, request);
        return ApiResponse.completed();
    }

    //删除学院公告
    @DeleteMapping("/announcements/{announcementId}")
    public ApiResponse<Void> deleteAnnouncement(
            @PathVariable("announcementId") @Positive Long announcementId) {
        collegeAdminService.deleteAnnouncement(announcementId);
        return ApiResponse.completed();
    }

    //查询本学院班级
    @GetMapping("/classes")
    public ApiResponse<List<Map<String, Object>>> getClasses() {
        return ApiResponse.success(collegeAdminService.getClasses());
    }

    //按班级和学期查询本学院课表
    @GetMapping("/schedule/class")
    public ApiResponse<List<Map<String, Object>>> getClassSchedule(
            @RequestParam @Positive Long classId,
            @RequestParam @NotBlank @Size(max = 20) String semester) {
        return ApiResponse.success(collegeAdminService.getClassSchedule(classId, semester));
    }

    //安排课程
    @PostMapping("/schedules")
    public ApiResponse<Void> createCourseSchedule(@Valid @RequestBody CreateCourseScheduleRequest request) {
        collegeAdminService.createCourseSchedule(request);
        return ApiResponse.completed();
    }

    //编辑排课
    @PutMapping("/schedules/{scheduleId}")
    public ApiResponse<Void> updateCourseSchedule(
            @PathVariable("scheduleId") @Positive Long scheduleId,
            @Valid @RequestBody UpdateCourseScheduleRequest request) {
        collegeAdminService.updateCourseSchedule(scheduleId, request);
        return ApiResponse.completed();
    }

    //删除排课
    @DeleteMapping("/schedules/{scheduleId}")
    public ApiResponse<Void> deleteCourseSchedule(
            @PathVariable("scheduleId") @Positive Long scheduleId) {
        collegeAdminService.deleteCourseSchedule(scheduleId);
        return ApiResponse.completed();
    }

    //查询学院开设的课程
    @GetMapping("/courses")
    public ApiResponse<List<Map<String, Object>>> getCourses() {
        return ApiResponse.success(collegeAdminService.getCourses());
    }

    //新增课程
    @PostMapping("/courses")
    public ApiResponse<Void> createCourse(@Valid @RequestBody CourseRequest request) {
        collegeAdminService.createCourse(request);
        return ApiResponse.completed();
    }

    //更新学院课程
    @PutMapping("/courses/{courseId}")
    public ApiResponse<Void> updateCourse(@PathVariable("courseId") @Positive Long courseId,
                                          @Valid @RequestBody CourseRequest request) {
        collegeAdminService.updateCourse(courseId, request);
        return ApiResponse.completed();
    }

    //删除学院课程
    @DeleteMapping("/courses/{courseId}")
    public ApiResponse<Void> deleteCourse(@PathVariable("courseId") @Positive Long courseId) {
        collegeAdminService.deleteCourse(courseId);
        return ApiResponse.completed();
    }

    //查询学院选课批次
    @GetMapping("/selection-batches")
    public ApiResponse<List<Map<String, Object>>> getSelectionBatches() {
        return ApiResponse.success(collegeAdminService.getSelectionBatches());
    }

    //创建学院选课批次
    @PostMapping("/selection-batches")
    public ApiResponse<Void> createSelectionBatch(@Valid @RequestBody CourseSelectionBatchRequest request) {
        collegeAdminService.createSelectionBatch(request);
        return ApiResponse.completed();
    }

    //更新学院选课
    @PutMapping("/selection-batches/{batchId}")
    public ApiResponse<Void> updateSelectionBatch(@PathVariable("batchId") @Positive Long batchId,
                                                   @Valid @RequestBody CourseSelectionBatchRequest request) {
        collegeAdminService.updateSelectionBatch(batchId, request);
        return ApiResponse.completed();
    }

    //删除学院选课批次
    @DeleteMapping("/selection-batches/{batchId}")
    public ApiResponse<Void> deleteSelectionBatch(@PathVariable("batchId") @Positive Long batchId) {
        collegeAdminService.deleteSelectionBatch(batchId);
        return ApiResponse.completed();
    }

    @GetMapping("/semesters")
    public ApiResponse<List<Map<String, Object>>> getSemesters() {
        return ApiResponse.success(collegeAdminService.getSemesters());
    }

    @PostMapping("/semesters")
    public ApiResponse<Void> createSemester(@Valid @RequestBody SemesterRequest request) {
        collegeAdminService.createSemester(request);
        return ApiResponse.completed();
    }

    @PutMapping("/semesters/{semesterId}")
    public ApiResponse<Void> updateSemester(
            @PathVariable("semesterId") @Positive Long semesterId,
            @Valid @RequestBody SemesterRequest request) {
        collegeAdminService.updateSemester(semesterId, request);
        return ApiResponse.completed();
    }

    @DeleteMapping("/semesters/{semesterId}")
    public ApiResponse<Void> deleteSemester(
            @PathVariable("semesterId") @Positive Long semesterId) {
        collegeAdminService.deleteSemester(semesterId);
        return ApiResponse.completed();
    }
}
