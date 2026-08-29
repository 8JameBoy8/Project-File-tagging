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
    profileSaveFailed: 'Failed to save profile. Please try again.',
    passwordChanged: 'Login password changed successfully!',

    // =========================
    // Logout
    // =========================
    logoutConfirm: 'Are you sure you want to log out?',
    loggedOut: 'Logged Out!',

    // =========================
    // Home
    // =========================
    selectFileToPreview: 'Select a file on the right to preview',
    confirmDeleteFile: 'Are you sure you want to delete this file?',
    fileTagLabel: 'File Tag',
    download: 'Download',
    delete: 'Delete',
    sortLabel: 'Sort',
    sortNewest: 'Latest Upload',
    sortOldest: 'Oldest',
    sortByType: 'By Type',
    sortByName: 'By Name',
    filterTag: 'Filter Tag',
    noTagsExist: 'No tags yet',
    clearSelection: 'Clear selection',
    filePasswordRequiredMsg: 'This file is password protected. Enter the password to view it.',

    // =========================
    // Manage Tag
    // =========================
    selectTagToAddFiles: 'Select a tag to add files to...',
    editTagTitle: 'Edit Tag',
    deleteTagTitle: 'Delete Tag',
    save: 'Save',
    addFileToTagTitle: 'Add files to this tag',
    selectedCountFiles: '{count} file(s) selected',
    pleaseSelectTagFirst: 'Please select a tag to add files to first',
    pleaseSelectTagToDelete: 'Please select a tag to delete',
    confirmDeleteTagMsg: 'Are you sure you want to delete this tag?',
    addFileToTagFailed: 'Failed to add files to tag',
    filesWithNoTag: 'Files with no tag',
    filesCountLabel: 'Files: {count}',
    clickFilesToSelectMsg: 'Click files below to select, then press Confirm to add them to tag {tag}',
    alreadyHasThisTag: 'Already has this tag',

    // =========================
    // Create Tag
    // =========================
    totalTagLabel: 'Total tag : {count}',
    nameTagLabel: 'Name Tag',
    nameTagPlaceholder: 'Type name here...',
    colorTagLabel: 'Color Tag',
    orCustomColorLabel: 'Or Custom Color',
    deleteSelectedBtn: 'Delete Selected',
    deleteCountBtn: 'Delete ({count})',
    createBtn: 'Create',
    createdTagsTitle: 'Created Tags (Click/Tap to select)',
    pleaseEnterTagName: 'Please enter a tag name before creating',
    createTagFailed: 'Failed to create tag',
    createTagError: 'Error creating tag',
    pleaseSelectTagsToDeleteBelow: 'Please select the tags to delete below',
    confirmDeleteTagsMsg: 'Are you sure you want to delete {count} selected tag(s)?',

    // =========================
    // Upload extra
    // =========================
    uploadingInProgress: 'Uploading...',
    uploadPartialFailure: 'Uploaded {success} of {total} files. Some files failed.',

    // =========================
    // Auth pages
    // =========================
    genericErrorMsg: 'Something went wrong. Please try again.',

    loginPageTitle: 'Login',
    loginBtn: 'Login',
    loggingInBtn: 'Logging in...',
    loginFailedMsg: 'Login failed',
    registerLinkText: 'Register?',
    forgotPasswordLinkText: 'Forgot password',

    registerPageTitle: 'Register',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Your Username',
    alreadyHaveAccountText: 'Already have an account?',
    loginLinkText: 'Login',
    signUpBtn: 'Sign Up',
    signingUpBtn: 'Signing up...',
    registerFailedMsg: 'Registration failed',

    forgotPasswordPageTitle: 'Forgot Password',
    forgotPasswordHeading: 'FORGOT PASSWORD',
    enterOtpHeading: 'ENTER OTP',
    forgotPasswordDesc: 'Please enter your email to receive an OTP to reset your password',
    otpSentToMsg: 'A 6-digit OTP has been sent to {email}',
    otpLabel: 'OTP Code',
    receiveOtpBtn: 'Get OTP',
    sendingOtpBtn: 'Sending OTP...',
    verifyOtpBtn: 'Verify OTP',
    changeEmailBtn: 'Change email',
    backToLoginLink: 'Back to login',
    sendOtpFailedMsg: 'Failed to send OTP',

    changePasswordPageTitle: 'Change Password',
    savingBtn: 'Saving...',
    invalidResetLinkMsg: 'This link is invalid. Please start again from the forgot password page.',
    resetPasswordFailedMsg: 'Failed to reset password',
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
    profileSaveFailed: 'บันทึกโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่',
    passwordChanged: 'เปลี่ยนรหัสผ่านเข้าสู่ระบบสำเร็จ!',

    // =========================
    // Logout
    // =========================
    logoutConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
    loggedOut: 'ออกจากระบบแล้ว!',

    // =========================
    // Home
    // =========================
    selectFileToPreview: 'เลือกไฟล์ทางด้านขวาเพื่อดูตัวอย่าง',
    confirmDeleteFile: 'ต้องการลบไฟล์ใช่หรือไม่?',
    fileTagLabel: 'แท็กไฟล์',
    download: 'ดาวน์โหลด',
    delete: 'ลบ',
    sortLabel: 'เรียงตาม',
    sortNewest: 'อัปโหลดล่าสุด',
    sortOldest: 'เก่าสุด',
    sortByType: 'ตามประเภท',
    sortByName: 'ตามชื่อ',
    filterTag: 'กรองแท็ก',
    noTagsExist: 'ไม่มีแท็ก',
    clearSelection: 'ล้างตัวเลือก',
    filePasswordRequiredMsg: 'ไฟล์นี้มีรหัสผ่านป้องกันอยู่ กรุณากรอกรหัสผ่านเพื่อดู',

    // =========================
    // Manage Tag
    // =========================
    selectTagToAddFiles: 'เลือกแท็กที่ต้องการเพิ่มไฟล์...',
    editTagTitle: 'แก้ไขแท็ก',
    deleteTagTitle: 'ลบแท็ก',
    save: 'บันทึก',
    addFileToTagTitle: 'เพิ่มไฟล์เข้าแท็กนี้',
    selectedCountFiles: 'เลือกแล้ว {count} ไฟล์',
    pleaseSelectTagFirst: 'กรุณาเลือกแท็กที่ต้องการเพิ่มไฟล์ก่อน',
    pleaseSelectTagToDelete: 'กรุณาเลือกแท็กที่ต้องการลบ',
    confirmDeleteTagMsg: 'คุณแน่ใจหรือไม่ว่าต้องการลบแท็กนี้?',
    addFileToTagFailed: 'เพิ่มไฟล์เข้าแท็กไม่สำเร็จ',
    filesWithNoTag: 'ไฟล์ที่ไม่มีแท็ก',
    filesCountLabel: 'ไฟล์: {count}',
    clickFilesToSelectMsg: 'คลิกไฟล์ด้านล่างเพื่อเลือก แล้วกด Confirm เพื่อเพิ่มเข้าแท็ก {tag}',
    alreadyHasThisTag: 'มีแท็กนี้แล้ว',

    // =========================
    // Create Tag
    // =========================
    totalTagLabel: 'จำนวนแท็กทั้งหมด : {count}',
    nameTagLabel: 'ชื่อแท็ก',
    nameTagPlaceholder: 'พิมพ์ชื่อที่นี่...',
    colorTagLabel: 'สีแท็ก',
    orCustomColorLabel: 'หรือกำหนดสีเอง',
    deleteSelectedBtn: 'ลบที่เลือก',
    deleteCountBtn: 'ลบ ({count})',
    createBtn: 'สร้าง',
    createdTagsTitle: 'แท็กที่สร้างไว้ (คลิก/แตะเพื่อเลือก)',
    pleaseEnterTagName: 'กรุณากรอกชื่อ Name Tag ก่อนทำการ Create',
    createTagFailed: 'สร้างแท็กไม่สำเร็จ',
    createTagError: 'เกิดข้อผิดพลาดในการสร้างแท็ก',
    pleaseSelectTagsToDeleteBelow: 'กรุณาเลือกแท็กที่ต้องการลบด้านล่างก่อนครับ',
    confirmDeleteTagsMsg: 'คุณแน่ใจหรือไม่ว่าต้องการลบแท็กที่เลือกทั้ง {count} แท็ก?',

    // =========================
    // Upload extra
    // =========================
    uploadingInProgress: 'กำลังอัปโหลด...',
    uploadPartialFailure: 'อัปโหลดสำเร็จ {success} จาก {total} ไฟล์ มีบางไฟล์ที่ไม่สำเร็จ',

    // =========================
    // Auth pages
    // =========================
    genericErrorMsg: 'เกิดข้อผิดพลาด กรุณาลองใหม่',

    loginPageTitle: 'เข้าสู่ระบบ',
    loginBtn: 'เข้าสู่ระบบ',
    loggingInBtn: 'กำลังเข้าสู่ระบบ...',
    loginFailedMsg: 'เข้าสู่ระบบไม่สำเร็จ',
    registerLinkText: 'สมัครสมาชิก?',
    forgotPasswordLinkText: 'ลืมรหัสผ่าน',

    registerPageTitle: 'สมัครสมาชิก',
    usernameLabel: 'ชื่อผู้ใช้',
    usernamePlaceholder: 'ชื่อผู้ใช้ของคุณ',
    alreadyHaveAccountText: 'มีบัญชีอยู่แล้ว?',
    loginLinkText: 'เข้าสู่ระบบ',
    signUpBtn: 'สมัครสมาชิก',
    signingUpBtn: 'กำลังสมัครสมาชิก...',
    registerFailedMsg: 'สมัครสมาชิกไม่สำเร็จ',

    forgotPasswordPageTitle: 'ลืมรหัสผ่าน',
    forgotPasswordHeading: 'ลืมรหัสผ่าน',
    enterOtpHeading: 'กรอกรหัส OTP',
    forgotPasswordDesc: 'กรุณากรอกอีเมลของคุณเพื่อรับรหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
    otpSentToMsg: 'รหัส OTP 6 หลักได้ถูกส่งไปยัง {email} แล้ว',
    otpLabel: 'รหัส OTP',
    receiveOtpBtn: 'รับรหัส OTP',
    sendingOtpBtn: 'กำลังส่ง OTP...',
    verifyOtpBtn: 'ยืนยัน OTP',
    changeEmailBtn: 'เปลี่ยนอีเมล',
    backToLoginLink: 'กลับไปหน้าเข้าสู่ระบบ',
    sendOtpFailedMsg: 'ส่ง OTP ไม่สำเร็จ',

    changePasswordPageTitle: 'เปลี่ยนรหัสผ่าน',
    savingBtn: 'กำลังบันทึก...',
    invalidResetLinkMsg: 'ลิงก์นี้ไม่ถูกต้อง กรุณากลับไปเริ่มจากหน้าลืมรหัสผ่านใหม่',
    resetPasswordFailedMsg: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
  },
};

const LanguageContext = createContext();

// ค่าเริ่มต้นตอนยังไม่รู้ว่า login อยู่ไหม (หรือยังไม่ login)
const EMPTY_PROFILE = {
  id: null,
  email: null,
  username: null, // = User.displayName ฝั่ง backend
  avatar: null,   // = User.avatarUrl ฝั่ง backend
  role: null,
};

// หมายเหตุ: Context นี้เดิมทำแค่เรื่องภาษา แต่ตอนนี้พ่วงข้อมูลโปรไฟล์ผู้ใช้จริงด้วย
// (ยังคงชื่อ LanguageContext/useLanguage ไว้เพื่อไม่ต้องแก้ import ทุกไฟล์ที่ใช้อยู่)
export const LanguageProvider = ({ children }) => {
  // ค่าเริ่มต้นต้องเหมือนกันทั้งฝั่ง server และ client (Next.js SSR)
  // แล้วค่อยอ่านค่าที่จำไว้จาก localStorage หลัง mount เพื่อไม่ให้ hydration mismatch
  const [lang, setLang] = useState('en');
  const [hasHydrated, setHasHydrated] = useState(false);

  const [userProfile, setUserProfile] = useState(EMPTY_PROFILE);

  // ดึงโปรไฟล์จริงจาก backend (ถ้า login อยู่) — เรียกได้ซ้ำหลังแก้ไขโปรไฟล์สำเร็จ
  const refreshProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        // 401 = ยังไม่ login ถือว่าเป็น guest เฉยๆ ไม่ต้อง throw
        setUserProfile(EMPTY_PROFILE);
        return;
      }
      const data = await res.json();
      setUserProfile({
        id: data.user.id,
        email: data.user.email,
        username: data.user.displayName || data.user.email,
        avatar: data.user.avatarUrl,
        role: data.user.role,
      });
      if (data.user.language) {
        setLang(data.user.language === 'TH' ? 'th' : 'en');
      }
    } catch {
      setUserProfile(EMPTY_PROFILE);
    }
  };

  useEffect(() => {
    const savedLang = typeof window !== 'undefined' ? window.localStorage.getItem('language') : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (localStorage) on mount, not deriving state from props/state
    if (savedLang) setLang(savedLang);
    refreshProfile();
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

  // เปลี่ยนภาษา — เก็บไว้ใน localStorage เสมอ และถ้า login อยู่ก็บันทึกลง backend ด้วย
  // (เผื่อ user ไปเปิดเครื่อง/เบราว์เซอร์อื่นจะได้ยังเป็นภาษาเดิม)
  const changeLanguage = (newLang) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('language', newLang);
    }
    if (userProfile.id) {
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang === 'th' ? 'TH' : 'EN' }),
      }).catch(() => {});
    }
  };

  // บันทึกชื่อ/รูปโปรไฟล์จริง — newAvatar เป็น File ดิบ (ไม่ใช่ object URL) ถ้ามีการเปลี่ยนรูป
  // คืนค่า true/false ว่าสำเร็จไหม
  const updateProfile = async (newUsername, newAvatarFile) => {
    try {
      if (newAvatarFile instanceof File) {
        const fd = new FormData();
        fd.append('avatar', newAvatarFile);
        const avatarRes = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
        if (!avatarRes.ok) return false;
      }

      const patchRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newUsername }),
      });
      if (!patchRes.ok) return false;

      await refreshProfile();
      return true;
    } catch {
      return false;
    }
  };

  // เปลี่ยนรหัสผ่านเข้าสู่ระบบของบัญชีผู้ใช้จริง (ไม่ใช้ OTP ต้องรู้รหัสเดิม)
  // คืนค่า true เมื่อเปลี่ยนสำเร็จ, false เมื่อรหัสผ่านปัจจุบันไม่ถูกต้อง/มีปัญหา
  const changeAccountPassword = async (currentPassword, newPassword) => {
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });
      return res.ok;
    } catch {
      return false;
    }
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
        refreshProfile,
        hasHydrated,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
