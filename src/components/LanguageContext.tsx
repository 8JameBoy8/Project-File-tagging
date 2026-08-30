"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Language = "th" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext =
  createContext<LanguageContextType | undefined>(
    undefined
  );

const translations: Record<
  Language,
  Record<string, string>
> = {
  th: {
    home: "หน้าหลัก",
    approve: "อนุมัติ / เลือก",
    setting: "ตั้งค่า",

    username: "ชื่อผู้ใช้",
    email: "อีเมล",
    password: "รหัสผ่าน",
    id: "รหัส",
    storage: "พื้นที่",
    fileCount: "จำนวนไฟล์",
    allTags: "แท็กทั้งหมด",

    rename: "เปลี่ยนชื่อ",
    delete: "ลบ",
    approveButton: "อนุมัติ",
    notApprove: "ไม่อนุมัติ",

    selectUser: "เลือกผู้ใช้",

    editProfile: "แก้ไขโปรไฟล์",
    changeImage: "เปลี่ยนรูป",
    totalUsers: "จำนวนผู้ใช้ทั้งหมด",

    language: "ภาษา",
    account: "บัญชี",
    logout: "ออกจากระบบ",
    currentLanguage: "ภาษาปัจจุบัน",

    alphabetical: "เรียงตามตัวอักษร",
    tagCount: "เรียงตามจำนวนแท็ก",

    pdf: "PDF",
    sql: "SQL",
    image: "รูปภาพ",
    powerpoint: "PowerPoint",
    word: "Word",

    newest: "ล่าสุด",
  },

  en: {
    home: "Home",
    approve: "Approve / Select",
    setting: "Setting",

    username: "Username",
    email: "Email",
    password: "Password",
    id: "ID",
    storage: "Storage",
    fileCount: "File Count",
    allTags: "All Tags",

    rename: "Rename",
    delete: "Delete",
    approveButton: "Approve",
    notApprove: "Not Approve",

    selectUser: "Select User",

    editProfile: "Edit Profile",
    changeImage: "Change Image",
    totalUsers: "Total Users",

    language: "Language",
    account: "Account",
    logout: "Logout",
    currentLanguage: "Current Language",

    alphabetical: "Sort: Alphabetical",
    tagCount: "Sort: Tag Count",

    pdf: "PDF",
    sql: "SQL",
    image: "Image",
    powerpoint: "PowerPoint",
    word: "Word",

    newest: "Newest",
  },
};

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
  useState<Language>("en");

useEffect(() => {
  const saved = localStorage.getItem(
    "language"
  ) as Language | null;

  if (saved === "th" || saved === "en") {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguageState(saved);
  }
}, []);

function setLanguage(nextLanguage: Language) {
  setLanguageState(nextLanguage);
  localStorage.setItem(
    "language",
    nextLanguage
  );
}

  function t(key: string) {
    return (
      translations[language][key] ??
      translations.en[key] ??
      key
    );
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}