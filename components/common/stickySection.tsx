import { cn } from "@/lib/utils"
import LandingSection from "./landingSection"
import SectionHeader from "./sectionHeader"

function StickySection({
  id,
  header,
  headerLevel,
  description,
  descriptionClassName,
  className,
  children,
  headerContent,
}: {
  id?: string
  header?: string
  headerLevel?: 1 | 2 | 3 | 4 | 5 | 6
  description?: string
  descriptionClassName?: string
  className?: string
  children?: React.ReactNode
  headerContent?: React.ReactNode
}) {
  return (
    <LandingSection
      id={id}
      className={cn("flex flex-col md:flex-row w-full gap-6", className)}
    >
      <div className='relative w-full md:w-auto md:flex-1'>
        <div className='flex flex-col items-center text-left sticky top-24 flex-1 gap-2'>
          {(header || description) && (
            <SectionHeader
              header={header}
              level={headerLevel}
              description={description}
              descriptionClassName={descriptionClassName}
            />
          )}

          {headerContent}
        </div>
      </div>

      <div className='flex flex-col flex-1 gap-14'>{children}</div>
    </LandingSection>
  )
}

export default StickySection
