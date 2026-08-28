//app/api/auth/logout/route.ts
//endpoint นี้รับ POST /api/auth/logout  ใช้ลบ cookie token ทิ้ง ทำให้ browser ไม่มี token ส่งไปกับ request 

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req:NextRequest) {
//create response ปกติก่อน
    const response = NextResponse.json({ message: 'ออกจากระบบสำเร็จ'})

//ลบ cookie ชื่อ 'token'  howto ลบ cookie = ตั้งค่าใหม่ให้หมดอายุทันที (maxAge: 0)
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // หมดอายุทันที = ลบ cookie นี้ออกจาก browser
        path: '/',
    })
    return response
}