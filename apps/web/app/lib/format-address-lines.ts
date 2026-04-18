/** Индекс РФ */
const POSTAL = /^\d{6}$/

function isRegionPart(s: string): boolean {
  const t = s.trim()
  return (
    /обл\.?$|край$|респ\.|Республика|область$|АО$|Чувашия|Татарстан|Башкортостан|Дагестан|Якутия|Адыгея|Алтай$/i.test(
      t,
    ) || /^[А-ЯЁа-яё -]+ (обл|край|респ)$/i.test(t)
  )
}

function isSettlement(s: string): boolean {
  const t = s.trim()
  return /^(г\.?|г\s|пгт\.?|пос\.?|посёлок|поселок|п\.?|с\.?|село|д\.?|дер\.?|деревня|снт|рп\.?|жилой\sпосёлок|мкр\.?|микрорайон|тер\.?|станица|аул|х\.?|хутор)/i.test(
    t,
  )
}

/** Район / округ между регионом и НП (пропускаем при поиске НП). */
function isDistrictOrMunicipal(s: string): boolean {
  const t = s.trim()
  if (isSettlement(t) || isStreetPart(t) || isHousePart(t)) return false
  return /р-н|район|муниципальный\sокруг|округ\s*$/i.test(t)
}

function isStreetPart(s: string): boolean {
  const t = s.trim()
  return /^(ул\.?|улица|пр-кт|просп\.|проспект|ш\.?|шоссе|пер\.?|переулок|наб\.?|набережная|пл\.?|площадь|б-р|бульвар|проезд|аллея|линия|микрорайон|кв-л|квартал)/i.test(
    t,
  )
}

function isHousePart(s: string): boolean {
  const t = s.trim()
  return /^(д\.?|дом|корп\.?|к\.?|стр\.?|снт|уч\.?|участок|зд\.?|владение|литера|садовое|товарищество)/i.test(
    t,
  )
}

export type AddressThreeLines = {
  /** Индекс + регион, либо индекс + город, если области в строке нет */
  line1: string
  /** Населённый пункт — только если регион был отдельной частью; иначе пусто */
  line2: string
  /** Улица/дом; после нормализации может быть перенесено в line2 */
  line3: string | null
}

/**
 * Разбивает адрес (через запятую) на строки:
 * 1 — индекс + область; если области нет — индекс + город (Нижний Новгород и т.п.);
 * 2 — населённый пункт, если он не вошёл в 1-ю строку;
 * 3 — улица/дом. Если 2-я строка пустая, а улица есть — она становится 2-й строкой.
 */
export function formatAddressThreeLines(raw: string): AddressThreeLines {
  const cleaned = raw.trim()
  if (!cleaned) {
    return { line1: '—', line2: '', line3: null }
  }

  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) {
    return { line1: '—', line2: '', line3: null }
  }

  if (parts.length === 1) {
    return { line1: parts[0], line2: '', line3: null }
  }

  let i = 0
  let line1 = ''

  if (POSTAL.test(parts[0])) {
    const postal = parts[0]
    i = 1
    if (parts[i] && isRegionPart(parts[i])) {
      line1 = `${postal}, ${parts[i]}`
      i++
    } else if (parts[i] && isSettlement(parts[i])) {
      // Область не указана — индекс и город сразу в первой строке: «603158, г. Нижний Новгород»
      line1 = `${postal}, ${parts[i]}`
      i++
    } else {
      line1 = postal
    }
  } else {
    line1 = parts[0]
    i = 1
  }

  if (!line1) line1 = '—'

  while (i < parts.length && isDistrictOrMunicipal(parts[i])) {
    i++
  }

  let line2 = ''
  if (i < parts.length) {
    if (isSettlement(parts[i])) {
      line2 = parts[i]
      i++
    } else if (!isStreetPart(parts[i]) && !isHousePart(parts[i])) {
      line2 = parts[i]
      i++
    }
  }

  const rest = parts.slice(i)
  let line3: string | null = null
  if (rest.length > 0) {
    const hasStreetOrHouse = rest.some((p) => isStreetPart(p) || isHousePart(p))
    if (hasStreetOrHouse) {
      line3 = rest.join(', ')
    } else if (line2) {
      line2 = [line2, ...rest].join(', ')
    } else {
      line2 = rest.join(', ')
    }
  }

  let line2Out = line2.trim()
  let line3Out = line3

  // Город уже в line1 — улица должна идти второй строкой, не третьей
  if (!line2Out && line3Out) {
    line2Out = line3Out
    line3Out = null
  }

  return {
    line1,
    line2: line2Out,
    line3: line3Out,
  }
}

/**
 * Подпись объекта для таблицы расчётов: регион (область/край/респ.),
 * район(и), населённый пункт — без улицы и дома.
 * Населённый пункт берём из {@link formatAddressThreeLines}: там тот же разбор, что в карточке (line2),
 * иначе отдельный проход по частям теряет «село …» из‑за границ `isSettlement` / смешения скриптов в regex.
 */
export function formatObjectAddressLabel(raw: string | null): string {
  const cleaned = raw?.trim()
  if (!cleaned) return '—'

  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return '—'

  const three = formatAddressThreeLines(cleaned)
  const settlement = three.line2.trim()

  let i = 0
  if (POSTAL.test(parts[0])) i = 1

  const segments: string[] = []

  if (i < parts.length && isRegionPart(parts[i])) {
    segments.push(parts[i])
    i++
  }

  while (i < parts.length && isDistrictOrMunicipal(parts[i])) {
    segments.push(parts[i])
    i++
  }

  if (settlement) {
    segments.push(settlement)
  } else if (
    i < parts.length &&
    !isStreetPart(parts[i]) &&
    !isHousePart(parts[i])
  ) {
    segments.push(parts[i])
  }

  if (segments.length > 0) {
    return segments.join(', ')
  }

  // Индекс + город без строки области: в карточке это line1
  if (three.line1 && three.line1 !== '—') {
    return three.line1
  }

  let j = 0
  if (parts[0] && POSTAL.test(parts[0])) j = 1
  while (
    j < parts.length &&
    !isStreetPart(parts[j]) &&
    !isHousePart(parts[j])
  ) {
    segments.push(parts[j])
    j++
    if (segments.length >= 4) break
  }

  if (segments.length > 0) {
    return segments.join(', ')
  }

  return parts[0]
}
