"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import UserIcon from "@/components/UserIcon";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingPage() {
  const { lang, changeLanguage, t, userProfile } = useLanguage();
  const router = useRouter();

  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setTotalUsers(data.totalUsers ?? 0))
      .catch(() => setTotalUsers(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/auth/login");
  }

  return (
    <AppShell title={t("setting")}>
      <div className="setting-page">
        {/* ================= LEFT: ADMIN PROFILE (อ่านอย่างเดียว ไม่มี endpoint แก้โปรไฟล์ admin แยกต่างหาก
             ใช้ /api/profile ตัวเดียวกับฝั่ง user ผ่าน context นี้อยู่แล้ว) ================= */}
        <section className="setting-card">
          <h2>{t("editProfile")}</h2>

          <div className="profile-section">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="Profile" className="profile-image" />
            ) : (
              <UserIcon size={76} />
            )}
          </div>

          <label className="input-label">{t("username")}</label>
          <input className="setting-input" value={userProfile?.username || ""} readOnly />

          <label className="input-label">{t("email")}</label>
          <input className="setting-input" value={userProfile?.email || ""} readOnly />

          <label className="input-label">{t("totalUsers")}</label>
          <input className="setting-input" value={totalUsers === null ? "—" : String(totalUsers)} readOnly />
        </section>

        {/* ================= RIGHT ================= */}
        <section className="setting-card">
          <div className="setting-block">
            <h2>{t("language")}</h2>

            <div className="language-options">
              <button
                type="button"
                className={lang === "en" ? "setting-language-button active" : "setting-language-button"}
                onClick={() => changeLanguage("en")}
              >
                English
              </button>
              <button
                type="button"
                className={lang === "th" ? "setting-language-button active" : "setting-language-button"}
                onClick={() => changeLanguage("th")}
              >
                ภาษาไทย
              </button>
            </div>
          </div>

          <div className="setting-block">
            <h2>{t("account")}</h2>
            <button type="button" className="logout-button" onClick={handleLogout}>
              → {t("logout")}
            </button>
          </div>

          <div className="current-language">
            <strong>{t("currentLanguage")}:</strong>
            <span>{lang === "th" ? "ภาษาไทย" : "English"}</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
