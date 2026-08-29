'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import {
  Home,
  Upload,
  Tags,
  FolderPlus,
  Settings as SettingsIcon,
  Camera,
} from 'lucide-react';
import DefaultAvatar from '@/components/DefaultAvatar';

export default function Profile() {
  const router = useRouter();
  const { userProfile, updateProfile, changeAccountPassword, t } = useLanguage();

  const goToUpload = () => router.push('/user/uploadfile');
  const goToSetting = () => router.push('/user/setting');

  // 'profile' | 'change-password'
  const [view, setView] = useState('profile');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [tempUsername, setTempUsername] = useState(userProfile.username);
  const [tempAvatar, setTempAvatar] = useState(userProfile.avatar);
  const fileInputRef = useRef(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the edit form to match userProfile when it changes; fields then diverge as the user types
    setTempUsername(userProfile.username);
    setTempAvatar(userProfile.avatar);
  }, [userProfile]);

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
    goToSetting();
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
    setView('profile');
  };

  return (
    <div className="setting-page-container">
      {/* Top Header Navigation */}
      <header className="top-header">
        <nav className="main-navigation">
          <button className="nav-item" onClick={() => router.push('/')}>
            <Home size={20} />
            <span>{t('home')}</span>
          </button>
          <button className="nav-item" onClick={goToUpload}>
            <Upload size={20} />
            <span>{t('uploadFile')}</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/manage-tag')}>
            <Tags size={20} />
            <span>{t('manageTag')}</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/create-tag')}>
            <FolderPlus size={20} />
            <span>{t('createTag')}</span>
          </button>
          <button className="nav-item active" onClick={goToSetting}>
            <SettingsIcon size={20} />
            <span>{t('setting')}</span>
          </button>
        </nav>

        <div className="header-right">
          <h2>{t('profile')}</h2>
          <button className="profile-icon-btn" onClick={() => setView('profile')}>
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

        {/* Profile View (ไม่มีปุ่ม Back) */}
        {view === 'profile' && (
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

            <button className="btn-change-pass" onClick={() => setView('change-password')}>
              {t('changeLoginPassword')}
            </button>

            <div className="profile-action-buttons">
              <button className="btn-cancel" onClick={handleCancelEdit}>{t('cancelBtn')}</button>
              <button className="btn-submit" onClick={() => setShowSaveModal(true)}>{t('confirmBtn')}</button>
            </div>
          </div>
        )}

        {/* Password View */}
        {view === 'change-password' && (
          <div className="clean-sub-view password-change-container">
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
                <button type="button" className="btn-cancel" onClick={() => setView('profile')}>{t('cancelBtn')}</button>
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
    </div>
  );
}
