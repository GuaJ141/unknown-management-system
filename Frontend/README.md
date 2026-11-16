# 课程教学管理平台

## 开发与登录

运行 `npm install` 后使用 `npm run dev` 启动开发服务器。项目通过共享 Axios 实例发送 API 请求，后端地址统一配置在 `src/constants/api.ts` 的 `localhost` 常量（当前为 `http://localhost:8080`）。登录接口为 `POST /api/v1/user/login`。

- 学生与教师登录：`/login`
- 学院管理员登录：`/admin/login`

登录接口与角色定义见 [AUTH_API.md](./AUTH_API.md)。学生、教师和管理员成功登录后分别进入 `/student`、`/teacher` 和 `/admin` 工作台；认证状态由 Zustand 在当前页面会话中维护。

学院管理员工作台支持批量注册师生、分页查看本学院学生、查看未分班学生并分配班级、管理课程和选课批次。班级列表查询尚未提供，创建和分班操作仍需按接口输入班级信息或 ID。业务规则与接口字段见 [COLLEGE_ADMIN_API.md](./COLLEGE_ADMIN_API.md)。

学生工作台支持查询开放课程并选课、查看选课结果和课表、成绩、班级信息及公告，也可更新手机号和密码。首次登录学生必须先修改初始密码；学生业务接口及字段校验见 [STUDENT_API.md](./STUDENT_API.md)。

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
