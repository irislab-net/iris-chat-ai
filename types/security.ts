export interface SecurityDoc {
  title: string
  date: Date
  link: string
}

export interface SecurityDocCategory {
  title: string
  link: string
  docs: SecurityDoc[]
}
