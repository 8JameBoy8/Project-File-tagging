'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/Topbar'
import { useLanguage } from '@/context/LanguageContext'

type Tag = { id: string, name: string, color: string }
type FileItem = { id: string, name: string, ext: string, type: string, tags: string[], size: number, src: string, date: string, uploadedAt: string, hasPassword: boolean }

export default function HomePage() {
  const { t } = useLanguage()
  const [files, setFiles] = useState<FileItem[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [sortMode, setSortMode] = useState('date-desc')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  const [sortOpen, setSortOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)

  // ไฟล์ที่มีรหัสผ่านและเพิ่งปลดล็อกแล้ว (เฉพาะ session นี้ รีเฟรชหน้าแล้วต้องกรอกใหม่)
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const fetchFiles = async () => {
    let url = `/api/files?sort=${sortMode}`
    activeTags.forEach(t => { url += `&tagId=${t}` })

    try {
      const res = await fetch(url)
      if (res.ok) setFiles(await res.json())
    } catch (e) { }
  }

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) setAllTags(await res.json())
    } catch (e) { }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (the API) on mount, not deriving state from props/state
    fetchTags()
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (the API) when sort/filter changes, not deriving state from props/state
    fetchFiles()
  }, [sortMode, activeTags])

  const handleDelete = async () => {
    if (!selectedId) return
    if (!confirm(t('confirmDeleteFile'))) return
    try {
      await fetch(`/api/files/${selectedId}`, { method: 'DELETE' })
      setSelectedId(null)
      fetchFiles()
    } catch (e) { }
  }

  const handleDownload = () => {
    if (!selectedId) return
    window.location.href = `/api/files/${selectedId}/download`
  }

  const toggleTag = (id: string) => {
    const next = new Set(activeTags)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setActiveTags(next)
  }

  const selectFile = (id: string) => {
    setSelectedId(id)
    setPasswordInput('')
    setPasswordError('')
  }

  const handleVerifyFilePassword = async () => {
    if (!selectedId) return
    setVerifying(true)
    setPasswordError('')
    try {
      const res = await fetch(`/api/files/${selectedId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      })
      if (res.ok) {
        setUnlockedIds(prev => new Set(prev).add(selectedId))
        setPasswordInput('')
      } else {
        const data = await res.json()
        setPasswordError(data?.error?.message || t('passwordIncorrect'))
      }
    } catch {
      setPasswordError(t('passwordIncorrect'))
    } finally {
      setVerifying(false)
    }
  }

  const selectedFile = files.find(f => f.id === selectedId)
  const isLocked = !!selectedFile?.hasPassword && !unlockedIds.has(selectedFile.id)

  const getTagColor = (tagName: string) => allTags.find(t => t.name === tagName)?.color || 'var(--accent)'

  const sortLabels: Record<string, string> = {
    'date-desc': t('sortNewest'),
    'date-asc': t('sortOldest'),
    'type': t('sortByType'),
    'name': t('sortByName'),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title={t('home')} />

      <div style={{ display: 'flex', gap: 22, padding: '18px 28px', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT PANEL */}
        <div style={{ flex: '0 1 40%', maxWidth: '40%', minWidth: 320, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 16, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>

          <div style={{ width: '100%', flex: '1 1 auto', minHeight: 140, maxHeight: '38vh', background: 'var(--surface-alt)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            {!selectedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
                <svg viewBox="0 0 24 24" style={{ width: 38, height: 38, stroke: 'var(--muted)', fill: 'none', strokeWidth: 1.4 }}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 15l-5-5-11 11" /></svg>
                <span style={{ fontSize: 13.5 }}>{t('selectFileToPreview')}</span>
              </div>
            ) : isLocked ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--muted)', padding: '0 20px', width: '100%' }}>
                <span style={{ fontSize: 30 }}>🔒</span>
                <span style={{ fontSize: 13, textAlign: 'center' }}>{t('filePasswordRequiredMsg')}</span>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleVerifyFilePassword() }}
                  placeholder={t('enterPasswordEllipsis')}
                  style={{ width: '100%', maxWidth: 220, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 6, textAlign: 'center' }}
                />
                {passwordError && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{passwordError}</span>}
                <button onClick={handleVerifyFilePassword} disabled={verifying} style={{ padding: '8px 20px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 6, fontWeight: 'bold', fontSize: 13 }}>
                  {t('unlock')}
                </button>
              </div>
            ) : selectedFile.type === 'image' ? (
              <img src={selectedFile.src} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0F1614' }} />
            ) : selectedFile.type === 'video' ? (
              <video src={selectedFile.src} controls style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0F1614' }} />
            ) : selectedFile.type === 'audio' ? (
              <audio src={selectedFile.src} controls style={{ width: '80%' }} />
            ) : (
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>.{selectedFile.ext} FILE</div>
            )}
          </div>

          {selectedFile && (
            <>
              <div style={{ textAlign: 'center', marginTop: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14.5 }}>{selectedFile.name}</div>
              <div style={{ marginTop: 12, flexShrink: 0 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--muted)', marginBottom: 6 }}>{t('fileName')}</label>
                <div style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface-alt)', padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, minHeight: 20 }}>
                  {selectedFile.name}
                </div>
              </div>
              <div style={{ marginTop: 12, flexShrink: 0 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--muted)', marginBottom: 6 }}>{t('fileTagLabel')}</label>
                <div style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface-alt)', padding: '9px 12px', minHeight: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedFile.tags.length > 0 ? selectedFile.tags.map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, background: 'var(--surface)', border: '1px solid var(--line)', padding: '4px 9px 4px 7px', borderRadius: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: getTagColor(t) }}></span>{t}
                    </span>
                  )) : <span style={{ color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>—</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexShrink: 0 }}>
                <button onClick={handleDownload} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, padding: '11px 14px', fontWeight: 600, fontSize: 14, background: 'var(--ok-soft)', color: 'var(--ok)' }}>{t('download')}</button>
                <button onClick={handleDelete} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, padding: '11px 14px', fontWeight: 600, fontSize: 14, background: 'var(--danger-soft)', color: 'var(--danger)' }}>{t('delete')}</button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: '1 1 60%', minWidth: 340, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 14, flexShrink: 0, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setSortOpen(!sortOpen); setTagOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 14px', fontSize: 13.5, fontWeight: 500, boxShadow: 'var(--shadow)' }}>
                {t('sortLabel')}: {sortLabels[sortMode]}
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 20, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: 'var(--shadow)', padding: 8, minWidth: 200 }}>
                  {['date-desc', 'date-asc', 'type', 'name'].map(s => (
                    <div key={s} onClick={() => { setSortMode(s); setSortOpen(false) }} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: sortMode === s ? 'var(--surface-alt)' : 'transparent', fontWeight: sortMode === s ? 'bold' : 'normal', color: sortMode === s ? 'var(--accent)' : 'inherit' }}>
                      {sortLabels[s]}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button onClick={() => { setTagOpen(!tagOpen); setSortOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 14px', fontSize: 13.5, fontWeight: 500, boxShadow: 'var(--shadow)' }}>
                {t('filterTag')} {activeTags.size > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '2px 6px', fontSize: 10 }}>{activeTags.size}</span>}
              </button>
              {tagOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 20, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: 'var(--shadow)', padding: 8, minWidth: 220 }}>
                  {allTags.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={activeTags.has(t.id)} onChange={() => toggleTag(t.id)} style={{ accentColor: 'var(--accent)' }} />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{t.name}</span>
                    </label>
                  ))}
                  {allTags.length === 0 && <div style={{ padding: 10, color: 'var(--muted)', fontSize: 12.5 }}>{t('noTagsExist')}</div>}
                  <div style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={() => setActiveTags(new Set())} style={{ color: 'var(--muted)', fontSize: 12, textDecoration: 'underline' }}>{t('clearSelection')}</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}>
            {files.map(f => (
              <div key={f.id} onClick={() => selectFile(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: '1px solid var(--line)', cursor: 'pointer', background: selectedId === f.id ? 'var(--accent-soft)' : 'transparent', borderLeft: `3px solid ${selectedId === f.id ? 'var(--accent)' : 'transparent'}` }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, flexShrink: 0, background: 'var(--surface-alt)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {f.hasPassword ? <span style={{ fontSize: 22 }}>🔒</span> : f.type === 'image' ? <img src={f.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>📄</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                    {f.tags.map(t => <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, background: 'var(--surface)', border: '1px solid var(--line)', padding: '4px 9px 4px 7px', borderRadius: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: getTagColor(t) }}></span>{t}</span>)}
                  </div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)', flexShrink: 0, textAlign: 'right' }}>
                  {new Date(f.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {files.length === 0 && <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>{t('noFilesFound')}</div>}
          </div>

        </div>
      </div>

    </div>
  )
}
