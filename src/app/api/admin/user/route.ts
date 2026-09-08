// app/api/admin/user/route.ts
// GET: admin ดูรายชื่อ user ทั้งหมด พร้อมสรุปข้อมูลไฟล์ของแต่ละคน
// (พื้นที่ใช้งานรวม, จำนวนไฟล์, แท็กทั้งหมดที่เคยใช้)
// รองรับ sort พิเศษ: firstUpload (คนที่เพิ่มไฟล์คนแรก), lastUpload (คนที่เพิ่มไฟล์ล่าสุด)

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const roleCheck = requireRole(['ADMIN'])(authResult)
  if (roleCheck) return roleCheck

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
  const search = searchParams.get('search') || ''

  const whereClause = search
    ? {
        deletedAt: null,
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { displayName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : { deletedAt: null }

  // 1. ดึง user list ตามปกติ (ยังไม่รวมข้อมูลไฟล์)
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      orderBy: sortBy === 'firstUpload' || sortBy === 'lastUpload'
        ? { createdAt: 'desc' } // ถ้า sort แบบพิเศษ เดี๋ยวไป sort เองด้านล่าง ตรงนี้ใส่ default ไปก่อน
        : { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: whereClause }),
  ])

  // 2. ดึงข้อมูลไฟล์ของแต่ละ user ที่อยู่ในหน้านี้ทีเดียว (groupBy = สรุปยอดต่อคน ประหยัดกว่า query ทีละคน)
  const userIds = users.map((u) => u.id)

  // เดิม query 2 ก้อนนี้อ่านจาก ModerationItem (คิวสแกนไวรัส) ทั้งคู่ ซึ่งมี 2 ปัญหาที่เจอจริงจาก
  // การทดสอบ: (1) fileCount/storageUsedBytes นับ "ทุกครั้งที่เคยอัปโหลด" รวมรายการที่สแกนไม่ผ่าน/
  // ยังไม่ผ่านคิวด้วย ตัวเลขเลยไม่ตรงกับจำนวนไฟล์จริงที่มีอยู่ (เช่น อัปโหลด 8 ครั้งแต่มีไฟล์จริงแค่ 7
  // เพราะ 1 อันสแกนไม่ผ่าน) (2) field `tags` ของ ModerationItem เป็น field เก่าที่เก็บไว้เพื่อ
  // backward-compat เท่านั้น (คอมเมนต์ในเอง schema บอกตรงๆ) โค้ดอัปโหลดปัจจุบันไม่เคยเขียนค่าใส่เลย
  // (ใช้ `tagIds` แทนตั้งนานแล้ว) เลยเป็น null เสมอ ผลคือแสดงเป็น tag ว่างๆ ทุกครั้ง
  // แก้โดยอ่านจากตาราง File จริงแทนทั้งหมด (เหมือนที่แก้ไปแล้วใน /api/admin/user/[id]/files)
  const fileStats = await prisma.file.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _sum: { size: true },          // รวมขนาดไฟล์ทั้งหมดของ user คนนั้น
    _count: { id: true },          // นับจำนวนไฟล์ทั้งหมด
    _min: { uploadedAt: true },    // เวลาไฟล์แรกที่อัปโหลด (ใช้ตอน sort firstUpload)
    _max: { uploadedAt: true },    // เวลาไฟล์ล่าสุดที่อัปโหลด (ใช้ตอน sort lastUpload)
  })

  // 3. ดึงแท็กทั้งหมดที่แต่ละ user เคยใช้จริง (query แยก เพราะ groupBy รวม relation ตรงๆ ไม่ได้)
  const allFiles = await prisma.file.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, tags: { select: { tag: { select: { name: true } } } } },
  })

  // 4. รวมข้อมูลทั้งหมดเข้ากับ user แต่ละคน (merge ด้วย JS เพราะ Prisma รวม query ข้าม table แบบนี้ให้ตรงๆ ไม่ได้)
  const usersWithStats = users.map((user) => {
    const stat = fileStats.find((s) => s.userId === user.id)

    // รวมแท็กทั้งหมดของ user คนนี้ แล้วตัดตัวซ้ำออกด้วย Set
    const userTags = allFiles
      .filter((file) => file.userId === user.id)
      .flatMap((file) => file.tags.map((t) => t.tag.name))
    const uniqueTags = Array.from(new Set(userTags))

    return {
      ...user,
      storageUsedBytes: stat?._sum.size ?? 0,
      fileCount: stat?._count.id ?? 0,
      tags: uniqueTags,
      firstUploadAt: stat?._min.uploadedAt ?? null,
      lastUploadAt: stat?._max.uploadedAt ?? null,
    }
  })

  // 5. ถ้าเลือก sort แบบพิเศษ (ตามไฟล์แรก/ไฟล์ล่าสุด) ให้ sort ทับอีกรอบตรงนี้
  //    เพราะ sort แบบนี้ต้องอ้างอิงข้อมูลจาก ModerationItem ไม่ใช่จาก User โดยตรง
  if (sortBy === 'firstUpload') {
    usersWithStats.sort((a, b) => {
      const aTime = a.firstUploadAt ? new Date(a.firstUploadAt).getTime() : 0
      const bTime = b.firstUploadAt ? new Date(b.firstUploadAt).getTime() : 0
      return order === 'asc' ? aTime - bTime : bTime - aTime
    })
  } else if (sortBy === 'lastUpload') {
    usersWithStats.sort((a, b) => {
      const aTime = a.lastUploadAt ? new Date(a.lastUploadAt).getTime() : 0
      const bTime = b.lastUploadAt ? new Date(b.lastUploadAt).getTime() : 0
      return order === 'asc' ? aTime - bTime : bTime - aTime
    })
  }

  return NextResponse.json({
    users: usersWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}