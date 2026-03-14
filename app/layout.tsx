import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GVMP Autohaus',
  description: 'Privater Fahrzeughandel im GVMP Stil',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}