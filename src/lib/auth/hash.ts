//เข้ารหัส pass ตอนสมัครกับเช็ค pass ตอน login
import bcrypt from 'bcryptjs'

// num 10 = salt rounds เลขสูง safe but slow (10 = standard)
const SALT_ROUNDS = 10

//register   รับ pass คืนค่า hash เเล้วเก็บใน DB
export async function hashPassword(password:string) : Promise<string>{
    return bcrypt.hash(password, SALT_ROUNDS)
}

//login เทียบ pass กับ hash ที่เก็บใน DB  คืนค่า true=ตรง ไม่ตรง=false
export async function verifyPassword(
    password:string,
    hashedPassword : string
) : Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}