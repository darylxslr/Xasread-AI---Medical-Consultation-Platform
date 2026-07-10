export function formatTimestamp(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const todayPh = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })
  const datePh = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })
  if (datePh === todayPh) {
    return d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour12: true, hour: 'numeric', minute: '2-digit' })
  }
  const datePart = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timePart = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour12: true, hour: 'numeric', minute: '2-digit' })
  return `${datePart} at ${timePart}`
}
