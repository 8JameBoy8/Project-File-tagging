"use client";

import {
  useMemo,
  useState,
} from "react";

import AppShell from "@/components/AppShell";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/components/LanguageContext";

type ApproveFile = {
  id: number;
  name: string;
  type: string;
  size: string;
  user: string;
  email: string;
  password: string;
  storage: string;
  fileCount: number;
  tags: string[];
  date: string;
  status: "pending" | "approved" | "notApproved";
};

const initialFiles: ApproveFile[] = [
  {
    id: 1,
    name: "Project_Report.pdf",
    type: "PDF",
    size: "2 MB",
    user: "User1",
    email: "user1@gmail.com",
    password: "U001",
    storage: "3.8 GB",
    fileCount: 24,
    tags: ["Project", "Report"],
    date: "18/05/2025 10:30 AM",
    status: "pending",
  },
  {
    id: 2,
    name: "UI_Design.png",
    type: "Image",
    size: "1.5 MB",
    user: "User2",
    email: "user2@gmail.com",
    password: "U002",
    storage: "2.4 GB",
    fileCount: 18,
    tags: ["UI", "Design"],
    date: "18/05/2025 09:45 AM",
    status: "pending",
  },
  {
    id: 3,
    name: "Database.sql",
    type: "SQL",
    size: "500 KB",
    user: "User3",
    email: "user3@gmail.com",
    password: "U003",
    storage: "1.8 GB",
    fileCount: 12,
    tags: ["Database", "SQL"],
    date: "18/05/2025 09:20 AM",
    status: "pending",
  },
  {
    id: 4,
    name: "Presentation.pptx",
    type: "PowerPoint",
    size: "3.9 MB",
    user: "User1",
    email: "user1@gmail.com",
    password: "U001",
    storage: "3.8 GB",
    fileCount: 24,
    tags: ["Presentation", "Design"],
    date: "18/05/2025 09:15 AM",
    status: "pending",
  },
  {
    id: 5,
    name: "Document.docx",
    type: "Word",
    size: "1.1 MB",
    user: "User2",
    email: "user2@gmail.com",
    password: "U002",
    storage: "2.4 GB",
    fileCount: 18,
    tags: ["Document", "Word"],
    date: "18/05/2025 08:50 AM",
    status: "pending",
  },
];

export default function ApprovePage() {
  const { t } = useLanguage();

  const [files, setFiles] =
    useState<ApproveFile[]>(
      initialFiles
    );

  const [selectedId, setSelectedId] =
    useState(1);

  const selectedFile =
    files.find(
      (file) =>
        file.id === selectedId
    ) ?? files[0];


  const selectedUser =
    selectedFile?.user ?? "User1";


  const userFiles = useMemo(() => {
    return files.filter(
      (file) =>
        file.user === selectedUser
    );
  }, [files, selectedUser]);


  function updateStatus(
    status:
      | "approved"
      | "notApproved"
  ) {
    if (!selectedFile) return;

    setFiles((current) =>
      current.map((file) =>
        file.id === selectedFile.id
          ? {
              ...file,
              status,
            }
          : file
      )
    );
  }


  return (
    <AppShell
      title={t("approve")}
    >

      <div className="approve-page">

        {/* TOOLBAR */}
        <div className="approve-toolbar">

          <label>
            {t("selectUser")}
          </label>

          <select
            value={selectedUser}
            onChange={(event) => {

              const nextUser =
                event.target.value;

              const firstFile =
                files.find(
                  (file) =>
                    file.user ===
                    nextUser
                );

              if (firstFile) {
                setSelectedId(
                  firstFile.id
                );
              }

            }}
          >

            <option value="User1">
              User1
            </option>

            <option value="User2">
              User2
            </option>

            <option value="User3">
              User3
            </option>

          </select>

        </div>


        {/* MAIN GRID */}
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

                  <strong>
                    {selectedFile?.type}
                  </strong>

                </div>

              </div>

            </div>


            {selectedFile && (
              <div className="details">

                <div className="detail-row">
                  <strong>
                    {t("username")}
                  </strong>

                  <span>
                    {selectedFile.user}
                  </span>
                </div>


                <div className="detail-row">
                  <strong>
                    {t("email")}
                  </strong>

                  <span>
                    {selectedFile.email}
                  </span>
                </div>


                <div className="detail-row">
                  <strong>
                    {t("password")}
                  </strong>

                  <span>
                    {selectedFile.password}
                  </span>
                </div>


                <div className="detail-row">
                  <strong>
                    {t("storage")}
                  </strong>

                  <span>
                    {selectedFile.storage}
                  </span>
                </div>


                <div className="detail-row">
                  <strong>
                    {t("fileCount")}
                  </strong>

                  <span>
                    {selectedFile.fileCount}
                  </span>
                </div>


                <div className="detail-row tags-row">

                  <strong>
                    {t("allTags")}
                  </strong>

                  <div className="detail-tags">

                    {selectedFile.tags.map(
                      (tag: string) => (
                        <span
                          className="detail-tag"
                          key={tag}
                        >
                          {tag}
                        </span>
                      )
                    )}

                  </div>

                </div>

              </div>
            )}


            {/* APPROVE BUTTONS */}
            <div className="approve-actions">

              <button
                type="button"
                className="approve-button"
                onClick={() =>
                  updateStatus(
                    "approved"
                  )
                }
              >
                ✓ {t("approveButton")}
              </button>


              <button
                type="button"
                className="not-approve-button"
                onClick={() =>
                  updateStatus(
                    "notApproved"
                  )
                }
              >
                × {t("notApprove")}
              </button>

            </div>

          </section>


          {/* RIGHT */}
          <section className="file-list-card">

            <div className="file-list">

              {userFiles.map(
                (file) => (
                  <ProductCard
                    key={file.id}
                    name={file.name}
                    type={file.type}
                    size={file.size}
                    user={file.user}
                    date={file.date}
                    selected={
                      file.id ===
                      selectedId
                    }
                    onClick={() =>
                      setSelectedId(
                        file.id
                      )
                    }
                  />
                )
              )}

            </div>

          </section>

        </div>

      </div>

    </AppShell>
  );
}