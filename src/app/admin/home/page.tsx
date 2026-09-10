"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProductCard from "@/components/ProductCard";
import UserIcon from "@/components/UserIcon";
import { useLanguage } from "@/context/LanguageContext";

type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  storageUsedBytes: number;
  fileCount: number;
  tags: string[];
};

// ไฟล์จริงของ user คนหนึ่ง (จากตาราง File จริง ไม่ใช่ moderation queue) — ดู
// GET /api/admin/user/[id]/files
type UserFile = {
  id: string;
  name: string;
  type: string;
  ext: string;
  size: number;
  uploadedAt: string;
  tags: string[];
  hasPassword: boolean;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export default function HomePage() {
  const { t, lang, userProfile } = useLanguage();
  const isThai = lang === "th";

  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sortType, setSortType] = useState("newest");
  const [loading, setLoading] = useState(true);

  // ตัดบัญชี admin ที่ล็อกอินอยู่ออกจากลิสต์ — หน้านี้มีไว้จัดการ "ผู้ใช้คนอื่น" ไม่ใช่ตัวเอง
  // (ตรงกับที่ฝั่ง mobile ทำ) ถึง backend จะกันลบตัวเองอยู่แล้วก็ตาม
  const users = useMemo(
    () => allUsers.filter((u) => u.id !== userProfile?.id),
    [allUsers, userProfile?.id]
  );

  // ไฟล์จริงของ user ที่เลือกอยู่ — ดึงจาก /api/admin/user/[id]/files (ตาราง File จริง) แทน
  // /api/admin/moderation ที่เคยใช้ เพราะ moderation queue เก็บชื่อไฟล์/แท็กไว้แค่ ณ ตอนอัปโหลด
  // ครั้งเดียว ไม่อัปเดตตามหลังเวลา user ไปเพิ่ม/ลบแท็กทีหลังผ่านหน้าจัดการแท็ก ทำให้จำนวนไฟล์และ
  // แท็กที่โชว์ไม่ตรงกับความเป็นจริงปัจจุบัน (เจอจริงจากการทดสอบ)
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/user?limit=100")
      .then((res) => res.json())
      .then((userData) => setAllUsers(userData.users || []))
      .finally(() => setLoading(false));
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  // เลือก user คนแรกให้อัตโนมัติ และถ้าคนที่เลือกอยู่หายไป (ถูกลบ/ถูกกรองออก) ให้เด้งไปคนแรกที่เหลือ
  useEffect(() => {
    if (users.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keeping selection in sync with the fetched user list
      if (selectedUserId !== null) setSelectedUserId(null);
      return;
    }
    if (!selectedUserId || !users.some((u) => u.id === selectedUserId)) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (no user selected = clear the file list), not deriving state from props/state
      setUserFiles([]);
      return;
    }
    setFilesLoading(true);
    fetch(`/api/admin/user/${selectedUserId}/files`)
      .then((res) => res.json())
      .then((data) => setUserFiles(data.files || []))
      .catch(() => setUserFiles([]))
      .finally(() => setFilesLoading(false));
  }, [selectedUserId]);

  const sortedFiles = useMemo(() => {
    const result = [...userFiles];
    if (sortType === "newest") {
      result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } else if (sortType === "oldest") {
      result.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
    } else if (sortType === "alphabetical") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [sortType, userFiles]);

  async function handleDelete() {
    if (!selectedUser) return;
    const confirmed = window.confirm(t("confirmDeleteUserMsg"));
    if (!confirmed) return;

    const res = await fetch(`/api/admin/user/${selectedUser.id}`, { method: "DELETE" });
    if (res.ok) {
      alert(t("deleteUserSuccessMsg"));
      // ตัดออกจาก allUsers — effect ด้านบนจะเลือก user คนถัดไปให้เอง
      setAllUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error?.message || t("deleteUserFailedMsg"));
    }
  }

  return (
    <AppShell title={t("home")}>
      <div className="toolbar">
        <label htmlFor="home-sort">{isThai ? "เรียงตาม" : "Sort by"}</label>
        <select
          id="home-sort"
          className="sort-select"
          value={sortType}
          onChange={(event) => setSortType(event.target.value)}
        >
          <option value="newest">{isThai ? "ใหม่สุด" : "Newest"}</option>
          <option value="oldest">{isThai ? "เก่าสุด" : "Oldest"}</option>
          <option value="alphabetical">{isThai ? "เรียงตามชื่อไฟล์" : "By file name"}</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state">{isThai ? "กำลังโหลด..." : "Loading..."}</div>
      ) : !selectedUser ? (
        <div className="empty-state">{isThai ? "ยังไม่มีผู้ใช้ในระบบ" : "No users yet"}</div>
      ) : (
        <section className="home-grid home-grid-3">
          {/* LEFT: USER PICKER — เลือก user คนอื่นได้ (เดิมเลือกไม่ได้เลย ล็อกไว้ที่คนแรกคนเดียว) */}
          <div className="user-picker-card">
            <div className="user-picker-head">
              <strong>{isThai ? "ผู้ใช้" : "Users"}</strong>
              <span>{isThai ? `${users.length} คน` : `${users.length} users`}</span>
            </div>
            <div className="user-picker-list">
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  className={`user-picker-item${u.id === selectedUserId ? " active" : ""}`}
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <span className="user-picker-avatar">
                    {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="user-picker-text">
                    <span className="user-picker-name">{u.displayName || u.email}</span>
                    <span className="user-picker-email">{u.email}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* MIDDLE: USER DETAILS */}
          <div className="detail-card">
            <div className="preview-box">
              <UserIcon size={92} />
            </div>

            <div className="details">
              <div className="detail-row">
                <strong>{t("username")}</strong>
                <span>{selectedUser.displayName || selectedUser.email}</span>
              </div>
              <div className="detail-row">
                <strong>{t("email")}</strong>
                <span>{selectedUser.email}</span>
              </div>
              <div className="detail-row">
                <strong>{t("id")}</strong>
                <span>{selectedUser.id}</span>
              </div>
              <div className="detail-row">
                <strong>{t("fileCount")}</strong>
                <span>{selectedUser.fileCount}</span>
              </div>
              <div className="detail-row">
                <strong>{t("storage")}</strong>
                <span>{formatBytes(selectedUser.storageUsedBytes)}</span>
              </div>
              <div className="detail-row tags-row">
                <strong>{t("allTags")}</strong>
                <div className="detail-tags">
                  {selectedUser.tags.length === 0 && <span>—</span>}
                  {selectedUser.tags.map((tag) => (
                    <span className="detail-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* หมายเหตุ: ปุ่ม Rename เอาออก — ยังไม่มี endpoint รองรับการแก้ displayName ของ user คนอื่นจากฝั่ง admin */}
            <div className="action-buttons">
              <button type="button" className="delete-button" onClick={handleDelete}>
                ✕ {t("delete")}
              </button>
            </div>
          </div>

          {/* RIGHT: ไฟล์จริงของ user ที่เลือกอยู่ทางซ้าย (ไม่ใช่ไฟล์ของทุกคนแล้ว — เดิมคลิกไฟล์
              เพื่อสลับ selected user แต่ซ้ำซ้อนเพราะเลือก user ได้จากลิสต์ user อยู่แล้ว) */}
          <div className="file-list-card">
            <div className="file-list">
              {filesLoading ? (
                <div className="empty-state">{isThai ? "กำลังโหลด..." : "Loading..."}</div>
              ) : sortedFiles.length === 0 ? (
                <div className="empty-state">{isThai ? "ยังไม่มีไฟล์" : "No files yet"}</div>
              ) : (
                sortedFiles.map((file) => (
                  <ProductCard
                    key={file.id}
                    title={file.name}
                    description={`${file.type} • ${formatBytes(file.size)} • ${
                      file.tags.length > 0 ? file.tags.join(", ") : (isThai ? "ไม่มีแท็ก" : "no tags")
                    }`}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
