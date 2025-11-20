import React, { useState, useEffect, useRef } from 'react';
import PieChartDisplay from './components/PieChartDisplay';
import './App.css';
import Header from './components/Header';
import ForecastDisplay from './components/ForecastDisplay';
import RecommendationsDisplay from './components/RecommendationsDisplay';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { apiService } from './services/api';
import { ForecastsClient } from './services/forecasts';
import { NotificationsClient } from './services/notifications'; 
import { RecommendationsClient } from './services/recommendations';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const forecastsClientRef = useRef(null);
  const notificationsClientRef = useRef(null); 
  const recommendationsClientRef = useRef(null);
  const userMenuRef = useRef(null);

  // Функция для нормализации данных пользователя
  const normalizeUserData = (user) => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      // Поддерживаем оба варианта написания bankClientId
      bankClientId: user.bankClientId || user.bank_client_id,
      createdAt: user.createdAt,
      verificationStatus: user.verificationStatus,
      verified: user.verified
    };
  };

  // Восстановление сессии
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsInitializing(false);
        return;
      }

      apiService.setToken(token);

      try {
        const profile = await apiService.getProfile();
        if (profile?.id) {
          setCurrentUserId(profile.id);
          setUserData(normalizeUserData(profile));
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      } catch {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };
    restoreSession();
  }, []);

  // Закрытие меню пользователя при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Загрузка уведомлений
  const loadNotifications = async (userId) => {
    if (!userId) return;
    try {
      const notificationsData = await apiService.getUserNotifications(userId);
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData);
      }
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      loadNotifications(currentUserId);
    } else {
      setNotifications([]);
      setCurrentUserId(null);
    }
  }, [isAuthenticated, currentUserId]);

  // WebSocket для прогнозов
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      const forecastsClient = new ForecastsClient({ userId: currentUserId });

      forecastsClient.onForecast = (forecastData) => {
        console.log('📊 Received forecast data:', forecastData);
        setForecast(forecastData);
      };

      forecastsClient.onOpen = () => console.log('✅ Forecast WebSocket connected');
      forecastsClient.onError = (error) => console.error('❌ Forecast WS error:', error);
      forecastsClient.onClose = () => console.log('📊 Forecast WebSocket closed');

      forecastsClient.connect();
      forecastsClientRef.current = forecastsClient;

      return () => {
        forecastsClient.disconnect();
        forecastsClientRef.current = null;
      };
    } else {
      if (forecastsClientRef.current) {
        forecastsClientRef.current.disconnect();
        forecastsClientRef.current = null;
      }
      setForecast(null);
    }
  }, [isAuthenticated, currentUserId]);

  // WebSocket для рекомендаций
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      const recClient = new RecommendationsClient({ userId: currentUserId });

      recClient.onRecommendation = (data) => {
        console.log('🎯 Received recommendations data:', data);
        
        if (data && data.recommendations && Array.isArray(data.recommendations)) {
          console.log('✅ Setting recommendations array:', data.recommendations.length);
          setRecommendations(data.recommendations);
        } else {
          console.log('❌ No recommendations array found in data');
          setRecommendations([]);
        }
      };

      recClient.onOpen = () => console.log('✅ Recommendations WS connected');
      recClient.onError = (err) => console.error('❌ Recommendations WS error:', err);
      recClient.onClose = () => console.log('🔔 Recommendations WS closed');

      recClient.connect();
      recommendationsClientRef.current = recClient;

      return () => {
        recClient.disconnect();
        recommendationsClientRef.current = null;
      };
    } else {
      if (recommendationsClientRef.current) {
        recommendationsClientRef.current.disconnect();
        recommendationsClientRef.current = null;
      }
      setRecommendations([]);
    }
  }, [isAuthenticated, currentUserId]);

  // WebSocket для уведомлений
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      const client = new NotificationsClient({
        token: localStorage.getItem('authToken'),
        userId: currentUserId,
      });

      client.onNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      };

      client.onError = (err) => console.error('❌ Notifications WS error:', err);
      client.onClose = () => console.log('🔔 Notifications WebSocket closed');

      client.connect();
      notificationsClientRef.current = client;

      return () => {
        client.disconnect();
        notificationsClientRef.current = null;
      };
    } else {
      if (notificationsClientRef.current) {
        notificationsClientRef.current.disconnect();
        notificationsClientRef.current = null;
      }
    }
  }, [isAuthenticated, currentUserId]);

  // Обработчики аутентификации
  const handleLogin = async (loginData) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.login(loginData);
      console.log('Login response:', response); // Для отладки
      if (response?.user?.id) {
        setCurrentUserId(response.user.id);
        setUserData(normalizeUserData(response.user));
        setIsAuthenticated(true);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (registerData) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.register({
        email: registerData.email,
        password: registerData.password,
        bank_client_id: registerData.bank_client_id,
        phone: registerData.phone,
        fullName: registerData.fullName || 'User',
      });
      console.log('Register response:', response); // Для отладки
      if (response?.user?.id) {
        setCurrentUserId(response.user.id);
        setUserData(normalizeUserData(response.user));
        setIsAuthenticated(true);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (forecastsClientRef.current) forecastsClientRef.current.disconnect();
    if (notificationsClientRef.current) notificationsClientRef.current.disconnect();
    if (recommendationsClientRef.current) recommendationsClientRef.current.disconnect();
    
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setAuthMode('login');
    setForecast(null);
    setNotifications([]);
    setRecommendations([]);
    setCurrentUserId(null);
    setUserData(null);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Обработчики уведомлений
  const handleNotificationsClick = () => setShowNotifications(!showNotifications);

  const markAsRead = async (notificationId) => {
    setNotificationLoading(notificationId);
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setNotificationLoading(null);
    }
  };

  const deleteNotification = (notificationId) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Состояние загрузки
  if (isInitializing) {
    return (
      <div className="App">
        <Header 
          showNotificationsButton={false}
          userData={null}
          onUserMenuToggle={() => {}}
          showUserMenu={false}
          userMenuRef={null}
          onLogout={() => {}}
        />
        <div className="loading">Проверка сессии...</div>
      </div>
    );
  }

  // Неаутентифицированный пользователь
  if (!isAuthenticated) {
    return (
      <div className="App">
        <Header 
          showNotificationsButton={false}
          userData={null}
          onUserMenuToggle={() => {}}
          showUserMenu={false}
          userMenuRef={null}
          onLogout={() => {}}
        />
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading">Loading...</div>}
        {authMode === 'login' ? (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </div>
    );
  }

  // Основной интерфейс
  return (
    <div className="App">
      <Header
        showNotificationsButton={true}
        onNotificationsClick={handleNotificationsClick}
        notificationCount={unreadCount}
        userData={userData}
        onUserMenuToggle={toggleUserMenu}
        showUserMenu={showUserMenu}
        userMenuRef={userMenuRef}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading">Загрузка данных...</div>}

        {/* Основная панель с ПРАВИЛЬНЫМ ПОРЯДКОМ */}
        <div className="dashboard">
          {/* Левая колонка - 1/3 ширины (только для десктопа) */}
          <div className="left-column">
            <div className="forecast-section">
              <ForecastDisplay forecast={forecast} />
            </div>
            
            {/* Блок с банковскими предложениями */}
            <RecommendationsDisplay recommendations={recommendations} />
          </div>

          {/* Правая колонка - 2/3 ширины (только для десктопа) */}
          <div className="right-column">
            <div className="transactions-section">
              <PieChartDisplay
                imageUrl={forecast?.chartUrls?.pie_chart}
                chartData={forecast?.chartUrls?.pie_chart_data}
                forecastData={forecast}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Панель уведомлений */}
      {showNotifications && (
        <div className="notifications-overlay" onClick={() => setShowNotifications(false)}>
          <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notifications-header">
              <h3>Уведомления</h3>
              <button className="close-button" onClick={() => setShowNotifications(false)}>
                ×
              </button>
            </div>

            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">Уведомлений пока нет</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${
                      notification.type?.toLowerCase() || ''
                    }`}
                  >
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="notification-actions">
                      {!notification.isRead && (
                        <button
                          className={`mark-read-btn ${
                            notificationLoading === notification.id ? 'loading' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                          disabled={notificationLoading === notification.id}
                          title="Пометить как прочитанное"
                        >
                          {notificationLoading === notification.id ? '...' : '✓'}
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        onClick={() => deleteNotification(notification.id)}
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="notifications-footer">
              <button
                className="clear-all-btn"
                onClick={() => setNotifications([])}
                disabled={notifications.length === 0}
              >
                Очистить все
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;