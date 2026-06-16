'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAtlasStore } from '@/store/useAtlasStore'

const modes = [
  { href: '/evolution', label: 'Evolution',  icon: '⊕' },
  { href: '/migration', label: 'Migration',  icon: '⟶' },
  { href: '/genetics',  label: 'Genetics',   icon: '⊗' },
]

function formatEra(era: number) {
  const abs = Math.abs(era)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M BP`
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)}K BP`
  return `${abs.toLocaleString()} BP`
}

export function NavBar() {
  const pathname = usePathname()
  const activeEra = useAtlasStore(s => s.activeEra)

  return (
    <nav style={{
      height: 'var(--nav-height)',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'relative',
      zIndex: 100,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <span style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '1.5px solid var(--accent-amber)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: 'var(--accent-amber)',
        }}>◉</span>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
        }}>Human Atlas</span>
      </Link>

      <div style={{ display: 'flex', gap: 2 }}>
        {modes.map(({ href, label, icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.04em',
              color: active ? 'var(--text-amber-bright)' : 'var(--text-secondary)',
              background: active ? 'rgba(217, 119, 6, 0.12)' : 'transparent',
              border: active ? '1px solid rgba(217, 119, 6, 0.25)' : '1px solid transparent',
              transition: 'all var(--transition-fast)',
              textTransform: 'uppercase',
            }}>
              <span style={{ fontSize: 11, opacity: active ? 1 : 0.6 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </div>

      <div style={{
        flex: 1,
        textAlign: 'right',
        fontSize: 11,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
      }}>
        <span style={{ color: 'var(--text-secondary)' }}>{formatEra(activeEra)}</span>
      </div>
    </nav>
  )
}