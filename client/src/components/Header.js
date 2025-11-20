import React from 'react';
import './Header.css';

const Header = ({ 
  showNotificationsButton, 
  onNotificationsClick, 
  notificationCount,
  userData,
  onUserMenuToggle,
  showUserMenu,
  userMenuRef,
  onLogout
}) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-center">
          <div className="header-text">
            <h1 className="header-title">FinPulse</h1>
            <div className="header-subtitle">Ваш персональный финансовый аналитик</div>
          </div>
        </div>

        <div className="header-actions">
          {showNotificationsButton && (
            <button 
              className="notifications-button"
              onClick={onNotificationsClick}
            >
              <img 
                src="/images/uveda.png" 
                alt="Уведомления" 
                className="notification-icon"
                onError={(e) => {
                  // Fallback если изображение не загрузилось
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="notification-emoji" style={{display: 'none'}}>🔔</span>
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
          )}

          <div className="user-menu-container" ref={userMenuRef}>
            <button 
              className="user-avatar-button"
              onClick={onUserMenuToggle}
            >
              <img 
                src="/images/user.png" 
                alt="User" 
                className="user-avatar"
                onError={(e) => {
                  // Fallback если изображение не загрузилось
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI0IiBmaWxsPSIjNjY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMVYxOUMyMCAxNi43OTA5IDE4LjIwOTEgMTUgMTYgMTVIOEM1Ljc5MDg2IDE1IDQgMTYuNzkwOSA0IDE5VjIxIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                }}
              />
            </button>

            {showUserMenu && userData && (
              <div className="user-dropdown-menu">
                <div className="user-info-section">
                  <h3>Профиль пользователя</h3>
                  <div className="user-info-item">
                    <span className="user-info-label">ФИО:</span>
                    <span className="user-info-value">{userData.fullName || 'Не указано'}</span>
                  </div>
                  <div className="user-info-item">
                    <span className="user-info-label">Bank Client ID:</span>
                    <span className="user-info-value">{userData.bankClientId || 'Не указан'}</span>
                  </div>
                  <div className="user-info-item">
                    <span className="user-info-label">Email:</span>
                    <span className="user-info-value">{userData.email || 'Не указана'}</span>
                  </div>
                  <div className="user-info-item">
                    <span className="user-info-label">Телефон:</span>
                    <span className="user-info-value">{userData.phone || 'Не указан'}</span>
                  </div>
                </div>
                
                <div className="user-menu-actions">
                  <button 
                    className="logout-menu-button"
                    onClick={onLogout}
                  >
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;