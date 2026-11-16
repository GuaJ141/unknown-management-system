# 用户接口

## 目录

- [登录](#登录)

## 登录

`POST /api/v1/user/login`

此接口无需登录令牌。学生、教师和学院管理员均可使用账号编号（`login_no`）或手机号登录。

请求示例：

```json
{
  "login_no": "学号、教师编号、管理员编号或手机号",
  "password": "账户密码"
}
```

| 字段 | 约束 |
|---|---|
| `login_no` | 必填，不能为空，最多 30 个字符；可传账号编号或手机号 |
| `password` | 必填，不能为空，最多 64 个字符 |

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": {
    "token": "JWT",
    "userId": 1,
    "role": 1,
    "mustChangePassword": true,
    "login_no": "20260001"
  }
}
```

响应中的 `login_no` 是账户的实际登录编号（从 `user_account.login_no` 读取），即使请求使用手机号登录也会返回该编号。角色值：`1` 表示学生，`2` 表示教师，`3` 表示学院管理员。`mustChangePassword` 表示用户是否必须修改密码。新注册的学生和教师默认密码为 `123456`，登录后必须修改密码。

访问需要身份认证的接口时，请在 `Authorization` 请求头中携带返回的 JWT：

```http
Authorization: <JWT>
```

只有状态正常的账户可以登录。凭据无效时返回 HTTP `401`；请求字段无效时返回 HTTP `400`。
