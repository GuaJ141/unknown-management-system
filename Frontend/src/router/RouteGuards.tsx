import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function StudentGuard() {
  const session = useAuthStore((state) => state.session)
  if (!session) return <Navigate to="/login" replace />
  if (session.role !== 1) {
    return <Navigate to={session.role === 3 ? '/admin' : '/teacher'} replace />
  }
  return <Outlet />
}

export function TeacherGuard() {
  const session = useAuthStore((state) => state.session)
  if (!session) return <Navigate to="/login" replace />
  if (session.role !== 2) {
    return <Navigate to={session.role === 3 ? '/admin' : '/student'} replace />
  }
  return <Outlet />
}

export function AdminGuard() {
  const session = useAuthStore((state) => state.session)
  if (!session) return <Navigate to="/admin/login" replace />
  if (session.role !== 3) {
    return <Navigate to={session.role === 1 ? '/student' : '/teacher'} replace />
  }
  return <Outlet />
}
