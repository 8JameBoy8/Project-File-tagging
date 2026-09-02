import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        // integration test (src/__tests__/integration) มี config/รันทางแยกของตัวเอง
        // (vitest.integration.config.mts, npm run test:integration) — ยิง server+service จริง
        // ช้ากว่านี้มาก ไม่ควรมาปนกับ unit test เร็ว ๆ ที่รันทุก push ใน CI
        exclude: ['src/__tests__/integration/**', 'node_modules/**']
    }
})
