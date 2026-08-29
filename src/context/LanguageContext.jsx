'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

const translations = {
  en: {
    // =========================
    // Navigation
    // =========================
    home: 'Home',
    uploadFile: 'Upload File',
    manageTag: 'Manage Tag',
    createTag: 'Create Tag',
    setting: 'Setting',
    filePasswords: 'File Passwords',

    // =========================
    // General
    // =========================
    language: 'Language',
    profile: 'Profile',
    logout: 'Logout',
    back: 'Back',
    confirmBtn: 'Confirm',
    cancelBtn: 'Cancel',
    unlock: 'Unlock',
    actions: 'Actions',

    // =========================
    // Language
    // =========================
    english: 'English',
    thai: 'ภาษาไทย',
    confirmLangTitle: 'Confirm Language Change',
    confirmLangMsg: 'Are you sure you want to change the system language to {language}?',

    // =========================
    // Upload
    // =========================
    selectTag: 'Select Tag',
    allTags: 'All Tags',
    document: 'Document',
    work: 'Work',
    study: 'Study',
    personal: 'Personal',
    unassigned: 'Unassigned',

    dragDrop: 'Drag & Drop your file here',
    or: 'or',
    chooseFile: 'Choose File',
    maximumStorage: 'Up to {count} files at a time',

    selectedFiles: 'Selected Files ({count})',
    filePassword: 'File Password',
    sharedPassword: 'Choose which files below will be protected with this password',
    applyPasswordTo: 'Apply password to these files',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    enterPassword: 'Enter password',

    addMoreFiles: 'Add More Files',
    confirmUpload: 'Confirm Upload',
    cancelAll: 'Cancel All',

    clickToOpen: 'Click to open file',
    removeFile: 'Remove file',

    // =========================
    // Upload messages
    // =========================
    maxFilesMessage: 'You can select up to {count} files at a time.',
    fileTooLarge: 'File "{name}" exceeds 50 MB.',
    selectAtLeastOne: 'Please select at least 1 file.',
    fillPassword: 'Please enter and confirm the password.',
    passwordsDoNotMatch: 'Password and confirmation password do not match.',
    selectAtLeastOneForPassword: 'Please select at least one file to apply the password to.',
    uploadSuccess: 'Successfully uploaded {count} file(s){suffix}',
    sharedPasswordSuffix: ' (with password protection)',

    // =========================
    // File Password
    // =========================
    fileName: 'File Name',
    tag: 'Tag',
    passwordProtection: 'Password Protection',
    noPassword: 'No Password',
    newPassword: 'New password',
    newPasswordPlaceholder: 'New password',
    changePassword: 'Change Password',
    showPassword: 'Show Password',
    hidePassword: 'Hide Password',
    noFilesFound: 'No files found.',
    searchFiles: 'Search files...',

    enterFilePassword: 'Enter Your Account Password',
    filePasswordDescription: 'Enter your account (login) password once to view and manage all saved file passwords on this page.',
    enterPasswordEllipsis: 'Enter password...',
    passwordIncorrect: 'Incorrect password',
    fileAddressMissing: 'File address not found or the file is incomplete.',

    // =========================
    // Setting
    // =========================
    storageUsage: 'Storage Usage',
    used: 'Used',
    remaining: 'Remaining',

    editProfile: 'Edit Profile',
    enterUsername: 'Enter username',

    changeLoginPassword: 'Change Login Password',
    currentPassword: 'Current Password',
    confirmNewPassword: 'Confirm New Password',
    currentPasswordIncorrect: 'Current password is incorrect.',
    passwordMismatch: 'Password and confirmation password do not match.',

    saveProfileTitle: 'Confirm Changes',
    saveProfileMsg: 'Do you want to save the changes to your profile?',

    profileSaved: 'Profile information saved successfully!',
    passwordChanged: 'Login password changed successfully!',

    // =========================
    // Logout
    // =========================
    logoutConfirm: 'Are you sure you want to log out?',
    loggedOut: 'Logged Out!',
  },

  th: {
    // =========================
    // Navigation
    // =========================
    home: 'หน้าหลัก',
    uploadFile: 'อัปโหลดไฟล์',
    manageTag: 'จัดการแท็ก',
    createTag: 'สร้างแท็ก',
    setting: 'ตั้งค่า',
    filePasswords: 'รหัสผ่านไฟล์',

    // =========================
    // General
    // =========================
    language: 'ภาษา',
    profile: 'โปรไฟล์',
    logout: 'ออกจากระบบ',
    back: 'ย้อนกลับ',
    confirmBtn: 'ยืนยัน',
    cancelBtn: 'ยกเลิก',
    unlock: 'ปลดล็อก',
    actions: 'การดำเนินการ',

    // =========================
    // Language
    // =========================
    english: 'English',
    thai: 'ภาษาไทย',
    confirmLangTitle: 'ยืนยันการเปลี่ยนภาษา',
    confirmLangMsg: 'คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนภาษาของระบบเป็น {language}?',

    // =========================
    // Upload
    // =========================
    selectTag: 'เลือกแท็ก',
    allTags: 'แท็กทั้งหมด',
    document: 'เอกสาร',
    work: 'งาน',
    study: 'การเรียน',
    personal: 'ส่วนตัว',
    unassigned: 'ไม่ได้กำหนด',

    dragDrop: 'ลากและวางไฟล์ของคุณที่นี่',
    or: 'หรือ',
    chooseFile: 'เลือกไฟล์',
    maximumStorage: 'สูงสุด {count} ไฟล์ต่อครั้ง',

    selectedFiles: 'ไฟล์ที่เลือก ({count})',
    filePassword: 'รหัสผ่านไฟล์',
    sharedPassword: 'เลือกไฟล์ด้านล่างที่จะป้องกันด้วยรหัสผ่านนี้',
    applyPasswordTo: 'ใช้รหัสผ่านกับไฟล์เหล่านี้',
    password: 'รหัสผ่าน',
    confirmPassword: 'ยืนยันรหัสผ่าน',
    enterPassword: 'กรอกรหัสผ่าน',

    addMoreFiles: 'เพิ่มไฟล์',
    confirmUpload: 'ยืนยันการอัปโหลด',
    cancelAll: 'ยกเลิกทั้งหมด',

    clickToOpen: 'คลิกเพื่อเปิดไฟล์',
    removeFile: 'ลบไฟล์',

    // =========================
    // Upload messages
    // =========================
    maxFilesMessage: 'สามารถเลือกไฟล์ได้สูงสุด {count} ไฟล์ต่อครั้ง',
    fileTooLarge: 'ไฟล์ "{name}" มีขนาดเกิน 50 MB',
    selectAtLeastOne: 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์',
    fillPassword: 'กรุณากรอกรหัสผ่านและยืนยันรหัสผ่านให้ครบถ้วน',
    passwordsDoNotMatch: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน',
    selectAtLeastOneForPassword: 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์ที่จะใช้รหัสผ่านนี้',
    uploadSuccess: 'อัปโหลดสำเร็จจำนวน {count} ไฟล์{suffix}',
    sharedPasswordSuffix: ' (มีการป้องกันด้วยรหัสผ่าน)',

    // =========================
    // File Password
    // =========================
    fileName: 'ชื่อไฟล์',
    tag: 'แท็ก',
    passwordProtection: 'การป้องกันด้วยรหัสผ่าน',
    noPassword: 'ไม่มีรหัสผ่าน',
    newPassword: 'รหัสผ่านใหม่',
    newPasswordPlaceholder: 'รหัสผ่านใหม่',
    changePassword: 'เปลี่ยนรหัสผ่าน',
    showPassword: 'แสดงรหัสผ่าน',
    hidePassword: 'ซ่อนรหัสผ่าน',
    noFilesFound: 'ไม่พบไฟล์',
    searchFiles: 'ค้นหาไฟล์...',

    enterFilePassword: 'กรอกรหัสผ่านบัญชีผู้ใช้',
    filePasswordDescription: 'กรอกรหัสผ่านบัญชีผู้ใช้ (รหัสผ่านเข้าสู่ระบบ) เพียงครั้งเดียว เพื่อดูและจัดการรหัสผ่านของไฟล์ทั้งหมดในหน้านี้',
    enterPasswordEllipsis: 'กรอกรหัสผ่าน...',
    passwordIncorrect: 'รหัสผ่านไม่ถูกต้อง',
    fileAddressMissing: 'ไม่พบที่อยู่ของไฟล์ หรือไฟล์นี้ไม่สมบูรณ์',

    // =========================
    // Setting
    // =========================
    storageUsage: 'พื้นที่จัดเก็บข้อมูล',
    used: 'ใช้ไป',
    remaining: 'เหลือ',

    editProfile: 'แก้ไขโปรไฟล์',
    enterUsername: 'กรอกชื่อผู้ใช้งาน',

    changeLoginPassword: 'เปลี่ยนรหัสผ่านเข้าสู่ระบบ',
    currentPassword: 'รหัสผ่านปัจจุบัน',
    confirmNewPassword: 'ยืนยันรหัสผ่านใหม่',
    currentPasswordIncorrect: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
    passwordMismatch: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน',

    saveProfileTitle: 'ยืนยันการเปลี่ยนแปลง',
    saveProfileMsg: 'คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลโปรไฟล์ใช่หรือไม่?',

    profileSaved: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!',
    passwordChanged: 'เปลี่ยนรหัสผ่านเข้าสู่ระบบสำเร็จ!',

    // =========================
    // Logout
    // =========================
    logoutConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
    loggedOut: 'ออกจากระบบแล้ว!',
  },
};

const LanguageContext = createContext();

// รหัสผ่านเริ่มต้นของบัญชี (ข้อมูลจำลอง ใช้สำหรับปลดล็อกรหัสผ่านไฟล์)
const DEFAULT_ACCOUNT_PASSWORD = 'Password123';

export const LanguageProvider = ({ children }) => {
  // ค่าเริ่มต้นต้องเหมือนกันทั้งฝั่ง server และ client (Next.js SSR)
  // แล้วค่อยอ่านค่าที่จำไว้จาก localStorage หลัง mount เพื่อไม่ให้ hydration mismatch
  const [lang, setLang] = useState('en');
  const [hasHydrated, setHasHydrated] = useState(false);

  const [userProfile, setUserProfile] = useState({
    username: 'John Doe',
    avatar: null,
    password: DEFAULT_ACCOUNT_PASSWORD,
  });

  useEffect(() => {
    const savedLang = typeof window !== 'undefined' ? window.localStorage.getItem('language') : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (localStorage) on mount, not deriving state from props/state
    if (savedLang) setLang(savedLang);
    setHasHydrated(true);
  }, []);

  // ฟังก์ชันแปลภาษา
  const t = (key, values = {}) => {
    let text = translations[lang]?.[key] ?? translations.en[key] ?? key;

    // รองรับข้อความ เช่น {count}, {name}
    Object.keys(values).forEach((valueKey) => {
      text = text.replace(`{${valueKey}}`, values[valueKey]);
    });

    return text;
  };

  // เปลี่ยนภาษา
  const changeLanguage = (newLang) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('language', newLang);
    }
  };

  const updateProfile = (newUsername, newAvatar) => {
    setUserProfile((prev) => ({
      ...prev,
      username: newUsername,
      avatar: newAvatar,
    }));
  };

  // เปลี่ยนรหัสผ่านเข้าสู่ระบบของบัญชีผู้ใช้
  // คืนค่า true เมื่อเปลี่ยนสำเร็จ, false เมื่อรหัสผ่านปัจจุบันไม่ถูกต้อง
  const changeAccountPassword = (currentPassword, newPassword) => {
    if (currentPassword !== userProfile.password) {
      return false;
    }
    setUserProfile((prev) => ({ ...prev, password: newPassword }));
    return true;
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        changeLanguage,
        t,
        userProfile,
        updateProfile,
        changeAccountPassword,
        hasHydrated,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
