// lib/moderation/promoteToFile.ts
// ใช้ตอน ModerationItem หนึ่งรายการถูกตัดสินว่า "ใช้ได้แล้ว" — ไม่ว่าจะเป็นเพราะสแกนไวรัสผ่าน
// อัตโนมัติ (worker เรียกเอง, reviewedBy = null) หรือ admin กด Approve เองในหน้า Approve/Select
// (reviewedBy = userId ของ admin) — สร้าง File จริงในระบบจาก ModerationItem แล้วผูกกลับไว้ที่
// resultFileId เพื่อให้ตรวจสอบย้อนหลังได้ว่าไฟล์นี้มาจากรายการไหน

import { prisma } from '@/lib/db'
import { getFileType, getFileExtension } from '@/lib/fileUtils'

export async function promoteToFile(itemId: string, reviewedBy: string | null) {
    const item = await prisma.moderationItem.findUnique({ where: { id: itemId } })
    if (!item) {
        throw new Error('ModerationItem not found')
    }

    // parse tagIds ที่เก็บไว้ตอนอัปโหลด แล้ว re-validate ว่ายังเป็นของ uploadedBy จริงอยู่
    // (กันเคส user ลบ tag ทิ้งไปแล้วระหว่างที่ไฟล์กำลังรอสแกน/รอ admin ตรวจ)
    let ownedTagIds: string[] = []
    if (item.tagIds) {
        try {
            const parsed = JSON.parse(item.tagIds)
            if (Array.isArray(parsed) && parsed.length > 0) {
                const ownedTags = await prisma.tag.findMany({
                    where: { id: { in: parsed }, userId: item.uploadedBy },
                    select: { id: true },
                })
                ownedTagIds = ownedTags.map((t) => t.id)
            }
        } catch {
            // tagIds เพี้ยน/parse ไม่ได้ — ถือว่าไม่มี tag ไปเลยไม่ต้อง fail ทั้ง promote
            ownedTagIds = []
        }
    }

    // ใช้ util ตัวเดียวกับที่ /api/files POST เดิมใช้ตอนเช็คประเภทไฟล์ (เทียบจากชื่อไฟล์ต้นฉบับ)
    // fallback ไปใช้ fileType ที่ Cloudinary เดาไว้ ถ้าไม่มีชื่อไฟล์เก็บมาด้วยเหตุผลบางอย่าง
    const nameForTypeCheck = item.fileName || `file.${item.fileType || 'bin'}`
    const fileTypeCategory = getFileType(nameForTypeCheck)
    const ext = getFileExtension(nameForTypeCheck)

    const file = await prisma.file.create({
        data: {
            name: item.fileName || `file.${ext.toLowerCase()}`,
            type: fileTypeCategory,
            ext,
            path: item.fileUrl, // URL เต็มของ Cloudinary — serve/download endpoint จะ fetch ต่อจาก path นี้
            size: item.fileSize ?? 0,
            userId: item.uploadedBy,
            password: item.password,
            tags: {
                create: ownedTagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
            },
        },
    })

    await prisma.moderationItem.update({
        where: { id: itemId },
        data: {
            status: 'APPROVED',
            resultFileId: file.id,
            reviewedBy,
        },
    })

    return file
}
