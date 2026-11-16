package com.guajsama.backend.service;

import com.guajsama.backend.module.dto.ChangePasswordRequest;
import com.guajsama.backend.module.dto.ChangePhoneRequest;

import java.util.List;
import java.util.Map;

public interface StudentService {
    void changePhone(ChangePhoneRequest request);

    void changePassword(ChangePasswordRequest request);

    List<Map<String, Object>> getAvailableCourses();

    void selectCourse(Long courseId);

    List<Map<String, Object>> getCourseSelections();

    List<Map<String, Object>> getSchedule();

    List<Map<String, Object>> getScheduleByClassAndSemester(Long classId, String semester);

    List<Map<String, Object>> getScores();

    Map<String, Object> getClassInfo();

}
