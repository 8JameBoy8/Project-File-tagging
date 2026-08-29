'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/Topbar'

type Tag = {
    id: string
    name: string
    color: string
}

export default function CreateTagPage() {
    const [createdTags, setCreatedTags] = useState<Tag[]>([])
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
    const [name, setName] = useState('')
    const [color, setColor] = useState('#d9d9d9')

    const swatches = ['#d9d9d9', '#ff4d4f', '#ff9c6e', '#ffc53d', '#73d13d', '#36cfc9', '#4096ff', '#9254de', '#f759ab', '#000000']

    // Fetch initial tags on load
    useEffect(() => {
        fetch('/api/tags')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setCreatedTags(data)
            })
            .catch(e => console.error(e))
    }, [])

    const handleCreate = async () => {
        if (!name.trim()) {
            alert('กรุณากรอกชื่อ Name Tag ก่อนทำการ Create')
            return
        }
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), color })
            })
            if (res.ok) {
                const newTag = await res.json()
                setCreatedTags([newTag, ...createdTags])
                setName('')
                setColor('#d9d9d9')
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to create tag')
            }
        } catch (e) {
            alert('Error creating tag')
        }
    }

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedTags)
        if (newSelected.has(id)) newSelected.delete(id)
        else newSelected.add(id)
        setSelectedTags(newSelected)
    }

    const handleDelete = async () => {
        if (selectedTags.size === 0) {
            alert('กรุณาเลือกแท็กที่ต้องการลบด้านล่างก่อนครับ')
            return
        }
        if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแท็กที่เลือกทั้ง ${selectedTags.size} แท็ก?`)) return

        for (const id of Array.from(selectedTags)) {
            try {
                await fetch(`/api/tags/${id}`, { method: 'DELETE' })
            } catch (e) {
                console.error(e)
            }
        }

        setCreatedTags(prev => prev.filter(t => !selectedTags.has(t.id)))
        setSelectedTags(new Set())
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Topbar title="Create Tag" />
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column' }}>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, width: '100%', maxWidth: 1100, margin: '0 auto 20px' }}>
                    <div style={{ backgroundColor: '#d9d9d9', border: '1px solid #333', padding: '5px 15px', fontSize: 12, borderRadius: 4 }}>
                        Total tag : <span>{createdTags.length}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', gap: 40, marginBottom: 40, width: '100%', maxWidth: 1100, margin: '0 auto 40px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 40 }}>
                            <label style={{ fontSize: 16, whiteSpace: 'nowrap' }}>Name Tag</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Type name here..." style={{ flexGrow: 1, height: 35, backgroundColor: '#d9d9d9', border: '1px solid #333', borderRadius: 8, padding: '0 10px', fontSize: 16 }} />
                        </div>
                        <div style={{ width: 150, height: 150, backgroundColor: color, borderRadius: '50%', marginBottom: 15, border: '2px solid transparent', transition: 'background-color 0.3s' }}></div>
                        <div style={{ fontSize: 16 }}>{name || 'Name Tag'}</div>
                    </div>

                    <div style={{ flex: 1, minWidth: 300 }}>
                        <div style={{ width: '100%', backgroundColor: '#d9d9d9', border: '1px solid #333', borderRadius: 12, display: 'flex', flexDirection: 'column', padding: 20 }}>
                            <span style={{ fontSize: 18, marginBottom: 15, textAlign: 'center', fontWeight: 'bold' }}>Color Tag</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 25 }}>
                                {swatches.map(c => (
                                    <div key={c} onClick={() => setColor(c)} style={{ width: 35, height: 35, borderRadius: '50%', cursor: 'pointer', backgroundColor: c, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: color === c ? '2px solid #333' : '2px solid transparent', outline: color === c ? '2px solid #fff' : 'none', outlineOffset: -4 }}></div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, borderTop: '1px solid #bbb', paddingTop: 15 }}>
                                <label style={{ fontSize: 14 }}>Or Custom Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 50, height: 40, cursor: 'pointer', border: '1px solid #999', borderRadius: 4, padding: 2 }} />
                                    <input type="text" value={color} readOnly style={{ width: 80, height: 30, textAlign: 'center', border: '1px solid #999', borderRadius: 4 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginBottom: 30 }}>
                    <button onClick={handleDelete} style={{ width: 120, height: 35, border: selectedTags.size > 0 ? '1px solid #cc0000' : '1px solid #333', borderRadius: 4, fontSize: 16, backgroundColor: selectedTags.size > 0 ? '#ffcccc' : '#d9d9d9', color: selectedTags.size > 0 ? '#cc0000' : '#000' }}>
                        {selectedTags.size > 0 ? `Delete (${selectedTags.size})` : 'Delete Selected'}
                    </button>
                    <button onClick={handleCreate} style={{ width: 120, height: 35, backgroundColor: '#d9d9d9', border: '1px solid #333', borderRadius: 4, fontSize: 16 }}>Create</button>
                </div>

                <div style={{ borderTop: '1px solid #ccc', paddingTop: 20, width: '100%', maxWidth: 1100, margin: '0 auto' }}>
                    <h3 style={{ fontSize: 16, marginBottom: 15, color: '#555' }}>Created Tags (Click/Tap to select)</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                        {createdTags.map(tag => {
                            const sel = selectedTags.has(tag.id)
                            return (
                                <div key={tag.id} onClick={() => toggleSelect(tag.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: sel ? '#e0e0e0' : '#f0f0f0', border: sel ? '2px solid #333' : '2px solid #ccc', borderRadius: 20, fontSize: 14, cursor: 'pointer' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #999', backgroundColor: tag.color }}></div>
                                    <span>{tag.name}</span>
                                    {sel && <span style={{ color: '#28a745', fontWeight: 'bold', marginLeft: 5 }}>✓</span>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
