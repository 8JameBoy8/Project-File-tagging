import { defineConfig } from 'vitest/config'
import path from 'path'

// Config แยกจาก vitest.config.mts (unit test) โดยสิ้นเชิง — integration test ยิง server
// จริง + external service จริง (Cloudinary/Cloudmersive/Redis) ช้ากว่า unit test มาก และต้อง
// รันทีละไฟล์เพราะใช้ server/DB ทดสอบตัวเดียวกันร่วมกัน (รันพร้อมกันจะชนกัน)
export default defineConfig({
    resolve: {
        // vitest ไม่อ่าน tsconfig paths ("@/*") ให้เองอัตโนมัติ ต้อง map ตรงนี้ด้วย
        alias: { '@': path.resolve(import.meta.dirname, './src') }
    },
    test: {
        environment: 'node',
        include: ['src/__tests__/integration/**/*.test.ts'],
        globalSetup: ['src/__tests__/integration/global-setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        fileParallelism: false,
    }
})
