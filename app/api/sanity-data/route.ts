import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { postsQuery, trailersQuery } from '@/sanity/lib/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const [trailers, posts] = await Promise.all([
      client.fetch(trailersQuery, {}, { cache: 'no-store' }),
      client.fetch(postsQuery, {}, { cache: 'no-store' }),
    ])

    return NextResponse.json(
      {
        trailers: trailers ?? [],
        posts: posts ?? [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error('Sanity API Fehler:', error)

    return NextResponse.json(
      {
        error: 'Die Verbindung zu Sanity ist fehlgeschlagen. Prüfe das VS-Code-Terminal für den genauen Fehler.',
      },
      { status: 500 },
    )
  }
}
