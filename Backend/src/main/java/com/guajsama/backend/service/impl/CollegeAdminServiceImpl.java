package com.guajsama.backend.service.impl;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.guajsama.backend.service.StudentServiceException;
import com.guajsama.backend.mapper.CollegeAdminMapper;
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
import com.guajsama.backend.module.dto.StudentRegistrationRequest;
import com.guajsama.backend.module.dto.TeacherRegistrationRequest;
import com.guajsama.backend.service.CollegeAdminService;
import com.guajsama.backend.utils.EncryptUtils;
import com.guajsama.backend.utils.RedisUtil;
import com.guajsama.backend.utils.ThreadLocalUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;

@Service
public class CollegeAdminServiceImpl implements CollegeAdminService {
    private static final String DEFAULT_PASSWORD = "123456";
    private static final int STUDENT_ROLE = 1;
    private static final int TEACHER_ROLE = 2;
    private static final String SELECTION_BATCH_PREFIX = "course_selection_batch:";

    private final CollegeAdminMapper collegeAdminMapper;
    private final RedisUtil redisUtil;

    public CollegeAdminServiceImpl(CollegeAdminMapper collegeAdminMapper, RedisUtil redisUtil) {
        this.collegeAdminMapper = collegeAdminMapper;
        this.redisUtil = redisUtil;
    }

    @Override
    @Transactional
    public List<String> registerTeachers(BatchTeacherRegistrationRequest request) {
        //getCurrentAdmin()返回用户id和学院id
        AdminContext admin = getCurrentAdmin();
        //获取年份
        int year = LocalDate.now(ZoneId.of("Asia/Shanghai")).getYear();
        initializeAccountNumberSequence(year);
        List<String> teacherNumbers = new ArrayList<>(request.teachers().size());
        try {
            for (TeacherRegistrationRequest teacher : request.teachers()) {
                String teacherNo = nextAccountNumber(year);
                if (collegeAdminMapper.insertAccount(teacherNo, teacher.phone().trim(),
                        EncryptUtils.getMd5String(DEFAULT_PASSWORD), admin.collegeId(), TEACHER_ROLE) != 1) {
                    throw new IllegalStateException("教师账户创建失败");
                }

                Long userId = collegeAdminMapper.findAccountIdByLoginNo(teacherNo);
                if (userId == null || collegeAdminMapper.insertTeacher(userId, teacherNo,
                        teacher.name().trim(), teacher.idCard().trim(), admin.collegeId()) != 1) {
                    throw new IllegalStateException("教师账户创建失败");
                }
                teacherNumbers.add(teacherNo);
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "手机号或身份证号已被使用");
        }
        return teacherNumbers;
    }

    @Override
    @Transactional
    public List<String> registerStudents(BatchStudentRegistrationRequest request) {
        AdminContext admin = getCurrentAdmin();
        int year = LocalDate.now(ZoneId.of("Asia/Shanghai")).getYear();
        initializeAccountNumberSequence(year);
        List<String> studentNumbers = new ArrayList<>(request.students().size());
        try {
            for (StudentRegistrationRequest student : request.students()) {
                if (student.graduationYear() != student.enrollmentYear() + student.studyDuration()) {
                    throw new StudentServiceException(HttpStatus.BAD_REQUEST,
                            "毕业年份必须等于入学年份加学制");
                }
                String studentNo = nextAccountNumber(year);
                if (collegeAdminMapper.insertAccount(studentNo, student.phone().trim(),
                        EncryptUtils.getMd5String(DEFAULT_PASSWORD), admin.collegeId(), STUDENT_ROLE) != 1) {
                    throw new IllegalStateException("学生账户创建失败");
                }
                Long userId = collegeAdminMapper.findAccountIdByLoginNo(studentNo);
                if (userId == null || collegeAdminMapper.insertStudent(userId, studentNo,
                        student.name().trim(), student.idCard().trim(), admin.collegeId(),
                        student.gender(), student.birth(), student.enrollmentYear(),
                        student.graduationYear(), student.studyDuration()) != 1) {
                    throw new IllegalStateException("学生账户创建失败");
                }
                studentNumbers.add(studentNo);
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "手机号或身份证号已被使用");
        }
        return studentNumbers;
    }

    //生成唯一id（年份+六位流水）
    private void initializeAccountNumberSequence(int year) {
        int currentMaximum = collegeAdminMapper.findMaxAccountNumberSuffix(year);
        collegeAdminMapper.initializeAccountNumberSequence(year, currentMaximum);
    }

    private String nextAccountNumber(int year) {
        Integer currentValue = collegeAdminMapper.findAccountNumberSequenceValueForUpdate(year);
        if (currentValue == null) {
            throw new IllegalStateException("账号编号序列不存在");
        }
        if (currentValue >= 999_999) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "本年度账号编号已用尽");
        }

        int nextValue = currentValue + 1;
        if (collegeAdminMapper.updateAccountNumberSequence(year, nextValue) != 1) {
            throw new IllegalStateException("账号编号序列更新失败");
        }
        return String.format(Locale.ROOT, "%04d%06d", year, nextValue);
    }

    @Override
    @Transactional
    public void assignStudentsToClass(BatchAssignStudentClassRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.findClassInCollege(request.classId(), collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "班级不存在、不属于当前学院或已毕业");
        }

        Set<Long> uniqueStudentIds = new HashSet<>(request.studentIds());
        if (uniqueStudentIds.size() != request.studentIds().size()) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "学生ID不能重复");
        }
        for (Long studentId : request.studentIds()) {
            if (collegeAdminMapper.findStudentInCollege(studentId, collegeId) == null) {
                throw new StudentServiceException(HttpStatus.NOT_FOUND,
                        "学生不存在、不属于当前学院或已分配班级");
            }
        }
        for (Long studentId : request.studentIds()) {
            if (collegeAdminMapper.assignStudentClass(studentId, request.classId(), collegeId) != 1) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "学生班级信息已变更，请重试");
            }
            if (collegeAdminMapper.incrementClassStudentCount(request.classId(), collegeId) != 1) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "班级状态已变更，请重试");
            }
        }
    }

    @Override
    public List<Map<String, Object>> getStudentsWithoutClass() {
        return collegeAdminMapper.findStudentsWithoutClass(getCurrentAdmin().collegeId());
    }

    @Override
    public PageInfo<Map<String, Object>> getStudents(int pageNum, int pageSize) {
        Long collegeId = getCurrentAdmin().collegeId();
        PageHelper.startPage(pageNum, pageSize);
        return new PageInfo<>(collegeAdminMapper.findStudentsByCollege(collegeId));
    }

    @Override
    public PageInfo<Map<String, Object>> getTeachers(int pageNum, int pageSize) {
        Long collegeId = getCurrentAdmin().collegeId();
        PageHelper.startPage(pageNum, pageSize);
        return new PageInfo<>(collegeAdminMapper.findTeachersByCollege(collegeId));
    }

    @Override
    @Transactional
    public void updateStudent(Long studentId, UpdateStudentRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (request.graduationYear() != request.enrollmentYear() + request.studyDuration()) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "毕业年份必须等于入学年份加学制");
        }
        if (collegeAdminMapper.findStudentAccountInCollege(studentId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "学生不存在或不属于当前学院");
        }
        try {
            int updated = collegeAdminMapper.updateStudent(studentId, collegeId, request.name().trim(),
                    request.phone().trim(), request.gender(), request.birth(),
                    request.enrollmentYear(), request.graduationYear(), request.studyDuration());
            if (updated == 0
                    && collegeAdminMapper.findStudentAccountInCollege(studentId, collegeId) == null) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "学生账户状态已变更，请重试");
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "手机号已被其他账户使用");
        }
    }

    @Override
    @Transactional
    public void deactivateStudent(Long studentId) {
        Long collegeId = getCurrentAdmin().collegeId();
        Map<String, Object> student = collegeAdminMapper.findStudentAccountInCollege(studentId, collegeId);
        if (student == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "学生不存在或不属于当前学院");
        }
        if (collegeAdminMapper.deactivateStudent(studentId, collegeId) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "学生账户状态已变更，请重试");
        }
        Object classIdValue = student.get("classId");
        if (classIdValue instanceof Number classId
                && collegeAdminMapper.decrementClassStudentCount(classId.longValue(), collegeId) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "班级信息已变更，请重试");
        }
    }

    @Override
    @Transactional
    public void updateTeacher(Long teacherId, UpdateTeacherRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.findTeacherInCollege(teacherId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "教师不存在或不属于当前学院");
        }
        try {
            int updated = collegeAdminMapper.updateTeacher(teacherId, collegeId,
                    request.name().trim(), request.phone().trim());
            if (updated == 0 && collegeAdminMapper.findTeacherInCollege(teacherId, collegeId) == null) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "教师账户状态已变更，请重试");
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "手机号已被其他账户使用");
        }
    }

    @Override
    public void deactivateTeacher(Long teacherId) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.deactivateTeacher(teacherId, collegeId) != 1) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "教师不存在或不属于当前学院");
        }
    }

    @Override
    public void createClass(CreateClassRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (request.graduationYear() <= request.enrollmentYear()) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "毕业年份必须晚于入学年份");
        }
        if (collegeAdminMapper.insertClass(request.className().trim(), collegeId, request.grade().trim(),
                request.enrollmentYear(), request.graduationYear(), request.status()) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "班级创建失败");
        }
    }

    @Override
    public void updateClass(Long classId, UpdateClassRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (request.graduationYear() <= request.enrollmentYear()) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "毕业年份必须晚于入学年份");
        }
        if (collegeAdminMapper.findClassForUpdate(classId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "班级不存在或不属于当前学院");
        }
        int updated = collegeAdminMapper.updateClass(classId, collegeId, request.className().trim(),
                request.grade().trim(), request.enrollmentYear(), request.graduationYear(), request.status());
        if (updated == 0 && collegeAdminMapper.findClassForUpdate(classId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "班级不存在或不属于当前学院");
        }
    }

    @Override
    public void createAnnouncement(CreateAnnouncementRequest request) {
        AdminContext admin = getCurrentAdmin();
        if (collegeAdminMapper.insertAnnouncement(request.title().trim(), request.content().trim(),
                admin.userId(), admin.collegeId(), request.status()) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "公告创建失败");
        }
    }

    @Override
    public void updateAnnouncement(Long announcementId, CreateAnnouncementRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.findAnnouncementInCollege(announcementId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "公告不存在或不属于当前学院");
        }
        int updated = collegeAdminMapper.updateAnnouncement(announcementId, collegeId,
                request.title().trim(), request.content().trim(), request.status());
        if (updated == 0 && collegeAdminMapper.findAnnouncementInCollege(announcementId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "公告不存在或不属于当前学院");
        }
    }

    @Override
    public void deleteAnnouncement(Long announcementId) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.deleteAnnouncement(announcementId, collegeId) != 1) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "公告不存在或不属于当前学院");
        }
    }

    @Override
    public List<Map<String, Object>> getClasses() {
        return collegeAdminMapper.findClassesByCollege(getCurrentAdmin().collegeId());
    }

    @Override
    public List<Map<String, Object>> getClassSchedule(Long classId, String semester) {
        Long collegeId = getCurrentAdmin().collegeId();
        return collegeAdminMapper.findClassSchedule(classId, semester, collegeId);
    }

    @Override
    public void createCourseSchedule(CreateCourseScheduleRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (request.endWeek() < request.startWeek()) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "结束周必须大于或等于起始周");
        }
        if (collegeAdminMapper.findCourseInCollege(request.courseId(), collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "课程不存在或不属于当前学院");
        }
        if (collegeAdminMapper.findClassForUpdate(request.classId(), collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "班级不存在或不属于当前学院");
        }
        if (collegeAdminMapper.findTeacherInCollege(request.teacherId(), collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "教师不存在或不属于当前学院");
        }
        if (collegeAdminMapper.insertCourseSchedule(request.courseId(), request.classId(), request.teacherId(),
                request.semester().trim(), request.weekday(), request.section(), request.startWeek(),
                request.endWeek(), request.location().trim(), collegeId) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "课程安排创建失败");
        }
    }

    @Override
    public void updateCourseSchedule(Long scheduleId, UpdateCourseScheduleRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (request.endWeek() < request.startWeek()) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "结束周必须大于或等于起始周");
        }
        if (collegeAdminMapper.findCourseScheduleInCollege(scheduleId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "排课不存在或不属于当前学院");
        }
        if (collegeAdminMapper.findCourseInCollege(request.courseId(), collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "课程不存在或不属于当前学院");
        }
        if (collegeAdminMapper.findClassForUpdate(request.classId(), collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "班级不存在或不属于当前学院");
        }
        int updated = collegeAdminMapper.updateCourseSchedule(scheduleId, collegeId, request.courseId(),
                request.classId(), request.weekday(), request.section(), request.startWeek(),
                request.endWeek(), request.location().trim());
        if (updated == 0 && collegeAdminMapper.findCourseScheduleInCollege(scheduleId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "排课不存在或不属于当前学院");
        }
    }

    @Override
    public void deleteCourseSchedule(Long scheduleId) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.deleteCourseSchedule(scheduleId, collegeId) != 1) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "排课不存在或不属于当前学院");
        }
    }

    @Override
    public List<Map<String, Object>> getCourses() {
        return collegeAdminMapper.findCourses(getCurrentAdmin().collegeId());
    }

    @Override
    public void createCourse(CourseRequest request) {
        AdminContext admin = getCurrentAdmin();
        verifyTeacher(request.teacherId(), admin.collegeId());
        try {
            collegeAdminMapper.insertCourse(request.courseCode().trim(), request.name().trim(),
                    request.credit(), request.hours(), request.assessType().trim(), admin.collegeId(),
                    request.teacherId(), request.courseType(), request.status());
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "课程码已被使用");
        }
    }

    @Override
    public void updateCourse(Long courseId, CourseRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.findCourseInCollege(courseId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "课程不存在或不属于当前学院");
        }
        verifyTeacher(request.teacherId(), collegeId);
        try {
            if (collegeAdminMapper.updateCourse(courseId, collegeId, request.courseCode().trim(),
                    request.name().trim(), request.credit(), request.hours(), request.assessType().trim(),
                    request.teacherId(), request.courseType(), request.status()) != 1) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "课程信息已变更，请重试");
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "课程码已被使用");
        }
    }

    @Override
    public void deleteCourse(Long courseId) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.findCourseInCollege(courseId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "课程不存在或不属于当前学院");
        }
        try {
            if (collegeAdminMapper.deleteCourse(courseId, collegeId) != 1) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "课程信息已变更，请重试");
            }
        } catch (DataIntegrityViolationException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "课程已有选课记录，无法删除");
        }
    }

    @Override
    public List<Map<String, Object>> getSelectionBatches() {
        return collegeAdminMapper.findSelectionBatches(getCurrentAdmin().collegeId());
    }

    @Override
    @Transactional
    public void createSelectionBatch(CourseSelectionBatchRequest request) {
        AdminContext admin = getCurrentAdmin();
        validateBatchTimes(request);
        if (collegeAdminMapper.insertSelectionBatch(request.batchName().trim(), admin.collegeId(),
                request.startTime(), request.endTime(), request.status(), admin.userId()) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "选课批次创建失败");
        }
        Long batchId = collegeAdminMapper.findLastInsertedSelectionBatchId();
        if (batchId == null) {
            throw new IllegalStateException("无法获取新建选课批次ID");
        }
        syncSelectionBatchExpiration(batchId, request.endTime(), request.status());
    }

    @Override
    @Transactional
    public void updateSelectionBatch(Long batchId, CourseSelectionBatchRequest request) {
        Long collegeId = getCurrentAdmin().collegeId();
        validateBatchTimes(request);
        if (collegeAdminMapper.findSelectionBatchInCollege(batchId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "选课批次不存在或不属于当前学院");
        }
        collegeAdminMapper.updateSelectionBatch(batchId, collegeId, request.batchName().trim(),
                request.startTime(), request.endTime(), request.status());
        if (collegeAdminMapper.findSelectionBatchInCollege(batchId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "选课批次信息已变更，请重试");
        }
        syncSelectionBatchExpiration(batchId, request.endTime(), request.status());
    }

    @Override
    @Transactional
    public void deleteSelectionBatch(Long batchId) {
        Long collegeId = getCurrentAdmin().collegeId();
        if (collegeAdminMapper.deleteSelectionBatch(batchId, collegeId) != 1) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "选课批次不存在或不属于当前学院");
        }
        redisUtil.delete(SELECTION_BATCH_PREFIX + batchId);
    }

    private void syncSelectionBatchExpiration(Long batchId, LocalDateTime endTime, Integer status) {
        String redisKey = SELECTION_BATCH_PREFIX + batchId;
        if (status != 1) {
            redisUtil.delete(redisKey);
            return;
        }
        long ttlMillis = Duration.between(
                LocalDateTime.now(ZoneId.of("Asia/Shanghai")), endTime).toMillis();
        if (ttlMillis <= 0) {
            collegeAdminMapper.setSelectionBatchToStatusZero(batchId);
            redisUtil.delete(redisKey);
            return;
        }
        redisUtil.setString(redisKey, batchId.toString(), ttlMillis);
    }

    @Override
    public List<Map<String, Object>> getSemesters() {
        getCurrentAdmin();
        return collegeAdminMapper.findSemesters();
    }

    @Override
    @Transactional
    public void createSemester(SemesterRequest request) {
        getCurrentAdmin();
        String semester = request.semester().trim();
        if (collegeAdminMapper.findSemesterIdByName(semester) != null) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "该学期已存在");
        }
        try {
            if (collegeAdminMapper.insertSemester(semester) != 1) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "学期创建失败");
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "该学期已存在");
        }
    }

    @Override
    @Transactional
    public void updateSemester(Long semesterId, SemesterRequest request) {
        getCurrentAdmin();
        String oldSemester = collegeAdminMapper.findSemesterName(semesterId);
        if (oldSemester == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "学期不存在");
        }
        String newSemester = request.semester().trim();
        Long existingId = collegeAdminMapper.findSemesterIdByName(newSemester);
        if (existingId != null && !existingId.equals(semesterId)) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "该学期已存在");
        }
        if (oldSemester.equals(newSemester)) {
            return;
        }
        try {
            if (collegeAdminMapper.updateSemester(semesterId, newSemester) != 1) {
                throw new StudentServiceException(HttpStatus.CONFLICT, "学期信息已变更，请重试");
            }
        } catch (DuplicateKeyException exception) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "该学期已存在");
        }
        collegeAdminMapper.renameScheduledSemester(oldSemester, newSemester);
    }

    @Override
    @Transactional
    public void deleteSemester(Long semesterId) {
        getCurrentAdmin();
        String semester = collegeAdminMapper.findSemesterName(semesterId);
        if (semester == null) {
            throw new StudentServiceException(HttpStatus.NOT_FOUND, "学期不存在");
        }
        if (collegeAdminMapper.countSchedulesBySemester(semester) > 0) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "该学期已有排课，无法删除");
        }
        if (collegeAdminMapper.deleteSemester(semesterId) != 1) {
            throw new StudentServiceException(HttpStatus.CONFLICT, "学期信息已变更，请重试");
        }
    }

    private void verifyTeacher(Long teacherId, Long collegeId) {
        if (collegeAdminMapper.findTeacherInCollege(teacherId, collegeId) == null) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "课程教师不存在或不属于当前学院");
        }
    }

    private void validateBatchTimes(CourseSelectionBatchRequest request) {
        if (!request.startTime().isBefore(request.endTime())) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "选课开始时间必须早于结束时间");
        }
        if (request.status() < 0 || request.status() > 2) {
            throw new StudentServiceException(HttpStatus.BAD_REQUEST, "选课批次状态不合法");
        }
    }

    private AdminContext getCurrentAdmin() {
        Map<String, Object> claimsObject = ThreadLocalUtils.get();
        if (!(claimsObject.get("id") instanceof Number id)) {
            throw new StudentServiceException(HttpStatus.UNAUTHORIZED, "登录信息无效");
        }
        Long userId = id.longValue();

        Map<String, Object> admin = collegeAdminMapper.findAdminByUserId(userId);
        if (admin == null) {
            throw new StudentServiceException(HttpStatus.FORBIDDEN, "当前账户不是有效的学院管理员");
        }
        return new AdminContext(userId, numberValue(admin.get("collegeId")));
    }

    private long numberValue(Object value) {
        //判断是不是这个类型
        if (value instanceof Number number) {
            //是就number = value并且强转为long
            return number.longValue();
        }
        throw new IllegalStateException("数据库返回了无效的数字字段");
    }

    private record AdminContext(Long userId, Long collegeId) {
    }
}
