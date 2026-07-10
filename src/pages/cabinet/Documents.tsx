import { useEffect, useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/format'
import Card from '../../components/Card'
import type { AppDocument } from '../../lib/database.types'

const TYPE_LABELS: Record<string, string> = {
  fiche_de_paie: 'Fiche de paie',
  justificatif_absence: 'Justificatif d’absence',
  facture_mensuelle: 'Facture mensuelle',
}

export default function Documents() {
  const { profile } = useAuth()
  const [documents, setDocuments] = useState<AppDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('cabinet_id', profile.cabinet_id)
        .order('created_at', { ascending: false })

      if (profile.role === 'employee') {
        query = query.or(`employee_id.eq.${profile.id},employee_id.is.null`)
      }

      const { data } = await query
      setDocuments((data as AppDocument[]) ?? [])
      setLoading(false)
    })()
  }, [profile])

  if (!profile) return null
  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Documents</h1>

      <Card>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun document disponible pour le moment.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {documents.map((doc) => {
              const link = doc.macompta_paie_url ?? undefined
              return (
                <div key={doc.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{doc.document_name}</p>
                      <p className="text-xs text-slate-500">
                        {TYPE_LABELS[doc.document_type] ?? doc.document_type} · {formatDate(doc.created_at.slice(0, 10))}
                      </p>
                    </div>
                  </div>
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Ouvrir <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Lien à venir</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
