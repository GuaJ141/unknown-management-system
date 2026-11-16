package com.guajsama.backend.controller;

import com.guajsama.backend.module.dto.ChangePasswordRequest;
import com.guajsama.backend.module.dto.ChangePhoneRequest;
import com.guajsama.backend.module.dto.EnterScoreRequest;
import com.guajsama.backend.module.vo.ApiResponse;
import com.guajsama.backend.service.TeacherService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teacher")
@Validated
public class TeacherController {
    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    @PutMapping("/phone")
    public ApiResponse<Void> changePhone(@Valid @RequestBody ChangePhoneRequest request) {
        teacherService.changePhone(request);
        return ApiResponse.completed();
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        teacherService.changePassword(request);
        return ApiResponse.completed();
    }

    @GetMapping("/classes/students")
    public ApiResponse<List<Map<String, Object>>> getClassStudents(
            @RequestParam @Positive Long courseId) {
        return ApiResponse.success(teacherService.getClassStudents(courseId));
    }

    @GetMapping("/courses")
    public ApiResponse<List<Map<String, Object>>> getCourses() {
        return ApiResponse.success(teacherService.getCourses());
    }

    @GetMapping("/scores")
    public ApiResponse<List<Map<String, Object>>> getScoresByClassCourseAndTeacher(
            @RequestParam @Positive Long classId,
            @RequestParam @Positive Long courseId,
            @RequestParam @Positive Long teacherId) {
        return ApiResponse.success(
                teacherService.getScoresByClassCourseAndTeacher(classId, courseId, teacherId));
    }

    @GetMapping("/schedule")
    public ApiResponse<List<Map<String, Object>>> getSchedule() {
        return ApiResponse.success(teacherService.getSchedule());
    }

    @GetMapping("/schedule/teacher")
    public ApiResponse<List<Map<String, Object>>> getScheduleByTeacherAndSemester(
            @RequestParam(required = false) @Positive Long teacherId,
            @RequestParam @NotBlank @Size(max = 20) String semester) {
        return ApiResponse.success(teacherService.getScheduleByTeacherAndSemester(teacherId, semester));
    }

    @PostMapping("/courses/{courseId}/scores")
    public ApiResponse<Void> enterScore(@PathVariable("courseId") @Positive Long courseId,
                                        @Valid @RequestBody EnterScoreRequest request) {
        teacherService.enterScore(courseId, request);
        return ApiResponse.completed();
    }

    @PutMapping("/courses/{courseId}/scores")
    public ApiResponse<Void> updateScore(@PathVariable("courseId") @Positive Long courseId,
                                         @Valid @RequestBody EnterScoreRequest request) {
        teacherService.updateScore(courseId, request);
        return ApiResponse.completed();
    }

    @DeleteMapping("/courses/{courseId}/scores/{studentId}")
    public ApiResponse<Void> deleteScore(@PathVariable("courseId") @Positive Long courseId,
                                         @PathVariable("studentId") @Positive Long studentId) {
        teacherService.deleteScore(courseId, studentId);
        return ApiResponse.completed();
    }
}
