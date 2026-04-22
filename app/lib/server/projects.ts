import fs from "node:fs"
import path from "node:path"
import * as XLSX from "xlsx"

export type ProjectTransportLine = {
  lineNo: string
  vehicleType: string
  rate: string
}

export type ProjectRecord = {
  id: string
  contractNumber: string
  houseNumber: string
  projectType: string
  projectClass: string
  address: string
  totalAmount: string
  lines: ProjectTransportLine[]
}

export type ProjectTypeListItem = {
  slug: string
  projectType: string
  recordsCount: number
}

export type ProjectTypeDetails = {
  slug: string
  projectType: string
  characteristics: {
    projectClass: string
    standardFleet: string
  }
  records: ProjectRecord[]
}

const EXCEL_EXT = ".xlsx"

function asText(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : ""
  const text = String(value).trim()
  if (text === "-" || text === "—") return ""
  return text
}

function asMoney(value: unknown): string {
  if (value == null || value === "") return "—"
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
  const text = asText(value)
  if (!text) return "—"
  const numeric = Number(text.replace(/\s+/g, "").replace(",", "."))
  if (Number.isFinite(numeric)) {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric)
  }
  return text
}

export function loadProjectsFromExcel(): ProjectRecord[] {
  const root = process.cwd()
  const candidateFiles = fs
    .readdirSync(root)
    .filter(
      (name) =>
        name.toLowerCase().endsWith(EXCEL_EXT) && !name.startsWith("~$"),
    )
    .sort((a, b) => a.localeCompare(b))

  if (candidateFiles.length === 0) {
    throw new Error('Excel-файл (.xlsx) не найден в корне проекта.')
  }

  const filePath = path.join(root, candidateFiles[0])

  const workbookBuffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(workbookBuffer, { type: "buffer", raw: false })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: null,
  })

  const dataRows = rows.slice(1)
  const projects: ProjectRecord[] = []
  let current: ProjectRecord | null = null
  let skippedExampleBlock = false

  for (const row of dataRows) {
    const houseNumber = asText(row[0])
    const projectCode = asText(row[1])
    const projectName = asText(row[2])
    const projectClass = asText(row[3])
    const address = asText(row[4])
    const totalAmount = asMoney(row[9])

    const startsNewProject = Boolean(houseNumber || projectCode || projectName || address)
    if (startsNewProject) {
      if (!skippedExampleBlock) {
        skippedExampleBlock = true
        current = null
        continue
      }
      current = {
        id: `${houseNumber || projectCode || "no-code"}-${projects.length + 1}`,
        contractNumber: projectCode || "—",
        houseNumber: houseNumber || "—",
        projectType: projectName || "—",
        projectClass: projectClass || "—",
        address: address || "—",
        totalAmount,
        lines: [],
      }
      projects.push(current)
    }

    if (!current) continue

    const lineNo = asText(row[5])
    const vehicleType = asText(row[6])
    const rate = asMoney(row[8])
    if (lineNo || vehicleType || rate !== "—") {
      current.lines.push({
        lineNo: lineNo || "—",
        vehicleType: vehicleType || "—",
        rate,
      })
    }
  }

  return projects
}

function normalizeTypeName(value: string): string {
  const text = value.trim()
  return text.length > 0 ? text : "—"
}

function slugifyTypeName(value: string): string {
  const normalized = normalizeTypeName(value).toLowerCase()
  const slug = normalized
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "type"
}

export function listProjectTypesFromExcel(): ProjectTypeListItem[] {
  const rows = loadProjectsFromExcel()
  const counts = new Map<string, { projectType: string; recordsCount: number }>()
  for (const row of rows) {
    const projectType = normalizeTypeName(row.projectType)
    const key = projectType.toLowerCase()
    const prev = counts.get(key)
    if (prev) {
      prev.recordsCount += 1
    } else {
      counts.set(key, { projectType, recordsCount: 1 })
    }
  }

  const slugUsed = new Map<string, number>()
  return [...counts.values()]
    .sort((a, b) => a.projectType.localeCompare(b.projectType, "ru"))
    .map((item) => {
      const base = slugifyTypeName(item.projectType)
      const used = slugUsed.get(base) ?? 0
      slugUsed.set(base, used + 1)
      const slug = used === 0 ? base : `${base}-${used + 1}`
      return { slug, projectType: item.projectType, recordsCount: item.recordsCount }
    })
}

export function getProjectTypeDetailsBySlug(slug: string): ProjectTypeDetails | null {
  const types = listProjectTypesFromExcel()
  const target = types.find((x) => x.slug === slug)
  if (!target) return null

  const rows = loadProjectsFromExcel().filter(
    (row) => normalizeTypeName(row.projectType).toLowerCase() === target.projectType.toLowerCase(),
  )

  const standardFleet = (() => {
    const template = rows.find((row) => row.lines.length > 0)
    if (!template) return "—"
    return template.lines
      .map((line) => `${line.lineNo} ${line.vehicleType} — ${line.rate}`)
      .join("; ")
  })()

  const classCandidate =
    rows.find((r) => r.projectClass && r.projectClass !== "—")?.projectClass ?? "—"

  return {
    slug: target.slug,
    projectType: target.projectType,
    characteristics: {
      projectClass: classCandidate,
      standardFleet,
    },
    records: rows,
  }
}
