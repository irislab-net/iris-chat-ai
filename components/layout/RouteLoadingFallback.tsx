import { BrandLoadingMark } from "@/components/layout/BrandLoadingMark"

/** Lightweight shell for lazy route boundaries (keeps layout stable). */
export default function RouteLoadingFallback() {
  return (
    <div
      className='flex min-h-[40vh] flex-col items-center justify-center px-4'
      aria-busy
      aria-label='Loading page'
    >
      <BrandLoadingMark />
    </div>
  )
}
