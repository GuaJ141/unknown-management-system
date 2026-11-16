package com.guajsama.backend.service.impl;

import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.mapper.TeacherMapper;
import com.guajsama.backend.module.dto.ChangePasswordRequest;
import com.guajsama.backend.module.dto.ChangePhoneRequest;
import com.guajsama.backend.module.dto.EnterScoreRequest;
import com.guajsama.backend.service.TeacherService;
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
public class TeacherServiceImpl implements TeacherService {
    private final TeacherMapper teacherMapper;
    private final RedisUtil redisUtil;

    public TeacherServiceImpl(TeacherMapper teacherMapper, RedisUtil redisUtil) {
        this.teacherMapper = teacherMapper;
        this.redisUtil = redisUtil;
    }

    @Override
    public void changePhone(ChangePhoneRequest request) {
        TeacherContext teacher = getCurrentTeacher();
        verifyIdentity(teacher.userId(), request.name(), request.idCard());
        try {
            if (teacherMapper.updatePhone(teacher.userId(), request.phone()) != 1) {
                throw new StudentServiceException(HttpStatus.FORBIDDEN, "账户不可用");
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "该手机号已被其他账户使用");
        }
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        TeacherContext teacher = getCurrentTeacher();
        verifyIdentity(teacher.userId(), request.name(), request.idCard());
        if (teacherMapper.updatePassword(teacher.userId(),
                EncryptUtils.getMd5String(request.newPassword())) != 1) {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "账户不可用");
        }
        redisUtil.delete("auth:" + teacher.userId());
    }

    @Override
    public List<Map<String, Object>> getClassStudents(Long courseId) {
        Long teacherId = getCurrentTeacher().teacherId();
        if (teacherMapper.findCourseForTeacher(courseId, teacherId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "课程不存在或不属于当前教师");
        }
        return teacherMapper.findClassStudents(teacherId, courseId);
    }

    @Override
    public List<Map<String, Object>> getCourses() {
        return teacherMapper.findCoursesByTeacherId(getCurrentTeacher().teacherId());
    }

    @Override
    public List<Map<String, Object>> getScoresByClassCourseAndTeacher(Long classId, Long courseId, Long teacherId) {
        Map<?, ?> claims = getClaims();
        int role = roleValue(claims);
        Long adminUserId = null;
        if (role == 2) {
            Long currentTeacherId = getCurrentTeacher().teacherId();
            if (!currentTeacherId.equals(teacherId)) {
                throw new StudentServiceException(HttpStatus.FORBIDDEN, "教师只能查询本人课程成绩");
            }
        } else if (role == 3) {
            adminUserId = userIdValue(claims);
        } else {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "当前账户无权查询学生成绩");
        }
        return teacherMapper.findScoresByClassCourseAndTeacher(classId, courseId, teacherId, adminUserId);
    }

    @Override
    public List<Map<String, Object>> getSchedule() {
        return teacherMapper.findSchedule(getCurrentTeacher().teacherId());
    }

    @Override
    public List<Map<String, Object>> getScheduleByTeacherAndSemester(Long teacherId, String semester) {
        Map<?, ?> claims = getClaims();
        int role = roleValue(claims);
        Long adminUserId = null;
        if (role == 2) {
            Long currentTeacherId = getCurrentTeacher().teacherId();
            if (teacherId != null && !currentTeacherId.equals(teacherId)) {
                throw new StudentServiceException(HttpStatus.FORBIDDEN, "教师只能查询自己的课表");
            }
            teacherId = currentTeacherId;
        } else if (role == 3) {
            if (teacherId == null) {
                throw new StudentServiceException(HttpStatus.BAD_REQUEST, "学院管理员查询时必须提供教师ID");
            }
            adminUserId = userIdValue(claims);
        } else {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "当前账户无权查询教师课表");
        }
        return teacherMapper.findScheduleByTeacherAndSemester(teacherId, semester, adminUserId);
    }

    @Override
    @Transactional
    public void enterScore(Long courseId, EnterScoreRequest request) {
        TeacherContext teacher = getCurrentTeacher();
        verifyScoreEntry(teacher.teacherId(), courseId, request.studentId());
        if (teacherMapper.enterScore(teacher.teacherId(), courseId, request.studentId(), request.score()) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "成绩已录入，请使用修改成绩接口");
        }
    }

    @Override
    @Transactional
    public void updateScore(Long courseId, EnterScoreRequest request) {
        TeacherContext teacher = getCurrentTeacher();
        verifyScoreEntry(teacher.teacherId(), courseId, request.studentId());
        if (teacherMapper.updateScore(teacher.teacherId(), courseId, request.studentId(), request.score()) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "成绩尚未录入或已变更，无法修改");
        }
    }

    @Override
    @Transactional
    public void deleteScore(Long courseId, Long studentId) {
        TeacherContext teacher = getCurrentTeacher();
        verifyScoreEntry(teacher.teacherId(), courseId, studentId);
        if (teacherMapper.deleteScore(teacher.teacherId(), courseId, studentId) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "成绩尚未录入或已变更，无法删除");
        }
    }

    private void verifyScoreEntry(Long teacherId, Long courseId, Long studentId) {
        if (teacherMapper.findCourseForTeacher(courseId, teacherId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "课程不存在或不属于当前教师");
        }
        if (teacherMapper.findActiveSelection(studentId, courseId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "该学生未选修此课程");
        }
    }

    private TeacherContext getCurrentTeacher() {
        Map<?, ?> claims = getClaims();
        Object idValue = claims.get("id");
        if (!(idValue instanceof Number id)) {
            throw new StudentServiceException(HttpStatus.UNAUTHORIZED, "登录信息无效");
        }
        Long userId = id.longValue();
        Map<String, Object> teacher = teacherMapper.findTeacherByUserId(userId);
        if (teacher == null) {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "当前账户不是有效的教师账户");
        }
        return new TeacherContext(userId, numberValue(teacher.get("teacherId")));
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
        if (teacherMapper.verifyTeacherIdentity(userId, name.trim(), idCard.trim()) == null) {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "姓名或身份证号核验失败");
        }
    }

    private long numberValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new IllegalStateException("数据库返回了无效的数字字段");
    }

    private record TeacherContext(Long userId, Long teacherId) {
    }
}
