"use client"

import dynamic from "next/dynamic"

const TestimonialV2 = dynamic(() => import("@/components/ui/testimonial-v2"), {
  ssr: false,
})

export function LandingTestimonials() {
  return <TestimonialV2 />
}
