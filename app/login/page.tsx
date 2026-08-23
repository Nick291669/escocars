'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/konto'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'E-Mail oder Passwort ist nicht korrekt.' : error.message)
      setLoading(false)
      return
    }
    window.location.href = next.startsWith('/') ? next : '/konto'
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">← Zur Startseite</Link>
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Kundenbereich</div>
          <h1 className="mt-3 text-3xl font-semibold">Einloggen</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Melde dich an, um Buchungen zu erstellen und deine Mieten zu verwalten.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm text-zinc-300">E-Mail
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-amber-400/60" />
            </label>
            <label className="block text-sm text-zinc-300">Passwort
              <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-amber-400/60" />
            </label>
            {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            <button disabled={loading} className="w-full rounded-xl bg-amber-400 px-4 py-3.5 font-semibold text-black transition hover:bg-amber-300 disabled:opacity-60">{loading ? 'Wird angemeldet…' : 'Einloggen'}</button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">Noch kein Konto? <Link href={`/registrieren?next=${encodeURIComponent(next)}`} className="font-medium text-amber-400 hover:text-amber-300">Jetzt registrieren</Link></p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#070806] text-white" />}><LoginForm /></Suspense>
}
