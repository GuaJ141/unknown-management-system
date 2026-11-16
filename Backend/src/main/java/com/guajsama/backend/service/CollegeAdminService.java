package com.guajsama.backend.service;

import com.guajsama.backend.module.dto.BatchAssignStudentClassRequest;
import com.guajsama.backend.module.dto.BatchStudentRegistrationRequest;
import com.guajsama.backend.module.dto.BatchTeacherRegistrationRequest;
import com.guajsama.backend.module.dto.CreateClassRequest;
import com.guajsama.backend.module.dto.CreateCourseScheduleRequest;
import com.guajsama.backend.module.dto.CreateAnnouncementRequest;
import com.guajsama.backend.module.dto.CourseRequest;
import com.guajsama.backend.module.dto.CourseSelectionBatchRequest;
import com.guajsama.backend.module.dto.UpdateClassRequest;
import com.guajsama.backend.module.dto.UpdateCourseScheduleRequest;
import com.guajsama.backend.module.dto.SemesterRequest;
import com.guajsama.backend.module.dto.UpdateStudentRequest;
import com.guajsama.backend.module.dto.UpdateTeacherRequest;
import com.github.pagehelper.PageInfo;

import java.util.List;
import java.util.Map;

public interface CollegeAdminService {
    List<String> registerTeachers(BatchTeacherRegistrationRequest request);

    List<String> registerStudents(BatchStudentRegistrationRequest request);

    void assignStudentsToClass(BatchAssignStudentClassRequest request);

    List<Map<String, Object>> getStudentsWithoutClass();

    PageInfo<Map<String, Object>> getStudents(int pageNum, int pageSize);

    PageInfo<Map<String, Object>> getTeachers(int pageNum, int pageSize);

    void updateStudent(Long studentId, UpdateStudentRequest request);

    void deactivateStudent(Long studentId);

    void updateTeacher(Long teacherId, UpdateTeacherRequest request);

    void deactivateTeacher(Long teacherId);

    void createClass(CreateClassRequest request);

    void updateClass(Long classId, UpdateClassRequest request);

    void createAnnouncement(CreateAnnouncementRequest request);

    void updateAnnouncement(Long announcementId, CreateAnnouncementRequest request);

    void deleteAnnouncement(Long announcementId);

    List<Map<String, Object>> getClasses();

    List<Map<String, Object>> getClassSchedule(Long classId, String semester);

    void createCourseSchedule(CreateCourseScheduleRequest request);

    void updateCourseSchedule(Long scheduleId, UpdateCourseScheduleRequest request);

    void deleteCourseSchedule(Long scheduleId);

    List<Map<String, Object>> getCourses();

    void createCourse(CourseRequest request);

    void updateCourse(Long courseId, CourseRequest request);

    void deleteCourse(Long courseId);

    List<Map<String, Object>> getSelectionBatches();

    void createSelectionBatch(CourseSelectionBatchRequest request);

    void updateSelectionBatch(Long batchId, CourseSelectionBatchRequest request);

    void deleteSelectionBatch(Long batchId);

    List<Map<String, Object>> getSemesters();

    void createSemester(SemesterRequest request);

    void updateSemester(Long semesterId, SemesterRequest request);

    void deleteSemester(Long semesterId);
}
