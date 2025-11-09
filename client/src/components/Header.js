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
          {}
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
          {}
          {children}
        </div>
      </div>
    </header>
  );
};

export default Header;