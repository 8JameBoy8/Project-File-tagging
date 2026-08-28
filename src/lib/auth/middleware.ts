//lib/auth/middleware.ts   check always ที่มี request เข้ามาที่ endpoint ต้อง login ก่อน
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'

// Typedata user ดึงจาก token ได้ (ใช้ต่อใน endpoint อื่นๆ)
export type AuthUser = {
    userId: string
    role: string
}

//f เรียกใช้ต้นๆ ของทุก endpoint ต้อง login ก่อนถึงจะเข้าได้   ถ้า token ไม่มี/ไม่ถูก จะคืนค่า NextResponse (error) กลับไป
//ถ้า token ถูก จะคืนค่า AuthUser ข้อมูล user ที่ decode จาก token
export async function requireAuth(
    req: NextRequest
) : Promise<AuthUser | NextResponse> {
    
//ดึง token จาก cookie ชื่อ token ที่ตั้งไว้ตอน login
    const token = req.cookies.get('token')?.value

//ถ้าไม่มี token เลย ไม่ได้ login ตอบ 401 Unauthorized
if (!token) {
    return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ'}},
        { status: 401 }
    )
}
try {
//ถอด token ดูว่าถูกมั้ย เซ็นด้วย secret ที่ถูกมั้ย หมดอายุยัง 
const payload = await verifyToken(token)

//token ถูก คืน data user กลับไปให้ endpoint ที่เรียกใช้
    return { userId: payload.userId, role: payload.role}
} catch (error) {
// token ผิด/หมดอายุ/ปลอม ตอบ 401 
    return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'เซสซั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่'}},
        { status: 401 }
    )
}
}
//f check user มี role ตรงตามที่กำหนดมั้ย ใช้ต่อ requireAuth เสมอ ต้องรู้ก่อนว่า user เป็นใคร login อยู่ไหมถึงจะ login ได้
//How to: requireRole(['ADMIN]) - ส่ง array ของ role ที่่อนุญาต เผื่ออนาคตมีหลาย role 
export function requireRole(allowedRoles:string[]) {

//    คืนค่าเป็น f อีกที pattern = "higher-order function"   เพื่อให้เรียกใช้เเบบ requireRole(['ADMIN])(authUser) ได้
    return (authUser: AuthUser): NextResponse | null => {

//ถ้า role ของ user ไม่อยู่ใน list ที่อนุญาต ตอบ 403 Forbidden
        if (!allowedRoles.includes(authUser.role)) {
            return NextResponse.json(
            { error: { code: 'FORBIDEN', message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'}},
            { status: 403 }
            )
        }

// if role ถูก = null 
        return null
    }
}
