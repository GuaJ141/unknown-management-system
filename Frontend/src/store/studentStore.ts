import { create } from 'zustand'
import type { StudentRecord } from '../api/student'

export type StudentSection =
  | 'overview'
  | 'courses'
  | 'myCourses'
  | 'selections'
  | 'schedule'
  | 'scores'
  | 'class'
  | 'announcements'
  | 'account'

type CollectionSection =
  | 'courses'
  | 'selections'
  | 'schedule'
  | 'scores'
  | 'announcements'

interface StudentState {
  section: StudentSection
  collections: Record<CollectionSection, StudentRecord[]>
  classInfo: StudentRecord | null
  setSection: (section: StudentSection) => void
  setCollection: (section: CollectionSection, records: StudentRecord[]) => void
  setClassInfo: (record: StudentRecord) => void
  clearData: () => void
}

const emptyCollections: Record<CollectionSection, StudentRecord[]> = {
  courses: [],
  selections: [],
  schedule: [],
  scores: [],
  announcements: [],
}

export const useStudentStore = create<StudentState>((set) => ({
  section: 'overview',
  collections: emptyCollections,
  classInfo: null,
  setSection: (section) => set({ section }),
  setCollection: (section, records) =>
    set((state) => ({
      collections: { ...state.collections, [section]: records },
    })),
  setClassInfo: (classInfo) => set({ classInfo }),
  clearData: () =>
    set({
      section: 'overview',
      collections: emptyCollections,
      classInfo: null,
    }),
}))
