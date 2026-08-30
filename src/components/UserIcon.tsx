"use client";

type UserIconProps = {
  size?: number;
};

export default function UserIcon({
  size = 40,
}: UserIconProps) {
  return (
    <div
      className="user-icon"
      style={{
        width: size,
        height: size,
      }}
      aria-label="User"
    >
      <span className="user-head" />
      <span className="user-body" />
    </div>
  );
}