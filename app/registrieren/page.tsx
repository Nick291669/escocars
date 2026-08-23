'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

function RegisterForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/konto'
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      window.location.href = next.startsWith('/') ? next : '/konto'
      return
    }

    setMessage('Konto erstellt. Bitte bestätige jetzt die E-Mail, die Supabase dir geschickt hat, und logge dich danach ein.')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">← Zur Startseite</Link>
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Neues Kundenkonto</div>
          <h1 className="mt-3 text-3xl font-semibold">Registrieren</h1>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm text-zinc-300">Vor- und Nachname<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-amber-400/60" /></label>
            <label className="block text-sm text-zinc-300">Telefon<input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-amber-400/60" /></label>
            <label className="block text-sm text-zinc-300">E-Mail<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-amber-400/60" /></label>
            <label className="block text-sm text-zinc-300">Passwort<input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-amber-400/60" /><span className="mt-1 block text-xs text-zinc-600">Mindestens 6 Zeichen.</span></label>
            {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}
            <button disabled={loading} className="w-full rounded-xl bg-amber-400 px-4 py-3.5 font-semibold text-black hover:bg-amber-300 disabled:opacity-60">{loading ? 'Konto wird erstellt…' : 'Konto erstellen'}</button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500">Schon registriert? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-amber-400">Einloggen</Link></p>
        </div>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#070806] text-white" />}><RegisterForm /></Suspense>
}
