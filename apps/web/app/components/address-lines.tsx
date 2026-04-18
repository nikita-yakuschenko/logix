import { formatAddressThreeLines } from '@/lib/format-address-lines'
import { cn } from '@/lib/utils'

type Props = {
  text: string
  className?: string
  /** Класс для 1-й строки (индекс + регион) */
  line1ClassName?: string
  line2ClassName?: string
  line3ClassName?: string
}

/** Три строки: индекс+регион, населённый пункт, улица/дом (если есть). */
export function AddressLinesBlock({
  text,
  className,
  line1ClassName,
  line2ClassName,
  line3ClassName,
}: Props) {
  const { line1, line2, line3 } = formatAddressThreeLines(text)
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <div className={cn('whitespace-pre-wrap', line1ClassName)}>{line1}</div>
      {line2 ? (
        <div className={cn('whitespace-pre-wrap', line2ClassName)}>{line2}</div>
      ) : null}
      {line3 ? (
        <div className={cn('whitespace-pre-wrap', line3ClassName)}>{line3}</div>
      ) : null}
    </div>
  )
}
