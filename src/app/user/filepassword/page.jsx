'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Topbar from '@/components/Topbar';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Search,
  ChevronDown,
  Edit3,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

function FilePasswords() {
  const { t } = useLanguage();

  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState([]); // ใช้ทำ tag filter + color map
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const [revealedPasswords, setRevealedPasswords] = useState({}); // fileId -> password จริง (ดึงมาเฉพาะตอนกดดู)
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // ยืนยันตัวตนด้วยรหัสผ่านบัญชีเพียงครั้งเดียวต่อการเข้าหน้านี้ 1 ครั้ง
  // (ไม่ต้องกรอกรหัสซ้ำทุกไฟล์เหมือนเดิม)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingOpenFile, setPendingOpenFile] = useState(null); // เก็บไฟล์ที่รอเปิดหลังจากยืนยันตัวตน
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [editingFileId, setEditingFileId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files?hasPassword=true');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
        // มีไฟล์ที่ตั้งรหัสผ่านไว้อย่างน้อย 1 ไฟล์ -> ขอรหัสผ่านบัญชีก่อนครั้งเดียว
        if (data.length > 0) setShowAuthModal(true);
      }
    } catch (e) { }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) setTags(await res.json());
    } catch (e) { }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (the API) on mount, not deriving state from props/state
    fetchFiles();
    fetchTags();
  }, []);

  const getTagColor = (tagName) => tags.find((t) => t.name === tagName)?.color || 'var(--accent, #146356)';

  // ฟังก์ชันสำหรับเปิดไฟล์ในแท็บใหม่ (ผ่าน /api/files/{id}/serve ที่เช็คสิทธิ์เจ้าของไฟล์แล้ว)
  const openFileNative = (file) => {
    const newWindow = window.open(file.src, '_blank');
    if (!newWindow) {
      alert(t('fileAddressMissing'));
    }
  };

  // จัดการเมื่อผู้ใช้กดคลิกที่ชื่อไฟล์เพื่อเปิดดู
  const handleOpenFileClick = (file) => {
    if (isAuthenticated) {
      openFileNative(file);
      return;
    }
    // ถ้ายังไม่ได้ยืนยันตัวตน -> เรียก Modal ให้ใส่รหัสผ่านบัญชีผู้ใช้ก่อน (ครั้งเดียว)
    setPendingOpenFile(file);
    setAuthInput('');
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleToggleEye = async (file) => {
    if (!isAuthenticated) {
      setAuthInput('');
      setAuthError('');
      setShowAuthModal(true);
      return;
    }

    // กำลังจะซ่อน ไม่ต้อง fetch อะไรใหม่
    if (visiblePasswords[file.id]) {
      setVisiblePasswords((prev) => ({ ...prev, [file.id]: false }));
      return;
    }

    // กำลังจะเปิดเผย ดึงรหัสผ่านจริงมาก่อนถ้ายังไม่เคยดึง
    if (!(file.id in revealedPasswords)) {
      try {
        const res = await fetch(`/api/files/${file.id}/password`);
        if (res.ok) {
          const data = await res.json();
          setRevealedPasswords((prev) => ({ ...prev, [file.id]: data.password }));
        }
      } catch (e) { }
    }
    setVisiblePasswords((prev) => ({ ...prev, [file.id]: true }));
  };

  // ยืนยันตัวตนด้วย "รหัสผ่านของบัญชีผู้ใช้" เพียงครั้งเดียวต่อการเข้าหน้านี้
  // เมื่อยืนยันสำเร็จแล้ว จะสามารถดู/จัดการรหัสผ่านของทุกไฟล์ได้โดยไม่ต้องกรอกซ้ำอีก
  const handleVerifyAccountPassword = async () => {
    setAuthError('');
    try {
      const res = await fetch('/api/profile/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: authInput }),
      });
      if (!res.ok) {
        setAuthError(t('passwordIncorrect'));
        return;
      }
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthInput('');
      setAuthError('');

      // ถ้าเป็นการกดเพื่อเปิดไฟล์ ให้ทำการเปิดไฟล์หลังยืนยันตัวตนสำเร็จ
      if (pendingOpenFile) {
        openFileNative(pendingOpenFile);
        setPendingOpenFile(null);
      }
    } catch (e) {
      setAuthError(t('passwordIncorrect'));
    }
  };

  const handleSaveNewPassword = async (fileId) => {
    if (!newPassword.trim()) return;
    try {
      const res = await fetch(`/api/files/${fileId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setRevealedPasswords((prev) => ({ ...prev, [fileId]: newPassword }));
        setVisiblePasswords((prev) => ({ ...prev, [fileId]: true }));
      }
    } catch (e) { }
    setEditingFileId(null);
    setNewPassword('');
  };

  const filteredFiles = files
    .filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = selectedTag ? file.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    })
    // sort ตาม tag แรกของแต่ละไฟล์ (ไฟล์ที่ไม่มีแท็กไปอยู่ท้ายสุด)
    .sort((a, b) => (a.tags[0] || '￿').localeCompare(b.tags[0] || '￿'));

  return (
    <div className="legacy-user-page passwords-page-wrapper">
      <Topbar title={t('filePasswords')} />

      <main className="main-container-full">
        <section className="card password-list-card">
          <div className="filter-controls-row">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder={t('searchFiles')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="tag-select-wrapper">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="">{t('allTags')}</option>
                {tags.map((tg) => (
                  <option key={tg.id} value={tg.name}>{tg.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>

          <div className="table-responsive">
            <table className="passwords-table">
              <thead>
                <tr>
                  <th>{t('fileName')}</th>
                  <th>{t('tag')}</th>
                  <th>{t('passwordProtection')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => {
                    const isUnlocked = isAuthenticated;
                    const isVisible = visiblePasswords[file.id];
                    const isEditing = editingFileId === file.id;
                    const displayedPassword = revealedPasswords[file.id];

                    return (
                      <tr key={file.id}>
                        <td className="file-name-cell">
                          <div
                            className="file-cell-content file-clickable"
                            onClick={() => handleOpenFileClick(file)}
                            title={t('clickToOpen')}
                          >
                            <Key size={18} className="key-icon" />
                            <span className="file-name">{file.name}</span>
                            <ExternalLink size={14} className="open-icon" />
                          </div>
                        </td>

                        <td>
                          {file.tags.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {file.tags.map((tagName) => (
                                <span key={tagName} className="tag-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: getTagColor(tagName), display: 'inline-block' }}></span>
                                  {tagName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="tag-badge tag-default">{t('unassigned')}</span>
                          )}
                        </td>

                        <td className="password-cell">
                          {isEditing ? (
                            <div className="inline-edit-box">
                              <input
                                type="text"
                                className="edit-password-input"
                                placeholder={t('newPasswordPlaceholder')}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                              <button
                                className="btn-action-icon save"
                                onClick={() => handleSaveNewPassword(file.id)}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="btn-action-icon cancel"
                                onClick={() => setEditingFileId(null)}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="password-display">
                              {isUnlocked ? (
                                <Unlock size={14} className="unlock-icon" />
                              ) : (
                                <Lock size={14} className="lock-icon" />
                              )}
                              <span>{isVisible && displayedPassword ? displayedPassword : '••••••••••••'}</span>
                            </div>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div className="actions-cell-group">
                            {!isEditing && (
                              <button
                                className="btn-toggle-eye"
                                type="button"
                                onClick={() => handleToggleEye(file)}
                                title={isVisible ? t('hidePassword') : t('showPassword')}
                              >
                                {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            )}

                            {isUnlocked && !isEditing && (
                              <button
                                className="btn-change-password"
                                onClick={() => {
                                  setEditingFileId(file.id);
                                  setNewPassword(displayedPassword || '');
                                }}
                              >
                                <Edit3 size={14} /> {t('changePassword')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-table-cell">
                      {t('noFilesFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('enterFilePassword')}</h3>
            <p>{t('filePasswordDescription')}</p>

            <input
              type="password"
              className="modal-password-input"
              placeholder={t('enterPasswordEllipsis')}
              autoFocus
              value={authInput}
              onChange={(e) => setAuthInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyAccountPassword();
              }}
            />

            {authError && <span className="auth-error-msg">{authError}</span>}

            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => {
                  setShowAuthModal(false);
                  setPendingOpenFile(null);
                  setAuthInput('');
                  setAuthError('');
                }}
              >
                {t('cancelBtn')}
              </button>
              <button
                className="btn-modal-submit"
                onClick={handleVerifyAccountPassword}
              >
                {t('unlock')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilePasswords;
