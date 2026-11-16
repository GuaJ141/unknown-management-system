package com.guajsama.backend.service.impl;

import com.guajsama.backend.mapper.StudentMapper;
import com.guajsama.backend.module.dto.ChangePasswordRequest;
import com.guajsama.backend.module.dto.ChangePhoneRequest;
import com.guajsama.backend.service.StudentService;
import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.utils.EncryptUtils;
import com.guajsama.backend.utils.RedisUtil;
import com.guajsama.backend.utils.ThreadLocalUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class StudentServiceImpl implements StudentService {
    private final StudentMapper studentMapper;
    private final RedisUtil redisUtil;

    public StudentServiceImpl(StudentMapper studentMapper, RedisUtil redisUtil) {
        this.studentMapper = studentMapper;
        this.redisUtil = redisUtil;
    }

    @Override
    public void changePhone(ChangePhoneRequest request) {
        StudentContext student = getCurrentStudent();
        verifyIdentity(student.userId(), request.name(), request.idCard());
        try {
            if (studentMapper.updatePhone(student.userId(), request.phone()) != 1) {
                throw new StudentServiceException(HttpStatus.FORBIDDEN, "账户不可用");
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "该手机号已被其他账户使用");
        }
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        StudentContext student = getCurrentStudent();
        verifyIdentity(student.userId(), request.name(), request.idCard());
        if (studentMapper.updatePassword(student.userId(), EncryptUtils.getMd5String(request.newPassword())) != 1) {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "账户不可用");
        }
        redisUtil.delete("auth:" + student.userId());
    }

    @Override
    public List<Map<String, Object>> getAvailableCourses() {
        StudentContext student = getCurrentStudent();
        return studentMapper.findAvailableCourses(student.collegeId());
    }

    @Override
    @Transactional
    public void selectCourse(Long courseId) {
        StudentContext student = getCurrentStudent();
        if (studentMapper.countOpenSelectionBatches(student.collegeId()) == 0) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "当前没有开放的选课批次");
        }
        if (studentMapper.findSelectableCourse(courseId, student.collegeId()) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "课程不存在或当前不可选");
        }

        Map<String, Object> selection = studentMapper.findSelection(student.studentId(), courseId);
        if (selection == null) {
            try {
                if (studentMapper.insertSelection(student.studentId(), courseId, student.collegeId()) != 1) {
                    throw new StudentServiceException(HttpStatus.CONFLICT, "课程授课教师不存在，无法选课");
                }
            } catch (DuplicateKeyException exception) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "该课程已选或选课状态已变更");
            }
            return;
        }
        if (numberValue(selection.get("status")) == 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "请勿重复选择该课程");
        }
        Object selectionId = selection.get("id");
        if (!(selectionId instanceof Number id) || studentMapper.reactivateSelection(id.longValue()) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "选课状态已变更，请重试");
        }
    }

    @Override
    public List<Map<String, Object>> getCourseSelections() {
        return studentMapper.findCourseSelections(getCurrentStudent().studentId());
    }

    @Override
    public List<Map<String, Object>> getSchedule() {
        return studentMapper.findSchedule(getCurrentStudent().studentId());
    }

    @Override
    public List<Map<String, Object>> getScheduleByClassAndSemester(Long classId, String semester) {
        Map<?, ?> claims = getClaims();
        int role = roleValue(claims);
        Long adminUserId = null;
        Long studentId = null;
        if (role == 1) {
            StudentContext student = getCurrentStudent();
            if (classId != null && (student.classId() == null || !student.classId().equals(classId))) {
                throw new StudentServiceException(HttpStatus.FORBIDDEN, "学生只能查询所在班级的课表");
            }
            studentId = student.studentId();
        } else if (role == 3) {
            if (classId == null) {
                throw new StudentServiceException(HttpStatus.BAD_REQUEST, "学院管理员查询时必须提供班级ID");
            }
            adminUserId = userIdValue(claims);
        } else {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "当前账户无权查询班级课表");
        }
        if (studentId != null) {
            return studentMapper.findScheduleByStudentAndSemester(studentId, semester);
        }
        return studentMapper.findScheduleByClassAndSemester(classId, semester, adminUserId);
    }

    @Override
    public List<Map<String, Object>> getScores() {
        return studentMapper.findScores(getCurrentStudent().studentId());
    }

    @Override
    public Map<String, Object> getClassInfo() {
        return studentMapper.findClassInfo(getCurrentStudent().studentId());
    }

    private StudentContext getCurrentStudent() {
        Map<?, ?> claims = getClaims();
        Object idValue = claims.get("id");
        if (!(idValue instanceof Number id)) {
            throw new StudentServiceException(HttpStatus.UNAUTHORIZED, "登录信息无效");
        }
        Long userId = id.longValue();
        Map<String, Object> student = studentMapper.findStudentByUserId(userId);
        if (student == null) {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "当前账户不是有效的学生账户");
        }
        return new StudentContext(userId, numberValue(student.get("studentId")),
                numberValue(student.get("collegeId")), nullableNumberValue(student.get("classId")));
    }

    private Map<?, ?> getClaims() {
        Object claimsObject = ThreadLocalUtils.get();
        if (!(claimsObject instanceof Map<?, ?> claims)) {
            throw new StudentServiceException(HttpStatus.UNAUTHORIZED, "登录信息无效");
        }
        return claims;
    }

    private int roleValue(Map<?, ?> claims) {
        if (!(claims.get("role") instanceof Number role)) {
            throw new StudentServiceException(HttpStatus.UNAUTHORIZED, "登录信息无效");
        }
        return role.intValue();
    }

    private Long userIdValue(Map<?, ?> claims) {
        if (!(claims.get("id") instanceof Number id)) {
            throw new StudentServiceException(HttpStatus.UNAUTHORIZED, "登录信息无效");
        }
        return id.longValue();
    }

    private void verifyIdentity(Long userId, String name, String idCard) {
        if (studentMapper.verifyStudentIdentity(userId, name.trim(), idCard.trim()) == null) {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "姓名或身份证号核验失败");
        }
    }

    private long numberValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new IllegalStateException("数据库返回了无效的数字字段");
    }

    private Long nullableNumberValue(Object value) {
        if (value == null) {
            return null;
        }
        return numberValue(value);
    }

    private record StudentContext(Long userId, Long studentId, Long collegeId, Long classId) {
    }

}
