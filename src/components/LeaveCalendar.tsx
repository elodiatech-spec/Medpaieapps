import { useState } from 'react'
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isWithinInterval,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LEAVE_TYPE_LABELS, type LeaveRequest, type Profile } from '../lib/database.types'

const STATUS_DOT: Record<string, string> = {
  approved: 'bg-brand-500',
  pending: 'bg-amber-400',
  rejected: 'bg-slate-300',
}

export default function LeaveCalendar({
  leaves,
  employees,
}: {
  leaves: LeaveRequest[]
  employees?: Map<string, Profile>
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const visibleLeaves = leaves.filter((l) => l.status !== 'rejected')

  function leavesOnDay(day: Date) {
    return visibleLeaves.filter((l) =>
      isWithinInterval(day, {
        start: new Date(l.start_date + 'T00:00:00'),
        end: new Date(l.end_date + 'T23:59:59'),
      }),
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium capitalize text-slate-900">
          {format(month, 'MMMM yyyy', { locale: fr })}
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayLeaves = leavesOnDay(day)
          const inMonth = isSameMonth(day, month)
          const isToday = isSameDay(day, new Date())
          return (
            <div
              key={day.toISOString()}
              className={`flex min-h-16 flex-col items-center gap-1 rounded-lg p-1 text-xs ${
                inMonth ? 'bg-white' : 'bg-slate-50 text-slate-300'
              } ${isToday ? 'ring-1 ring-brand-400' : ''}`}
            >
              <span className={inMonth ? 'text-slate-700' : 'text-slate-300'}>{format(day, 'd')}</span>
              <div className="flex flex-wrap justify-center gap-0.5">
                {dayLeaves.slice(0, 4).map((l) => (
                  <span
                    key={l.id}
                    title={`${employees?.get(l.employee_id)?.first_name ?? ''} — ${LEAVE_TYPE_LABELS[l.leave_type]}`}
                    className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[l.status]}`}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Approuvé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> En attente
        </span>
      </div>
    </div>
  )
}
