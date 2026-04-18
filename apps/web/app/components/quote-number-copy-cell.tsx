'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type QuoteRef = {
  id: string
  publicCode?: string | null
}

/** Номер + копирование: один контрол, клик по номеру или иконке; без тоста — локальная анимация. */
export function QuoteNumberCopyCell({ quote }: { quote: QuoteRef }) {
  const copyText = quote.publicCode?.trim() ?? quote.id
  const display = quote.publicCode?.trim() ? quote.publicCode.trim() : '—'
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 900)
    return () => clearTimeout(id)
  }, [copied])

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(copyText)
        setCopied(true)
      } catch {
        // тихо: без глобального тоста
      }
    },
    [copyText],
  )

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 720, damping: 38, mass: 0.65 }}
      className={cn(
        // Без w-full — только 7ch + иконка; скругление чуть меньше rounded-md
        'group inline-flex max-w-full items-center gap-0 rounded-sm px-1 py-0.5 text-left outline-none',
        'transition-[background-color,box-shadow] duration-100',
        copied
          ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:ring-emerald-500/40'
          : 'hover:bg-muted hover:shadow-sm hover:ring-1 hover:ring-border/80 dark:hover:ring-border/60',
        'focus-visible:ring-ring focus-visible:ring-2',
      )}
      aria-label={copied ? 'Номер скопирован' : 'Скопировать номер расчёта'}
      title={copied ? 'Скопирован' : 'Скопировать номер'}
    >
      {/* Тот же слот: номер ↔ «Скопирован», не рядом */}
      <span className="relative flex min-h-5 min-w-[7ch] shrink-0 items-center text-left">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="copied-label"
              className="ml-[5px] whitespace-nowrap font-sans text-[10px] font-medium leading-none tracking-tight text-emerald-600 dark:text-emerald-400"
              initial={{ opacity: 0, x: 12, filter: 'blur(3px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.45 }}
            >
              Скопирован
            </motion.span>
          ) : (
            <motion.span
              key="num"
              title={display}
              className="w-[7ch] min-w-[7ch] max-w-[7ch] truncate font-sans tabular-nums select-none"
              initial={{ opacity: 0, x: -10, filter: 'blur(2px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 10, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 560, damping: 36, mass: 0.45 }}
            >
              {display}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {/* Компактная зона иконки: 20×20, иконка 14px, без лишних полей — рядом с текстом */}
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center p-0">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="ok"
              role="presentation"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.55, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 680, damping: 32, mass: 0.45 }}
            >
              <IconCheck
                className="size-3.5 text-emerald-600 dark:text-emerald-400"
                stroke={2}
              />
            </motion.span>
          ) : (
            <motion.span
              key="cp"
              role="presentation"
              className="text-muted-foreground group-hover:text-foreground absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
            >
              <IconCopy className="size-3.5" stroke={1.75} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
