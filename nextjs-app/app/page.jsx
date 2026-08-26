'use client';

import { useState } from 'react';
import UploadFile from '../components/UploadFile';
import FilePasswords from '../components/FilePasswords';
import Setting from '../components/Setting';
import { LanguageProvider } from '../context/LanguageContext';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('upload'); // 'upload' | 'passwords' | 'setting'

  // State เก็บไฟล์ทั้งหมดที่อัปโหลดเข้าสู่ระบบ
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: '1', name: 'ออกแบบ01.txt', tag: 'Study', password: 'Password123' },
    { id: '2', name: '134107664106653705.jpg', tag: 'Personal', password: 'MySecretPass' },
  ]);

  // ฟังก์ชันรับไฟล์ใหม่จากหน้า UploadFile
  const handleUploadSuccess = (newFiles) => {
    setUploadedFiles((prev) => [...newFiles, ...prev]);
  };

  const goToUpload = () => setCurrentPage('upload');
  const goToPasswords = () => setCurrentPage('passwords');
  const goToSetting = () => setCurrentPage('setting');

  return (
    <LanguageProvider>
      <div>
        {currentPage === 'upload' && (
          <UploadFile
            onUploadSuccess={handleUploadSuccess}
            goToUpload={goToUpload}
            goToPasswords={goToPasswords}
            goToSetting={goToSetting}
          />
        )}

        {currentPage === 'passwords' && (
          <FilePasswords
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            goToUpload={goToUpload}
            goToPasswords={goToPasswords}
            goToSetting={goToSetting}
          />
        )}

        {currentPage === 'setting' && (
          <Setting
            goToUpload={goToUpload}
            goToPasswords={goToPasswords}
            goToSetting={goToSetting}
          />
        )}
      </div>
    </LanguageProvider>
  );
}
