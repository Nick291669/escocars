'use client'

import Link from 'next/link'

type Section = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

export default function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string
  title: string
  intro: string
  sections: Section[]
}) {
  return (
    <main className="min-h-screen bg-[#080906] text-zinc-100">
      <div className="mx-auto max-w-4xl px-5 py-10 md:px-6 md:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold tracking-[0.14em] text-amber-400">
            LIWA
          </Link>
          <Link href="/" className="text-sm text-zinc-500 transition hover:text-white">
            Zur Startseite
          </Link>
        </div>

        <header className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-9">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
            {eyebrow}
          </div>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{intro}</p>
        </header>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-7">
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index} className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-400">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-400">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-6 text-xs text-zinc-500">
          <Link href="/impressum" className="hover:text-amber-300">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-amber-300">Datenschutz</Link>
          <Link href="/agb" className="hover:text-amber-300">AGB</Link>
          <Link href="/mietbedingungen" className="hover:text-amber-300">Mietbedingungen</Link>
        </footer>
      </div>
    </main>
  )
}
