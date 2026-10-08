import { cn } from "@/lib/utils"

function Logo({
  fragmented = false,
  ref,
  className,
}: {
  fragmented?: boolean
  ref?: React.RefObject<SVGSVGElement | null>
  className?: string
}) {
  return (
    <svg
      ref={ref}
      className={cn("size-[1em]", className)}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 100'
      origin='center'
      fill='none'
      strokeLinecap='round'
      strokeLinejoin='round'
      overflow='visible'
    >
      {!fragmented && (
        <path
          className='line'
          d='M13 87V13L50 50L87 13V87'
          stroke='currentColor'
          strokeWidth='5'
        />
      )}

      {fragmented && (
        <g className='line-fragments' stroke='currentColor' strokeWidth='5'>
          <line
            className='line-left-bottom'
            x1='12.9'
            y1='87'
            x2='12.9'
            y2='50'
          />
          <line className='line-left-top' x1='12.9' y1='50' x2='12.9' y2='13' />
          <line
            className='line-oblique-left'
            x1='13.2332'
            y1='13.7887'
            x2='49.2332'
            y2='48.7887'
          />
          <line
            className='line-oblique-right'
            x1='51.2116'
            y1='49.2329'
            x2='87.2116'
            y2='12.2329'
          />
          <line
            className='line-right-top'
            x1='86.9'
            y1='13'
            x2='86.9'
            y2='50'
          />
          <line
            className='line-right-bottom'
            x1='86.9'
            y1='50'
            x2='86.9'
            y2='87'
          />
        </g>
      )}

      <g className='dots' fill='currentColor'>
        <circle
          data-size='sm'
          data-on-line='true'
          data-position='left-bottom left bottom'
          cx='13'
          cy='87'
          r='7'
        />
        <circle
          data-size='lg'
          data-on-line='true'
          data-position='left-middle left middle'
          cx='13'
          cy='50'
          r='12'
        />
        <circle
          data-size='sm'
          data-on-line='true'
          data-position='left-top left top'
          cx='13'
          cy='13'
          r='7'
        />
        <circle
          data-size='lg'
          data-on-line='true'
          data-position='center-middle center middle'
          cx='50'
          cy='50'
          r='12'
        />
        <circle
          data-size='lg'
          data-on-line='false'
          data-position='center-top center top'
          cx='50'
          cy='13'
          r='12'
        />
        <circle
          data-size='sm'
          data-on-line='true'
          data-position='right-top right top'
          cx='87'
          cy='13'
          r='7'
        />
        <circle
          data-size='lg'
          data-on-line='true'
          data-position='right-middle right middle'
          cx='87'
          cy='50'
          r='12'
        />
        <circle
          data-size='sm'
          data-on-line='true'
          data-position='right-bottom right bottom'
          cx='87'
          cy='87'
          r='7'
        />
        <circle
          data-size='lg'
          data-on-line='false'
          data-position='center-bottom center bottom'
          cx='50'
          cy='87'
          r='12'
        />
      </g>
    </svg>
  )
}

export default Logo
