import React from 'react';
import './Header.css';

const Header = ({ children, onNotificationsClick, notificationCount, showNotificationsButton = true }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-center">
          <div className="header-text">
            <h1 className="header-title">FinPulse</h1>
            <p className="header-subtitle">Управляйте своими финансами эффективно</p>
          </div>
        </div>
        <div className="header-actions">
          {/* Кнопка уведомлений показывается только если showNotificationsButton = true */}
          {showNotificationsButton && (
            <button 
              className="notifications-button"
              onClick={onNotificationsClick}
            >
              <img 
                src="/images/uveda.png" 
                alt="Уведомления" 
                className="notification-icon"
              />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
          )}
          {/* Кнопка выхода */}
          {children}
        </div>
      </div>
    </header>
  );
};

export default Header;