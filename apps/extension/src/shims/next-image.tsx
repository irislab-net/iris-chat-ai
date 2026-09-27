import * as React from "react"

type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  fill?: boolean
  priority?: boolean
  unoptimized?: boolean
  loader?: unknown
  quality?: number
  placeholder?: string
  blurDataURL?: string
  sizes?: string
}

/** Shim for `next/image` — plain img for the extension runtime. */
export default function Image({
  src,
  alt,
  width,
  height,
  className,
  loading,
  priority,
  referrerPolicy,
  onError,
  onLoad,
  style,
  ...rest
}: NextImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : loading}
      referrerPolicy={referrerPolicy}
      onError={onError}
      onLoad={onLoad}
      style={style}
      decoding="async"
      {...rest}
    />
  )
}
