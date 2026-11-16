import { createBrowserRouter, Navigate } from 'react-router-dom'
import AdminLoginPage from '../pages/admin-login/AdminLoginPage'
import { AdminGuard, StudentGuard, TeacherGuard } from './RouteGuards'
import { AdminPortal, StudentPortal, TeacherPortal } from './RoutePortals'
import StudentTeacherLoginPage from '../pages/student-login/StudentTeacherLoginPage'

export const routeTable = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <StudentTeacherLoginPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    element: <StudentGuard />,
    children: [{ path: '/student', element: <StudentPortal /> }],
  },
  {
    element: <TeacherGuard />,
    children: [{ path: '/teacher', element: <TeacherPortal /> }],
  },
  {
    element: <AdminGuard />,
    children: [{ path: '/admin', element: <AdminPortal /> }],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]

export const router = createBrowserRouter(routeTable)
