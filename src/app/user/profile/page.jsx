'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Camera } from 'lucide-react';
import DefaultAvatar from '@/components/DefaultAvatar';
import Topbar from '@/components/Topbar';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}

export default function Profile() {
  const router = useRouter();
  const { userProfile, updateProfile, changeAccountPassword, t } = useLanguage();

  const goToSetting = () => router.push('/user/setting');

  // 'profile' | 'change-password'
  const [view, setView] = useState('profile');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tempUsername, setTempUsername] = useState(userProfile.username || '');
  const [tempAvatar, setTempAvatar] = useState(userProfile.avatar); // preview URL (blob หรือของจริง)
  const [tempAvatarFile, setTempAvatarFile] = useState(null); // ไฟล์ดิบ ส่งจริงตอน confirm
  const fileInputRef = useRef(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [storage, setStorage] = useState({ usedBytes: 0, limitBytes: 0 });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the edit form to match userProfile when it changes; fields then diverge as the user types
    setTempUsername(userProfile.username || '');
    setTempAvatar(userProfile.avatar);
  }, [userProfile]);

  useEffect(() => {
    fetch('/api/profile/storage')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStorage(data);
      })
      .catch(() => {});
  }, []);

  const storagePercent = storage.limitBytes > 0 ? Math.min(100, (storage.usedBytes / storage.limitBytes) * 100) : 0;
  const storageRemainingBytes = Math.max(0, storage.limitBytes - storage.usedBytes);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempAvatar(imageUrl);
      setTempAvatarFile(file);
    }
    e.target.value = '';
  };

  const confirmSaveProfile = async () => {
    setSaving(true);
    const success = await updateProfile(tempUsername, tempAvatarFile);
    setSaving(false);
    setShowSaveModal(false);
    if (success) {
      setTempAvatarFile(null);
      alert(t('profileSaved'));
    } else {
      alert(t('profileSaveFailed'));
    }
  };

  const handleCancelEdit = () => {
    setTempUsername(userProfile.username || '');
    setTempAvatar(userProfile.avatar);
    setTempAvatarFile(null);
    goToSetting();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert(t('passwordMismatch'));
      return;
    }

    setPasswordSubmitting(true);
    const success = await changeAccountPassword(oldPassword, newPassword);
    setPasswordSubmitting(false);

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
    <div className="legacy-user-page setting-page-container">
      <Topbar title={t('profile')} />

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
                <div className="storage-bar-fill" style={{ width: `${storagePercent}%` }}></div>
              </div>
              <div className="storage-info">
                <span>{t('used')} {formatBytes(storage.usedBytes)}</span>
                <span>{t('remaining')} {formatBytes(storageRemainingBytes)}</span>
              </div>
            </div>

            <button className="btn-change-pass" onClick={() => setView('change-password')}>
              {t('changeLoginPassword')}
            </button>

            <div className="profile-action-buttons">
              <button className="btn-cancel" onClick={handleCancelEdit}>{t('cancelBtn')}</button>
              <button className="btn-submit" onClick={() => setShowSaveModal(true)} disabled={saving}>{t('confirmBtn')}</button>
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
                <button type="submit" className="btn-submit" disabled={passwordSubmitting}>{t('confirmBtn')}</button>
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
              <button className="btn-primary" onClick={confirmSaveProfile} disabled={saving}>{t('confirmBtn')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
