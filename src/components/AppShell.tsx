"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const { lang, changeLanguage, t } = useLanguage();
  const pathname = usePathname();

  const menu = [
    { href: "/admin/home", icon: "⌂", label: t("home") },
    { href: "/admin/approve", icon: "☑", label: t("approve") },
    { href: "/admin/setting", icon: "⚙", label: t("setting") },
  ];

  return (
    <div className="admin-page">
      <div className="app-shell">
        <header
          className="top-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            background: "var(--surface-alt)",
            borderBottom: "1px solid var(--line)",
            flexShrink: 0,
          }}
        >
          {/* ================= LEFT MENU ================= */}
          <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {menu.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius)",
                    color: "var(--ink)",
                    textDecoration: "none",
                    background: active ? "var(--accent-soft)" : "transparent",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: active ? "var(--accent)" : "var(--muted)",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* ================= RIGHT SIDE ================= */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "20px",
                margin: 0,
              }}
            >
              {title}
            </h1>

            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={() => changeLanguage("en")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--line)",
                  background: lang === "en" ? "var(--accent)" : "var(--surface)",
                  color: lang === "en" ? "#fff" : "var(--ink)",
                  cursor: "pointer",
                  fontSize: "12.5px",
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => changeLanguage("th")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--line)",
                  background: lang === "th" ? "var(--accent)" : "var(--surface)",
                  color: lang === "th" ? "#fff" : "var(--ink)",
                  cursor: "pointer",
                  fontSize: "12.5px",
                }}
              >
                TH
              </button>
            </div>

            <UserIcon size={38} />
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
