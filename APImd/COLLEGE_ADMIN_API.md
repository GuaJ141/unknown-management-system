# 学院管理员接口

所有接口路径以 `/api/v1` 为前缀，并使用现有 `Authorization` 登录令牌。只有 `user_account.role=3` 且状态正常的学院管理员账户可以调用。服务端使用该账户 `user_account.college_id` 确定管理员所属学院；请求不能指定或覆盖管理范围。

学期表为全校共享资源；学期管理接口仅允许学院管理员调用，但修改会影响所有学院使用的学期列表。

## 目录

- [批量注册教师](#批量注册教师)
- [批量注册学生](#批量注册学生)
- [批量将学生加入班级](#批量将学生加入班级)
- [查询未分配班级学生](#查询未分配班级学生)
- [分页查询本学院学生](#分页查询本学院学生)
- [分页查询本学院教师](#分页查询本学院教师)
- [创建班级](#创建班级)
- [查询本学院班级](#查询本学院班级)
- [编辑班级](#编辑班级)
- [创建公告](#创建公告)
- [编辑公告](#编辑公告)
- [删除公告](#删除公告)
- [查询本学院课程](#查询本学院课程)
- [创建课程](#创建课程)
- [更新课程](#更新课程)
- [删除课程](#删除课程)
- [查询本学院选课批次](#查询本学院选课批次)
- [创建选课批次](#创建选课批次)
- [更新选课批次](#更新选课批次)
- [删除选课批次](#删除选课批次)
- [查询学期](#查询学期)
- [创建学期](#创建学期)
- [更新学期](#更新学期)
- [删除学期](#删除学期)
- [按班级查询课表](#按班级查询课表)
- [安排课程](#安排课程)
- [修改排课](#修改排课)
- [删除排课](#删除排课)
- [按教师查询课表](#按教师查询课表)
- [查询排课学期列表](#查询排课学期列表)
- [管理员账户配置](#管理员账户配置)
- [通用行为](#通用行为)

## 批量注册教师

`POST /api/v1/college-admin/teachers/batch`

批量注册本学院教师。教师号由后端生成，格式为“当前年份 + 六位流水号”，并作为 `login_no`；同一年度的学生号和教师号共用流水，因此在统一账户表中全局唯一。手机号作为登录手机号，所属学院由管理员账户确定。列表不能为空，单次最多 500 人。

请求示例：

```json
{
  "teachers": [
    {
      "name": "张老师",
      "idCard": "450902245123123123",
      "phone": "13800000000"
    }
  ]
}
```

| 字段 | 约束 |
|---|---|
| `teachers` | 必填，不能为空，单次最多 500 人 |
| `teachers[].name` | 必填，不能为空，最多 50 个字符 |
| `teachers[].idCard` | 必填，不能为空，18 位身份证号 |
| `teachers[].phone` | 必填，不能为空，中国大陆手机号（11 位） |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": ["2026000001"]
}
```

`data` 按请求顺序返回生成的教师号。手机号或身份证号冲突时返回 `409`，整批事务回滚。新建教师账户的默认密码为 `123456`，账户标记为首次登录必须修改密码。

现有数据库需创建 `account_number_sequence` 表（建表语句见 `se_project.sql`）。升级已有数据库时只执行该表的 `CREATE TABLE` 语句，不要重跑包含删表操作的整份脚本；系统会根据已有的同格式账户编号初始化年度序列。

## 批量注册学生

`POST /api/v1/college-admin/students/batch`

批量注册本学院学生。学号由后端生成，格式为“当前年份 + 六位流水号”，并作为 `login_no`；同一年度的学生号和教师号共用流水，因此在统一账户表中全局唯一。手机号作为登录手机号；学生归属当前管理员的学院。

请求示例：

```json
{
  "students": [
    {
      "name": "李同学",
      "idCard": "450902200405212514",
      "phone": "13900000000",
      "gender": 1,
      "birth": "2004-05-21",
      "enrollmentYear": 2026,
      "graduationYear": 2030,
      "studyDuration": 4
    }
  ]
}
```

| 字段 | 约束 |
|---|---|
| `students` | 必填，不能为空，单次最多 500 人 |
| `students[].name` | 必填，不能为空，最多 50 个字符 |
| `students[].idCard` | 必填，不能为空，18 位身份证号 |
| `students[].phone` | 必填，不能为空，中国大陆手机号（11 位） |
| `students[].gender` | 可选：`0` 女、`1` 男 |
| `students[].birth` | 可选，使用 `YYYY-MM-DD` 完整日期格式 |
| `students[].enrollmentYear` | 必填，1901–2155 |
| `students[].graduationYear` | 必填，1901–2155，须等于入学年份加学制 |
| `students[].studyDuration` | 必填，正整数 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": ["2026000001"]
}
```

`data` 按请求顺序返回生成的学号。手机号或身份证号冲突时返回 `409`，整批事务回滚；学籍年份与学制不一致返回 `400`。新建学生账户的默认密码为 `123456`，账户标记为首次登录必须修改密码。

## 批量将学生加入班级

`PUT /api/v1/college-admin/students/class`

批量将本学院学生加入本学院班级。所有学生和目标班级都必须属于当前管理员所在学院，学生必须尚未分班，且班级状态必须为 `1`（在校）；已毕业班级不能分配新学生。每成功分配一名学生，服务端在同一事务中将目标班级 `student_count` 加 `1`；批量分配 N 名学生则增加 N。若原人数为 `NULL`，按 `0` 处理后递增。

请求示例：

```json
{
  "classId": 10,
  "studentIds": [101, 102, 103]
}
```

| 字段 | 约束 |
|---|---|
| `classId` | 必填，必须为正整数，且班级属于当前学院 |
| `studentIds` | 必填，不能为空，最多 500 人，学生必须属于当前学院且尚未分班 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

重复学生 ID 返回 `400`，学生或班级越权、不存在、已分班或班级已毕业时返回 `404`。批量操作在单个事务中执行，任何学生校验或更新失败时整批回滚。

## 查询未分配班级学生

`GET /api/v1/college-admin/students/unassigned-class`

查询当前管理员所属学院、账户状态正常且尚未分配班级的学生，按学号排序。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "studentId": 101,
      "studentNo": "2026000001",
      "studentName": "李同学"
    }
  ]
}
```

`data` 为学生对象数组，每个对象包含 `studentId`、`studentNo`、`studentName`。

## 分页查询本学院学生

`GET /api/v1/college-admin/students?pageNum=1&pageSize=10`

使用 PageHelper 分页，两个参数均可选：`pageNum` 从 `1` 开始，默认 `1`；`pageSize` 范围为 `1`–`100`，默认 `10`。只返回当前管理员学院内状态正常的学生账户，按学号排序。学生身份证号不会返回；无班级学生的班级字段为 `null`。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "size": 1,
    "startRow": 1,
    "endRow": 1,
    "total": 1,
    "pages": 1,
    "list": [
      {
        "studentId": 1,
        "studentNo": "2026000001",
        "studentName": "李同学",
        "phone": "13900000000",
        "gender": 1,
        "birth": "2008-01-01",
        "enrollmentYear": 2026,
        "graduationYear": 2030,
        "studyDuration": 4,
        "classId": 10,
        "className": "软件工程 2026 级 1 班",
        "grade": "2026",
        "classEnrollmentYear": 2026,
        "classGraduationYear": 2030,
        "classStatus": 1
      }
    ]
  }
}
```

`data` 包含 PageHelper 分页信息及学生列表。

## 编辑学生账号

`PUT /api/v1/college-admin/students/{studentId}`

编辑本学院正常学生的姓名、手机号、性别、出生日期和学籍年份。请求体字段与学生档案对应；毕业年份必须等于入学年份加学制。学号、身份证号和班级归属不可通过此接口修改。手机号重复返回 `409`，学生不属于本学院或已停用返回 `404`。

```json
{
  "name": "李同学",
  "phone": "13900000000",
  "gender": 1,
  "birth": "2008-01-01",
  "enrollmentYear": 2026,
  "graduationYear": 2030,
  "studyDuration": 4
}
```

## 停用学生账号

`DELETE /api/v1/college-admin/students/{studentId}`

停用本学院学生账户（`user_account.status=0`），保留学生档案、选课和成绩历史。若学生已分班，同时更新班级人数。停用后该账号不能登录，也不会出现在正常学生列表中。

## 分页查询本学院教师

`GET /api/v1/college-admin/teachers?pageNum=1&pageSize=10`

使用 PageHelper 分页，两个参数均可选：`pageNum` 从 `1` 开始，默认 `1`；`pageSize` 范围为 `1`–`100`，默认 `10`。仅返回当前管理员学院内状态正常的教师账户，按教师号排序。身份证号和密码等敏感信息不会返回。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "total": 1,
    "pages": 1,
    "list": [
      {
        "teacherId": 5,
        "teacherNo": "2026000001",
        "teacherName": "张老师",
        "phone": "13800000000"
      }
    ]
  }
}
```

`data` 包含 PageHelper 分页信息及教师列表。

## 编辑教师账号

`PUT /api/v1/college-admin/teachers/{teacherId}`

编辑本学院正常教师的姓名和手机号。教师号及身份证号不通过此接口修改；手机号重复返回 `409`。

```json
{
  "name": "张老师",
  "phone": "13800000000"
}
```

## 停用教师账号

`DELETE /api/v1/college-admin/teachers/{teacherId}`

停用本学院教师账户（`user_account.status=0`），保留教师档案、课程和历史记录。停用后该账号不能登录，也不会出现在正常教师列表中。

## 创建班级

`POST /api/v1/college-admin/classes`

创建本学院班级。新班级的 `college_id` 自动取当前管理员账户的学院，不接受请求指定；`student_count` 创建时初始化为 `0`。

请求示例：

```json
{
  "className": "软件工程 2026 级 1 班",
  "grade": "2026",
  "enrollmentYear": 2026,
  "graduationYear": 2030,
  "status": 1
}
```

| 字段 | 约束 |
|---|---|
| `className` | 必填，不能为空，最多 50 个字符 |
| `grade` | 必填，不能为空，最多 10 个字符 |
| `enrollmentYear` | 必填，1901–2155 |
| `graduationYear` | 必填，1901–2155，须晚于入学年 |
| `status` | 必填：`1` 在校、`0` 已毕业 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

字段校验失败或年份关系无效时返回 `400`。

## 查询本学院班级

`GET /api/v1/college-admin/classes`

查询当前管理员所属学院的班级，按入学年份倒序、班级名称排序。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "classId": 10,
      "className": "软件工程 2026 级 1 班",
      "grade": "2026",
      "studentCount": 30,
      "enrollmentYear": 2026,
      "graduationYear": 2030,
      "status": 1
    }
  ]
}
```

`data` 为班级对象数组。`studentCount` 为班级表中记录的人数；`status` 为 `1` 在校、`0` 已毕业。

## 编辑班级

`PUT /api/v1/college-admin/classes/{classId}`

编辑本学院班级，采用完整更新。班级必须属于当前管理员所在学院；`studentCount` 由学生分班操作维护，不接受修改。

请求示例：

```json
{
  "className": "软件工程 2026 级 2 班",
  "grade": "2026",
  "enrollmentYear": 2026,
  "graduationYear": 2030,
  "status": 1
}
```

| 字段 | 约束 |
|---|---|
| `className` | 必填，不能为空，最多 50 个字符 |
| `grade` | 必填，不能为空，最多 10 个字符 |
| `enrollmentYear` | 必填，1901–2155 |
| `graduationYear` | 必填，1901–2155，须晚于入学年 |
| `status` | 必填：`1` 在校、`0` 已毕业 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

班级不存在或不属于当前学院时返回 `404`；字段校验失败或毕业年份不晚于入学年份时返回 `400`。

请求字段与创建班级相同，采用完整更新。班级必须属于当前管理员所在学院；`studentCount` 由学生分班操作维护，不接受修改。班级不存在或不属于当前学院时返回 `404`；字段校验失败或毕业年份不晚于入学年份时返回 `400`。

## 创建公告

`POST /api/v1/college-admin/announcements`

创建本学院公告。`title` 必填且最长 200 字符，`content` 必填，`status` 必填：`0` 为草稿，`1` 为已发布。`publisher_user_id` 和 `college_id` 由当前管理员账户自动写入，不能由请求指定；发布时间由数据库自动生成。

请求示例：

```json
{
  "title": "选课通知",
  "content": "本学期选课将于下周开始。",
  "status": 1
}
```

| 字段 | 约束 |
|---|---|
| `title` | 必填，不能为空，最多 200 个字符 |
| `content` | 必填，不能为空 |
| `status` | 必填：`0` 为草稿，`1` 为已发布 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 编辑公告

`PUT /api/v1/college-admin/announcements/{announcementId}`

编辑本学院公告，采用完整更新，可编辑标题、内容和状态。公告必须属于当前管理员所在学院。

请求示例：

```json
{
  "title": "选课通知（更新）",
  "content": "本学期选课将于下周开始，请注意时间。",
  "status": 1
}
```

| 字段 | 约束 |
|---|---|
| `title` | 必填，不能为空，最多 200 个字符 |
| `content` | 必填，不能为空 |
| `status` | 必填：`0` 为草稿，`1` 为已发布 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

公告不存在或不属于当前学院时返回 `404`。

## 删除公告

`DELETE /api/v1/college-admin/announcements/{announcementId}`

删除指定公告。只能删除当前管理员所在学院的公告。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

公告不存在或不属于当前学院时返回 `404`。

## 查询本学院课程

`GET /api/v1/college-admin/courses`

查询当前学院开设的课程。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": 1,
      "courseCode": "JSJWL",
      "name": "2009计算机网络",
      "credit": 2.0,
      "hours": 48,
      "assessType": "笔试",
      "openCollegeId": 1,
      "teacherId": 1,
      "courseType": 1,
      "status": 1
    }
  ]
}
```

`data` 为课程对象数组。

## 创建课程

`POST /api/v1/college-admin/courses`

创建本学院课程。开课单位自动设置为当前管理员的学院，不能通过请求修改。

请求示例：

```json
{
  "courseCode": "WEB101",
  "name": "网络课程",
  "credit": 2.0,
  "hours": 32,
  "assessType": "线上考试",
  "teacherId": 5,
  "courseType": 3,
  "status": 0
}
```

| 字段 | 约束 |
|---|---|
| `courseCode` | 必填，最多 30 字符，全局唯一 |
| `name` | 必填，最多 100 字符 |
| `credit` | 必填，0.1–99.9，最多一位小数 |
| `hours` | 必填，正整数 |
| `assessType` | 必填，最多 20 字符 |
| `teacherId` | 必填，必须是本学院教师 |
| `courseType` | 必填：1 专业课、2 选修课、3 网课 |
| `status` | 必填：0 未发布、1 可选、2 停开 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

课程码冲突返回 `409`。

## 更新课程

`PUT /api/v1/college-admin/courses/{courseId}`

完整更新本学院课程。更新只能针对本学院课程。

请求示例：

```json
{
  "courseCode": "WEB101",
  "name": "网络课程（更新）",
  "credit": 3.0,
  "hours": 48,
  "assessType": "线上考试",
  "teacherId": 5,
  "courseType": 3,
  "status": 1
}
```

| 字段 | 约束 |
|---|---|
| `courseCode` | 必填，最多 30 字符，全局唯一 |
| `name` | 必填，最多 100 字符 |
| `credit` | 必填，0.1–99.9，最多一位小数 |
| `hours` | 必填，正整数 |
| `assessType` | 必填，最多 20 字符 |
| `teacherId` | 必填，必须是本学院教师 |
| `courseType` | 必填：1 专业课、2 选修课、3 网课 |
| `status` | 必填：0 未发布、1 可选、2 停开 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

课程不存在或不属于当前学院时返回 `404`；课程码冲突返回 `409`。

## 删除课程

`DELETE /api/v1/college-admin/courses/{courseId}`

删除当前学院已创建的课程。

请求示例：

```http
DELETE /api/v1/college-admin/courses/8
Authorization: <JWT>
```

`courseId` 为课程主键正整数。课程不存在或不属于当前学院时返回 `404`。课程关联的排课会由数据库级联删除；若课程已有选课记录，数据库外键会阻止删除，接口返回 `409`（课程已有选课记录，无法删除）。成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 查询本学院选课批次

`GET /api/v1/college-admin/selection-batches`

查询当前学院的选课批次。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": 1,
      "batchName": "2026 春季选课",
      "startTime": "2026-03-01T08:00:00",
      "endTime": "2026-03-10T23:59:59",
      "status": 1
    }
  ]
}
```

`data` 为选课批次对象数组。

## 创建选课批次

`POST /api/v1/college-admin/selection-batches`

创建本学院选课批次。状态为 0 未开始/已关闭、1 开放、2 已结束；开始时间必须早于结束时间。管理员只能管理自己学院的批次，创建的批次不会开放给其他学院。状态为 1 时，后端将向 Redis 写入 `course_selection_batch:{id}` 并设置到结束时间的 TTL。

请求示例：

```json
{
  "batchName": "2026 春季选课",
  "startTime": "2026-03-01T08:00:00",
  "endTime": "2026-03-10T23:59:59",
  "status": 1
}
```

| 字段 | 约束 |
|---|---|
| `batchName` | 必填，不能为空，最多 100 字符 |
| `startTime` | 必填，开始时间 |
| `endTime` | 必填，结束时间，须晚于开始时间 |
| `status` | 必填：0 未开始/已关闭、1 开放、2 已结束 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 更新选课批次

`PUT /api/v1/college-admin/selection-batches/{batchId}`

完整更新本学院选课批次。状态为 0 未开始/已关闭、1 开放、2 已结束；开始时间必须早于结束时间。更新后 Redis 过期时间会同步调整。

请求示例：

```json
{
  "batchName": "2026 春季选课（更新）",
  "startTime": "2026-03-01T08:00:00",
  "endTime": "2026-03-15T23:59:59",
  "status": 1
}
```

| 字段 | 约束 |
|---|---|
| `batchName` | 必填，不能为空，最多 100 字符 |
| `startTime` | 必填，开始时间 |
| `endTime` | 必填，结束时间，须晚于开始时间 |
| `status` | 必填：0 未开始/已关闭、1 开放、2 已结束 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

批次不存在或不属于当前学院时返回 `404`。

批次到达结束时间后，Redis 过期监听器会将数据库中的状态更新为 `0`，保留该批次记录，不会自动删除。Redis 服务需启用 key 过期事件通知：在 `redis.conf` 中配置 `notify-keyspace-events Ex`（或运行 `CONFIG SET notify-keyspace-events Ex` 即时启用）。

## 删除选课批次

`DELETE /api/v1/college-admin/selection-batches/{batchId}`

删除当前学院的选课批次。

请求示例：

```http
DELETE /api/v1/college-admin/selection-batches/3
Authorization: <JWT>
```

`batchId` 为选课批次主键正整数。批次不存在或不属于当前管理员所在学院时返回 `404`。成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": null
}
```

## 查询学期

`GET /api/v1/college-admin/semesters`

查询学期表中的学期记录，按学期名称排序。

```json
{
  "success": true,
  "message": "success",
  "data": [
    { "semesterId": 1, "semester": "2026-2027-1" }
  ]
}
```

## 创建学期

`POST /api/v1/college-admin/semesters`

请求体为 `{"semester":"2026-2027-1"}`。`semester` 必填、去除首尾空格后不能为空，最多 20 个字符且不可重复。重复学期返回 `409`。

## 更新学期

`PUT /api/v1/college-admin/semesters/{semesterId}`

请求体与创建学期相同。更新名称时会同步更新已有排课记录中的学期名称；不存在返回 `404`，重名返回 `409`。

## 删除学期

`DELETE /api/v1/college-admin/semesters/{semesterId}`

删除没有排课记录的学期。学期不存在返回 `404`；已有排课时返回 `409`，需要先移除该学期的排课。

以上操作成功时均返回 `{"success":true,"message":"success","data":null}`。

## 按班级查询课表

`GET /api/v1/college-admin/schedule/class?classId=10&semester=2026-2027-1`

学院管理员使用此专属接口查看本学院指定班级的课表。请求需携带当前学院管理员的有效 `Authorization` 登录令牌；服务端根据管理员账户自动限定学院，跨学院班级不会返回排课记录。`classId` 为必填正整数；`semester` 为必填非空字符串，最长 20 个字符，并须与排课数据中的学期一致，例如 `2026-2027-1`。

请求示例：

```http
GET /api/v1/college-admin/schedule/class?classId=10&semester=2026-2027-1
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

`data` 为排课对象数组；班级或排课不存在、或班级不属于当前学院时返回空数组；参数校验失败时返回 HTTP `400`。`/student/schedule/class` 共享接口仍可供学生本人查询课表。

## 安排课程

`POST /api/v1/college-admin/schedules`

向 `course_schedule` 添加一条课程安排。课程、班级和教师必须属于当前管理员所在学院；`courseId`、`classId`、`teacherId` 均使用对应表中的主键 ID。

请求示例：

```http
POST /api/v1/college-admin/schedules
Authorization: <JWT>
Content-Type: application/json
```

```json
{
  "courseId": 1,
  "classId": 1,
  "teacherId": 1,
  "semester": "2008-2009-1",
  "weekday": 1,
  "section": 1,
  "startWeek": 6,
  "endWeek": 11,
  "location": "B2教学楼"
}
```

| 字段 | 约束 |
|---|---|
| `courseId` | 必填正整数；课程须属于当前学院 |
| `classId` | 必填正整数；班级须属于当前学院 |
| `teacherId` | 必填正整数；教师须属于当前学院且账户状态正常 |
| `semester` | 必填，最多 20 个字符，例如 `2026-2027-1` |
| `weekday` | 必填，范围 `1`–`7` |
| `section` | 必填，范围 `1`–`12` |
| `startWeek`、`endWeek` | 必填，范围 `1`–`255`；结束周不能早于起始周 |
| `location` | 必填，最多 100 个字符 |

`id`、`created_at` 和 `updated_at` 由数据库生成。成功响应为 `{"success":true,"message":"success","data":null}`。参数不合法返回 HTTP `400`；课程、班级或教师不存在或不属于当前学院时返回 `404`。

## 修改排课

`PUT /api/v1/college-admin/schedules/{scheduleId}`

根据 `course_schedule` 主键 ID 更新排课。只修改课程、班级、星期、节次、起始周、结束周和地点；`semester` 与 `teacher_id` 保持原值，不接受为请求字段。

请求示例：

```http
PUT /api/v1/college-admin/schedules/18
Authorization: <JWT>
Content-Type: application/json
```

```json
{
  "courseId": 1,
  "classId": 1,
  "weekday": 1,
  "section": 2,
  "startWeek": 6,
  "endWeek": 11,
  "location": "B2教学楼"
}
```

路径参数 `scheduleId` 为排课记录主键正整数。请求体字段约束与安排课程接口一致，但不包含 `teacherId` 和 `semester`：`courseId`、`classId` 为当前学院内有效记录；`weekday` 范围 `1`–`7`，`section` 范围 `1`–`12`；`startWeek`、`endWeek` 范围 `1`–`255` 且结束周不能早于起始周；`location` 必填且最多 100 个字符。更新只能操作当前学院的排课记录。成功响应为 `{"success":true,"message":"success","data":null}`；参数无效返回 `400`，排课、课程或班级不存在或不属于当前学院时返回 `404`。

## 删除排课

`DELETE /api/v1/college-admin/schedules/{scheduleId}`

按排课主键 ID 删除当前学院的排课记录。

请求示例：

```http
DELETE /api/v1/college-admin/schedules/18
Authorization: <JWT>
```

`scheduleId` 为必填正整数。排课不存在或不属于当前管理员所在学院时返回 `404`；成功响应为 `{"success":true,"message":"success","data":null}`。

## 按教师查询课表

`GET /api/v1/teacher/schedule/teacher?teacherId=5&semester=2026-2027-1`

学院管理员可以使用此接口查看本学院的教师课表。请求需携带当前学院管理员的有效 `Authorization` 登录令牌；跨学院的教师不会返回排课记录。`semester` 必须与排课数据中的学期字符串一致，例如 `2026-2027-1`。`teacherId` 为必填正整数，且教师必须属于当前管理员所在学院；`semester` 为必填非空字符串，最长 20 个字符。

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

`data` 为排课对象数组；无匹配排课时返回空数组；参数校验失败时返回 HTTP `400`。

## 查询排课学期列表

`GET /api/v1/common/semesters`

学院管理员可以使用此接口查询学期表中的学期。请求需携带当前学院管理员的有效 `Authorization` 登录令牌。无需查询参数。返回学期名称，按字符串升序排列。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": ["2026-2027-1", "2026-2027-2"]
}
```

`data` 为字符串数组，每个元素为一个学期。没有维护的学期时返回空数组。为迁移已有数据库，可执行以下语句，将现有排课学期补入学期表：

```sql
INSERT INTO semester (semester)
SELECT DISTINCT schedule.semester
FROM course_schedule schedule
WHERE NOT EXISTS (
  SELECT 1 FROM semester existing
  WHERE existing.semester = schedule.semester
);
```

访问需要身份认证的接口时，请在 `Authorization` 请求头中携带 JWT：

```http
Authorization: <JWT>
```

## 管理员账户配置

`user_account.college_id` 是指向 `college.id` 的外键。学院管理员账户需设置 `role=3`、`status=1`，并将 `college_id` 指向其管理的学院。例如：

```sql
UPDATE user_account
SET role = 3, college_id = 1, status = 1
WHERE id = 管理员账户ID;
```

多个管理员账户可设置相同的 `college_id`。批量创建的学生和教师账户也会继承当前管理员的 `college_id`；对应的 `student.college_id` 或 `teacher.college_id` 必须与账户学院一致。

## 通用行为

- 参数校验失败返回 HTTP `400`；无效登录状态返回 `401`；非管理员或无权限返回 `403`。
- 批量创建和课程码冲突返回 HTTP `409`。
- 所有成功响应沿用项目统一结构：`{"success":true,"message":"success","data":null}`。查询接口的 `data` 为结果数组；批量注册接口的 `data` 为按请求顺序生成的编号数组。
