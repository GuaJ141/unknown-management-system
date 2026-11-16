/*
 Navicat Premium Dump SQL

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80043 (8.0.43)
 Source Host           : localhost:3306
 Source Schema         : se_project

 Target Server Type    : MySQL
 Target Server Version : 80043 (8.0.43)
 File Encoding         : 65001

 Date: 16/11/2026 15:20:08
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for account_number_sequence
-- ----------------------------
DROP TABLE IF EXISTS `account_number_sequence`;
CREATE TABLE `account_number_sequence`  (
  `generation_year` smallint NOT NULL COMMENT '编号年份',
  `last_value` int NOT NULL DEFAULT 0 COMMENT '该年份已分配的最大六位序号',
  PRIMARY KEY (`generation_year`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '账号编号序列表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of account_number_sequence
-- ----------------------------
INSERT INTO `account_number_sequence` VALUES (2026, 3);

-- ----------------------------
-- Table structure for announcement
-- ----------------------------
DROP TABLE IF EXISTS `announcement`;
CREATE TABLE `announcement`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '内容',
  `publisher_user_id` bigint NOT NULL COMMENT '发布人账户ID',
  `college_id` bigint NULL DEFAULT NULL COMMENT 'NULL=全校,否则限定学院',
  `publish_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '0草稿 1已发布',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_ann_college`(`college_id` ASC) USING BTREE,
  INDEX `fk_ann_publisher`(`publisher_user_id` ASC) USING BTREE,
  CONSTRAINT `fk_ann_college` FOREIGN KEY (`college_id`) REFERENCES `college` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_ann_publisher` FOREIGN KEY (`publisher_user_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '公告表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of announcement
-- ----------------------------
INSERT INTO `announcement` VALUES (1, '百人服务器开始测试', 'ZE14F\n因为大部分实体都需要修改 还有很多问题\n可在论坛或者群聊向管理员反馈BUG', 1, 1, '2026-11-07 13:34:42', 1, '2026-11-07 13:34:42', '2026-11-07 13:34:42');

-- ----------------------------
-- Table structure for class
-- ----------------------------
DROP TABLE IF EXISTS `class`;
CREATE TABLE `class`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '班级ID',
  `class_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '班级名称',
  `college_id` bigint NOT NULL COMMENT '所属学院',
  `grade` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '年级',
  `student_count` int NOT NULL COMMENT '班级人数',
  `enrollment_year` year NOT NULL COMMENT '入学年份',
  `graduation_year` year NOT NULL COMMENT '毕业年份',
  `status` int NOT NULL COMMENT '1为在校，0为已毕业',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_class_college`(`college_id` ASC) USING BTREE,
  CONSTRAINT `fk_class_college` FOREIGN KEY (`college_id`) REFERENCES `college` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '班级表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of class
-- ----------------------------
INSERT INTO `class` VALUES (1, '2008会计1班', 1, '2008', 2, 2008, 2011, 1, '2026-11-06 16:47:33', '2026-11-07 13:31:59');
INSERT INTO `class` VALUES (2, '2008会计2班', 1, '2008', 0, 2008, 2011, 1, '2026-11-07 13:14:40', '2026-11-07 13:32:46');

-- ----------------------------
-- Table structure for college
-- ----------------------------
DROP TABLE IF EXISTS `college`;
CREATE TABLE `college`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学院ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学院名称',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_college_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学院表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of college
-- ----------------------------
INSERT INTO `college` VALUES (1, '应用技术学院', '2026-11-05 17:51:55', '2026-11-05 17:51:55');

-- ----------------------------
-- Table structure for course
-- ----------------------------
DROP TABLE IF EXISTS `course`;
CREATE TABLE `course`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  `course_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '课程码',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '课程名称',
  `credit` decimal(3, 1) NOT NULL COMMENT '学分',
  `hours` int NOT NULL COMMENT '学时',
  `assess_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '考核方式:考试/考查/网课线上考试等',
  `open_college_id` bigint NOT NULL COMMENT '开课单位',
  `teacher_id` bigint NULL DEFAULT NULL COMMENT '课程对应老师',
  `course_type` tinyint NOT NULL DEFAULT 1 COMMENT '1专业课 2选修课 3网课',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '0未发布 1可选 2停开',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_course_code`(`course_code` ASC) USING BTREE,
  INDEX `idx_course_teacher`(`teacher_id` ASC) USING BTREE,
  INDEX `idx_course_college`(`open_college_id` ASC) USING BTREE,
  CONSTRAINT `fk_course_college` FOREIGN KEY (`open_college_id`) REFERENCES `college` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_course_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '课程表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of course
-- ----------------------------
INSERT INTO `course` VALUES (1, 'JSJWL', '2009计算机网络', 2.0, 48, '笔试', 1, 1, 1, 1, '2026-11-07 00:28:48', '2026-11-07 13:13:39');
INSERT INTO `course` VALUES (2, 'YYJS', '音乐鉴赏', 1.0, 10, '线上考试', 1, 1, 3, 1, '2026-11-07 23:03:56', '2026-11-07 23:03:56');

-- ----------------------------
-- Table structure for course_schedule
-- ----------------------------
DROP TABLE IF EXISTS `course_schedule`;
CREATE TABLE `course_schedule`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `class_id` bigint NOT NULL COMMENT '班级ID',
  `teacher_id` bigint NOT NULL COMMENT '授课教师(若需细分到排课)',
  `semester` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学期，如2026-2027-1',
  `weekday` tinyint NOT NULL COMMENT '星期几',
  `section` tinyint NOT NULL COMMENT '第几节课（一共有1-12节课）',
  `start_week` tinyint NOT NULL COMMENT '起始周',
  `end_week` tinyint NOT NULL COMMENT '结束周',
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '上课地点',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_schedule_course`(`course_id` ASC) USING BTREE,
  INDEX `idx_schedule_semester`(`semester` ASC) USING BTREE,
  INDEX `idx_schedule_time`(`weekday` ASC, `section` ASC) USING BTREE,
  INDEX `fk_class_id`(`class_id` ASC) USING BTREE,
  INDEX `fk_teacher_id`(`teacher_id` ASC) USING BTREE,
  CONSTRAINT `fk_class_id` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_schedule_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_teacher_id` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of course_schedule
-- ----------------------------
INSERT INTO `course_schedule` VALUES (1, 1, 1, 1, '2008-2009-1', 1, 2, 6, 11, 'B2教学楼', '2026-11-07 17:00:25', '2026-11-08 14:08:33');
INSERT INTO `course_schedule` VALUES (2, 1, 1, 1, '2008-2009-1', 1, 3, 1, 16, 'B1教学楼', '2026-11-07 20:58:57', '2026-11-08 14:08:33');
INSERT INTO `course_schedule` VALUES (3, 1, 1, 1, '2008-2009-1', 7, 12, 1, 16, 'B2教学楼', '2026-11-07 21:13:50', '2026-11-08 14:08:33');
INSERT INTO `course_schedule` VALUES (4, 1, 1, 1, '2008-2009-1', 6, 11, 1, 16, 'B2教学楼', '2026-11-07 21:14:07', '2026-11-08 14:08:33');
INSERT INTO `course_schedule` VALUES (5, 1, 1, 1, '2008-2009-1', 5, 10, 1, 16, 'B2教学楼', '2026-11-07 21:14:10', '2026-11-08 14:08:33');
INSERT INTO `course_schedule` VALUES (6, 1, 1, 1, '2008-2009-1', 4, 9, 1, 16, 'B2教学楼', '2026-11-07 21:14:12', '2026-11-08 14:08:33');
INSERT INTO `course_schedule` VALUES (7, 1, 1, 1, '2008-2009-1', 3, 8, 1, 16, 'B2教学楼', '2026-11-07 21:14:14', '2026-11-08 14:08:33');
INSERT INTO `course_schedule` VALUES (8, 1, 1, 1, '2008-2009-1', 2, 7, 1, 16, 'B2教学楼', '2026-11-07 21:14:17', '2026-11-08 14:08:33');

-- ----------------------------
-- Table structure for course_selection
-- ----------------------------
DROP TABLE IF EXISTS `course_selection`;
CREATE TABLE `course_selection`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '选课ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `select_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '选课时间',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1已选 2已退',
  `score` decimal(5, 1) NULL DEFAULT NULL COMMENT '成绩, NULL=未录入',
  `grade_point` decimal(3, 2) NULL DEFAULT NULL COMMENT '绩点',
  `teacher_name` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '授课老师名字',
  `score_teacher_id` bigint NULL DEFAULT NULL COMMENT '成绩录入教师',
  `score_updated_at` datetime NULL DEFAULT NULL COMMENT '成绩录入/修改时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_selection_stu_course`(`student_id` ASC, `course_id` ASC) USING BTREE,
  INDEX `idx_selection_course`(`course_id` ASC) USING BTREE,
  INDEX `fk_selection_score_teacher`(`score_teacher_id` ASC) USING BTREE,
  CONSTRAINT `fk_selection_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_selection_score_teacher` FOREIGN KEY (`score_teacher_id`) REFERENCES `teacher` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_selection_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '选课及成绩表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of course_selection
-- ----------------------------
INSERT INTO `course_selection` VALUES (1, 2, 1, '2026-11-07 11:01:29', 1, NULL, NULL, 'king', NULL, NULL, '2026-11-07 11:01:29', '2026-11-08 12:48:43');
INSERT INTO `course_selection` VALUES (2, 2, 2, '2026-11-07 23:05:41', 1, 70.0, NULL, 'king', 1, '2026-11-08 14:20:50', '2026-11-07 23:05:41', '2026-11-08 14:20:50');

-- ----------------------------
-- Table structure for course_selection_batch
-- ----------------------------
DROP TABLE IF EXISTS `course_selection_batch`;
CREATE TABLE `course_selection_batch`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '批次ID',
  `batch_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '批次名称',
  `college_id` bigint NULL DEFAULT NULL COMMENT '适用学院,NULL=全校',
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NOT NULL COMMENT '结束时间',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '0未开始 1进行中 2已结束',
  `created_by` bigint NOT NULL COMMENT '创建人账户ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_batch_college`(`college_id` ASC) USING BTREE,
  INDEX `fk_batch_creator`(`created_by` ASC) USING BTREE,
  CONSTRAINT `fk_batch_college` FOREIGN KEY (`college_id`) REFERENCES `college` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_batch_creator` FOREIGN KEY (`created_by`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '选课批次表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of course_selection_batch
-- ----------------------------
INSERT INTO `course_selection_batch` VALUES (4, '114541test', 1, '2026-11-08 15:39:00', '2026-11-08 15:42:00', 0, 1, '2026-11-08 15:40:03', '2026-11-08 15:42:00');

-- ----------------------------
-- Table structure for semester
-- ----------------------------
DROP TABLE IF EXISTS `semester`;
CREATE TABLE `semester`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `semester` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学期',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_semester_name`(`semester` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学期展示表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of semester
-- ----------------------------
INSERT INTO `semester` VALUES (1, '2008-2009-1');
INSERT INTO `semester` VALUES (2, '2008-2009-2');

-- ----------------------------
-- Table structure for student
-- ----------------------------
DROP TABLE IF EXISTS `student`;
CREATE TABLE `student`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生ID',
  `user_id` bigint NOT NULL COMMENT '账户ID',
  `student_no` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学号',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '姓名',
  `id_card` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '身份证号(身份核验用)',
  `college_id` bigint NOT NULL COMMENT '所属学院',
  `class_id` bigint NULL DEFAULT NULL COMMENT '所在班级,可空',
  `gender` tinyint NULL DEFAULT NULL COMMENT '0女 1男',
  `birth` date NULL DEFAULT NULL COMMENT '出生日期',
  `enrollment_year` year NOT NULL COMMENT '入学年份',
  `graduation_year` year NOT NULL COMMENT '毕业年份',
  `study_duration` int NOT NULL COMMENT '学制',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_student_no`(`student_no` ASC) USING BTREE,
  UNIQUE INDEX `uk_student_id_card`(`id_card` ASC) USING BTREE,
  UNIQUE INDEX `uk_student_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_student_college`(`college_id` ASC) USING BTREE,
  INDEX `idx_student_class`(`class_id` ASC) USING BTREE,
  CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_student_college` FOREIGN KEY (`college_id`) REFERENCES `college` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学生表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of student
-- ----------------------------
INSERT INTO `student` VALUES (2, 7, '2026000002', 'omakase', '450902200405212514', 1, 1, 1, '1970-05-21', 2008, 2011, 3, '2026-11-05 23:44:41', '2026-11-07 13:33:46');
INSERT INTO `student` VALUES (3, 9, '2026000003', '啊米诺斯', '450902200405212589', 1, 1, 1, '2010-06-09', 2008, 2011, 3, '2026-11-06 00:41:48', '2026-11-07 13:33:54');

-- ----------------------------
-- Table structure for teacher
-- ----------------------------
DROP TABLE IF EXISTS `teacher`;
CREATE TABLE `teacher`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '教师ID',
  `user_id` bigint NOT NULL COMMENT '账户ID',
  `teacher_no` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '教师号',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '姓名',
  `id_card` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '身份证号(身份核验用)',
  `college_id` bigint NOT NULL COMMENT '所属学院',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_teacher_no`(`teacher_no` ASC) USING BTREE,
  UNIQUE INDEX `uk_teacher_id_card`(`id_card` ASC) USING BTREE,
  UNIQUE INDEX `uk_teacher_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_teacher_college`(`college_id` ASC) USING BTREE,
  CONSTRAINT `fk_teacher_college` FOREIGN KEY (`college_id`) REFERENCES `college` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_teacher_user` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '教师表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of teacher
-- ----------------------------
INSERT INTO `teacher` VALUES (1, 6, '2026000001', 'king', '450902245123123123', 1, '2026-11-05 23:43:23', '2026-11-05 23:43:23');

-- ----------------------------
-- Table structure for user_account
-- ----------------------------
DROP TABLE IF EXISTS `user_account`;
CREATE TABLE `user_account`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '账户ID',
  `login_no` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录号:学号/教师号/管理员号',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '手机号,登录账号之一',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码哈希',
  `college_id` bigint NOT NULL COMMENT '学院id',
  `role` tinyint NOT NULL COMMENT '1学生 2教师 3学院管理员',
  `must_change_password` tinyint NOT NULL DEFAULT 1 COMMENT '1=首次登录需改密',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '0禁用 1正常',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_login_no`(`login_no` ASC) USING BTREE,
  UNIQUE INDEX `uk_phone`(`phone` ASC) USING BTREE,
  INDEX `idx_role`(`role` ASC) USING BTREE,
  INDEX `学院id`(`college_id` ASC) USING BTREE,
  CONSTRAINT `学院id` FOREIGN KEY (`college_id`) REFERENCES `college` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '统一账户表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user_account
-- ----------------------------
INSERT INTO `user_account` VALUES (1, '202513143500593', '18587734759', 'M6bDW60BO0EktFe0X+3Zgw==:uAlSARzB+jnw4d+jtSky5weheyLlvCa2fXHZyF3e21c=', 1, 3, 1, 1, '2026-11-05 23:24:54', '2026-11-05 23:24:57');
INSERT INTO `user_account` VALUES (6, '2026000001', '19177181145', 'Uoi28d78hs63dOyQtfx4lA==:WBMU8AUamJdN8V8VGljmZ0o60ueSb1dNadYAgJBOds8=', 1, 2, 0, 1, '2026-11-05 23:43:23', '2026-11-07 23:48:20');
INSERT INTO `user_account` VALUES (7, '2026000002', '19167981154', 'XcJlpu3ACRjs+tRJ2OCPCw==:2uMMUeMKwFODQZNqWULLRad0gU105DSNjROBny3pB8g=', 1, 1, 0, 1, '2026-11-05 23:44:41', '2026-11-07 00:03:09');
INSERT INTO `user_account` VALUES (9, '2026000003', '19011451145', 'OOemDXGvaYI12ZwSJqlOmw==:uPc6JUfTJsO8C7oiVgCDMV7lX4y7xuPuzaO1F6vZ5xk=', 1, 1, 0, 1, '2026-11-06 00:41:48', '2026-11-07 21:52:24');

SET FOREIGN_KEY_CHECKS = 1;
