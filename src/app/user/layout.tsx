// สไตล์ของหน้า Upload / File Passwords / Setting (มาจากโปรเจกต์ ui-setting เดิม)
// ใช้เฉพาะโซน /user/* เท่านั้น ไม่ปนกับ globals.css ของแอปหลัก
import './user-theme.css'
import { UploadedFilesProvider } from '@/context/UploadedFilesContext'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UploadedFilesProvider>
      {children}
    </UploadedFilesProvider>
  )
}
