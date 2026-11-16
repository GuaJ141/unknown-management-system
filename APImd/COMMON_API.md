# 公共接口

所有接口路径以 `/api/v1` 为前缀，并需携带有效的 `Authorization` 登录令牌。学生、教师和学院管理员均可调用。

## 目录

- [查询已有学期](#查询已有学期)

## 查询已有学期

`GET /api/v1/common/semesters`

无需请求参数。返回 `semester` 学期表中的学期列表，按字符串升序排列。

成功响应：

```json
{
  "success": true,
  "message": "success",
  "data": ["2026-2027-1", "2026-2027-2"]
}
```

`data` 为字符串数组，每个元素为一个学期，例如 `"2026-2027-1"`。没有维护的学期时返回空数组。

访问需要身份认证的接口时，请在 `Authorization` 请求头中携带 JWT：

```http
Authorization: <JWT>
```

参数校验失败时返回 HTTP `400`；凭据无效时返回 HTTP `401`。
