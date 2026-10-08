export interface QA {
  question: string
  answer: string
}

export interface QACategory {
  id: string
  title: string
  questions: QA[]
}
