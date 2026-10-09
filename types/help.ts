import type { SVGIcon } from "./icon"

export interface HelpGuide {
  id: string
  title: string
  description: string
  icon: SVGIcon
  articles: HelpArticle[]
}

export type HelpArticleLevel = "beginner" | "intermediate" | "advanced"

export interface HelpArticle {
  id: string
  title: string
  description: string
  level: HelpArticleLevel
}
