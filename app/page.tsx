'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { postsQuery, vehiclesQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/client'

type SanityImage = {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
}

type Vehicle = {
  _id: string
  title: string
  brand: string
  category: string
  price: string
  mileage: string
  fuel: string
  transmission: string
  stock: number
  status: string
  badge: string
  description: string
  heroImage?: SanityImage
  gallery?: SanityImage[]
}
type Post = {
  _id: string
  title: string
  dateLabel: string
  text: string
}

const categories = ['Alle', 'Limousine', 'Coupé', 'Sportwagen', 'SUV']

export default function Page() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const [vehicleData, postData] = await Promise.all([
      client.fetch(vehiclesQuery),
      client.fetch(postsQuery),
    ])
    setVehicles(vehicleData)
    setPosts(postData)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])
   const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const categoryMatch = selectedCategory === 'Alle' || vehicle.category === selectedCategory
      const searchMatch =
        vehicle.title?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.brand?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.category?.toLowerCase().includes(search.toLowerCase())
      return categoryMatch && searchMatch
    })
  }, [vehicles, selectedCategory, search])

  function getImage(image?: SanityImage) {
    return image ? urlFor(image).width(1200).height(800).url() : ''
  }

  function openVehicle(vehicle: Vehicle) {
    setSelectedVehicle(vehicle)
    setSelectedImage(getImage(vehicle.heroImage) || getImage(vehicle.gallery?.[0]))
  }

  function closeVehicle() {
    setSelectedVehicle(null)
    setSelectedImage('')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_22%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.06),transparent_16%),linear-gradient(to_bottom,#030303,#080808,#050505)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:38px_38px]" />

    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.45em] text-amber-400">ESCOBAR CARS Premium Showroom</div>
            <div className="mt-1 text-lg font-semibold">Privater Fahrzeughandel</div>
          </div>
          <div className="hidden rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-100 md:block">
            Galerie · Fahrzeuge · Beiträge
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-8 md:py-12">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.45em] text-amber-400">Bestandsfilter</div>
                <h2 className="mt-3 text-3xl font-semibold">Fahrzeuge durchsuchen</h2>
              </div>
              <div className="flex w-full flex-col gap-4 lg:max-w-2xl lg:flex-row">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suche nach Marke, Modell oder Kategorie"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
                />

                 <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-3 text-sm transition ${
                        selectedCategory === category
                          ? 'border border-amber-400/30 bg-amber-400/10 text-amber-100'
                          : 'border border-white/10 bg-white/5 text-zinc-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.45em] text-amber-400">Vehicle Gallery</div>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Showroom Fahrzeuge</h2>
            </div>
            <p className="max-w-2xl text-zinc-400 leading-8">
              Klicke auf ein Fahrzeug, um die Detailansicht mit mehreren Bildern, Daten und kompletter Beschreibung zu öffnen.
            </p>
          </div>

             {loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center text-zinc-300">
              Fahrzeuge werden geladen ...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
                <button
                  key={vehicle._id}
                  onClick={() => openVehicle(vehicle)}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] text-left transition duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-white/[0.06]"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img src={getImage(vehicle.heroImage)} alt={vehicle.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                      {vehicle.badge}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xl font-semibold">{vehicle.title}</div>
                        <div className="mt-1 text-sm text-zinc-300">{vehicle.brand} · {vehicle.category}</div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-100">
                        {vehicle.status}
                      </div>
                    </div>
                  </div>
                    <div className="p-6">
                    <p className="leading-7 text-zinc-300">{vehicle.description}</p>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-200">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">Preis<br /><span className="text-amber-300">{vehicle.price}</span></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">Bestand<br /><span className="text-amber-300">{vehicle.stock}</span></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">KM<br /><span className="text-amber-300">{vehicle.mileage}</span></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">Getriebe<br /><span className="text-amber-300">{vehicle.transmission}</span></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && filteredVehicles.length === 0 && (
            <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center text-zinc-300">
              Keine Fahrzeuge für diese Suche gefunden.
            </div>
          )}
        </section>
         <section className="mx-auto max-w-7xl px-6 pb-24 pt-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
            <div className="text-xs uppercase tracking-[0.45em] text-amber-400">Dealer News</div>
            <h2 className="mt-3 text-3xl font-semibold">Aktuelle Beiträge</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <div key={post._id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div>
                    <div className="text-lg font-medium">{post.title}</div>
                    <div className="mt-1 text-sm text-zinc-400">{post.dateLabel}</div>
                  </div>
                  <p className="mt-3 leading-7 text-zinc-300">{post.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-zinc-400">
            Escobar Fahrzeughandel · Showroom Seite
          </div>
          
        </div>
      </footer>
       {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.45em] text-amber-400">Fahrzeug Detailansicht</div>
                <h2 className="mt-3 text-3xl font-semibold md:text-5xl">{selectedVehicle.title}</h2>
                <p className="mt-2 text-zinc-400">{selectedVehicle.brand} · {selectedVehicle.category} · {selectedVehicle.status}</p>
              </div>
              <button
                onClick={closeVehicle}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200"
              >
                Schließen
              </button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
                  <img src={selectedImage} alt={selectedVehicle.title} className="h-[420px] w-full object-cover" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-4">
                  {[selectedVehicle.heroImage, ...(selectedVehicle.gallery || [])].filter(Boolean).map((image, index) => {
                    const imageUrl = getImage(image as SanityImage)
                    return (
                      <button
                        key={`${selectedVehicle._id}-${index}`}
                        onClick={() => setSelectedImage(imageUrl)}
                        className={`overflow-hidden rounded-2xl border ${selectedImage === imageUrl ? 'border-amber-400/40' : 'border-white/10'} bg-black/20`}
                      >
                        <img src={imageUrl} alt={`${selectedVehicle.title} ${index + 1}`} className="h-24 w-full object-cover" />
                      </button>
                    )
                  })}
                    </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                  {selectedVehicle.badge}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-200">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Preis<br /><span className="text-lg text-amber-300">{selectedVehicle.price}</span></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Bestand<br /><span className="text-lg text-amber-300">{selectedVehicle.stock}</span></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">KM<br /><span className="text-amber-300">{selectedVehicle.mileage}</span></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Getriebe<br /><span className="text-amber-300">{selectedVehicle.transmission}</span></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Kraftstoff<br /><span className="text-amber-300">{selectedVehicle.fuel}</span></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Kategorie<br /><span className="text-amber-300">{selectedVehicle.category}</span></div>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="text-sm uppercase tracking-[0.28em] text-amber-400">Beschreibung</div>
                  <p className="mt-3 leading-8 text-zinc-300">{selectedVehicle.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}