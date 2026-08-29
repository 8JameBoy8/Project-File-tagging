'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export default function Topbar({ title }: { title: string }) {
    const pathname = usePathname()

    const tabs = [
        { name: 'Home', href: '/', icon: <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg> },
        { name: 'Manage Tag', href: '/manage-tag', icon: <svg viewBox="0 0 24 24"><path d="M20 12l-8 8-9-9V4h7l9 9z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg> },
        { name: 'Import File', href: '/user/uploadfile', icon: <svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg> },
        { name: 'Create Tag', href: '/create-tag', icon: <svg viewBox="0 0 24 24"><path d="M12 8v8M8 12h8" /><rect x="3" y="3" width="18" height="18" rx="4" /></svg> },
        { name: 'Setting', href: '/user/setting', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" /></svg> },
    ]

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 28px', background: 'var(--surface-alt)', borderBottom: '1px solid var(--line)', flexShrink: 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {tabs.map(tab => {
                    const active = pathname === tab.href
                    return (
                        <Link key={tab.href} href={tab.href} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            padding: '8px 16px', borderRadius: 'var(--radius)', color: 'var(--ink)',
                            textDecoration: 'none', background: active ? 'var(--accent-soft)' : 'transparent',
                            transition: 'background .15s ease' // in a real app, we'd use classNames for active state
                        }}
                        /* Add simple basic hover effect by wrapping in a class if we want, but inline works here for speed */
                        >
                            <div style={{ width: '20px', height: '20px', stroke: 'var(--ink)', fill: 'none', strokeWidth: 1.6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {tab.icon}
                            </div>
                            <span style={{ fontSize: '12.5px', fontWeight: 500, color: active ? 'var(--accent)' : 'var(--muted)' }}>
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '20px', letterSpacing: '.2px' }}>
                    {title}
                </span>
                <div style={{
                    width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-soft)',
                    border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', cursor: 'pointer', flexShrink: 0
                }}>
                    <svg style={{ width: '22px', height: '22px', stroke: 'var(--accent)', fill: 'none', strokeWidth: 1.6 }} viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="3.2" /><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
