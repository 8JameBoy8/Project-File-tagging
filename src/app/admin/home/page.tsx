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

type ModerationFile = {
  id: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  status: string;
  uploadedBy: string;
  createdAt: string;
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
  const { t, lang } = useLanguage();
  const isThai = lang === "th";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [files, setFiles] = useState<ModerationFile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sortType, setSortType] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/user?limit=100").then((res) => res.json()),
      fetch("/api/admin/moderation?status=all").then((res) => res.json()),
    ])
      .then(([userData, fileData]) => {
        const loadedUsers: AdminUser[] = userData.users || [];
        setUsers(loadedUsers);
        setFiles(fileData.items || []);
        if (loadedUsers.length) setSelectedUserId(loadedUsers[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  const sortedFiles = useMemo(() => {
    const result = [...files];
    if (sortType === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortType === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortType === "alphabetical") {
      result.sort((a, b) => (a.fileName || "").localeCompare(b.fileName || ""));
    }
    return result;
  }, [sortType, files]);

  function userLabel(userId: string) {
    const u = users.find((user) => user.id === userId);
    return u ? u.displayName || u.email : userId;
  }

  async function handleDelete() {
    if (!selectedUser) return;
    const confirmed = window.confirm(t("confirmDeleteUserMsg"));
    if (!confirmed) return;

    const res = await fetch(`/api/admin/user/${selectedUser.id}`, { method: "DELETE" });
    if (res.ok) {
      alert(t("deleteUserSuccessMsg"));
      const remaining = users.filter((u) => u.id !== selectedUser.id);
      setUsers(remaining);
      setSelectedUserId(remaining[0]?.id ?? null);
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
        <section className="home-grid">
          {/* LEFT: USER DETAILS */}
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

          {/* RIGHT: ALL FILES (ทุก user) — คลิกไฟล์เพื่อดูรายละเอียด user ที่อัปโหลดไฟล์นั้น */}
          <div className="file-list-card">
            <div className="file-list">
              {sortedFiles.length === 0 ? (
                <div className="empty-state">{isThai ? "ยังไม่มีไฟล์ในระบบ" : "No files yet"}</div>
              ) : (
                sortedFiles.map((file) => (
                  <ProductCard
                    key={file.id}
                    title={userLabel(file.uploadedBy)}
                    description={`${file.fileName ?? ""} • ${file.fileType ?? "?"} • ${formatBytes(file.fileSize ?? 0)} • ${file.status}`}
                    selected={file.uploadedBy === selectedUser.id}
                    onClick={() => setSelectedUserId(file.uploadedBy)}
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
