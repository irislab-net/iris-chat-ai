import gsap from "gsap"

/** GSAP helpers — only touch nodes that exist under `root` (avoids "target not found" warnings). */
export function queryScopedTargets(
  root: Element | null | undefined,
  selector: string,
): Element[] {
  if (!root) return []
  return Array.from(root.querySelectorAll(selector))
}

export function setScopedIfPresent(
  root: Element | null | undefined,
  selector: string,
  vars: gsap.TweenVars,
): void {
  const targets = queryScopedTargets(root, selector)
  if (targets.length > 0) {
    gsap.set(targets, vars)
  }
}
