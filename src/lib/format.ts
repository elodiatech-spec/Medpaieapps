export function currentMonthPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export function formatMonthPeriod(period: string): string {
  const date = new Date(period + 'T00:00:00')
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

// Lundis des semaines dont le début tombe dans le mois donné (format 'YYYY-MM-01').
// Une semaine à cheval sur deux mois est rattachée au mois de son lundi.
export function weeksInMonth(monthPeriod: string): string[] {
  const monthDate = new Date(monthPeriod + 'T00:00:00')
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

  // Lundi de la semaine contenant le 1er du mois
  const firstDay = monthStart.getDay() // 0 = dimanche
  const offsetToMonday = firstDay === 0 ? -6 : 1 - firstDay
  const cursor = new Date(monthStart)
  cursor.setDate(cursor.getDate() + offsetToMonday)

  const weeks: string[] = []
  while (cursor <= monthEnd) {
    if (cursor >= monthStart) {
      weeks.push(cursor.toISOString().slice(0, 10))
    }
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

// Répartit un total d'heures supplémentaires hebdomadaires en paliers légaux :
// 25 % de la 36e à la 43e heure, 50 % à partir de la 44e (base 35h/semaine).
export function splitOvertimeLegal(weeklyHours: number, contractualWeeklyHours: number) {
  const overtime = Math.max(0, weeklyHours - contractualWeeklyHours)
  const tier25 = Math.min(overtime, 8)
  const tier50 = Math.max(0, overtime - 8)
  return { tier25, tier50 }
}
