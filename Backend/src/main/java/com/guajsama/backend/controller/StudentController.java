package com.guajsama.backend.controller;

import com.guajsama.backend.module.dto.ChangePasswordRequest;
import com.guajsama.backend.module.dto.ChangePhoneRequest;
import com.guajsama.backend.module.vo.ApiResponse;
import com.guajsama.backend.service.AnnouncementService;
import com.guajsama.backend.service.StudentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
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
@RequestMapping("/student")
@Validated
public class StudentController {
    private final StudentService studentService;
    private final AnnouncementService announcementService;

    public StudentController(StudentService studentService, AnnouncementService announcementService) {
        this.studentService = studentService;
        this.announcementService = announcementService;
    }

    @PutMapping("/phone")
    public ApiResponse<Void> changePhone(@Valid @RequestBody ChangePhoneRequest request) {
        studentService.changePhone(request);
        return ApiResponse.completed();
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        studentService.changePassword(request);
        return ApiResponse.completed();
    }

    @GetMapping("/courses/available")
    public ApiResponse<List<Map<String, Object>>> getAvailableCourses() {
        return ApiResponse.success(studentService.getAvailableCourses());
    }

    @PostMapping("/courses/{courseId}/selection")
    public ApiResponse<Void> selectCourse(@PathVariable("courseId") @Positive Long courseId) {
        studentService.selectCourse(courseId);
        return ApiResponse.completed();
    }

    @GetMapping("/course-selections")
    public ApiResponse<List<Map<String, Object>>> getCourseSelections() {
        return ApiResponse.success(studentService.getCourseSelections());
    }

    @GetMapping("/schedule")
    public ApiResponse<List<Map<String, Object>>> getSchedule() {
        return ApiResponse.success(studentService.getSchedule());
    }

    @GetMapping("/schedule/class")
    public ApiResponse<List<Map<String, Object>>> getScheduleByClassAndSemester(
            @RequestParam(required = false) @Positive Long classId,
            @RequestParam @NotBlank @Size(max = 20) String semester) {
        return ApiResponse.success(studentService.getScheduleByClassAndSemester(classId, semester));
    }

    @GetMapping("/scores")
    public ApiResponse<List<Map<String, Object>>> getScores() {
        return ApiResponse.success(studentService.getScores());
    }

    @GetMapping("/class")
    public ApiResponse<Map<String, Object>> getClassInfo() {
        return ApiResponse.success(studentService.getClassInfo());
    }

    @GetMapping("/announcements")
    public ApiResponse<List<Map<String, Object>>> getAnnouncements() {
        return ApiResponse.success(announcementService.getAnnouncements());
    }
}
