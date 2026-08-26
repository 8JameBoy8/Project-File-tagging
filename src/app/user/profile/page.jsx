import React from 'react';

export default function DefaultAvatar({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '50%', display: 'block' }}
    >
      <circle cx="50" cy="50" r="50" fill="#E2E0D8" />
      <circle cx="50" cy="41" r="18" fill="#888680" />
      <path
        d="M 18 88 C 18 68, 32 62, 50 62 C 68 62, 82 68, 82 88 Z"
        fill="#888680"
      />
    </svg>
  );
}
