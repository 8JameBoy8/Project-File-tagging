"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InputField from "../../components/InputField";
import AuthButton from "../../components/AuthButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2); 
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    alert("ยืนยัน OTP สำเร็จ! กำลังพาไปหน้าตั้งรหัสผ่านใหม่...");
    router.push("/change-password"); 
  };

  return (
    <div className="min-h-screen bg-[#bce3f9] flex flex-col font-sans">
      <header className="bg-white/60 backdrop-blur-sm py-4 px-8 flex justify-end shadow-sm">
        <h1 className="text-xl font-semibold text-gray-700">Forgot Password</h1>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative mt-10">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 bg-[#e6fafe] rounded-full flex items-center justify-center shadow-md border-4 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <div className="mt-10 text-center">
            <h2 className="text-2xl font-bold text-black mb-2 uppercase tracking-wider">
              {step === 1 ? "FORGOT PASSWORD" : "ENTER OTP"}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {step === 1 ? "กรุณากรอกอีเมลของคุณเพื่อรับรหัส OTP สำหรับรีเซ็ตรหัสผ่าน" : `รหัส OTP 6 หลักได้ถูกส่งไปยัง ${email} แล้ว`}
            </p>
          </div>
          {step === 1 ? (
            <form onSubmit={handleSendEmail} className="flex flex-col gap-5">
              <InputField label="Gmail" type="email" placeholder="Example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <AuthButton text="รับรหัส OTP" />
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <InputField label="รหัส OTP" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
              <AuthButton text="ยืนยัน OTP" />
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 underline mt-2">เปลี่ยนอีเมล</button>
            </form>
          )}
          <div className="flex justify-center w-full mt-6 pt-6 border-t border-gray-100 text-sm">
            <Link href="/login" className="text-blue-500 hover:text-blue-700 font-medium transition-colors">&larr; กลับไปหน้าเข้าสู่ระบบ</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
