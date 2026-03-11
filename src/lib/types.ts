export type Role = 'superadmin' | 'teacher' | 'student'

export interface Profile {
  id: string
  email: string
  name: string
  role: Role
  approved: boolean
  created_at: string
}

export interface Class {
  id: string
  name: string
  description: string | null
  teacher_id: string
  teacher?: Profile
  created_at: string
  student_count?: number
}

export interface ClassMember {
  id: string
  class_id: string
  student_id: string
  joined_at: string
  student?: Profile
}

export interface WordSet {
  id: string
  title: string
  description: string | null
  created_by: string
  class_id: string | null   // null = 관리자 공용 세트
  is_public: boolean
  word_count?: number
  created_at: string
}

export interface Word {
  id: string
  word_set_id: string
  term: string        // 영어 단어
  definition: string  // 한국어 뜻
  example: string | null
  order_index: number
}

export interface Assignment {
  id: string
  class_id: string
  word_set_id: string
  word_set?: WordSet
  title: string
  description: string | null
  due_date: string | null
  min_score: number | null      // 최소 통과 점수 (0~100)
  max_attempts: number | null   // 최대 시험 응시 횟수
  created_by: string
  created_at: string
}

export interface StudyLog {
  id: string
  user_id: string
  word_set_id: string
  assignment_id: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  mode: 'flashcard' | 'quiz' | 'typing'
}

export interface WordProgress {
  id: string
  user_id: string
  word_id: string
  word_set_id: string
  known: boolean
  attempts: number
  last_seen: string
}

export interface TestResult {
  id: string
  user_id: string
  user?: Profile
  assignment_id: string | null
  word_set_id: string
  score: number
  correct: number
  total: number
  passed: boolean
  answers: TestAnswer[]
  created_at: string
}

export interface TestAnswer {
  word_id: string
  term: string
  correct_definition: string
  selected: string
  is_correct: boolean
}
