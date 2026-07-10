import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Message, Profile } from '../lib/database.types'

export default function ChatThread({ cabinetId }: { cabinetId: string }) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [senders, setSenders] = useState<Record<string, Profile>>({})
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const [{ data: msgs }, { data: members }] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('cabinet_id', cabinetId)
          .order('created_at', { ascending: true })
          .limit(200),
        supabase.from('profiles').select('*').eq('cabinet_id', cabinetId),
      ])
      if (!active) return
      setMessages((msgs as Message[]) ?? [])
      const map: Record<string, Profile> = {}
      for (const m of (members as Profile[]) ?? []) map[m.id] = m
      setSenders(map)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`messages-${cabinetId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `cabinet_id=eq.${cabinetId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [cabinetId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile || !body.trim()) return
    const text = body.trim()
    setBody('')
    await supabase.from('messages').insert({
      cabinet_id: cabinetId,
      sender_id: profile.id,
      body: text,
    })
  }

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-[28rem] min-h-[16rem] flex-col gap-3 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-slate-400">Aucun message pour le moment.</p>
        )}
        {messages.map((m) => {
          const sender = senders[m.sender_id]
          const isMe = m.sender_id === profile?.id
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="mb-0.5 text-xs text-slate-400">
                {sender ? `${sender.first_name} ${sender.last_name}` : '…'}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  isMe ? 'bg-brand-600 text-white' : 'bg-white text-slate-800 ring-1 ring-black/5'
                }`}
              >
                {m.body}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
