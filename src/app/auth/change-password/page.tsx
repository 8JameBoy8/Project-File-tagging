"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InputField from "@/components/InputField";
import AuthButton from "@/components/AuthButton";
import { useLanguage } from "@/context/LanguageContext";

export default function ChangePasswordPage() {
  // useSearchParams() ต้องอยู่ใต้ Suspense ไม่งั้น next build จะ prerender ไม่ผ่าน
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}

function ChangePasswordForm() {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // มาจากหน้า forgot-password พร้อม email + otp ที่กรอกไว้ (ยังไม่เคยถูกตรวจสอบจริง
  // จนกว่าจะยิง /api/auth/reset-password ตรงนี้ ซึ่งเช็ค otp พร้อมตั้งรหัสใหม่ในทีเดียว)
  const email = searchParams.get("email") || "";
  const otp = searchParams.get("otp") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    if (!email || !otp) {
      setError(t("invalidResetLinkMsg"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || t("resetPasswordFailedMsg"));
        return;
      }
      alert(t("passwordChanged"));
      router.push("/auth/login");
    } catch {
      setError(t("genericErrorMsg"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#bce3f9] flex flex-col font-sans">
      <header className="bg-white/60 backdrop-blur-sm py-4 px-8 flex justify-end shadow-sm">
        <h1 className="text-xl font-semibold text-gray-700">{t("changePasswordPageTitle")}</h1>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative mt-10">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 bg-[#e6fafe] rounded-full flex items-center justify-center shadow-md border-4 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="mt-10 text-center">
            <h2 className="text-2xl font-bold text-black mb-6 tracking-wider">{t("changePasswordPageTitle")}</h2>
          </div>
         <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputField
              label={t("password")}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={8}
              minLength={8}
            />
            <InputField
              label={t("confirmPassword")}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              maxLength={8}
              minLength={8}
            />
            {error && <p className="text-sm text-red-500 text-center -mb-2">{error}</p>}
            <AuthButton text={submitting ? t("savingBtn") : t("confirmBtn")} />
          </form>
        </div>
      </main>
    </div>
  );
}
