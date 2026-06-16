import type { Metadata } from 'next'
import 'leaflet/dist/leaflet.css'
import './globals.css'
import { Providers } from './providers'
import { NavBar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Human Atlas',
  description: 'Explore human evolution, migration, and genetic relationships across deep time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavBar />
          <main style={{ height: `calc(100% - var(--nav-height))`, position: 'relative' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
