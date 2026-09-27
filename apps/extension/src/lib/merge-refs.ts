import * as React from "react"

/** Merge multiple refs into one callback ref. */
function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (ref == null) continue
      if (typeof ref === "function") {
        ref(node)
        continue
      }
      ;(ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

export { mergeRefs }
