import { v2 as cloudinary } from 'cloudinary'

// Cloudinary จะอ่านค่าจาก CLOUDINARY_URL อัตโนมัติ ไม่ต้อง config เอง
cloudinary.config(true)

export default cloudinary