import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import type { QA } from "@/types/qa"
import GrowingCard from "./growingCard"
import MarkdownRenderer from "./markdownRenderer"

function QAList({
  list,
  children,
  className,
  defaultOpenAll,
}: {
  list: QA[]
  children?: React.ReactNode
  className?: string
  defaultOpenAll?: boolean
}) {
  const accordionProps = defaultOpenAll
    ? {
        type: "multiple" as const,
        defaultValue: list.map((_, index) => `item-${index}`),
        className: "flex flex-col w-full gap-[inherit] w-full",
      }
    : {
        type: "single" as const,
        collapsible: true,
        className: "flex flex-col w-full gap-[inherit] w-full",
      }

  return (
    <div
      className={cn("flex flex-col items-start gap-5 flex-1 w-full", className)}
    >
      <Accordion {...accordionProps}>
        {list.map((qa, index) => (
          <GrowingCard key={index} className='bg-neutral-50 w-full'>
            <AccordionItem value={`item-${index}`}>
              <AccordionTrigger className='md:text-lg font-medium px-6 py-5'>
                {qa.question}
              </AccordionTrigger>

              <AccordionContent className='text-left text-neutral-500 px-4 pb-4'>
                <div className='leading-6'>
                  <MarkdownRenderer content={qa.answer} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </GrowingCard>
        ))}
      </Accordion>

      {children}
    </div>
  )
}

export default QAList
