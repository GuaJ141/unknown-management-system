# 学生接口

所有接口路径均以 `/api/v1` 为前缀，并且需要携带有效的 `Authorization` 登录令牌。

## 目录

- [更新手机号](#更新手机号)
- [修改密码](#修改密码)
- [查询可用课程](#查询可用课程)
- [选课](#选课)
- [查询已选课程](#查询已选课程)
- [查询已选课程的课表](#查询已选课程的课表)
- [按班级和学期查询排课](#按班级和学期查询排课)
- [查询已录入的成绩](#查询已录入的成绩)
- [查询班级和学院信息](#查询班级和学院信息)
- [查询已发布的公告](#查询已发布的公告)

## 更新手机号

`PUT /api/v1/student/phone`

系统会将提交的姓名和身份证号与当前登录学生的记录进行核验。手机号必须为中国大陆手机号，身份证号必须为 18 位。

请求示例：

```json
{
  "name": "张三",
  "idCard": "450902200405212514",
  "phone": "13800000000"
}
```

| 字段 | 约束 |
|---|---|
| `name` | 必填，不能为空，最多 50 个字符 |
| `idCard` | 必填，不能为空，18 位身份证号 |
| `phone` | 必填，不能为空，中国大陆手机号（11 位） |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 修改密码

`PUT /api/v1/student/password`

系统会将提交的姓名和身份证号与当前登录学生的记录进行核验。密码长度必须为 8–64 个字符。

请求示例：

```json
{
  "name": "张三",
  "idCard": "450902200405212514",
  "newPassword": "Abc12345"
}
```

| 字段 | 约束 |
|---|---|
| `name` | 必填，不能为空，最多 50 个字符 |
| `idCard` | 必填，不能为空，18 位身份证号 |
| `newPassword` | 必填，不能为空，8–64 个字符 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 查询可用课程

`GET /api/v1/student/courses/available`

查询本学院开放的课程。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "courseId": 1,
      "courseCode": "JSJWL",
      "courseName": "2009计算机网络",
      "teacherName": "king"
    }
  ]
}
```

`data` 为课程对象数组，每个对象包含课程 ID、课程码、课程名称和授课教师姓名。

## 选课

`POST /api/v1/student/courses/{courseId}/selection`

在选课批次开放期间选择课程。选课成功时，后端会根据课程当前关联的教师，将教师姓名写入 `course_selection.teacher_name`。没有关联有效教师的课程无法选课。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 查询已选课程

`GET /api/v1/student/course-selections`

查询学生已选的课程，返回保存的教师姓名。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "selectionId": 1,
      "courseId": 1,
      "courseCode": "JSJWL",
      "courseName": "2009计算机网络",
      "teacherName": "king",
      "status": 1,
      "score": null,
      "gradePoint": null
    }
  ]
}
```

`data` 为已选课程对象数组。

## 查询已选课程的课表

`GET /api/v1/student/schedule`

查询学生已选课程的课表。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "scheduleId": 18,
      "courseId": 8,
      "courseCode": "WEB101",
      "courseName": "网络课程",
      "classId": 10,
      "teacherId": 5,
      "teacherName": "张老师",
      "semester": "2026-2027-1",
      "weekday": 1,
      "section": 3,
      "startWeek": 1,
      "endWeek": 16,
      "location": "教学楼 A101"
    }
  ]
}
```

`data` 为课表对象数组，包含 `scheduleId`、`courseId`、`courseCode`、`courseName`、`classId`、`teacherId`、`teacherName`、`semester`、`weekday`、`section`、`startWeek`、`endWeek` 和 `location` 字段。

## 按班级和学期查询排课

`GET /api/v1/student/schedule/class?semester=2026-2027-1`

学生请求只需传入 `semester`。服务端从当前登录信息中获取学生身份，并根据该学生所属班级和学期查询课表；学生不能通过请求指定其他班级。未分配班级时返回空数组。学院管理员如需查询本学院指定班级，需额外提供正整数 `classId`。`semester` 必填且最多 20 个字符。

请求示例：

```http
GET /api/v1/student/schedule/class?semester=2026-2027-1
Authorization: <JWT>
```

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "scheduleId": 18,
      "courseId": 8,
      "courseCode": "WEB101",
      "courseName": "网络课程",
      "classId": 10,
      "teacherId": 5,
      "teacherName": "张老师",
      "semester": "2026-2027-1",
      "weekday": 1,
      "section": 3,
      "startWeek": 1,
      "endWeek": 16,
      "location": "教学楼 A101"
    }
  ]
}
```

`data` 为排课对象数组；无匹配记录时返回空数组。该接口返回学生所属班级在指定学期的全部排课记录，不限于 `course_selection` 中的自选课程。学生工作台的“本学期课程”页面根据此接口按课程去重展示应参加课程；详细周课表仍可在“我的课表”查看。

## 查询已录入的成绩

`GET /api/v1/student/scores`

查询学生已选课程中已录入的成绩。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "courseId": 1,
      "courseCode": "JSJWL",
      "courseName": "2009计算机网络",
      "teacherName": "king",
      "score": 85.5,
      "gradePoint": 3.5
    }
  ]
}
```

`data` 为成绩对象数组，未录入成绩的课程 `score` 为 `null`。

## 查询班级和学院信息

`GET /api/v1/student/class`

查询学生所在的班级和学院信息。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": {
    "studentId": 2,
    "studentNo": "2026000002",
    "studentName": "张三",
    "collegeId": 1,
    "collegeName": "应用技术学院",
    "classId": 1,
    "className": "2008会计1班",
    "grade": "2008",
    "enrollmentYear": 2008,
    "graduationYear": 2011,
    "classStatus": 1
  }
}
```

`data` 包含学生和学院信息，以及 `classId`、`className`、`grade`、`enrollmentYear`、`graduationYear` 和 `classStatus`（`1` 表示在校，`0` 表示已毕业）。如果学生尚未分配班级，班级相关字段为 `null`。

## 查询已发布的公告

`GET /api/v1/student/announcements`

查询已发布的学校及学院公告。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "选课通知",
      "content": "本学期选课将于下周开始。",
      "publishTime": "2026-11-07 13:34:42",
      "status": 1
    }
  ]
}
```

`data` 为公告对象数组，仅返回状态为已发布且可见的公告。

访问需要身份认证的接口时，请在 `Authorization` 请求头中携带 JWT：

```http
Authorization: <JWT>
```

凭据无效时返回 HTTP `401`；请求字段无效时返回 HTTP `400`；无权限访问时返回 HTTP `403`。
