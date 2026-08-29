'use client';

import React, { createContext, useContext, useState } from 'react';

// ในต้นฉบับ (ui-setting) หน้า Upload / File Passwords / Setting เป็นแค่ "แท็บ" ของหน้าเดียวกัน
// จึงส่ง uploadedFiles/setUploadedFiles กันผ่าน props ได้ตรง ๆ
// แต่พอย้ายมาเป็นคนละ route จริงใน Next.js (src/app/user/...) แต่ละหน้าจะถูก mount แยกกัน
// props แบบเดิมจึงใช้ไม่ได้ -> ใช้ Context ตัวนี้แชร์สถานะแทน ครอบไว้ที่ src/app/user/layout.tsx
// (คงอยู่ตลอดตราบใดที่ยังอยู่ใต้ /user/* และไม่ reload หน้าเต็ม)

const UploadedFilesContext = createContext(null);

const INITIAL_FILES = [
  { id: '1', name: 'ออกแบบ01.txt', tag: 'Study', password: 'Password123' },
  { id: '2', name: '134107664106653705.jpg', tag: 'Personal', password: 'MySecretPass' },
];

export function UploadedFilesProvider({ children }) {
  const [uploadedFiles, setUploadedFiles] = useState(INITIAL_FILES);

  return (
    <UploadedFilesContext.Provider value={{ uploadedFiles, setUploadedFiles }}>
      {children}
    </UploadedFilesContext.Provider>
  );
}

export function useUploadedFiles() {
  const ctx = useContext(UploadedFilesContext);
  if (!ctx) {
    throw new Error('useUploadedFiles ต้องถูกเรียกใช้ภายใต้ <UploadedFilesProvider>');
  }
  return ctx;
}
