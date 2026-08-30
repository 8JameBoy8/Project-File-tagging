"use client";

import Link from "next/link";
import { ReactNode } from "react";
import UserIcon from "./UserIcon";
import { useLanguage } from "@/context/LanguageContext";

type AppShellProps = {
  children: ReactNode;
  title: string;
};

export default function AppShell({
  children,
  title,
}: AppShellProps) {
  const { language, setLanguage } = useLanguage();

  const isThai = language === "th";

  const menu = [
    {
      href: "/home",
      icon: "⌂",
      th: "หน้าหลัก",
      en: "Home",
    },
    {
      href: "/approve",
      icon: "☑",
      th: "อนุมัติ / เลือก",
      en: "Approve / Select",
    },
    {
      href: "/setting",
      icon: "⚙",
      th: "ตั้งค่า",
      en: "Setting",
    },
  ];

  return (
    <div className="app-shell">
      <header className="top-header">

        {/* ================= LEFT MENU ================= */}
        <nav className="main-nav">
          {menu.map((item) => {
            const active =
              (item.href === "/home" &&
                title === "Home") ||
              (item.href === "/approve" &&
                (title === "Approve" ||
                  title === "Approve / Select")) ||
              (item.href === "/setting" &&
                title === "Setting");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${
                  active ? "active" : ""
                }`}
              >
                <span className="nav-icon">
                  {item.icon}
                </span>

                <span>
                  {isThai
                    ? item.th
                    : item.en}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ================= RIGHT SIDE ================= */}
        <div className="header-right">

          {/* PAGE TITLE */}
          <h1 className="page-title">
            {isThai
              ? title === "Home"
                ? "หน้าหลัก"
                : title === "Approve" ||
                    title === "Approve / Select"
                  ? "อนุมัติ / เลือก"
                  : "ตั้งค่า"
              : title}
          </h1>

          {/* LANGUAGE */}
          <div className="language-switcher">

            <button
              type="button"
              className={`language-button ${
                language === "en"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setLanguage("en")
              }
            >
              EN
            </button>

            <button
              type="button"
              className={`language-button ${
                language === "th"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setLanguage("th")
              }
            >
              TH
            </button>

          </div>

          {/* USER ICON */}
          <div className="header-user">
            <UserIcon size={38} />
          </div>

        </div>
      </header>

      {/* ================= PAGE CONTENT ================= */}
      <main className="page-content">
        {children}
      </main>
    </div>
  );
}