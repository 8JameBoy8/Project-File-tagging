'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  KeyRound,
  Globe,
  User,
  LogOut,
  Check,
  Home,
  Upload,
  Tags,
  FolderPlus,
  Settings as SettingsIcon,
  Camera,
} from 'lucide-react';
import DefaultAvatar from './DefaultAvatar';

export default function Setting({ goToPasswords, goToUpload, goToSetting, initialTab = 'menu' }) {
  const { lang, changeLanguage, userProfile, updateProfile, changeAccountPassword, t } = useLanguage();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [pendingLang, setPendingLang] = useState(null);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [tempUsername, setTempUsername] = useState(userProfile.username);
  const [tempAvatar, setTempAvatar] = useState(userProfile.avatar);
  const fileInputRef = useRef(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setTempUsername(userProfile.username);
    setTempAvatar(userProfile.avatar);
  }, [userProfile]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectLang = (selectedLang) => {
    if (selectedLang === lang) return;
    setPendingLang(selectedLang);
    setShowLangModal(true);
  };

  const confirmLangChange = () => {
    if (pendingLang) changeLanguage(pendingLang);
    setShowLangModal(false);
    setPendingLang(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempAvatar(imageUrl);
    }
    e.target.value = '';
  };

  const confirmSaveProfile = () => {
    updateProfile(tempUsername, tempAvatar);
    setShowSaveModal(false);
    alert(t('profileSaved'));
  };

  const handleCancelEdit = () => {
    setTempUsername(userProfile.username);
    setTempAvatar(userProfile.avatar);
    setActiveTab('menu');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert(t('passwordMismatch'));
      return;
    }

    const success = changeAccountPassword(oldPassword, newPassword);
    if (!success) {
      alert(t('currentPasswordIncorrect'));
      return;
    }

    alert(t('passwordChanged'));
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveTab('menu');
  };

  return (
    <div className="setting-page-container">
      {/* Top Header Navigation */}
      <header className="top-header">
        <nav className="main-navigation">
          <button className="nav-item">
            <Home size={20} />
            <span>{t('home')}</span>
          </button>
          <button className="nav-item" onClick={goToUpload}>
            <Upload size={20} />
            <span>{t('uploadFile')}</span>
          </button>
          <button className="nav-item" onClick={() => {}}>
            <Tags size={20} />
            <span>{t('manageTag')}</span>
          </button>
          <button className="nav-item" onClick={() => {}}>
            <FolderPlus size={20} />
            <span>{t('createTag')}</span>
          </button>
          <button className="nav-item active" onClick={() => setActiveTab('menu')}>
            <SettingsIcon size={20} />
            <span>{t('setting')}</span>
          </button>
        </nav>

        <div className="header-right">
          <h2>{activeTab === 'profile' ? t('profile') : t('setting')}</h2>
          <button className="profile-icon-btn" onClick={() => setActiveTab('profile')}>
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt={t('profile')} className="navbar-avatar-img" />
            ) : (
              <DefaultAvatar size={36} />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="setting-content-clean">

        {/* Setting Menu */}
        {activeTab === 'menu' && (
          <div className="clean-menu-list">
            <button className="setting-btn-clean" onClick={goToPasswords}>
              <KeyRound size={20} />
              <span>{t('filePasswords')}</span>
            </button>

            <button className="setting-btn-clean" onClick={() => setActiveTab('language')}>
              <Globe size={20} />
              <span>{t('language')}</span>
            </button>

            <button className="setting-btn-clean" onClick={() => setActiveTab('profile')}>
              <User size={20} />
              <span>{t('profile')}</span>
            </button>

            <button className="setting-btn-clean btn-pink" onClick={() => setShowLogoutModal(true)}>
              <LogOut size={20} />
              <span>{t('logout')}</span>
            </button>
          </div>
        )}

        {/* Language View */}
        {activeTab === 'language' && (
          <div className="clean-sub-view">
            <div className="back-btn-wrapper">
              <button className="back-link-btn" onClick={() => setActiveTab('menu')}>← {t('back')}</button>
            </div>
            <div className="clean-menu-list">
              <button
                className={`setting-btn-clean ${lang === 'en' ? 'active-item' : ''}`}
                onClick={() => handleSelectLang('en')}
              >
                <span>{t('english')}</span>
                {lang === 'en' && <Check size={18} />}
              </button>

              <button
                className={`setting-btn-clean ${lang === 'th' ? 'active-item' : ''}`}
                onClick={() => handleSelectLang('th')}
              >
                <span>{t('thai')}</span>
                {lang === 'th' && <Check size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Profile View (ไม่มีปุ่ม Back) */}
        {activeTab === 'profile' && (
          <div className="clean-sub-view profile-edit-container">

            {/* กดที่รูปโปรไฟล์เพื่อเลือกรูปได้เลย ไม่ต้องมีปุ่ม Edit Profile แยก */}
            <div className="avatar-edit-box">
              <button
                type="button"
                className="avatar-wrapper-large avatar-clickable"
                onClick={() => fileInputRef.current.click()}
                title={t('editProfile')}
              >
                {tempAvatar ? (
                  <img src={tempAvatar} alt={t('profile')} className="profile-img-large" />
                ) : (
                  <div className="default-avatar-large-container">
                    <DefaultAvatar size={180} />
                  </div>
                )}
                <span className="avatar-hover-overlay">
                  <Camera size={28} />
                </span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            <div className="form-group-clean">
              <input
                type="text"
                className="input-clean"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder={t('enterUsername')}
              />
            </div>

            <div className="storage-box-clean">
              <div className="storage-title">{t('storageUsage')}</div>
              <div className="storage-bar-bg">
                <div className="storage-bar-fill" style={{ width: '40%' }}></div>
              </div>
              <div className="storage-info">
                <span>{t('used')} 2 GB</span>
                <span>{t('remaining')} 3 GB</span>
              </div>
            </div>

            <button className="btn-change-pass" onClick={() => setActiveTab('change-password')}>
              {t('changeLoginPassword')}
            </button>

            <div className="profile-action-buttons">
              <button className="btn-cancel" onClick={handleCancelEdit}>{t('cancelBtn')}</button>
              <button className="btn-submit" onClick={() => setShowSaveModal(true)}>{t('confirmBtn')}</button>
            </div>
          </div>
        )}

        {/* Password View */}
        {activeTab === 'change-password' && (
          <div className="clean-sub-view password-change-container">
            {/* ลบปุ่ม Back ที่ทำงานคล้าย Cancel ออกแล้ว */}

            <h3 className="form-title">{t('changeLoginPassword')}</h3>
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group-clean">
                <input
                  type="password"
                  className="input-clean"
                  placeholder={t('currentPassword')}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group-clean">
                <input
                  type="password"
                  className="input-clean"
                  placeholder={t('newPassword')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group-clean">
                <input
                  type="password"
                  className="input-clean"
                  placeholder={t('confirmNewPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="profile-action-buttons">
                <button type="button" className="btn-cancel" onClick={() => setActiveTab('profile')}>{t('cancelBtn')}</button>
                <button type="submit" className="btn-submit">{t('confirmBtn')}</button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Profile Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('saveProfileTitle')}</h3>
            <p>{t('saveProfileMsg')}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>{t('cancelBtn')}</button>
              <button className="btn-primary" onClick={confirmSaveProfile}>{t('confirmBtn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLangModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('confirmLangTitle')}</h3>
            <p>{t('confirmLangMsg', { language: pendingLang === 'en' ? t('english') : t('thai') })}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLangModal(false)}>{t('cancelBtn')}</button>
              <button className="btn-primary" onClick={confirmLangChange}>{t('confirmBtn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('logout')}</h3>
            <p>{t('logoutConfirm')}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutModal(false)}>{t('cancelBtn')}</button>
              <button className="btn-danger" onClick={() => alert(t('loggedOut'))}>{t('logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
