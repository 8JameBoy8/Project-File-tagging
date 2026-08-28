//ออก token ให้ user ตอน login สำเร็จ เเละตรวจ ตอน user ส่ง request มาที่ต้องการ auth
import {SignJWT , jwtVerify } from 'jose'

//secret k ใช้เซ็นเเละตรวจ token เก็บเป็นความลับ อยู่ใน env  TextEncoder แปลง string เป็น bytes เพราะ jose ต้องการ k = Unit8Array
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

//format dataที่จะฝังใน token (payload) ใส่เเค่ userId and role ไม่ใส่ pass
type TokenPayload = {
    userId : string
    role   : string
}

//ใช้ตอน login สำเร็จ create token new for user
export async function signToken(payload:TokenPayload): Promise<string> {
    return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256'})   //บอกว่าใช้ algorithm อะไรเซ็น
    .setIssuedAt()                         //save เวลาที่ออก token
    .setExpirationTime('7d')               //token หมดอายุใน 7d  ถ้าไม่ใส่tokenจะไม่มีวันหมดอายุ มันจะหลุดอันตราย
    .sign(secret)                          // secret k เซ็น คืนเป็น string
}
//ใช้ตอน middleware check request ที่เข้ามา ถอด token ดูว่าใครส่งมา
export async function verifyToken(token:string): Promise<TokenPayload> {
    const { payload } = await jwtVerify(token, secret)

//payload ที่ได้กลับมาเป็นทั่วไป(type generic ต้อง cast เป็น TokenPayload ที่เรากำหนดเอง)
    return payload as unknown as TokenPayload
}