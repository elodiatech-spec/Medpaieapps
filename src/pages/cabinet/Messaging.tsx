import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/Card'
import ChatThread from '../../components/ChatThread'

export default function Messaging() {
  const { profile } = useAuth()
  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Messagerie</h1>
      <Card>
        <ChatThread cabinetId={profile.cabinet_id} />
      </Card>
    </div>
  )
}
