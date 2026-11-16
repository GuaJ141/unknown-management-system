package com.guajsama.backend.service;

import com.guajsama.backend.module.dto.ChangePasswordRequest;
import com.guajsama.backend.module.dto.ChangePhoneRequest;
import com.guajsama.backend.module.dto.EnterScoreRequest;

import java.util.List;
import java.util.Map;

public interface TeacherService {
    void changePhone(ChangePhoneRequest request);

    void changePassword(ChangePasswordRequest request);

    List<Map<String, Object>> getClassStudents(Long courseId);

    List<Map<String, Object>> getCourses();

    List<Map<String, Object>> getScoresByClassCourseAndTeacher(Long classId, Long courseId, Long teacherId);

    List<Map<String, Object>> getSchedule();

    List<Map<String, Object>> getScheduleByTeacherAndSemester(Long teacherId, String semester);

    void enterScore(Long courseId, EnterScoreRequest request);

    void updateScore(Long courseId, EnterScoreRequest request);

    void deleteScore(Long courseId, Long studentId);
}
