# 教师接口

所有接口路径均以 `/api/v1` 为前缀，并且需要携带有效的 `Authorization` 登录令牌。除特别说明外，接口仅供状态正常的教师账户调用；“按教师和学期查询排课”及“按班级课程和教师查询学生成绩”也允许学院管理员查询本学院数据。

## 目录

- [更新手机号](#更新手机号)
- [修改密码](#修改密码)
- [查询所授课程的已选学生](#查询所授课程的已选学生)
- [查询当前教师所授课程](#查询当前教师所授课程)
- [按班级课程和教师查询学生成绩](#按班级课程和教师查询学生成绩)
- [查询当前教师的课表](#查询当前教师的课表)
- [按教师和学期查询排课](#按教师和学期查询排课)
- [录入学生成绩](#录入学生成绩)
- [修改学生成绩](#修改学生成绩)
- [删除学生成绩](#删除学生成绩)

## 更新手机号

`PUT /api/v1/teacher/phone`

系统会将提交的姓名和身份证号与当前登录教师的记录进行核验。手机号必须为中国大陆手机号，身份证号必须为 18 位。

请求示例：

```json
{
  "name": "张老师",
  "idCard": "450902245123123123",
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

`PUT /api/v1/teacher/password`

系统会将提交的姓名和身份证号与当前登录教师的记录进行核验。密码长度必须为 8–64 个字符。

请求示例：

```json
{
  "name": "张老师",
  "idCard": "450902245123123123",
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

## 查询所授课程的已选学生

`GET /api/v1/teacher/classes/students?courseId=8`

查询当前教师指定课程中已选课的学生名单（去重），并返回班级信息。`courseId` 为必填正整数；教师只能查询本人所授课程。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "studentId": 2,
      "studentNo": "2026000002",
      "studentName": "张三",
      "classId": 1,
      "className": "2008会计1班",
      "grade": "2008",
      "enrollmentYear": 2008,
      "graduationYear": 2011,
      "classStatus": 1
    }
  ]
}
```

`data` 为学生对象数组。班级信息包含 `classId`、`className`、`grade`、`enrollmentYear`、`graduationYear` 和 `classStatus`（`1` 表示在校，`0` 表示已毕业）。如果学生尚未分配班级，班级相关字段为 `null`。

课程不属于当前教师或不存在时返回 `404`。

## 查询当前教师所授课程

`GET /api/v1/teacher/courses`

查询当前登录教师所授课程。教师身份由登录令牌解析，不需要也不接受客户端传入 `teacherId`。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "courseId": 8,
      "courseCode": "WEB101",
      "courseName": "网络课程",
      "credit": 2.0,
      "hours": 48,
      "assessType": "笔试",
      "teacherId": 5,
      "courseType": 1,
      "status": 1
    }
  ]
}
```

`data` 为课程对象数组，包含 `courseId`、`courseCode`、`courseName`、`credit`、`hours`、`assessType`、`teacherId`、`courseType` 和 `status` 字段；无课程时返回空数组。

## 按班级课程和教师查询学生成绩

`GET /api/v1/teacher/scores?classId=1&courseId=8&teacherId=5`

根据班级 ID、课程 ID 和教师 ID 查询该班选修此课程的学生及成绩。只返回有效选课记录；尚未录入的成绩字段为 `null`，不要求课程已有排课记录。教师只能查询本人课程的成绩；学院管理员可以查询本学院教师的成绩，其他角色无权访问。三个 ID 均为必填正整数。

请求示例：

```http
GET /api/v1/teacher/scores?classId=1&courseId=8&teacherId=5
Authorization: <JWT>
```

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "studentId": 2,
      "studentNo": "2026000002",
      "studentName": "张三",
      "classId": 1,
      "className": "计算机1班",
      "courseId": 8,
      "courseCode": "WEB101",
      "courseName": "网络课程",
      "teacherId": 5,
      "teacherName": "王老师",
      "score": 85.5,
      "gradePoint": null,
      "scoreUpdatedAt": "2026-11-08T10:30:00"
    }
  ]
}
```

`data` 为学生成绩对象数组，包含学生、班级、课程、教师、成绩、绩点和成绩更新时间；无匹配记录时返回空数组。

## 查询当前教师的课表

`GET /api/v1/teacher/schedule`

查询当前教师所授课程的课表。教师只能查询本人课表。

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

## 按教师和学期查询排课

`GET /api/v1/teacher/schedule/teacher?semester=2026-2027-1`

教师请求只需传入 `semester`。服务端从当前登录信息中获取教师身份，教师只能查询本人课表；学生无权调用。学院管理员如需查询本学院指定教师的课表，需额外提供正整数 `teacherId`。`semester` 必填且最多 20 个字符。

请求示例：

```http
GET /api/v1/teacher/schedule/teacher?semester=2026-2027-1
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

`data` 为排课对象数组，包含 `scheduleId`、`courseId`、`courseCode`、`courseName`、`classId`、`teacherId`、`semester`、`weekday`、`section`、`startWeek`、`endWeek` 和 `location` 字段；无匹配记录时返回空数组。

## 录入学生成绩

`POST /api/v1/teacher/courses/{courseId}/scores`

为已选课且尚未录入成绩的学生录入成绩。教师只能为自己所授课程中处于有效选课状态的学生录入成绩。录入成绩时会记录当前教师和更新时间；此接口不会重新计算绩点。如果成绩已经存在，请使用修改成绩接口。

请求示例：

```json
{
  "studentId": 2,
  "score": 85.5
}
```

| 字段 | 约束 |
|---|---|
| `studentId` | 必填，必须为正整数 |
| `score` | 必填，0–100 之间的分数 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 修改学生成绩

`PUT /api/v1/teacher/courses/{courseId}/scores`

修改指定学生已录入的成绩。教师只能修改自己所授课程中处于有效选课状态的学生成绩。请求字段及范围与录入成绩接口相同；成绩尚未录入时不能通过此接口修改。修改时会记录当前教师和更新时间，不会重新计算绩点。

请求示例：

```json
{
  "studentId": 2,
  "score": 90.0
}
```

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 删除学生成绩

`DELETE /api/v1/teacher/courses/{courseId}/scores/{studentId}`

删除指定学生在课程中的已录入成绩。此操作只清空成绩、绩点和成绩录入信息，不会删除选课记录。教师只能删除自己所授课程中处于有效选课状态的学生成绩；成绩尚未录入时不能删除。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

访问需要身份认证的接口时，请在 `Authorization` 请求头中携带 JWT：

```http
Authorization: <JWT>
```

凭据无效时返回 HTTP `401`；请求字段无效时返回 HTTP `400`；无权限访问时返回 HTTP `403`。
