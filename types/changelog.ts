export interface ChangeLog {
  title: string
  date: Date
  description?: string
  changes?: string[]
}

export type ChangeLogs = ChangeLog[]
