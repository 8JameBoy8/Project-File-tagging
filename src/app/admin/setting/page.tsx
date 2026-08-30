"use client";

import {
  ChangeEvent,
  useState,
} from "react";

import AppShell from "@/components/AppShell";
import UserIcon from "@/components/UserIcon";
import { useLanguage } from "@/components/LanguageContext";

export default function SettingPage() {
  const {
    language,
    setLanguage,
    t,
  } = useLanguage();

  const [username, setUsername] =
    useState("User1");

  const [email, setEmail] =
    useState("user1@gmail.com");

  const [profileImage, setProfileImage] =
    useState<string | null>(null);


  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      setProfileImage(
        reader.result as string
      );
    };

    reader.readAsDataURL(file);
  }


  function handleLogout() {
    window.alert(
      language === "th"
        ? "ออกจากระบบแล้ว"
        : "Logged out"
    );
  }


  return (
    <AppShell title={t("setting")}
    >

      <div className="setting-page">

        {/* ================= LEFT ================= */}
        <section className="setting-card">

          <h2>
            {t("editProfile")}
          </h2>


          {/* PROFILE */}
          <div className="profile-section">

            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="profile-image"
              />
            ) : (
              <UserIcon size={76} />
            )}

            <label className="change-image-button">

              ▣ {t("changeImage")}

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={
                  handleImageChange
                }
              />

            </label>

          </div>


          {/* USERNAME */}
          <label className="input-label">
            {t("username")}
          </label>

          <div className="input-with-button">

            <input
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                setUsername(
                  window.prompt(
                    t("username"),
                    username
                  ) || username
                )
              }
            >
              ✎
            </button>

          </div>


          {/* EMAIL */}
          <label className="input-label">
            {t("email")}
          </label>

          <input
            className="setting-input"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
          />


          {/* TOTAL USER */}
          <label className="input-label">
            {t("totalUser")}
          </label>

          <input
            className="setting-input"
            value="3"
            readOnly
          />

        </section>


        {/* ================= RIGHT ================= */}
        <section className="setting-card">

          {/* LANGUAGE */}
          <div className="setting-block">

            <h2>
              {t("language")}
            </h2>


            <div className="language-options">

              <button
                type="button"
                className={
                  language === "en"
                    ? "setting-language-button active"
                    : "setting-language-button"
                }
                onClick={() =>
                  setLanguage("en")
                }
              >
                English
              </button>


              <button
                type="button"
                className={
                  language === "th"
                    ? "setting-language-button active"
                    : "setting-language-button"
                }
                onClick={() =>
                  setLanguage("th")
                }
              >
                ภาษาไทย
              </button>

            </div>

          </div>


          {/* ACCOUNT */}
          <div className="setting-block">

            <h2>
              {t("account")}
            </h2>


            <button
              type="button"
              className="logout-button"
              onClick={
                handleLogout
              }
            >
              → {t("logout")}
            </button>

          </div>


          {/* CURRENT LANGUAGE */}
          <div className="current-language">

            <strong>
              {t("currentLanguage")}:
            </strong>

            <span>
              {language === "th"
                ? "ภาษาไทย"
                : "English"}
            </span>

          </div>

        </section>

      </div>

    </AppShell>
  );
}