'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { client, urlFor } from '@/sanity/lib/client'
import { postsQuery, trailersQuery } from '@/sanity/lib/queries'

type SanityImage = {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
}

type Trailer = {
  _id: string
  title: string
  category: string
  shortDescription?: string
  description?: string
  pricePerDay?: string
  weekendPrice?: string
  deposit?: string
  totalWeight?: string
  payload?: string
  dimensions?: string
  braked?: boolean
  licenseClass?: string
  status?: string
  badge?: string
  heroImage?: SanityImage
  gallery?: SanityImage[]
}

type Post = {
  _id: string
  title: string
  dateLabel: string
  text: string
}

const categories = [
  'Alle',
  'Kastenanhänger',
  'Hochlader',
  'Kipper',
  'Autotransporter',
  'Motorradanhänger',
  'Tieflader',
]

const fallbackTrailers: Trailer[] = [
  {
    _id: 'demo-kasten',
    title: 'Kastenanhänger 750 kg',
    category: 'Kastenanhänger',
    shortDescription: 'Der praktische Allrounder für Umzug, Garten und Alltag.',
    description:
      'Kompakter, ungebremster Anhänger für Transporte im Alltag. Ideal für Möbel, Baumarkt-Einkäufe, Grünschnitt und kleinere Umzüge.',
    pricePerDay: '25 €',
    weekendPrice: '59 €',
    deposit: '100 €',
    totalWeight: '750 kg',
    payload: 'ca. 600 kg',
    dimensions: '2,05 × 1,10 m',
    braked: false,
    licenseClass: 'B',
    status: 'Verfügbar',
    badge: 'Beliebt',
  },
  {
    _id: 'demo-hochlader',
    title: 'Hochlader 1.300 kg',
    category: 'Hochlader',
    shortDescription: 'Viel Ladefläche und von drei Seiten einfach zu beladen.',
    description:
      'Gebremster Hochlader mit klappbaren Bordwänden. Perfekt für Baustoffe, Maschinen, Paletten und größere Transportaufgaben.',
    pricePerDay: '39 €',
    weekendPrice: '89 €',
    deposit: '150 €',
    totalWeight: '1.300 kg',
    payload: 'ca. 1.000 kg',
    dimensions: '2,60 × 1,50 m',
    braked: true,
    licenseClass: 'B / B96 / BE*',
    status: 'Verfügbar',
    badge: 'Top Preis',
  },
  {
    _id: 'demo-auto',
    title: 'Autotransporter 2.700 kg',
    category: 'Autotransporter',
    shortDescription: 'Sicherer Fahrzeugtransport mit Auffahrrampen und Winde.',
    description:
      'Robuster Autotransporter für PKW und kleinere Fahrzeuge. Mit Auffahrrampen, Winde und zahlreichen Verzurrpunkten ausgestattet.',
    pricePerDay: '69 €',
    weekendPrice: '159 €',
    deposit: '250 €',
    totalWeight: '2.700 kg',
    payload: 'ca. 2.000 kg',
    dimensions: '4,00 × 2,00 m',
    braked: true,
    licenseClass: 'BE*',
    status: 'Verfügbar',
    badge: 'Profi',
  },
]

function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  const paths: Record<string, React.ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" {...common}/><path d="M16 3v4M8 3v4M3 10h18" {...common}/></>,
    check: <path d="m5 12 4 4L19 6" {...common}/>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" {...common}/><path d="m9.2 12 1.8 1.8 3.8-4" {...common}/></>,
    clock: <><circle cx="12" cy="12" r="9" {...common}/><path d="M12 7v5l3 2" {...common}/></>,
    truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" {...common}/><circle cx="7" cy="18" r="2" {...common}/><circle cx="17" cy="18" r="2" {...common}/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" {...common}/></>,
    weight: <><path d="M7 8h10l2 12H5L7 8Z" {...common}/><path d="M9 8a3 3 0 0 1 6 0" {...common}/></>,
    ruler: <><path d="m4 17 13-13 3 3L7 20 4 17Z" {...common}/><path d="m14 7 3 3M11 10l2 2M8 13l3 3" {...common}/></>,
    user: <><circle cx="12" cy="8" r="4" {...common}/><path d="M4 21a8 8 0 0 1 16 0" {...common}/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" {...common}/><circle cx="12" cy="10" r="2.5" {...common}/></>,
    phone: <path d="M6.5 3h3l1.5 5-2 1.5a15 15 0 0 0 5.5 5.5l1.5-2 5 1.5v3c0 1.7-1.3 3-3 3C10.3 20.5 3.5 13.7 3.5 6a3 3 0 0 1 3-3Z" {...common}/>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" {...common}/></>,
    close: <><path d="m6 6 12 12M18 6 6 18" {...common}/></>,
  }

  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{paths[name]}</svg>
}

export default function Page() {
  const [trailers, setTrailers] = useState<Trailer[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [trailerData, postData] = await Promise.all([
          client.fetch<Trailer[]>(trailersQuery),
          client.fetch<Post[]>(postsQuery),
        ])
        setTrailers(trailerData?.length ? trailerData : fallbackTrailers)
        setPosts(postData || [])
      } catch {
        setTrailers(fallbackTrailers)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredTrailers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return trailers.filter((trailer) => {
      const categoryMatch = selectedCategory === 'Alle' || trailer.category === selectedCategory
      const searchMatch = !term ||
        trailer.title?.toLowerCase().includes(term) ||
        trailer.category?.toLowerCase().includes(term) ||
        trailer.shortDescription?.toLowerCase().includes(term)
      return categoryMatch && searchMatch
    })
  }, [trailers, selectedCategory, search])

  function getImage(image?: SanityImage) {
    return image ? urlFor(image).width(1400).height(900).url() : ''
  }

  function openTrailer(trailer: Trailer) {
    setSelectedTrailer(trailer)
    setSelectedImage(getImage(trailer.heroImage) || getImage(trailer.gallery?.[0]) || '')
  }

  function scrollToFleet() {
    document.getElementById('anhaenger')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070806] text-white">
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_15%_5%,rgba(245,158,11,0.18),transparent_24%),radial-gradient(circle_at_90%_30%,rgba(132,204,22,0.08),transparent_22%),linear-gradient(to_bottom,#070806,#0b0c09_45%,#070806)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.045] bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070806]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <a href="#top" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300 transition group-hover:bg-amber-400/15">
              <Icon name="truck" className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-400">ESCO</div>
              <div className="text-sm font-semibold tracking-wide text-white sm:text-base">Anhängervermietung</div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-zinc-300 lg:flex">
            <a className="transition hover:text-white" href="#anhaenger">Anhänger</a>
            <a className="transition hover:text-white" href="#ablauf">So funktioniert&apos;s</a>
            <a className="transition hover:text-white" href="#vorteile">Vorteile</a>
            <a className="transition hover:text-white" href="#faq">FAQ</a>
            <a className="transition hover:text-white" href="#kontakt">Kontakt</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-white/5">
              Kundenbereich
            </button>
            <button onClick={scrollToFleet} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300">
              Jetzt mieten
            </button>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-xl border border-white/10 p-2.5 text-zinc-200 md:hidden" aria-label="Menü öffnen">
            <Icon name={mobileMenu ? 'close' : 'menu'} />
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t border-white/10 bg-[#0b0c09] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4 text-sm text-zinc-200">
              <a onClick={() => setMobileMenu(false)} href="#anhaenger">Anhänger</a>
              <a onClick={() => setMobileMenu(false)} href="#ablauf">So funktioniert&apos;s</a>
              <a onClick={() => setMobileMenu(false)} href="#vorteile">Vorteile</a>
              <a onClick={() => setMobileMenu(false)} href="#faq">FAQ</a>
              <a onClick={() => setMobileMenu(false)} href="#kontakt">Kontakt</a>
              <button onClick={() => { setMobileMenu(false); scrollToFleet() }} className="mt-2 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-black">Jetzt mieten</button>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative mx-auto max-w-7xl px-5 pb-14 pt-14 md:px-6 md:pb-20 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Schnell. Flexibel. Zuverlässig.
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-0.045em] sm:text-6xl md:text-7xl">
                Der passende Anhänger für <span className="text-amber-400">dein Vorhaben.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
                Ob Umzug, Baustelle oder Fahrzeugtransport: Finde den passenden Anhänger, wähle deinen Mietzeitraum und starte unkompliziert in dein Projekt.
              </p>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-300">
                {['Faire Tagespreise', 'Flexible Mietdauer', 'Geprüfte Anhänger'].map((item) => (
                  <div key={item} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/15 text-amber-300"><Icon name="check" className="h-3.5 w-3.5" /></span>{item}</div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 -z-10 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 md:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.28em] text-amber-400">Direkt starten</div>
                    <h2 className="mt-2 text-2xl font-semibold">Verfügbarkeit prüfen</h2>
                  </div>
                  <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-amber-300 sm:flex"><Icon name="calendar" /></div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[.2em] text-zinc-500">Abholung</span>
                    <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white outline-none focus:border-amber-400/40 [color-scheme:dark]" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[.2em] text-zinc-500">Rückgabe</span>
                    <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white outline-none focus:border-amber-400/40 [color-scheme:dark]" />
                  </label>
                </div>

                <button onClick={scrollToFleet} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 font-semibold text-black transition hover:bg-amber-300">
                  Verfügbare Anhänger anzeigen <Icon name="arrow" />
                </button>

                <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-black/20 py-4 text-center">
                  <div><div className="text-lg font-semibold text-white">ab 25 €</div><div className="mt-1 text-[11px] text-zinc-500">pro Tag</div></div>
                  <div><div className="text-lg font-semibold text-white">7 Tage</div><div className="mt-1 text-[11px] text-zinc-500">die Woche</div></div>
                  <div><div className="text-lg font-semibold text-white">100%</div><div className="mt-1 text-[11px] text-zinc-500">transparent</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-5 md:grid-cols-4 md:px-6">
            {[
              ['shield', 'Sicher mieten', 'Regelmäßig geprüft'],
              ['clock', 'Flexibel', 'Tages- & Wochenendmiete'],
              ['truck', 'Große Auswahl', 'Für jedes Vorhaben'],
              ['user', 'Persönlich', 'Direkter Ansprechpartner'],
            ].map(([icon, title, text]) => (
              <div key={title} className="flex gap-3 border-white/10 px-3 py-6 sm:px-5 md:border-r md:last:border-r-0">
                <div className="mt-0.5 text-amber-400"><Icon name={icon} /></div>
                <div><div className="text-sm font-semibold">{title}</div><div className="mt-1 text-xs text-zinc-500">{text}</div></div>
              </div>
            ))}
          </div>
        </section>

        <section id="anhaenger" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-6 md:py-28">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-400">Unsere Flotte</div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Anhänger für jeden Einsatz</h2>
              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">Vom kompakten Kastenanhänger bis zum Autotransporter. Alle wichtigen Daten und Preise auf einen Blick.</p>
            </div>
            <div className="text-sm text-zinc-500">{filteredTrailers.length} Anhänger gefunden</div>
          </div>

          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Anhänger durchsuchen ..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-400/40" />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button key={category} onClick={() => setSelectedCategory(category)} className={`rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${selectedCategory === category ? 'bg-amber-400 text-black' : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]'}`}>
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-zinc-400">Anhänger werden geladen ...</div>
          ) : filteredTrailers.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredTrailers.map((trailer) => {
                const image = getImage(trailer.heroImage)
                return (
                  <article key={trailer._id} className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-amber-400/25 hover:bg-white/[0.05]">
                    <button onClick={() => openTrailer(trailer)} className="block w-full text-left">
                      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950">
                        {image ? <img src={image} alt={trailer.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-zinc-700"><Icon name="truck" className="h-20 w-20" /></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {trailer.badge && <div className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-semibold text-black">{trailer.badge}</div>}
                        <div className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs backdrop-blur">{trailer.status || 'Verfügbar'}</div>
                      </div>
                    </button>
                    <div className="p-5 md:p-6">
                      <div className="text-xs font-medium uppercase tracking-[.22em] text-amber-400">{trailer.category}</div>
                      <h3 className="mt-2 text-xl font-semibold">{trailer.title}</h3>
                      <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-400">{trailer.shortDescription || trailer.description}</p>

                      <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3"><span className="text-zinc-500">Gesamtgewicht</span><div className="mt-1 font-medium text-zinc-200">{trailer.totalWeight || '—'}</div></div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3"><span className="text-zinc-500">Nutzlast</span><div className="mt-1 font-medium text-zinc-200">{trailer.payload || '—'}</div></div>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                        <div><div className="text-xs text-zinc-500">ab</div><div className="text-2xl font-semibold text-white">{trailer.pricePerDay || 'Preis auf Anfrage'} <span className="text-xs font-normal text-zinc-500">/ Tag</span></div></div>
                        <button onClick={() => openTrailer(trailer)} className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400 hover:text-black">Details <Icon name="arrow" className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-zinc-400">Keine passenden Anhänger gefunden.</div>
          )}
        </section>

        <section id="ablauf" className="scroll-mt-24 border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-6 md:py-24">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-400">Einfach mieten</div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">In drei Schritten zum Anhänger</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                ['01', 'Anhänger auswählen', 'Wähle den Anhänger, der zu deinem Transport und deiner Führerscheinklasse passt.'],
                ['02', 'Termin festlegen', 'Abhol- und Rückgabetermin auswählen und Verfügbarkeit direkt prüfen.'],
                ['03', 'Abholen & losfahren', 'Buchung abschließen, Anhänger übernehmen und dein Vorhaben starten.'],
              ].map(([number, title, text]) => (
                <div key={number} className="relative rounded-[1.75rem] border border-white/10 bg-[#0d0e0b] p-7">
                  <div className="text-5xl font-semibold tracking-tighter text-amber-400/20">{number}</div>
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="vorteile" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-5 py-20 md:px-6 md:py-28 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-400">Warum ESCO?</div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Vermietung ohne unnötigen Aufwand.</h2>
            <p className="mt-5 max-w-xl leading-8 text-zinc-400">Klare Preise, gepflegte Anhänger und ein unkomplizierter Ablauf. Du weißt vorher, was du bekommst und was es kostet.</p>
            <button onClick={scrollToFleet} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200">Anhänger ansehen <Icon name="arrow" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['shield', 'Geprüfte Technik', 'Unsere Anhänger werden regelmäßig kontrolliert und gepflegt.'],
              ['calendar', 'Flexible Zeiträume', 'Tagesmiete, Wochenende oder länger – passend zu deinem Projekt.'],
              ['weight', 'Passend zum Transport', 'Technische Daten und Nutzlast werden transparent angezeigt.'],
              ['user', 'Direkter Kontakt', 'Bei Fragen bekommst du einen persönlichen Ansprechpartner.'],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400"><Icon name={icon} /></div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {posts.length > 0 && (
          <section className="mx-auto max-w-7xl px-5 pb-20 md:px-6 md:pb-28">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-400">Aktuelles</div>
              <h2 className="mt-3 text-3xl font-semibold">Neuigkeiten & Hinweise</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {posts.map((post) => (
                  <article key={post._id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="text-lg font-semibold">{post.title}</div>
                    <div className="mt-1 text-xs text-zinc-500">{post.dateLabel}</div>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">{post.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="faq" className="scroll-mt-24 border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:px-6 md:py-24 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-400">FAQ</div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">Häufige Fragen</h2>
              <p className="mt-4 leading-7 text-zinc-500">Die wichtigsten Antworten rund um Abholung, Führerschein, Kaution und Rückgabe.</p>
            </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {[
                ['Welchen Führerschein brauche ich?', 'Das hängt vom zulässigen Gesamtgewicht des Gespanns ab. Die benötigte Führerscheinklasse wird bei jedem Anhänger angegeben. Prüfe im Zweifel zusätzlich die zulässigen Werte deines Zugfahrzeugs.'],
                ['Muss ich eine Kaution hinterlegen?', 'Ja, je nach Anhänger kann eine Kaution erforderlich sein. Die genaue Höhe siehst du bereits vor der Buchung in den Anhängerdetails.'],
                ['Kann ich den Anhänger länger als einen Tag mieten?', 'Ja. Neben Tagesmieten sind auch Wochenend- und längere Mietzeiträume möglich.'],
                ['Was muss ich zur Abholung mitbringen?', 'In der Regel benötigst du einen gültigen Führerschein sowie ein Ausweisdokument. Weitere Details erhältst du mit deiner Buchungsbestätigung.'],
              ].map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-medium"><span>{q}</span><span className="text-amber-400 transition group-open:rotate-45">+</span></summary>
                  <p className="max-w-3xl pt-4 text-sm leading-7 text-zinc-500">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="kontakt" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-6 md:py-28">
          <div className="overflow-hidden rounded-[2rem] border border-amber-400/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,.16),transparent_32%),rgba(255,255,255,.035)] p-7 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-end">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-400">Bereit für dein Projekt?</div>
                <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">Finde jetzt den passenden Anhänger.</h2>
                <p className="mt-5 max-w-2xl leading-8 text-zinc-400">Wähle deinen Mietzeitraum und entdecke die passenden Anhänger für deinen Transport.</p>
                <button onClick={scrollToFleet} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-amber-300">Verfügbarkeit prüfen <Icon name="arrow" /></button>
              </div>
              <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4"><Icon name="pin" className="h-5 w-5 text-amber-400" /><span>Standort wird noch eingetragen</span></div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4"><Icon name="phone" className="h-5 w-5 text-amber-400" /><span>Telefon wird noch eingetragen</span></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-7xl px-5 py-10 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400"><Icon name="truck" /></div><div><div className="text-[10px] uppercase tracking-[.3em] text-amber-400">ESCO</div><div className="font-semibold">Anhängervermietung</div></div></div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-500">Einfach den passenden Anhänger finden, Zeitraum wählen und unkompliziert mieten.</p>
            </div>
            <div className="text-sm"><div className="font-semibold text-zinc-200">Navigation</div><div className="mt-4 grid gap-2 text-zinc-500"><a href="#anhaenger" className="hover:text-white">Anhänger</a><a href="#ablauf" className="hover:text-white">Ablauf</a><a href="#faq" className="hover:text-white">FAQ</a><a href="#kontakt" className="hover:text-white">Kontakt</a></div></div>
            <div className="text-sm"><div className="font-semibold text-zinc-200">Rechtliches</div><div className="mt-4 grid gap-2 text-zinc-500"><span>Impressum</span><span>Datenschutz</span><span>AGB / Mietbedingungen</span><a href="/studio" className="mt-2 text-zinc-700 hover:text-zinc-400">Admin</a></div></div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-zinc-600">© {new Date().getFullYear()} ESCO Anhängervermietung. Alle Rechte vorbehalten.</div>
        </div>
      </footer>

      {selectedTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-3 py-4 backdrop-blur-md md:px-6">
          <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-[1.75rem] border border-white/10 bg-[#0c0d0a] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#0c0d0a]/95 px-5 py-5 backdrop-blur md:px-7">
              <div><div className="text-[10px] font-semibold uppercase tracking-[.28em] text-amber-400">{selectedTrailer.category}</div><h2 className="mt-1 text-2xl font-semibold md:text-3xl">{selectedTrailer.title}</h2></div>
              <button onClick={() => { setSelectedTrailer(null); setSelectedImage('') }} className="rounded-xl border border-white/10 p-2.5 text-zinc-300 transition hover:bg-white/5" aria-label="Schließen"><Icon name="close" /></button>
            </div>

            <div className="grid gap-7 p-5 md:p-7 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <div className="flex h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-800 to-black md:h-[430px]">
                  {selectedImage ? <img src={selectedImage} alt={selectedTrailer.title} className="h-full w-full object-cover" /> : <Icon name="truck" className="h-28 w-28 text-zinc-700" />}
                </div>
                {(selectedTrailer.heroImage || selectedTrailer.gallery?.length) && (
                  <div className="mt-3 grid grid-cols-4 gap-2.5">
                    {[selectedTrailer.heroImage, ...(selectedTrailer.gallery || [])].filter(Boolean).slice(0, 8).map((image, index) => {
                      const src = getImage(image as SanityImage)
                      return <button key={index} onClick={() => setSelectedImage(src)} className={`overflow-hidden rounded-xl border ${selectedImage === src ? 'border-amber-400' : 'border-white/10'}`}><img src={src} alt="" className="h-20 w-full object-cover" /></button>
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">{selectedTrailer.badge && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black">{selectedTrailer.badge}</span>}<span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">{selectedTrailer.status || 'Verfügbar'}</span></div>
                <p className="mt-5 leading-7 text-zinc-400">{selectedTrailer.description || selectedTrailer.shortDescription}</p>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['weight', 'Gesamtgewicht', selectedTrailer.totalWeight],
                    ['weight', 'Nutzlast', selectedTrailer.payload],
                    ['ruler', 'Ladefläche', selectedTrailer.dimensions],
                    ['shield', 'Gebremst', selectedTrailer.braked ? 'Ja' : 'Nein'],
                    ['user', 'Führerschein', selectedTrailer.licenseClass],
                    ['calendar', 'Wochenende', selectedTrailer.weekendPrice],
                  ].map(([icon, label, value]) => (
                    <div key={label as string} className="rounded-xl border border-white/10 bg-black/20 p-3.5"><div className="flex items-center gap-2 text-xs text-zinc-500"><Icon name={icon as string} className="h-4 w-4" />{label}</div><div className="mt-2 font-medium text-zinc-200">{value || '—'}</div></div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-5">
                  <div className="flex items-end justify-between gap-3"><div><div className="text-xs text-zinc-500">Mietpreis ab</div><div className="mt-1 text-3xl font-semibold">{selectedTrailer.pricePerDay || 'Auf Anfrage'} <span className="text-sm font-normal text-zinc-500">/ Tag</span></div></div><div className="text-right text-xs text-zinc-500">Kaution<br/><span className="text-sm text-zinc-300">{selectedTrailer.deposit || '—'}</span></div></div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2"><input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm [color-scheme:dark]"/><input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm [color-scheme:dark]"/></div>
                  <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-amber-300">Diesen Anhänger mieten <Icon name="arrow" /></button>
                </div>
                <p className="mt-4 text-[11px] leading-5 text-zinc-600">* Die tatsächlich benötigte Führerscheinklasse hängt vom Zugfahrzeug und der zulässigen Gesamtmasse des Gespanns ab.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <button onClick={scrollToFleet} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 text-sm font-semibold text-black shadow-2xl shadow-black/50">Anhänger mieten <Icon name="arrow" /></button>
      </div>
    </div>
  )
}
