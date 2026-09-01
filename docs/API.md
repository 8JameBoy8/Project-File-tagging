# API Reference — Project File Tagging

เอกสารนี้สำหรับทีมที่ทำ **mobile app (Expo/React Native)** ใช้อ้างอิงตอนต่อ API — endpoint ทั้งหมดเป็นชุดเดียวกับที่หน้าเว็บใช้อยู่จริง ไม่มีแยกเวอร์ชัน

## Base URL

- **Dev (ผ่าน tunnel ชั่วคราว):** `https://filetagging-api.loca.lt`
- **Local (รันเว็บเองในเครื่อง):** `http://localhost:3000`

> ⚠️ **URL นี้ไม่คงที่** — localtunnel (free tier) หลุด/เปลี่ยน URL เองได้เรื่อยๆ โดยไม่แจ้งล่วงหน้า ถ้ายิงแล้วได้ `502`/`503`/timeout ให้ไปถามคนที่รัน dev server ว่า URL ล่าสุดคืออะไร (เช็คค่านี้ที่ `lib/config.ts` ในโปรเจกต์ mobile ให้ตรงกันเสมอ) ถ้าจะให้เสถียรกว่านี้ต้อง deploy ขึ้น hosting จริงแทน tunnel
>
> ครั้งแรกที่เข้า URL ผ่าน tunnel จากเบราว์เซอร์จะเจอหน้า "click to continue" ของ localtunnel (ปกติ ไม่ใช่ error) — เรียกจากโค้ด (fetch) ไม่เจอหน้านี้

## Auth — สำคัญมาก อ่านก่อนเริ่ม

API ใช้ **JWT** เป็นหลักฐานว่า login อยู่ ฝั่งเว็บใช้ httpOnly cookie (browser จัดการให้อัตโนมัติ) แต่ **ฝั่ง mobile ต้องเก็บ token เองแล้วแนบ header เอง**:

1. เรียก `/api/auth/login` หรือ `/api/auth/register` → ได้ `token` กลับมาใน response body
2. เก็บ `token` ไว้ใน secure storage ของเครื่อง (แนะนำ `expo-secure-store`)
3. ทุก request ที่ต้อง login ให้แนบ header:
   ```
   Authorization: Bearer <token>
   ```
4. Token หมดอายุใน **7 วัน** — ถ้า request ไหนได้ 401 กลับมา ให้พาไปหน้า login ใหม่

Endpoint ที่มีคำว่า **"ต้อง login"** ด้านล่าง = ต้องแนบ header นี้ ไม่งั้นได้ 401 `UNAUTHORIZED`/`INVALID_TOKEN`

### รูปแบบ error ที่ใช้เหมือนกันทุก endpoint

```json
{ "error": { "code": "SOME_CODE", "message": "ข้อความสำหรับโชว์ผู้ใช้ (ไทย)" } }
```

---

## Auth Endpoints

### `POST /api/auth/register`
สมัครสมาชิก + login ให้เลยในตัว (ได้ token กลับมาทันที ไม่ต้องเรียก login ซ้ำ)

Request:
```json
{ "email": "a@b.com", "password": "atleast8chars" }
```

Response `201`:
```json
{ "user": { "id": "...", "email": "a@b.com", "role": "USER" }, "token": "eyJ..." }
```

Errors: `400 VALIDATION_ERROR`, `409 EMAIL_EXISTS`

### `POST /api/auth/login`
Request: `{ "email": "...", "password": "..." }`
Response `200`: เหมือน register (`{ user, token }`)
Errors: `401 INVALID_CREDENTIALS`, `403 ACCOUNT_DISABLED`, `400 VALIDATION_ERROR`

### `POST /api/auth/logout`
ไม่มี body — เคลียร์ cookie ฝั่งเว็บ (มือถือแค่ลบ token ที่เก็บไว้เองพอ ไม่ต้องเรียก endpoint นี้ก็ได้)

### `GET /api/auth/me` — ต้อง login
คืนข้อมูล user ปัจจุบันจาก token: `{ "user": { "id", "email", "role", "isVerified", "createdAt" } }`

### `POST /api/auth/forget-password`
Request: `{ "email": "..." }` → ส่ง OTP 6 หลักไปอีเมล (ตอบข้อความเดียวกันเสมอไม่ว่าจะเจอ email หรือไม่ เพื่อความปลอดภัย)

### `POST /api/auth/reset-password`
Request: `{ "email": "...", "otp": "123456", "newPassword": "..." }` → เช็ค OTP พร้อมตั้งรหัสใหม่ในทีเดียว
Errors: `400 INVALID_OTP`, `400 VALIDATION_ERROR`

---

## Profile Endpoints (ทั้งหมดต้อง login)

### `GET /api/profile`
`{ "user": { "id", "email", "displayName", "avatarUrl", "language", "role" } }`

### `PATCH /api/profile`
Request (ส่งเฉพาะ field ที่จะแก้): `{ "displayName"?: "...", "language"?: "TH" | "EN" }`

### `POST /api/profile/avatar`
`multipart/form-data` field ชื่อ `avatar` (ไฟล์รูป, สูงสุด 5MB) → `{ "avatarUrl": "https://..." }`
ต้องมี `CLOUDINARY_URL` ตั้งค่าไว้ฝั่ง server ไม่งั้น 500

### `POST /api/profile/verify-password`
เช็ครหัสผ่านบัญชีปัจจุบัน (ใช้ก่อนเข้าหน้า file passwords): `{ "password": "..." }` → `200 { ok: true }` / `401 INVALID_PASSWORD`

### `POST /api/profile/change-password`
เปลี่ยนรหัสผ่านบัญชี **ไม่ใช้ OTP** ต้องรู้รหัสเดิม: `{ "oldPassword": "...", "newPassword": "..." }`
Errors: `400 INVALID_PASSWORD`, `400 VALIDATION_ERROR`

### `GET /api/profile/storage`
`{ "usedBytes": 12345, "limitBytes": 5368709120 }` (limit = 5GB คงที่ ตอนนี้)

---

## Tag Endpoints (ทั้งหมดต้อง login + เป็นเจ้าของ tag เท่านั้น)

> Tag เป็นของ user แต่ละคน (ไม่ใช่ global อีกต่อไป) — คนละคนตั้งชื่อ tag ซ้ำกันได้ (เช่นทั้งคู่มี tag ชื่อ "Work" คนละสี) แต่คนเดียวกันตั้งชื่อซ้ำตัวเองไม่ได้

### `GET /api/tags`
เฉพาะ tag ของตัวเอง: `[{ "id", "name", "color", "createdAt", "userId", "_count": { "files": number } }]`

### `POST /api/tags`
Request: `{ "name": "...", "color"?: "#rrggbb" }` (default `#d9d9d9`) → `201` tag object (เป็นของ user ที่ login อยู่)
Error: `400` ถ้าชื่อซ้ำกับ tag อื่นของ**ตัวเอง**

### `PUT /api/tags/[id]`
Request: `{ "name"?, "color"? }` — แก้ได้เฉพาะ tag ของตัวเอง (`404` ถ้าไม่ใช่เจ้าของ)

### `DELETE /api/tags/[id]`
`{ "success": true }` — ลบได้เฉพาะ tag ของตัวเอง (`404` ถ้าไม่ใช่เจ้าของ)

### `POST /api/tags/[id]/files`
เพิ่ม tag นี้ให้ไฟล์หลายไฟล์พร้อมกัน **แบบเติม ไม่ลบ tag เดิมของไฟล์**: `{ "fileIds": ["id1", "id2"] }` (เช็คด้วยว่าทั้ง tag และทุกไฟล์ใน `fileIds` เป็นของ user คนเดียวกับที่ login อยู่ ตัวไหนไม่ใช่ของตัวเองจะถูกข้ามเงียบๆ)

---

## File Endpoints (ทั้งหมดต้อง login + เป็นเจ้าของไฟล์เท่านั้น)

### `GET /api/files`
Query params (ใส่ได้หลายตัวพร้อมกัน):
| param | ค่า | ผล |
|---|---|---|
| `sort` | `date-desc` (default) / `date-asc` / `type` / `name` | เรียงลำดับ |
| `tagId` | ใส่ได้หลายครั้ง `?tagId=a&tagId=b` | กรองไฟล์ที่มี tag ใดใน list นี้ |
| `untagged` | `true` | เฉพาะไฟล์ที่ไม่มี tag เลย |
| `hasPassword` | `true` | เฉพาะไฟล์ที่ตั้งรหัสผ่านไว้ |

Response: array ของ
```json
{
  "id": "...", "name": "photo.png", "type": "image", "ext": "PNG",
  "size": 12345, "uploadedAt": "2026-...", "userId": "...",
  "tags": ["Work", "Personal"], "hasPassword": false,
  "src": "/api/files/{id}/serve"
}
```
`src` เป็น path สัมพัทธ์ — มือถือต้องต่อ base URL เองก่อนใช้ (`${BASE_URL}${src}`) แล้วแนบ `Authorization` header ตอนโหลดด้วย (endpoint นี้ก็ต้อง login เหมือนกัน ไม่ใช่ public URL)

### `POST /api/files`
`multipart/form-data`:
| field | จำเป็น | ค่า |
|---|---|---|
| `file` | ✅ | ไฟล์ที่จะอัปโหลด |
| `tags` | ❌ | string เป็น JSON array ของ tag id เช่น `'["tagId1"]'` (ใส่ได้แค่ตอนอัปโหลด — จะติด tag เดียวกันให้ทุกไฟล์ที่อัปโหลดพร้อมกันก็ทำได้ด้วยการเรียก endpoint นี้ซ้ำต่อไฟล์ ใส่ `tags` เดิม) |
| `password` | ❌ | string — ถ้าใส่ ไฟล์นี้จะต้องกรอกรหัสถึงจะเปิดดูได้ |

**เปลี่ยนพฤติกรรมแล้ว (สำคัญ):** ไฟล์จะไม่กลายเป็น file จริงทันทีอีกต่อไป — ทุกไฟล์ต้องผ่านคิวสแกนไวรัสก่อนเสมอ (ปกติเสร็จภายในไม่กี่วินาที)

Response `202` (ไม่ใช่ `201` เหมือนเดิม):
```json
{ "status": "PENDING_SCAN", "moderationItemId": "...", "message": "..." }
```
ไม่มี file object ส่งกลับมาให้ทันที — มือถือต้องแจ้งผู้ใช้ประมาณ "กำลังตรวจสอบไฟล์..." แล้วปล่อยให้ไฟล์โผล่เองใน `GET /api/files` เมื่อสแกนเสร็จ (ไม่ต้อง poll สถานะแบบ real-time ไม่มี endpoint เช็คสถานะทีละไฟล์ให้มือถือตอนนี้ — แค่ดึง `GET /api/files` ใหม่อีกทีตอนผู้ใช้กลับมาหน้า Home ก็พอ) ไฟล์ที่สแกนไม่ผ่าน/ไม่ชัวร์จะไม่โผล่เลยจนกว่า admin จะตรวจแล้ว approve

### `GET /api/files/[id]`
File object เดี่ยว (shape เหมือนด้านบน)

### `DELETE /api/files/[id]`
`{ "success": true }` — ลบทั้ง record และไฟล์จริงบน disk

### `GET /api/files/[id]/serve`
คืน**ไฟล์จริง** (binary, ไม่ใช่ JSON) — ใช้เป็น URL ของ `<Image>`/video player ได้เลย แต่ต้องแนบ `Authorization` header ตอนโหลด (fetch แล้วแปลงเป็น blob/base64 หรือใช้ library ที่รองรับ custom header ต่อ URL ได้)

### `GET /api/files/[id]/download`
คืนไฟล์จริงพร้อม header `Content-Disposition: attachment` (บังคับดาวน์โหลด)

### `PUT /api/files/[id]/tags`
แทนที่ tag ทั้งหมดของไฟล์นี้ (ไม่ใช่เติม): `{ "tagIds": ["id1", "id2"] }`

### `POST /api/files/[id]/verify-password`
เช็ครหัสผ่านไฟล์ก่อนเปิดดู: `{ "password": "..." }` → `200 { ok: true }` / `401 INVALID_PASSWORD`
ถ้าไฟล์ไม่มีรหัสผ่านเลย เรียกแล้วผ่านทันที (`ok: true`)

### `GET /api/files/[id]/password`
คืนรหัสผ่านไฟล์**จริง** (plaintext): `{ "password": "abc123" }` (หรือ `null` ถ้าไม่มี) — เรียกเฉพาะตอนผู้ใช้กด "ดูรหัส" เท่านั้น อย่า fetch พร้อมกันทีเดียวหลายไฟล์

### `PUT /api/files/[id]/password`
ตั้ง/เปลี่ยนรหัสผ่านไฟล์: `{ "password": "รหัสใหม่" }` (ห้ามส่งค่าว่าง)

---

## หมายเหตุสำคัญสำหรับทีม mobile

1. **File password ≠ Account password** — คนละระบบกัน ไฟล์แต่ละไฟล์ตั้งรหัสแยกได้ (เก็บ plaintext เพราะต้องดูค่าเดิมได้) ส่วนรหัสบัญชี hash ปกติ
2. **Tag เป็นของแต่ละ user แล้ว** (ไม่ใช่ global) — คนละคนเห็น/แก้ tag ของตัวเองเท่านั้น ตั้งชื่อซ้ำกับคนอื่นได้
3. Storage quota = 5GB/user คงที่ในโค้ด ยังไม่มี endpoint เปลี่ยนค่านี้
4. Endpoint กลุ่ม `/api/admin/*` เชื่อมกับหน้าเว็บ admin แล้ว (โซนของ role ADMIN เท่านั้น) แต่**ไม่เกี่ยวกับ mobile ทีม user** ไม่ต้องอ้างอิง
5. **`POST /api/moderation/upload` ถูกลบไปแล้ว** (รวมเข้ากับ `POST /api/files` ตัวเดียวแล้ว ดูพฤติกรรมใหม่ด้านบน)
