import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ESCO Anhängervermietung | Anhänger einfach mieten',
  description: 'Anhänger für Umzug, Baustelle und Fahrzeugtransport einfach und flexibel mieten.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
