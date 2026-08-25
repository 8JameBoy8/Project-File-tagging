// lib/queue/virus-scan.ts
// ไฟล์นี้เรียก Cloudmersive API เพื่อสแกนไฟล์จาก URL ว่ามีไวรัสไหม

import axios from 'axios'

export type ScanResult = {
  isClean: boolean
  rawResult: string
}

export async function scanFileForVirus(fileUrl: string): Promise<ScanResult> {
  try {
    // Cloudmersive มี endpoint สแกนจาก URL โดยตรง ไม่ต้อง download ไฟล์มาเอง
    const response = await axios.post(
      'https://api.cloudmersive.com/virus/scan/website',
      { Url: fileUrl },
      {
        headers: {
          Apikey: process.env.CLOUDMERSIVE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    // response.data.CleanResult เป็น true ถ้าไฟล์ปลอดภัย
    return {
      isClean: response.data.CleanResult === true,
      rawResult: JSON.stringify(response.data),
    }
  } catch (error) {
    console.error('Virus scan API error:', error)
    // ถ้าเรียก API ไม่สำเร็จ ให้ถือว่าสแกนล้มเหลว (ปลอดภัยไว้ก่อน ไม่ผ่านอัตโนมัติ)
    return {
      isClean: false,
      rawResult: 'SCAN_ERROR',
    }
  }
}
