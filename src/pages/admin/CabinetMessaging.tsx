import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card'
import ChatThread from '../../components/ChatThread'
import type { Cabinet } from '../../lib/database.types'

export default function CabinetMessaging() {
  const { id } = useParams<{ id: string }>()
  const [cabinet, setCabinet] = useState<Cabinet | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data } = await supabase.from('cabinets').select('*').eq('id', id).single()
      setCabinet(data as Cabinet | null)
    })()
  }, [id])

  if (!id) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={`/cabinets/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Retour au cabinet
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">
          Messagerie {cabinet ? `— ${cabinet.name}` : ''}
        </h1>
      </div>
      <Card>
        <ChatThread cabinetId={id} />
      </Card>
    </div>
  )
}
