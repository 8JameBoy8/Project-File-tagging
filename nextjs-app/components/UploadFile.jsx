'use client';

import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import DefaultAvatar from './DefaultAvatar';
import {
  Home,
  Tags,
  FolderPlus,
  Settings,
  Upload,
  FileText,
  File,
  Image,
  FileArchive,
  X,
  Lock,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
} from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 8;

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function getFileIcon(file) {
  if (file.type === 'application/pdf') return <FileText size={20} className="file-icon" />;
  if (file.type.startsWith('image/')) return <Image size={20} className="file-icon" />;
  if (file.type.includes('zip') || file.type.includes('rar')) return <FileArchive size={20} className="file-icon" />;
  return <File size={20} className="file-icon" />;
}

function UploadFile({ onUploadSuccess, goToUpload, goToPasswords, goToSetting }) {
  const { t, userProfile } = useLanguage();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [uploaded, setUploaded] = useState(false);

  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // เก็บว่าไฟล์ไหนบ้างที่จะถูกใช้รหัสผ่านนี้ด้วย (เลือกไฟล์ก่อนว่าจะใช้พาสเวิร์ดกับไฟล์ไหน)
  const [selectedForPassword, setSelectedForPassword] = useState({});

  const openFileNative = (item) => {
    if (!item?.rawFile) return;

    const fileUrl = item.previewUrl || URL.createObjectURL(item.rawFile);
    const windowFeatures = 'width=1000,height=750,resizable=yes,scrollbars=yes,status=yes';
    const newWindow = window.open(fileUrl, '_blank', windowFeatures);

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.open(fileUrl, '_blank');
    }
  };

  const addFiles = (selectedFiles) => {
    setMessage('');
    setUploaded(false);

    const incomingFiles = Array.from(selectedFiles);

    if (files.length + incomingFiles.length > MAX_FILES) {
      setMessage(t('maxFilesMessage', { count: MAX_FILES }));
      return;
    }

    const validFiles = [];
    for (const file of incomingFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setMessage(t('fileTooLarge', { name: file.name }));
        continue;
      }

      validFiles.push({
        rawFile: file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      addFiles(event.target.files);
    }
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  };

  const removeFile = (id, event) => {
    event.stopPropagation();
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
    setSelectedForPassword((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setMessage('');
    setUploaded(false);
  };

  const clearFiles = () => {
    files.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setFiles([]);
    setMessage('');
    setUploaded(false);
    setSelectedTag('');
    setPasswordEnabled(false);
    setPassword('');
    setConfirmPassword('');
    setSelectedForPassword({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isSelectedForPassword = (id) => selectedForPassword[id] !== false;

  const handleConfirm = () => {
    if (files.length === 0) {
      setMessage(t('selectAtLeastOne'));
      return;
    }

    if (passwordEnabled) {
      if (!password || !confirmPassword) {
        setMessage(t('fillPassword'));
        return;
      }
      if (password !== confirmPassword) {
        setMessage(t('passwordsDoNotMatch'));
        return;
      }
      if (!files.some((item) => isSelectedForPassword(item.id))) {
        setMessage(t('selectAtLeastOneForPassword'));
        return;
      }
    }

    const newUploadedFiles = files.map((item) => {
      const usesPassword = passwordEnabled && isSelectedForPassword(item.id);
      return {
        id: item.id,
        name: item.rawFile.name,
        tag: selectedTag || 'Unassigned',
        password: usesPassword ? password : 'No Password',
        type: item.rawFile.type,
        rawFile: item.rawFile,
        previewUrl: item.previewUrl,
      };
    });

    if (onUploadSuccess) {
      onUploadSuccess(newUploadedFiles);
    }

    setUploaded(true);
    setMessage(t('uploadSuccess', { count: files.length, suffix: passwordEnabled ? t('sharedPasswordSuffix') : '' }));

    if (goToPasswords) {
      setTimeout(() => {
        goToPasswords();
      }, 1200);
    }
  };

  return (
    <div className="upload-page-wrapper">
      <header className="top-header">
        <nav className="main-navigation">
          <button className="nav-item" type="button">
            <Home size={20} />
            <span>{t('home')}</span>
          </button>
          <button className="nav-item" type="button">
            <Upload size={20} />
            <span>{t('uploadFile')}</span>
          </button>
          <button className="nav-item" type="button">
            <Tags size={20} />
            <span>{t('manageTag')}</span>
          </button>
          <button className="nav-item" type="button">
            <FolderPlus size={20} />
            <span>{t('createTag')}</span>
          </button>
          <button className="nav-item" type="button" onClick={goToSetting}>
            <Settings size={20} />
            <span>{t('setting')}</span>
          </button>
        </nav>

        <div className="header-right-group">
          <h2 className="header-page-title">{t('uploadFile')}</h2>
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
        <section className="card main-drop-card">
          <div className="tag-select-wrapper">
            <select
              value={selectedTag}
              onChange={(e) => {
                setSelectedTag(e.target.value);
                setMessage('');
              }}
            >
              <option value="">{t('selectTag')}</option>
              <option value="Document">{t('document')}</option>
              <option value="Work">{t('work')}</option>
              <option value="Study">{t('study')}</option>
              <option value="Personal">{t('personal')}</option>
            </select>
            <ChevronDown size={16} className="select-icon" />
          </div>

          <div
            className={`drop-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="upload-icon-circle">
              <Upload size={24} />
            </div>
            <h3>{t('dragDrop')}</h3>
            <span className="or-divider">{t('or')}</span>

            <button
              className="btn-choose-file"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> {t('chooseFile')}
            </button>

            <small className="hint-text">
              {t('maximumStorage', { count: MAX_FILES })}
            </small>
          </div>
        </section>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileChange}
        />

        {files.length > 0 && (
          <section className="card selected-files-card">
            <h3 className="section-title">{t('selectedFiles', { count: files.length })}</h3>

            <div className="files-list">
              {files.map((item) => (
                <div
                  className="file-item-row clickable"
                  key={item.id}
                  onClick={() => openFileNative(item)}
                  title={t('clickToOpen')}
                >
                  <div className="file-info">
                    <div className="icon-box">{getFileIcon(item.rawFile)}</div>
                    <div className="file-text">
                      <span className="file-name">{item.rawFile.name}</span>
                      <span className="file-size">{formatFileSize(item.rawFile.size)}</span>
                    </div>
                  </div>

                  <div className="file-actions">
                    {passwordEnabled && (
                      <label
                        className="password-file-checkbox"
                        onClick={(e) => e.stopPropagation()}
                        title={t('applyPasswordTo')}
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedForPassword(item.id)}
                          onChange={(e) =>
                            setSelectedForPassword((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                        />
                        <Lock size={14} />
                      </label>
                    )}
                    <button
                      className="btn-remove"
                      type="button"
                      onClick={(e) => removeFile(item.id, e)}
                      title={t('removeFile')}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="password-protection-box">
              <div className="lock-header">
                <div className="lock-title">
                  <Lock size={18} className="lock-icon" />
                  <div>
                    <strong>{t('filePassword')}</strong>
                    <p>{t('sharedPassword')}</p>
                  </div>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={passwordEnabled}
                    onChange={(e) => setPasswordEnabled(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {passwordEnabled && (
                <>
                  <div className="password-files-select">
                    <p className="password-files-label">{t('applyPasswordTo')}</p>
                    <div className="password-files-list">
                      {files.map((item) => (
                        <label className="password-file-pill" key={item.id}>
                          <input
                            type="checkbox"
                            checked={isSelectedForPassword(item.id)}
                            onChange={(e) =>
                              setSelectedForPassword((prev) => ({ ...prev, [item.id]: e.target.checked }))
                            }
                          />
                          <span>{item.rawFile.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="password-inputs-grid">
                    <div className="input-group">
                      <label>{t('password')}</label>
                      <div className="input-with-icon">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('enterPassword')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="input-group">
                      <label>{t('confirmPassword')}</label>
                      <div className="input-with-icon">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder={t('confirmPassword')}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {message && (
              <div className={`message-banner ${uploaded ? 'success' : 'error'}`}>
                {uploaded ? <Check size={18} /> : <X size={18} />}
                <span>{message}</span>
              </div>
            )}

            <div className="action-buttons-group">
              <button
                className="btn-browse-outline"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                + {t('addMoreFiles')}
              </button>

              <button
                className="btn-confirm-primary"
                type="button"
                onClick={handleConfirm}
              >
                <Upload size={16} /> {t('confirmUpload')}
              </button>

              <button
                className="btn-cancel-outline"
                type="button"
                onClick={clearFiles}
              >
                {t('cancelAll')}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default UploadFile;
