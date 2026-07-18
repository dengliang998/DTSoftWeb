const DATE_FORMAT_MAP = {
  year: 'YYYY',
  month: 'YYYY-MM',
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm:ss'
}

export function parseJsonObject(value) {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch (error) {
    return {}
  }
}

export function parseJsonArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

export function normalizeFieldOrder(fields) {
  return Array.isArray(fields)
    ? [...fields]
        .map((field, index) => ({
          ...field,
          sortOrder:
            field.sortOrder !== undefined && field.sortOrder !== null && field.sortOrder !== ''
              ? Number(field.sortOrder)
              : index + 1
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : []
}

export function normalizeLookupPageSize(pageSize) {
  const value = Number(pageSize)
  return Number.isInteger(value) && value >= 5 && value <= 200 ? value : 10
}

export function normalizeLookupColumns(columns, { dropIncomplete = false } = {}) {
  const normalized = typeof columns === 'string' ? parseJsonArray(columns) : columns
  if (!Array.isArray(normalized)) return []

  const result = normalized
    .filter((column) => column && typeof column === 'object')
    .map((column) => ({
      field: column.Field || column.field || '',
      label: column.Label || column.label || '',
      width: column.Width !== undefined && column.Width !== null ? column.Width : column.width || null
    }))

  return dropIncomplete ? result.filter((column) => column.field && column.label) : result
}

export function normalizeLookupMappings(mappings, { dropIncomplete = false } = {}) {
  const normalized = typeof mappings === 'string' ? parseJsonArray(mappings) : mappings
  if (!Array.isArray(normalized)) return []

  const result = normalized
    .filter((mapping) => mapping && typeof mapping === 'object')
    .map((mapping) => ({
      sourceField: mapping.SourceField || mapping.sourceField || '',
      targetField: mapping.TargetField || mapping.targetField || ''
    }))

  return dropIncomplete ? result.filter((mapping) => mapping.sourceField && mapping.targetField) : result
}

export function normalizeFieldOptions(options) {
  const normalized = typeof options === 'string' ? parseJsonArray(options) : options
  if (!Array.isArray(normalized)) return []

  return normalized
    .filter((option) => option && typeof option === 'object')
    .map((option) => ({
      label: option.Label || option.label || '',
      value: option.Value || option.value || ''
    }))
}

export function normalizeFormColumns(formColumns) {
  const value = Number(formColumns)
  return Number.isInteger(value) && value >= 1 && value <= 4 ? value : 1
}

export function normalizeQueryColumns(queryColumns) {
  const value = Number(queryColumns)
  return Number.isInteger(value) && value >= 1 && value <= 4 ? value : 1
}

export function normalizeQueryWidth(queryWidth) {
  const value = Number(queryWidth)
  return Number.isInteger(value) && value >= 100 && value <= 600 ? value : 150
}

export function getDateFormatType(field) {
  return ['year', 'month', 'date', 'datetime'].includes(field?.dateFormat) ? field.dateFormat : 'datetime'
}

export function getDatePickerType(field) {
  const formatType = getDateFormatType(field)
  return formatType === 'datetime' ? 'datetime' : formatType
}

export function getDateRangePickerType(field) {
  const formatType = getDateFormatType(field)
  return formatType === 'datetime' ? 'datetimerange' : `${formatType}range`
}

export function getDateValueFormat(field) {
  return DATE_FORMAT_MAP[getDateFormatType(field)]
}

export function getDateDisplayFormat(field) {
  return DATE_FORMAT_MAP[getDateFormatType(field)]
}

export function normalizeDateValueForSubmit(value, field, boundary = '') {
  if (!value) return ''

  const text = String(value)
  switch (getDateFormatType(field)) {
    case 'year':
      return boundary === 'end' ? `${text}-12-31 23:59:59` : `${text}-01-01 00:00:00`
    case 'month':
      if (boundary === 'end') {
        const [year, month] = text.split('-').map(Number)
        if (year && month) {
          const lastDay = new Date(year, month, 0).getDate()
          return `${text}-${String(lastDay).padStart(2, '0')} 23:59:59`
        }
      }
      return `${text}-01 00:00:00`
    case 'date':
      return boundary === 'end' ? `${text} 23:59:59` : `${text} 00:00:00`
    default:
      return text
  }
}

export function normalizeAttachmentValue(value, { wrapObject = false } = {}) {
  let normalized = value
  if (!normalized) return []
  if (typeof normalized === 'string') {
    try {
      normalized = JSON.parse(normalized)
    } catch (error) {
      return []
    }
  }
  if (!Array.isArray(normalized)) {
    return wrapObject && normalized && typeof normalized === 'object' ? [normalized] : []
  }
  return normalized.filter((item) => item && typeof item === 'object')
}

export function getAttachmentFileId(attachment) {
  return attachment.FileID || attachment.fileId || attachment.FileId || attachment.id || ''
}

export function getAttachmentKey(attachment, index) {
  return getAttachmentFileId(attachment) || index
}

export function getAttachmentName(attachment) {
  return (
    attachment.FileName || attachment.fileName || attachment.name || getAttachmentFileId(attachment) || '未命名附件'
  )
}

export function getAttachmentExt(attachment) {
  const ext = attachment.Ext || attachment.ext || ''
  if (ext) return String(ext).toLowerCase()

  const name = getAttachmentName(attachment)
  const dotIndex = name.lastIndexOf('.')
  return dotIndex > -1 ? name.slice(dotIndex).toLowerCase() : ''
}

export function getAttachmentExtLabel(attachment) {
  const ext = getAttachmentExt(attachment).replace(/^\./, '')
  return ext ? ext.toUpperCase() : 'FILE'
}

export function isImageAttachment(attachment) {
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(getAttachmentExt(attachment))
}

export function isVideoAttachment(attachment) {
  return ['.mp4', '.mov', '.webm', '.ogg'].includes(getAttachmentExt(attachment))
}

export function isPreviewableAttachment(attachment) {
  return isImageAttachment(attachment) || isVideoAttachment(attachment)
}

export function getRowValue(row, fieldName) {
  if (!row || !fieldName) return undefined
  if (Object.prototype.hasOwnProperty.call(row, fieldName)) return row[fieldName]
  const matchedKey = Object.keys(row).find((key) => key.toLowerCase() === fieldName.toLowerCase())
  return matchedKey ? row[matchedKey] : undefined
}
