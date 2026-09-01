"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";

type ModerationItem = {
  id: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  status: string;
  scanResult: string | null;
  tagIds: string | null;
  createdAt: string;
  uploader: { id: string; displayName: string | null; email: string } | null;
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

function tagCount(tagIds: string | null) {
  if (!tagIds) return 0;
  try {
    const parsed = JSON.parse(tagIds);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function ApprovePage() {
  const { t, lang } = useLanguage();
  const isThai = lang === "th";

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  function loadItems() {
    setLoading(true);
    fetch("/api/admin/moderation?status=PENDING_REVIEW")
      .then((res) => res.json())
      .then((data) => {
        const loaded: ModerationItem[] = data.items || [];
        setItems(loaded);
        setSelectedId((prev) => (loaded.some((i) => i.id === prev) ? prev : loaded[0]?.id ?? null));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (the API) on mount, not deriving state from props/state
    loadItems();
  }, []);

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  async function handleDecision(action: "approve" | "reject") {
    if (!selectedItem || working) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/admin/moderation/${selectedItem.id}/${action}`, { method: "POST" });
      if (res.ok) {
        alert(action === "approve" ? t("approveSuccessMsg") : t("rejectSuccessMsg"));
        const remaining = items.filter((i) => i.id !== selectedItem.id);
        setItems(remaining);
        setSelectedId(remaining[0]?.id ?? null);
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error?.message || (isThai ? "ทำรายการไม่สำเร็จ" : "Action failed"));
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppShell title={t("approve")}>
      {loading ? (
        <div className="empty-state">{isThai ? "กำลังโหลด..." : "Loading..."}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">{t("noPendingItemsMsg")}</div>
      ) : (
        <div className="approve-grid">
          {/* LEFT */}
          <section className="detail-card">
            <div className="preview-box">
              <div className="pdf-preview">
                <div className="pdf-page">
                  <div className="pdf-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                  <strong>{selectedItem?.fileType?.toUpperCase() ?? "?"}</strong>
                </div>
              </div>
            </div>

            {selectedItem && (
              <div className="details">
                <div className="detail-row">
                  <strong>{t("username")}</strong>
                  <span>{selectedItem.uploader?.displayName || selectedItem.uploader?.email || "—"}</span>
                </div>
                <div className="detail-row">
                  <strong>{t("email")}</strong>
                  <span>{selectedItem.uploader?.email ?? "—"}</span>
                </div>
                <div className="detail-row">
                  <strong>{isThai ? "ไฟล์" : "File"}</strong>
                  <span>{selectedItem.fileName ?? "—"}</span>
                </div>
                <div className="detail-row">
                  <strong>{isThai ? "ขนาด" : "Size"}</strong>
                  <span>{formatBytes(selectedItem.fileSize ?? 0)}</span>
                </div>
                <div className="detail-row">
                  <strong>{t("allTags")}</strong>
                  <span>{tagCount(selectedItem.tagIds)}</span>
                </div>
                <div className="detail-row tags-row">
                  <strong>{isThai ? "เหตุผลที่ถูกตรวจสอบ" : "Flag reason"}</strong>
                  <span style={{ fontSize: "12px", wordBreak: "break-word" }}>
                    {selectedItem.scanResult ?? "—"}
                  </span>
                </div>
              </div>
            )}

            <div className="approve-actions">
              <button
                type="button"
                className="approve-button"
                disabled={working}
                onClick={() => handleDecision("approve")}
              >
                ✓ {t("approveButton")}
              </button>
              <button
                type="button"
                className="not-approve-button"
                disabled={working}
                onClick={() => handleDecision("reject")}
              >
                × {t("notApprove")}
              </button>
            </div>
          </section>

          {/* RIGHT */}
          <section className="file-list-card">
            <div className="file-list">
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  name={item.fileName ?? ""}
                  type={item.fileType ?? "?"}
                  size={formatBytes(item.fileSize ?? 0)}
                  user={item.uploader?.displayName || item.uploader?.email || "—"}
                  date={new Date(item.createdAt).toLocaleString()}
                  selected={item.id === selectedId}
                  onClick={() => setSelectedId(item.id)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
