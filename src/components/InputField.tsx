import React from "react";

interface InputFieldProps {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export default function InputField({ label, type, placeholder, value, onChange, required, minLength, maxLength }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-bold text-black mb-1.5">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
      />
    </div>
  );
}
