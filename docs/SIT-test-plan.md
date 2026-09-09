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

ขอบเขตการทดสอบครอบคลุม 11 จุดเชื่อมต่อหลัก (SIT-01 ถึง SIT-11) รายละเอียดในหัวข้อ 4

SIT-07 ถึง SIT-11 เพิ่มเข้ามาหลังจากตรวจ RTM (`G04_RTM.xlsx`) แล้วพบว่ามี requirement ที่สร้างจริง
ไปแล้ว (ทั้งเว็บและมือถือ) แต่ไม่มี test case รองรับเลย — ดูหัวข้อ 4 ว่าแต่ละอันคู่กับ requirement
ข้อไหนใน RTM

## 2. Test Environment

| รายการ | ค่าที่ใช้ | เหตุผล |
|---|---|---|
| Database | SQLite ไฟล์แยกต่างหาก (`test-integration.db`) สร้างใหม่ทุกครั้งที่รัน | แยกจากข้อมูลจริง/dev ไม่ปนกัน แต่ยังใช้ schema/migration ชุดเดียวกับของจริงทุกตัว |
| Cloudinary / Cloudmersive / Redis | **ของจริง** (ตัวเดียวกับที่ใช้ dev/production) | ให้ผลตรงกับพฤติกรรมจริง 100% — เคยเจอบั๊กจริงที่ unit test/mock ตรวจไม่เจอมาแล้ว (ดู SIT-04.4) จึงตัดสินใจไม่ใช้ mock สำหรับ SIT |
| Web server | `next dev` รันจริงบน port แยก (3100) ผ่าน Vitest `globalSetup` | ทดสอบผ่าน HTTP request จริงเหมือนผู้ใช้งานจริง ไม่ใช่เรียกฟังก์ชันตรง ๆ ในโค้ด |
| Worker | `npm run worker` รันจริงคู่กัน | จำเป็นสำหรับทดสอบ pipeline สแกนไฟล์ทั้งสาย (SIT-03) |
| เครื่องมือ | Vitest (`vitest.integration.config.mts`) | แยก config จาก unit test โดยสิ้นเชิง ไม่กระทบ `npm test`/CI เดิม |

**วิธีรัน:** `npm run test:integration`
**Automated test files:** `src/__tests__/integration/*.test.ts`

## 3. สรุปผลการทดสอบ (รันจริงล่าสุด)

```
Test Files  11 passed (11)
      Tests  45 passed (45)
```

(เพิ่มจาก 23 เป็น 45 หลังเพิ่ม SIT-07 ถึง SIT-11 — 5 ไฟล์ทดสอบใหม่ ครอบคลุม requirement ที่พบว่า
สร้างจริงแล้วแต่ไม่มี test case มาก่อน ดูหัวข้อ 4)

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
| SIT-06.1 | ขอ OTP ให้ user ที่มีจริง | API + Gmail SMTP | มี user นี้ | POST `/api/auth/forget-password` | 200, ส่งอีเมลจริงสำเร็จ | `forgot-password-otp.test.ts` | ✅ Pass |
| SIT-06.2 | OTP ปลอมต้องถูกปฏิเสธ | API | ขอ OTP แล้ว | POST `/api/auth/reset-password` ด้วย OTP ผิด | 400 INVALID_OTP | `forgot-password-otp.test.ts` | ✅ Pass |
| SIT-06.3 | ขอ OTP ให้อีเมลที่ไม่มีในระบบ | API | ไม่มี | POST `/api/auth/forget-password` อีเมลไม่มีจริง | 200 (ข้อความกลาง ๆ กันเดา email) | `forgot-password-otp.test.ts` | ✅ Pass |
| SIT-07.1 | ไฟล์ยังไม่ตั้งรหัสผ่าน — verify ผ่านเลย | API + DB | มีไฟล์ | POST `/api/files/[id]/verify-password` (ไม่ส่งรหัส) | 200 | `file-password.test.ts` | ✅ Pass |
| SIT-07.2 | เจ้าของไฟล์ตั้งรหัสผ่านไฟล์ได้ | API + DB | มีไฟล์ | PUT `/api/files/[id]/password` | 200, ค่าใน DB ตรงกับที่ส่ง | `file-password.test.ts` | ✅ Pass |
| SIT-07.3 | ตั้งรหัสแล้ว — ใส่รหัสผิดถูกปฏิเสธ | API + DB | ตั้งรหัสไว้แล้ว | POST verify-password รหัสผิด | 401 INVALID_PASSWORD | `file-password.test.ts` | ✅ Pass |
| SIT-07.4 | ตั้งรหัสแล้ว — ใส่รหัสถูกผ่านสำเร็จ | API + DB | ตั้งรหัสไว้แล้ว | POST verify-password รหัสถูก | 200 | `file-password.test.ts` | ✅ Pass |
| SIT-07.5 | user อื่นแก้/ดูรหัสไฟล์ของคนอื่นไม่ได้ | API + DB (authorization) | ไฟล์เป็นของคนอื่น | GET/PUT `/api/files/[id]/password` | 404 ทั้งคู่, รหัสเดิมไม่ถูกแก้ | `file-password.test.ts` | ✅ Pass |
| SIT-08.1 | แก้ไข displayName สำเร็จ | API + DB | login แล้ว | PATCH `/api/profile` | 200, GET เห็นค่าใหม่ตรงกัน | `profile-settings.test.ts` | ✅ Pass |
| SIT-08.2 | เปลี่ยนรหัสผ่านบัญชี — รหัสเดิมผิด | API + DB | login แล้ว | POST `/api/profile/change-password` รหัสเดิมผิด | 400 | `profile-settings.test.ts` | ✅ Pass |
| SIT-08.3 | เปลี่ยนรหัสผ่านบัญชี — รหัสใหม่สั้นเกินไป | API | login แล้ว | POST change-password รหัสใหม่ < 8 ตัว | 400 VALIDATION_ERROR | `profile-settings.test.ts` | ✅ Pass |
| SIT-08.4 | เปลี่ยนรหัสผ่านบัญชีสำเร็จ (ครบวงจร) | API + DB + bcrypt | login แล้ว | POST change-password ถูกต้อง | 200, login ด้วยรหัสใหม่ได้, รหัสเดิมใช้ไม่ได้แล้ว | `profile-settings.test.ts` | ✅ Pass |
| SIT-09.1 | user ธรรมดาลบบัญชีคนอื่นไม่ได้ | API (RBAC) | login เป็น USER | DELETE `/api/admin/user/[id]` | 403 | `admin-delete-user.test.ts` | ✅ Pass |
| SIT-09.2 | แอดมินลบบัญชีตัวเองไม่ได้ | API | login เป็น ADMIN | DELETE ตัวเอง | 400 CANNOT_DELETE_SELF | `admin-delete-user.test.ts` | ✅ Pass |
| SIT-09.3 | แอดมินลบบัญชี user คนอื่นสำเร็จ (soft delete) | API + DB | login เป็น ADMIN | DELETE user คนอื่น | 200, `deletedAt` ถูกตั้ง, login ไม่ได้อีก (403) | `admin-delete-user.test.ts` | ✅ Pass |
| SIT-09.4 | ลบ user ที่ไม่มีอยู่จริง/ถูกลบไปแล้ว | API + DB | ลบไปแล้วรอบก่อน | DELETE user เดิมซ้ำ | 404 | `admin-delete-user.test.ts` | ✅ Pass |
| SIT-10.1 | sort=name เรียง a→z ถูกต้อง | API + DB | มีไฟล์ 2 ชื่อคนละตัวอักษรแรก | GET `/api/files?sort=name` | ลำดับตรงตามชื่อ | `file-sort-filter.test.ts` | ✅ Pass |
| SIT-10.2 | sort=date-asc เรียงเก่าไปใหม่ถูกต้อง | API + DB | มีไฟล์ 2 เวลาอัปโหลดต่างกัน | GET `/api/files?sort=date-asc` | ลำดับตรงตามเวลา | `file-sort-filter.test.ts` | ✅ Pass |
| SIT-10.3 | กรองด้วย tagId คืนเฉพาะไฟล์ที่มีแท็กนั้น | API + DB | มีไฟล์มีแท็ก/ไม่มีแท็กผสมกัน | GET `/api/files?tagId=...` | คืนเฉพาะไฟล์ที่มีแท็กนั้นจริง | `file-sort-filter.test.ts` | ✅ Pass |
| SIT-10.4 | untagged=true คืนเฉพาะไฟล์ที่ไม่มีแท็กเลย | API + DB | มีไฟล์มีแท็ก/ไม่มีแท็กผสมกัน | GET `/api/files?untagged=true` | คืนเฉพาะไฟล์ไม่มีแท็ก | `file-sort-filter.test.ts` | ✅ Pass |
| SIT-11.1 | ติดแท็กให้ไฟล์สำเร็จ | API + DB | มีแท็ก + ไฟล์ของตัวเอง | POST `/api/tags/[id]/files` | 200, มี FileTag เกิดขึ้นจริง | `tag-file-association.test.ts` | ✅ Pass |
| SIT-11.2 | ติดแท็กเดิมซ้ำไม่สร้างซ้ำ | API + DB | ติดแท็กไปแล้วรอบก่อน | POST ซ้ำด้วย fileId เดิม | 200, จำนวนแถวยังเป็น 1 | `tag-file-association.test.ts` | ✅ Pass |
| SIT-11.3 | ติดแท็กให้ไฟล์คนอื่นไม่ได้ | API + DB (authorization) | ไฟล์เป็นของอีกคน | POST ด้วย fileId ของคนอื่น | 200 (เงียบ) แต่ไม่มี FileTag เกิดขึ้นจริง | `tag-file-association.test.ts` | ✅ Pass |
| SIT-11.4 | ถอดแท็กออกจากไฟล์ได้ (ส่ง array ว่าง) | API + DB | ไฟล์มีแท็กอยู่ | PUT `/api/files/[id]/tags` ด้วย `tagIds: []` | 200, ไม่เหลือ FileTag ของไฟล์นี้เลย | `tag-file-association.test.ts` | ✅ Pass |
| SIT-11.5 | user อื่นแก้แท็กไฟล์ของคนอื่นไม่ได้ | API + DB | ไฟล์เป็นของอีกคน | PUT `/api/files/[id]/tags` ของคนอื่น | 404 | `tag-file-association.test.ts` | ✅ Pass |

**หมายเหตุ SIT-06:** เดิมใช้ Resend ซึ่งต้องยืนยันโดเมนของตัวเองก่อนถึงจะส่งอีเมลไปหา user จริงได้ (ไม่ใช่แค่อีเมลเจ้าของบัญชี Resend เอง) เปลี่ยนไปใช้ Gmail SMTP แทนแล้ว (ฟรี ไม่ต้องมีโดเมน) ทดสอบยืนยันด้วยมือแล้วว่าอีเมลจริงส่งถึงจริง (ครบวงจร: ขอ OTP → ได้รับอีเมลจริง → ตั้งรหัสผ่านใหม่ → login ด้วยรหัสใหม่สำเร็จ) ระหว่างทางเจอว่า Gmail SMTP port 465 (implicit TLS) ต่อไม่ผ่านบนเครือข่ายนี้ แต่ port 587 (STARTTLS) ต่อผ่านปกติ — ดู comment ใน `src/lib/auth/otp.ts`

**หมายเหตุ SIT-07 ถึง SIT-11:** เพิ่มเข้ามาหลังตรวจ RTM (`G04_RTM.xlsx`) แล้วพบว่า requirement
RQ-017 (รหัสผ่านไฟล์), RQ-018 (เปลี่ยนรหัสผ่านบัญชี), RQ-019 (แก้ไขโปรไฟล์), RQ-020 (แอดมินลบ
user), RQ-021 (เรียง/กรองไฟล์) สร้างจริงไปแล้วทั้งเว็บและมือถือ แต่ไม่มี requirement/test case
รองรับเลยในเอกสารเดิม — เพิ่ม requirement เข้า RTM ก่อน แล้วค่อยเขียน test case คู่กันตรงนี้
(SIT-11 เพิ่มแยกอีกทีตอนพบว่า RQ-007 "Manage Tag" ของเดิมในเอกสารก็ไม่มี test case คู่กันเหมือนกัน
— แม้ requirement ข้อนี้จะมีอยู่แล้วในเอกสารเดิม แต่ไม่เคยมีอะไรมาพิสูจน์ว่าใช้งานได้จริง)

## 5. รายการที่ยังค้างอยู่

ไม่มี — Railway (worker) และ Resend/Gmail (OTP email) แก้ครบทั้งคู่แล้ว ยืนยันด้วยการทดสอบจริงบน production ทั้งสองเรื่อง

## 6. ข้อจำกัดของชุดทดสอบนี้

- ทดสอบเฉพาะ "ไฟล์ปลอดภัย" (auto-approve path) ของ SIT-03 แบบ end-to-end จริงผ่าน Cloudmersive เพราะควบคุมให้ Cloudmersive ตีธงไฟล์ทดสอบว่าอันตรายไม่ได้โดยตรง (ไม่ควรใช้ไฟล์ไวรัสทดสอบจริงในการทดสอบอัตโนมัติ) — เคส "ไฟล์ที่ถูกตีธง" (SIT-04) จึงจำลองสถานการณ์ด้วยการ seed ข้อมูลสถานะ `PENDING_REVIEW` ตรง ๆ แทน ซึ่งเป็นสถานะที่เกิดขึ้นจริงในระบบเป๊ะ ๆ ไม่ต่างจากที่ worker จะสร้างขึ้นเองเมื่อ Cloudmersive ตีธงไฟล์จริง
