export interface AnimationConfig {
  target: string
  vars: GSAPTweenVars
}

export interface AnimationHandle {
  play: () => void
  restart: () => void
  reverse: () => void
  pause: () => void
  resume: () => void
  kill: () => void
}
