import CollegeAdminPage from '../pages/college-admin/CollegeAdminPage'
import StudentPage from '../pages/student/StudentPage'
import TeacherPage from '../pages/teacher/TeacherPage'

export function StudentPortal() {
  return <StudentPage />
}

export function TeacherPortal() {
  return <TeacherPage />
}

export function AdminPortal() {
  return <CollegeAdminPage />
}
