'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/Topbar'
import { useLanguage } from '@/context/LanguageContext'

type Tag = { id: string, name: string, color: string }
type FileItem = { id: string, name: string, ext: string, type: string, tags: string[], src: string, hasPassword: boolean }

const NO_TAG_ID = '__no_tag__'

export default function ManageTagPage() {
    const { t } = useLanguage()
    const [tags, setTags] = useState<Tag[]>([])
    const [selectedTagId, setSelectedTagId] = useState<string>('')
    const [files, setFiles] = useState<FileItem[]>([])

    // Tag editing state
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('#d9d9d9')

    // Browse / sort / filter state for picking files to add to the selected tag
    const [sortMode, setSortMode] = useState('date-desc')
    const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
    const [sortOpen, setSortOpen] = useState(false)
    const [tagOpen, setTagOpen] = useState(false)

    // Pick mode: select files below then confirm to add them into the selected tag
    const [pickMode, setPickMode] = useState(false)
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)

    const selectedTag = tags.find(t => t.id === selectedTagId)

    const sortLabels: Record<string, string> = {
        'date-desc': t('sortNewest'),
        'date-asc': t('sortOldest'),
        'type': t('sortByType'),
        'name': t('sortByName'),
    }

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/tags')
            if (res.ok) setTags(await res.json())
        } catch (e) { }
    }

    const fetchFiles = async () => {
        let url = `/api/files?sort=${sortMode}`
        if (activeTags.has(NO_TAG_ID)) {
            url += `&untagged=true`
        } else {
            activeTags.forEach(t => { url += `&tagId=${t}` })
        }
        try {
            const res = await fetch(url)
            if (res.ok) setFiles(await res.json())
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

    useEffect(() => {
        const t = tags.find(x => x.id === selectedTagId)
        if (t) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the edit form to match the newly selected tag; the fields then diverge as the user types
            setEditName(t.name)
            setEditColor(t.color)
        } else {
            setEditName('')
            setEditColor('#d9d9d9')
        }
        // switching the target tag cancels any in-progress selection
        setPickMode(false)
        setSelectedFileIds(new Set())
    }, [selectedTagId, tags])

    const handleDeleteTag = async () => {
        if (!selectedTagId) {
            alert(t('pleaseSelectTagToDelete'))
            return
        }
        if (confirm(t('confirmDeleteTagMsg'))) {
            try {
                await fetch(`/api/tags/${selectedTagId}`, { method: 'DELETE' })
                setSelectedTagId('')
                fetchTags()
            } catch (e) { }
        }
    }

    const handleUpdateTag = async () => {
        if (!selectedTagId) return
        try {
            await fetch(`/api/tags/${selectedTagId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, color: editColor })
            })
            setIsEditing(false)
            fetchTags()
        } catch (e) { }
    }

    const toggleFilterTag = (id: string) => {
        const next = new Set(activeTags)
        if (id === NO_TAG_ID) {
            if (next.has(NO_TAG_ID)) next.delete(NO_TAG_ID)
            else { next.clear(); next.add(NO_TAG_ID) }
        } else {
            next.delete(NO_TAG_ID)
            if (next.has(id)) next.delete(id)
            else next.add(id)
        }
        setActiveTags(next)
    }

    const startPickMode = () => {
        if (!selectedTagId) {
            alert(t('pleaseSelectTagFirst'))
            return
        }
        setPickMode(true)
        setSelectedFileIds(new Set())
    }

    const cancelPickMode = () => {
        setPickMode(false)
        setSelectedFileIds(new Set())
    }

    const toggleFileSelection = (f: FileItem) => {
        if (!pickMode) return
        if (selectedTag && f.tags.includes(selectedTag.name)) return // already has this tag
        const next = new Set(selectedFileIds)
        if (next.has(f.id)) next.delete(f.id)
        else next.add(f.id)
        setSelectedFileIds(next)
    }

    const handleConfirmAdd = async () => {
        if (selectedFileIds.size === 0) {
            alert(t('selectAtLeastOne'))
            return
        }
        setSaving(true)
        try {
            const res = await fetch(`/api/tags/${selectedTagId}/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileIds: Array.from(selectedFileIds) })
            })
            if (res.ok) {
                setPickMode(false)
                setSelectedFileIds(new Set())
                fetchFiles()
            } else {
                alert(t('addFileToTagFailed'))
            }
        } catch (e) { } finally {
            setSaving(false)
        }
    }

    const getFileIcon = (file: FileItem) => {
        if (file.type === 'document') return '📄'
        if (file.type === 'image') return '🖼️'
        if (file.type === 'video') return '🎬'
        if (file.type === 'audio') return '🎵'
        return '📁'
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 30 }}>
            <Topbar title={t('manageTag')} />
            <div style={{ padding: '20px 40px 0', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 20 }}>
                    <div style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--line)', padding: '10px 15px', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select style={{ width: 170, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 6, outline: 'none', fontSize: 14 }} value={selectedTagId} onChange={e => setSelectedTagId(e.target.value)}>
                            <option value="">{t('selectTagToAddFiles')}</option>
                            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>

                        {selectedTagId && !isEditing && (
                            <>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--line)', backgroundColor: editColor }}></div>
                                <div onClick={() => setIsEditing(true)} style={{ width: 32, height: 32, backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--line)' }} title={t('editTagTitle')}>✏️</div>
                                <div onClick={handleDeleteTag} style={{ width: 32, height: 32, backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--line)', color: 'red' }} title={t('deleteTagTitle')}>🗑️</div>
                            </>
                        )}

                        {selectedTagId && isEditing && (
                            <>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: '6px 8px', width: 120, borderRadius: 4, border: '1px solid #ccc' }} />
                                <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={{ width: 30, height: 30, padding: 0, border: 'none' }} />
                                <button onClick={handleUpdateTag} style={{ background: 'var(--ok-soft)', color: 'var(--ok)', padding: '6px 12px', borderRadius: 4, fontWeight: 'bold' }}>{t('save')}</button>
                                <button onClick={() => setIsEditing(false)} style={{ background: '#eee', padding: '6px 12px', borderRadius: 4 }}>{t('cancelBtn')}</button>
                            </>
                        )}

                        {!isEditing && !pickMode && (
                            <button onClick={startPickMode} title={t('addFileToTagTitle')} style={{ width: 32, height: 32, background: 'var(--accent)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', lineHeight: 1 }}>+</button>
                        )}

                        {pickMode && (
                            <>
                                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('selectedCountFiles', { count: selectedFileIds.size })}</span>
                                <button onClick={handleConfirmAdd} disabled={saving} style={{ background: 'var(--ok-soft)', color: 'var(--ok)', padding: '6px 14px', borderRadius: 6, fontWeight: 'bold' }}>{t('confirmBtn')}</button>
                                <button onClick={cancelPickMode} style={{ background: '#eee', padding: '6px 14px', borderRadius: 6 }}>{t('cancelBtn')}</button>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
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
                                    {tags.map(t => (
                                        <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={activeTags.has(t.id)} onChange={() => toggleFilterTag(t.id)} style={{ accentColor: 'var(--accent)' }} />
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{t.name}</span>
                                        </label>
                                    ))}
                                    {tags.length === 0 && <div style={{ padding: 10, color: 'var(--muted)', fontSize: 12.5 }}>{t('noTagsExist')}</div>}
                                    <div style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 8 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={activeTags.has(NO_TAG_ID)} onChange={() => toggleFilterTag(NO_TAG_ID)} style={{ accentColor: 'var(--accent)' }} />
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{t('filesWithNoTag')}</span>
                                        </label>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                                        <button onClick={() => setActiveTags(new Set())} style={{ color: 'var(--muted)', fontSize: 12, textDecoration: 'underline' }}>{t('clearSelection')}</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '8px 12px', background: 'var(--surface-alt)', border: '1px solid var(--line)', borderRadius: 6 }}>{t('filesCountLabel', { count: files.length })}</div>
                    </div>
                </div>

                {pickMode && (
                    <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--muted)' }}>
                        {t('clickFilesToSelectMsg', { tag: selectedTag ? `"${selectedTag.name}"` : '' })}
                    </div>
                )}

                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 30, boxShadow: 'var(--shadow)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 25, flex: 1, overflowY: 'auto' }}>
                    {files.map(f => {
                        const alreadyTagged = !!selectedTag && f.tags.includes(selectedTag.name)
                        const isSelected = selectedFileIds.has(f.id)
                        return (
                            <div key={f.id} onClick={() => toggleFileSelection(f)} style={{
                                backgroundColor: 'var(--surface-alt)',
                                border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
                                borderRadius: 8, padding: 15, position: 'relative',
                                cursor: pickMode && !alreadyTagged ? 'pointer' : 'default',
                                display: 'flex', flexDirection: 'column', height: 220,
                                opacity: pickMode && alreadyTagged ? 0.5 : 1
                            }}>
                                {pickMode && (
                                    <div style={{
                                        position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%',
                                        border: '2px solid ' + (isSelected ? 'var(--accent)' : 'var(--line)'),
                                        background: isSelected ? 'var(--accent)' : 'var(--surface)',
                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, zIndex: 2
                                    }}>{isSelected ? '✓' : ''}</div>
                                )}
                                {alreadyTagged && (
                                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 10, padding: '3px 7px', borderRadius: 20, zIndex: 2 }}>{t('alreadyHasThisTag')}</div>
                                )}
                                <div style={{ backgroundColor: '#dee2e6', borderRadius: 6, flexGrow: 1, marginBottom: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#adb5bd', overflow: 'hidden' }}>
                                    {/* ไฟล์รูปที่มีรหัสผ่านไม่โชว์ thumbnail จริง แสดง icon ล็อกแทน */}
                                    {f.hasPassword ? '🔒' : f.type === 'image' ? <img src={f.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : getFileIcon(f)}
                                </div>
                                <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 14, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, justifyContent: 'center' }}>
                                    {f.tags.map(t => <span key={t} style={{ fontSize: 10, background: 'var(--surface)', border: '1px solid var(--line)', padding: '2px 6px', borderRadius: 20, color: 'var(--muted)' }}>{t}</span>)}
                                </div>
                            </div>
                        )
                    })}
                    {files.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)', padding: 40 }}>{t('noFilesFound')}</div>}
                </div>

            </div>
        </div>
    )
}
