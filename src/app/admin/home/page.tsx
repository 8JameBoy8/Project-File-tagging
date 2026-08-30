"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProductCard from "@/components/ProductCard";
import UserIcon from "@/components/UserIcon";
import { useLanguage } from "@/context/LanguageContext";

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  area: string;
  storage: string;
  fileCount: number;
  tags: string[];
};

type FileItem = {
  id: number;
  user: string;
  type: string;
  size: string;
  tags: number;
  date: string;
  timestamp: number;
};

const users: User[] = [
  {
    id: "U001",
    name: "User1",
    email: "user1@gmail.com",
    password: "********",
    area: "Computer Science",
    storage: "3.8 GB",
    fileCount: 24,
    tags: ["Project", "Report"],
  },
  {
    id: "U002",
    name: "User2",
    email: "user2@gmail.com",
    password: "********",
    area: "Information Technology",
    storage: "2.6 GB",
    fileCount: 18,
    tags: ["Image", "Work", "Design"],
  },
  {
    id: "U003",
    name: "User3",
    email: "user3@gmail.com",
    password: "********",
    area: "Software Engineering",
    storage: "1.9 GB",
    fileCount: 12,
    tags: ["PDF", "Document"],
  },
];

const fileItems: FileItem[] = [
  {
    id: 1,
    user: "User1",
    type: "PDF",
    size: "2 MB",
    tags: 2,
    date: "18/05/2025 10:30 AM",
    timestamp: new Date("2025-05-18T10:30:00").getTime(),
  },
  {
    id: 2,
    user: "User1",
    type: "SQL",
    size: "500 KB",
    tags: 2,
    date: "18/05/2025 10:20 AM",
    timestamp: new Date("2025-05-18T10:20:00").getTime(),
  },
  {
    id: 3,
    user: "User1",
    type: "PowerPoint",
    size: "3.9 MB",
    tags: 1,
    date: "18/05/2025 09:15 AM",
    timestamp: new Date("2025-05-18T09:15:00").getTime(),
  },
  {
    id: 4,
    user: "User2",
    type: "Image",
    size: "1.5 MB",
    tags: 3,
    date: "18/05/2025 09:45 AM",
    timestamp: new Date("2025-05-18T09:45:00").getTime(),
  },
  {
    id: 5,
    user: "User2",
    type: "Word",
    size: "1.1 MB",
    tags: 2,
    date: "18/05/2025 08:50 AM",
    timestamp: new Date("2025-05-18T08:50:00").getTime(),
  },
  {
    id: 6,
    user: "User3",
    type: "PDF",
    size: "1.8 MB",
    tags: 2,
    date: "18/05/2025 08:10 AM",
    timestamp: new Date("2025-05-18T08:10:00").getTime(),
  },
];

export default function HomePage() {
  const { language } = useLanguage();

  const isThai = language === "th";

  const [selectedUserId, setSelectedUserId] =
    useState<string>("U001");

  const [sortType, setSortType] =
    useState<string>("newest");

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ??
    users[0];

  const sortedFiles = useMemo(() => {
    const result = [...fileItems];

    if (sortType === "newest") {
      result.sort(
        (a, b) => b.timestamp - a.timestamp
      );
    }

    if (sortType === "oldest") {
      result.sort(
        (a, b) => a.timestamp - b.timestamp
      );
    }

    if (sortType === "tags") {
      result.sort(
        (a, b) => b.tags - a.tags
      );
    }

    if (sortType === "alphabetical") {
      result.sort((a, b) =>
        a.user.localeCompare(b.user)
      );
    }

    return result;
  }, [sortType]);

  const sortLabel = {
    newest: isThai ? "ใหม่สุด" : "Newest",
    oldest: isThai ? "เก่าสุด" : "Oldest",
    tags: isThai
      ? "จำนวนแท็ก"
      : "Number of Tags",
    alphabetical: isThai
      ? "เรียงตามอักษร"
      : "Alphabetical",
  };

  const handleRename = () => {
    const newName = window.prompt(
      isThai
        ? "กรุณาใส่ชื่อใหม่"
        : "Enter a new name",
      selectedUser.name
    );

    if (newName && newName.trim()) {
      alert(
        isThai
          ? `เปลี่ยนชื่อเป็น ${newName.trim()} แล้ว`
          : `Renamed to ${newName.trim()}`
      );
    }
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      isThai
        ? `ต้องการลบ ${selectedUser.name} หรือไม่?`
        : `Do you want to delete ${selectedUser.name}?`
    );

    if (confirmed) {
      alert(
        isThai
          ? "ดำเนินการลบเรียบร้อย"
          : "Deleted successfully"
      );
    }
  };

  return (
    <AppShell title="Home">
      <main className="home-page">

        {/* =================================================
            SORT
        ================================================= */}

        <div className="toolbar">
          <label htmlFor="home-sort">
            {isThai ? "เรียงตาม" : "Sort by"}
          </label>

          <select
            id="home-sort"
            className="sort-select"
            value={sortType}
            onChange={(event) =>
              setSortType(event.target.value)
            }
          >
            <option value="newest">
              {sortLabel.newest}
            </option>

            <option value="oldest">
              {sortLabel.oldest}
            </option>

            <option value="tags">
              {sortLabel.tags}
            </option>

            <option value="alphabetical">
              {sortLabel.alphabetical}
            </option>
          </select>
        </div>


        {/* =================================================
            MAIN TWO COLUMNS
        ================================================= */}

        <section className="home-grid">

          {/* =================================================
              LEFT : USER DETAILS
          ================================================= */}

          <div className="detail-card">

            <div className="preview-box">
              <UserIcon size={92} />
            </div>

            <div className="details">

              <div className="detail-row">
                <strong>
                  {isThai
                    ? "ชื่อ User"
                    : "Username"}
                </strong>

                <span>
                  {selectedUser.name}
                </span>
              </div>

              <div className="detail-row">
                <strong>
                  {isThai
                    ? "อีเมล"
                    : "Email"}
                </strong>

                <span>
                  {selectedUser.email}
                </span>
              </div>

              <div className="detail-row">
                <strong>
                  {isThai
                    ? "รหัส"
                    : "ID"}
                </strong>

                <span>
                  {selectedUser.id}
                </span>
              </div>

              <div className="detail-row">
                <strong>
                  {isThai
                    ? "พื้นที่"
                    : "Area"}
                </strong>

                <span>
                  {selectedUser.area}
                </span>
              </div>

              <div className="detail-row">
                <strong>
                  {isThai
                    ? "จำนวนไฟล์"
                    : "File Count"}
                </strong>

                <span>
                  {selectedUser.fileCount}
                </span>
              </div>

              <div className="detail-row">
                <strong>
                  {isThai
                    ? "พื้นที่จัดเก็บ"
                    : "Storage"}
                </strong>

                <span>
                  {selectedUser.storage}
                </span>
              </div>

              <div className="detail-row tags-row">
                <strong>
                  {isThai
                    ? "แท็กทั้งหมด"
                    : "All Tags"}
                </strong>

                <div className="detail-tags">
                  {selectedUser.tags.map(
                    (tag: string) => (
                      <span
                        className="detail-tag"
                        key={`${selectedUser.id}-${tag}`}
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="action-buttons">

              <button
                type="button"
                className="rename-button"
                onClick={handleRename}
              >
                ✎{" "}
                {isThai
                  ? "เปลี่ยนชื่อ"
                  : "Rename"}
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={handleDelete}
              >
                ✕{" "}
                {isThai
                  ? "ลบ"
                  : "Delete"}
              </button>

            </div>

          </div>


          {/* =================================================
              RIGHT : USER FILE LIST
          ================================================= */}

          <div className="file-list-card">

            <div className="file-list">

              {sortedFiles.map((file) => (

                <ProductCard
                  key={file.id}
                  title={file.user}
                  description={`${file.type} • ${file.size} • ${file.tags} ${
                    isThai
                      ? "แท็ก"
                      : "tags"
                  }`}
                  count={file.tags}
                  selected={
                    file.user ===
                    selectedUser.name
                  }
                  onClick={() => {
                    const user =
                      users.find(
                        (item) =>
                          item.name ===
                          file.user
                      );

                    if (user) {
                      setSelectedUserId(
                        user.id
                      );
                    }
                  }}
                />

              ))}

            </div>

          </div>

        </section>

      </main>
    </AppShell>
  );
}