'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useUploadedFiles } from '@/context/UploadedFilesContext';
import DefaultAvatar from '@/components/DefaultAvatar';
import {
  Home,
  Upload,
  Tags,
  FolderPlus,
  Settings,
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
  const router = useRouter();
  const { t, userProfile } = useLanguage();
  const { uploadedFiles, setUploadedFiles } = useUploadedFiles();

  const goToUpload = () => router.push('/user/uploadfile');
  const goToSetting = () => router.push('/user/setting');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

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

  // มีไฟล์ที่ตั้งรหัสผ่านไว้อย่างน้อย 1 ไฟล์หรือไม่
  const hasAnyProtectedFile = uploadedFiles.some(
    (file) => file.password && file.password !== 'No Password'
  );

  // เมื่อเข้าหน้านี้ (mount) ให้ขอรหัสผ่านบัญชีครั้งเดียว ถ้ามีไฟล์ที่ตั้งรหัสผ่านไว้
  useEffect(() => {
    if (hasAnyProtectedFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time check on mount, not deriving state from props/state
      setShowAuthModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ฟังก์ชันสำหรับเปิดไฟล์ในแท็บใหม่
  const openFileNative = (file) => {
    let fileUrl = file.previewUrl || file.url;

    // ถ้ามี rawFile ให้สร้าง Object URL ใหม่เสมอ
    if (file.rawFile) {
      fileUrl = URL.createObjectURL(file.rawFile);
    }

    if (!fileUrl) {
      alert(t('fileAddressMissing'));
      return;
    }

    const windowFeatures = 'width=1000,height=750,resizable=yes,scrollbars=yes,status=yes';
    const newWindow = window.open(fileUrl, '_blank', windowFeatures);

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.open(fileUrl, '_blank');
    }
  };

  // จัดการเมื่อผู้ใช้กดคลิกที่ชื่อไฟล์เพื่อเปิดดู
  const handleOpenFileClick = (file) => {
    const hasPassword = file.password && file.password !== 'No Password';

    // ถ้าไม่มีรหัสผ่าน หรือ ยืนยันตัวตนด้วยรหัสบัญชีไปแล้ว -> เปิดไฟล์ได้ทันที
    if (!hasPassword || isAuthenticated) {
      openFileNative(file);
      return;
    }

    // ถ้ายังไม่ได้ยืนยันตัวตน -> เรียก Modal ให้ใส่รหัสผ่านบัญชีผู้ใช้ก่อน (ครั้งเดียว)
    setPendingOpenFile(file);
    setAuthInput('');
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleToggleEye = (file) => {
    const hasPassword = file.password && file.password !== 'No Password';

    if (!hasPassword) {
      setVisiblePasswords((prev) => ({ ...prev, [file.id]: !prev[file.id] }));
      return;
    }

    if (!isAuthenticated) {
      setAuthInput('');
      setAuthError('');
      setShowAuthModal(true);
      return;
    }

    setVisiblePasswords((prev) => ({ ...prev, [file.id]: !prev[file.id] }));
  };

  // ยืนยันตัวตนด้วย "รหัสผ่านของบัญชีผู้ใช้" เพียงครั้งเดียวต่อการเข้าหน้านี้
  // เมื่อยืนยันสำเร็จแล้ว จะสามารถดู/จัดการรหัสผ่านของทุกไฟล์ได้โดยไม่ต้องกรอกซ้ำอีก
  const handleVerifyAccountPassword = () => {
    if (authInput === userProfile.password) {
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthInput('');
      setAuthError('');

      // ถ้าเป็นการกดเพื่อเปิดไฟล์ ให้ทำการเปิดไฟล์หลังยืนยันตัวตนสำเร็จ
      if (pendingOpenFile) {
        openFileNative(pendingOpenFile);
        setPendingOpenFile(null);
      }
    } else {
      setAuthError(t('passwordIncorrect'));
    }
  };

  const handleSaveNewPassword = (fileId) => {
    if (!newPassword.trim()) return;

    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, password: newPassword } : f))
    );
    setEditingFileId(null);
    setNewPassword('');
  };

  const filteredFiles = uploadedFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? file.tag === selectedTag : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="passwords-page-wrapper">
      <header className="top-header">
        <nav className="main-navigation">
          <button className="nav-item" type="button" onClick={() => router.push('/')}>
            <Home size={20} />
            <span>{t('home')}</span>
          </button>
          <button className="nav-item" type="button" onClick={goToUpload}>
            <Upload size={20} />
            <span>{t('uploadFile')}</span>
          </button>
          <button className="nav-item" type="button" onClick={() => router.push('/manage-tag')}>
            <Tags size={20} />
            <span>{t('manageTag')}</span>
          </button>
          <button className="nav-item" type="button" onClick={() => router.push('/create-tag')}>
            <FolderPlus size={20} />
            <span>{t('createTag')}</span>
          </button>
          <button className="nav-item" type="button" onClick={goToSetting}>
            <Settings size={20} />
            <span>{t('setting')}</span>
          </button>
        </nav>

        <div className="header-right-group">
          <h2 className="header-page-title">{t('filePasswords')}</h2>
          <button className="profile-button" type="button" onClick={goToSetting}>
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt={t('profile')} className="navbar-avatar-img" />
            ) : (
              <DefaultAvatar size={36} />
            )}
          </button>
        </div>
      </header>

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
                <option value="Document">{t('document')}</option>
                <option value="Work">{t('work')}</option>
                <option value="Study">{t('study')}</option>
                <option value="Personal">{t('personal')}</option>
                <option value="Unassigned">{t('unassigned')}</option>
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
                    const hasPassword = file.password && file.password !== 'No Password';
                    const isUnlocked = hasPassword && isAuthenticated;
                    const isVisible = visiblePasswords[file.id];
                    const isEditing = editingFileId === file.id;

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
                          <span className={`tag-badge tag-${file.tag?.toLowerCase() || 'default'}`}>
                            {file.tag ? ({ Document: t('document'), Work: t('work'), Study: t('study'), Personal: t('personal'), Unassigned: t('unassigned') }[file.tag] || file.tag) : t('unassigned')}
                          </span>
                        </td>

                        <td className="password-cell">
                          {!hasPassword ? (
                            <span className="no-password-text">{t('noPassword')}</span>
                          ) : isEditing ? (
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
                              <span>{isVisible ? file.password : '••••••••••••'}</span>
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

                            {hasPassword && isUnlocked && !isEditing && (
                              <button
                                className="btn-change-password"
                                onClick={() => {
                                  setEditingFileId(file.id);
                                  setNewPassword(file.password);
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
