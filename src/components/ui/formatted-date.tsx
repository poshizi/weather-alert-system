'use client'

interface FormattedDateProps {
  dateString: string
  format?: 'datetime' | 'date' | 'time'
}

// Simple date formatting function that works consistently on server and client
function formatDate(date: Date, format: 'datetime' | 'date' | 'time'): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hours}:${minutes}:${seconds}`
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
}

export function FormattedDate({ dateString, format = 'datetime' }: FormattedDateProps) {
  const date = new Date(dateString)
  
  // Use simple formatting that works consistently on server and client
  // This prevents hydration mismatch by avoiding locale-specific methods
  const content = formatDate(date, format)

  return <span suppressHydrationWarning>{content}</span>
}