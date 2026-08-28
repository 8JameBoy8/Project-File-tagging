import React from "react";

interface AuthButtonProps {
  text: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export default function AuthButton({ text, type = "submit", onClick }: AuthButtonProps) {
  return (
    <button 
      type={type} 
      onClick={onClick}
      className="mt-4 w-full bg-[#4cdb5a] hover:bg-[#3ec44b] text-black font-bold py-2.5 rounded-lg border border-gray-400 shadow-sm hover:shadow transition-all duration-200"
    >
      {text}
    </button>
  );
}
