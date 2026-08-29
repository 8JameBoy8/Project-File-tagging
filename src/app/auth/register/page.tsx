"use client";

import { useState } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import AuthButton from "@/components/AuthButton";

export default function RegisterPage() {
  // 1. เพิ่ม State สำหรับเก็บข้อมูล Username ตรงนี้ครับ
  const [username, setUsername] = useState("");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน กรุณาลองใหม่อีกครั้ง");
      return;
    }
    // เพิ่ม username เข้าไปใน log เพื่อเช็คข้อมูลด้วย
    console.log("ข้อมูลสมัครสมาชิก:", { username, email, password });
  };

  return (
    <div className="min-h-screen bg-[#bce3f9] flex flex-col font-sans">
      <header className="bg-white/60 backdrop-blur-sm py-4 px-8 flex justify-end shadow-sm">
        <h1 className="text-xl font-semibold text-gray-700">Register</h1>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative mt-10">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 bg-[#e6fafe] rounded-full flex items-center justify-center shadow-md border-4 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <div className="mt-10 text-center">
            <h2 className="text-2xl font-bold text-black mb-6 uppercase tracking-wider">Register</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 2. เพิ่มช่องกรอก Username ตรงนี้ครับ */}
            <InputField 
              label="Username" 
              type="text" 
              placeholder="Your Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
            
            <InputField 
              label="Gmail" 
              type="email" 
              placeholder="Example@gmail.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <InputField 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              maxLength={8} 
              minLength={8} 
            />
            <InputField 
              label="Confirm Password" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              maxLength={8} 
              minLength={8} 
            />
            <AuthButton text="Sign Up" />
          </form>
          
          <div className="flex justify-center w-full mt-6 pt-6 border-t border-gray-100 text-sm">
            <span className="text-gray-600 mr-2">มีบัญชีอยู่แล้ว?</span>
            <Link href="/auth/login" className="text-blue-500 hover:text-blue-700 font-medium transition-colors">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </main>
    </div>
  );
}