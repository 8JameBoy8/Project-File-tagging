"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import UserIcon from "@/components/UserIcon";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingPage() {
  const { lang, changeLanguage, t, userProfile, refreshProfile, updateProfile, changeAccountPassword } =
    useLanguage();
  const router = useRouter();

  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  // ===== แก้ไขโปรไฟล์ admin ของตัวเอง (เดิมหน้านี้เป็น read-only ล้วน แก้ชื่อ/รูป/รหัสผ่านไม่ได้เลย
  //       ทั้งที่ backend ใช้ /api/profile ตัวเดียวกับฝั่ง user อยู่แล้ว — ตรงกับที่ฝั่ง mobile เพิ่มไป) =====
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setTotalUsers(data.totalUsers ?? 0))
      .catch(() => setTotalUsers(null));
  }, []);

  // sync ฟอร์มกับ userProfile เมื่อโหลด/เปลี่ยน (แล้วผู้ใช้ค่อยพิมพ์ทับเอง) — แพทเทิร์นเดียวกับ
  // src/app/user/profile/page.jsx: reset ฟอร์มให้ตรงกับ context ตอนมันเปลี่ยน แล้ว field ค่อย
  // diverge เมื่อผู้ใช้พิมพ์
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the edit form to match userProfile when it loads/changes
    setName(userProfile?.username || "");
    setAvatarPreview(userProfile?.avatar || null);
  }, [userProfile]);

  const nameChanged = name.trim() !== (userProfile?.username || "").trim();
  const canSaveProfile = (nameChanged || avatarFile !== null) && name.trim().length > 0;

  function handlePickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  }

  async function handleSaveProfile() {
    setProfileMsg("");
    setSavingProfile(true);
    const ok = await updateProfile(name.trim(), avatarFile);
    setSavingProfile(false);
    if (ok) {
      setAvatarFile(null);
      setProfileMsg(t("profileSaved"));
    } else {
      setProfileMsg(t("profileSaveFailed"));
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordMsg(t("passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    const ok = await changeAccountPassword(oldPassword, newPassword);
    setSavingPassword(false);
    if (!ok) {
      setPasswordMsg(t("currentPasswordIncorrect"));
      return;
    }
    setPasswordMsg(t("passwordChanged"));
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // เคลียร์ userProfile ที่ context เก็บไว้ (ไม่งั้นจะค้างเป็นของ admin คนนี้ต่อไปจนกว่าจะ
    // reload หน้าเอง — เจอบั๊กจริงตอนสลับ login ระหว่าง user/admin คนละคนในแท็บเดียวกัน)
    await refreshProfile();
    router.push("/auth/login");
  }

  return (
    <AppShell title={t("setting")}>
      <div className="setting-page">
        {/* ================= LEFT: ADMIN PROFILE (แก้ไขได้ — ใช้ /api/profile ตัวเดียวกับฝั่ง user) ================= */}
        <section className="setting-card">
          <h2>{t("editProfile")}</h2>

          <div className="profile-section">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Profile" className="profile-image" />
            ) : (
              <UserIcon size={76} />
            )}
            <button
              type="button"
              className="change-image-button"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 {t("changeImage")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePickAvatar}
              style={{ display: "none" }}
            />
          </div>

          <label className="input-label">{t("username")}</label>
          <input
            className="setting-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("enterUsername")}
          />

          <label className="input-label">{t("email")}</label>
          <input className="setting-input" value={userProfile?.email || ""} readOnly />

          <label className="input-label">{t("totalUsers")}</label>
          <input
            className="setting-input"
            value={totalUsers === null ? "—" : String(totalUsers)}
            readOnly
          />

          <button
            type="button"
            className="setting-language-button"
            style={{ alignSelf: "flex-start", marginTop: 4 }}
            disabled={!canSaveProfile || savingProfile}
            onClick={handleSaveProfile}
          >
            {savingProfile ? "…" : t("save")}
          </button>

          <div className="setting-block">
            {!showPasswordForm ? (
              <button
                type="button"
                className="change-image-button"
                onClick={() => {
                  setShowPasswordForm(true);
                  setPasswordMsg("");
                }}
              >
                🔒 {t("changeLoginPassword")}
              </button>
            ) : (
              <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label className="input-label">{t("currentPassword")}</label>
                <input
                  className="setting-input"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <label className="input-label">{t("newPassword")}</label>
                <input
                  className="setting-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <label className="input-label">{t("confirmNewPassword")}</label>
                <input
                  className="setting-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button type="submit" className="setting-language-button active" disabled={savingPassword}>
                    {savingPassword ? "…" : t("confirmBtn")}
                  </button>
                  <button
                    type="button"
                    className="setting-language-button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordMsg("");
                    }}
                  >
                    {t("cancelBtn")}
                  </button>
                </div>
              </form>
            )}
          </div>

          {(profileMsg || passwordMsg) && (
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{profileMsg || passwordMsg}</p>
          )}
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
