# System Integration Test (SIT) Plan — Project File Tagging

**เวอร์ชัน:** 1.0
**วันที่ทดสอบ:** 2 กันยายน 2569
**ผู้จัดทำ:** ทีมพัฒนา Project File Tagging

## 1. วัตถุประสงค์และขอบเขต

**System Integration Test (SIT)** คือการทดสอบว่าระบบย่อยหลายระบบที่ต่อกันจริงทำงานร่วมกันได้ถูกต้อง — ต่างจาก Unit Test ที่ทดสอบฟังก์ชัน/โมดูลเดี่ยว ๆ แยกขาดจากกัน (ดู `src/lib/fileUtils.test.ts`) SIT ทดสอบที่ **จุดเชื่อมต่อ (interface) ระหว่างระบบ** โดยเฉพาะ

โปรเจกต์นี้ประกอบด้วยระบบย่อยที่ต้องทำงานร่วมกัน:

| ระบบ | หน้าที่ |
|---|---|
| Next.js API (backend) | รับ request, ตรวจสอบสิทธิ์, ประสานงานระบบอื่น |
| SQLite/Turso (database) | เก็บข้อมูล user, tag, file, moderation |
| Cloudinary | เก็บไฟล์ที่ผู้ใช้อัปโหลดจริง |
| Redis + BullMQ (queue) | คิวงานสแกนไวรัส |
| Worker process | ดึงงานจากคิวมาประมวลผล |
| Cloudmersive | สแกนไวรัสไฟล์จริง |
| Next.js Middleware (proxy.ts) | ควบคุมสิทธิ์เข้าถึงหน้าเว็บตาม role |

ขอบเขตการทดสอบครอบคลุม 6 จุดเชื่อมต่อหลัก (SIT-01 ถึง SIT-06) รายละเอียดในหัวข้อ 4

## 2. Test Environment

| รายการ | ค่าที่ใช้ | เหตุผล |
|---|---|---|
| Database | SQLite ไฟล์แยกต่างหาก (`test-integration.db`) สร้างใหม่ทุกครั้งที่รัน | แยกจากข้อมูลจริง/dev ไม่ปนกัน แต่ยังใช้ schema/migration ชุดเดียวกับของจริงทุกตัว |
| Cloudinary / Cloudmersive / Redis | **ของจริง** (ตัวเดียวกับที่ใช้ dev/production) | ให้ผลตรงกับพฤติกรรมจริง 100% — เคยเจอบั๊กจริงที่ unit test/mock ตรวจไม่เจอ (ดูหัวข้อ 5) จึงตัดสินใจไม่ใช้ mock สำหรับ SIT |
| Web server | `next dev` รันจริงบน port แยก (3100) ผ่าน Vitest `globalSetup` | ทดสอบผ่าน HTTP request จริงเหมือนผู้ใช้งานจริง ไม่ใช่เรียกฟังก์ชันตรง ๆ ในโค้ด |
| Worker | `npm run worker` รันจริงคู่กัน | จำเป็นสำหรับทดสอบ pipeline สแกนไฟล์ทั้งสาย (SIT-03) |
| เครื่องมือ | Vitest (`vitest.integration.config.mts`) | แยก config จาก unit test โดยสิ้นเชิง ไม่กระทบ `npm test`/CI เดิม |

**วิธีรัน:** `npm run test:integration`
**Automated test files:** `src/__tests__/integration/*.test.ts`

## 3. สรุปผลการทดสอบ (รันจริงล่าสุด)

```
Test Files  6 passed (6)
     Tests  22 passed (22)
```

## 4. Test Case

| ID | Scenario | ระบบที่เกี่ยวข้อง | Precondition | ขั้นตอน | ผลที่คาดหวัง | ไฟล์ทดสอบ | สถานะ |
|---|---|---|---|---|---|---|---|
| SIT-01.1 | สมัครสมาชิกสำเร็จ | API + DB | ไม่มี | POST `/api/auth/register` ด้วยอีเมลใหม่ | 201, ได้ user + token | `auth.test.ts` | ✅ Pass |
| SIT-01.2 | สมัครอีเมลซ้ำ | API + DB | มี user นี้แล้ว | POST `/api/auth/register` อีเมลเดิม | 409 EMAIL_EXISTS | `auth.test.ts` | ✅ Pass |
| SIT-01.3 | Login รหัสผ่านผิด | API + DB | มี user นี้แล้ว | POST `/api/auth/login` รหัสผิด | 401 | `auth.test.ts` | ✅ Pass |
| SIT-01.4 | Bearer token ใช้งานได้จริง (เส้นทางมือถือ) | API + JWT | login สำเร็จ | แนบ `Authorization: Bearer <token>` เรียก `/api/profile` | 200, คืนข้อมูล user ที่ถูกต้อง | `auth.test.ts` | ✅ Pass |
| SIT-01.5 | ไม่มี token เข้า endpoint ที่ต้อง auth | API + JWT | ไม่มี | GET `/api/profile` ไม่แนบ token | 401 | `auth.test.ts` | ✅ Pass |
| SIT-02.1 | สอง user สร้าง tag ชื่อเดียวกัน | API + DB (schema constraint) | มี user 2 คน | ทั้งคู่ POST `/api/tags` ชื่อ "Work" | ทั้งคู่สำเร็จ (201), คนละ id | `tags-scoping.test.ts` | ✅ Pass |
| SIT-02.2 | เห็นแค่ tag ตัวเอง | API + DB | มี tag ของ 2 user | GET `/api/tags` | เห็นแค่ tag ของตัวเอง | `tags-scoping.test.ts` | ✅ Pass |
| SIT-02.3 | แก้ tag ข้าม user ไม่ได้ | API + DB (authorization) | มี tag ของอีกคน | PUT `/api/tags/[id]` ของอีกคน | 404 | `tags-scoping.test.ts` | ✅ Pass |
| SIT-02.4 | ลบ tag ข้าม user ไม่ได้ | API + DB | มี tag ของอีกคน | DELETE `/api/tags/[id]` ของอีกคน | 404, tag ยังอยู่จริงใน DB | `tags-scoping.test.ts` | ✅ Pass |
| SIT-03.1 | อัปโหลดไฟล์ -> เข้าคิว | API + Cloudinary + Redis | login แล้ว | POST `/api/files` (multipart) | 202 PENDING_SCAN, มี moderationItemId | `file-upload-scan-pipeline.test.ts` | ✅ Pass |
| SIT-03.2 | ไฟล์ปลอดภัยเข้าระบบอัตโนมัติ (ครบสาย) | API + Redis + Worker + Cloudmersive + DB | อัปโหลดแล้ว | poll `/api/files` จนไฟล์โผล่ | ไฟล์โผล่ภายใน ~20s, `reviewedBy = null` (auto) | `file-upload-scan-pipeline.test.ts` | ✅ Pass |
| SIT-03.3 | โหลดไฟล์กลับผ่าน serve | API + Cloudinary (proxy fetch) | มีไฟล์แล้ว | GET `/api/files/[id]/serve` | 200, เนื้อไฟล์ตรงกับที่อัปโหลด | `file-upload-scan-pipeline.test.ts` | ✅ Pass |
| SIT-04.1 | Admin เห็นคิวรอตรวจพร้อมข้อมูลผู้อัปโหลด | API + DB (join) | มี item PENDING_REVIEW | GET `/api/admin/moderation` (role ADMIN) | 200, มี `item.uploader` | `admin-moderation.test.ts` | ✅ Pass |
| SIT-04.2 | User ทั่วไปเข้าถึง endpoint admin ไม่ได้ | API (RBAC) | login เป็น USER | GET `/api/admin/moderation` | 403 | `admin-moderation.test.ts` | ✅ Pass |
| SIT-04.3 | Approve -> สร้างไฟล์จริง | API + DB | มี item PENDING_REVIEW | POST `/api/admin/moderation/[id]/approve` | 200, มี File จริง, `resultFileId`/`reviewedBy` ถูกต้อง | `admin-moderation.test.ts` | ✅ Pass |
| SIT-04.4 | Reject -> ลบไฟล์จาก Cloudinary จริง | API + Cloudinary | มี item PENDING_REVIEW | POST `/api/admin/moderation/[id]/reject` | 200, asset หายจริงจาก Cloudinary (ยืนยันด้วย `cloudinary.api.resource` โยน error) | `admin-moderation.test.ts` | ✅ Pass *(regression test ของบั๊กที่เจอระหว่างพัฒนา — เดิม `destroy()` ส่ง `resource_type` ผิด ทำให้ไม่ลบจริงแบบเงียบ ๆ)* |
| SIT-05.1 | ไม่ login เข้าโซน user | Middleware (proxy.ts) | ไม่มี cookie | GET `/user/home` | redirect ไป `/auth/login` | `proxy-role-gate.test.ts` | ✅ Pass |
| SIT-05.2 | USER ธรรมดาเข้าโซน admin | Middleware (proxy.ts) | login เป็น USER | GET `/admin/home` | redirect ไป `/user/home` | `proxy-role-gate.test.ts` | ✅ Pass |
| SIT-05.3 | ADMIN เข้าโซน admin | Middleware (proxy.ts) | login เป็น ADMIN | GET `/admin/home` | 200 | `proxy-role-gate.test.ts` | ✅ Pass |
| SIT-05.4 | ADMIN เข้าโซน user ได้ปกติ | Middleware (proxy.ts) | login เป็น USER/ADMIN | GET `/user/home` | 200 ทั้งคู่ | `proxy-role-gate.test.ts` | ✅ Pass |
| SIT-06.1 | ขอ OTP ให้ user ที่มีจริง | API + Resend | มี user นี้ | POST `/api/auth/forget-password` | **ควรได้ 200** | `forgot-password-otp.test.ts` | 🔴 **Blocked** — ได้ 500 จริง เพราะ Resend sandbox ยังส่งอีเมลไปหา user จริงไม่ได้ (ดูหัวข้อ 5) |
| SIT-06.2 | ขอ OTP ให้อีเมลที่ไม่มีในระบบ | API | ไม่มี | POST `/api/auth/forget-password` อีเมลไม่มีจริง | 200 (ข้อความกลาง ๆ กันเดา email) | `forgot-password-otp.test.ts` | ✅ Pass |

**หมายเหตุ SIT-06.1:** เทสอัตโนมัติ "ผ่าน" ในความหมายที่ว่ามันยืนยันสถานะปัจจุบันถูกต้อง (ได้ 500 ตามที่คาดจริง) — แต่ **ฟีเจอร์ Forgot Password ยังใช้กับผู้ใช้จริงไม่ได้** จนกว่าจะแก้ตามหัวข้อ 5 เมื่อแก้เสร็จให้เปลี่ยน assertion ในเทสจาก `toBe(500)` เป็น `toBe(200)`

## 5. รายการที่ยังค้างอยู่ (ไม่ผ่าน SIT เต็มรูปแบบ)

1. **Resend — ต้องยืนยันโดเมนของตัวเอง** บัญชียังอยู่โหมด sandbox (ผู้ส่ง `onboarding@resend.dev`) ส่งอีเมลได้แค่ไปยังอีเมลของเจ้าของบัญชีเอง ต้องไป Resend dashboard → Domains → เพิ่มโดเมนจริง + ตั้งค่า DNS ตามที่ Resend กำหนด ผลกระทบ: หน้า Forgot Password และ Change Password (OTP) ยังใช้กับผู้ใช้จริงไม่ได้ (SIT-06.1)
2. **Railway — ยังไม่ได้ deploy worker** ทดสอบผ่าน SIT ในเครื่อง (ที่มี worker รันจริง) ได้ผลถูกต้องหมด แต่บน production (Vercel) ยังไม่มี worker รันอยู่ที่ไหน ทำให้ไฟล์ที่ user อัปโหลดจริงบนเว็บที่ deploy แล้วจะค้างสถานะ "กำลังตรวจสอบ" ตลอดไป (ไม่ใช่ปัญหาของโค้ด เป็นเรื่อง deployment ที่ยังไม่เสร็จ)

## 6. ข้อจำกัดของชุดทดสอบนี้

- ทดสอบเฉพาะ "ไฟล์ปลอดภัย" (auto-approve path) ของ SIT-03 แบบ end-to-end จริงผ่าน Cloudmersive เพราะควบคุมให้ Cloudmersive ตีธงไฟล์ทดสอบว่าอันตรายไม่ได้โดยตรง (ไม่ควรใช้ไฟล์ไวรัสทดสอบจริงในการทดสอบอัตโนมัติ) — เคส "ไฟล์ที่ถูกตีธง" (SIT-04) จึงจำลองสถานการณ์ด้วยการ seed ข้อมูลสถานะ `PENDING_REVIEW` ตรง ๆ แทน ซึ่งเป็นสถานะที่เกิดขึ้นจริงในระบบเป๊ะ ๆ ไม่ต่างจากที่ worker จะสร้างขึ้นเองเมื่อ Cloudmersive ตีธงไฟล์จริง
