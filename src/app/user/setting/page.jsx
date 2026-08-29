'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { KeyRound, Globe, User, LogOut, Check } from 'lucide-react';
import Topbar from '@/components/Topbar';

export default function Setting() {
  const router = useRouter();
  const { lang, changeLanguage, t } = useLanguage();

  const goToPasswords = () => router.push('/user/filepassword');
  const goToProfile = () => router.push('/user/profile');

  const [activeTab, setActiveTab] = useState('menu');
  const [pendingLang, setPendingLang] = useState(null);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { }
    router.push('/auth/login');
  };

  return (
    <div className="legacy-user-page setting-page-container">
      <Topbar title={t('setting')} />

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

            <button className="setting-btn-clean" onClick={goToProfile}>
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

      </main>

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
              <button className="btn-danger" onClick={handleLogout}>{t('logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
