/** Сумма в формате ru-RU и «руб.» строчными (без символа ₽). */
export function formatRubAmount(total: string): string {
  const n = Number(total)
  if (Number.isNaN(n)) return total
  const s = n.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${s}\u00a0руб.`
}
