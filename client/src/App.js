import React, { useState, useEffect, useRef } from 'react';
import PieChartDisplay from './components/PieChartDisplay';
import './App.css';
import Header from './components/Header';
import ForecastDisplay from './components/ForecastDisplay';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { apiService } from './services/api';
import { ForecastsClient } from './services/forecasts';
import { NotificationsClient } from './services/notifications'; 

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

  const forecastsClientRef = useRef(null);
  const notificationsClientRef = useRef(null); 

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

  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      const client = new NotificationsClient({
        token: localStorage.getItem('authToken'),
        userId: currentUserId,
      });

      client.onNotification = (notif) => {
        console.log('🔔 New notification received:', notif);
        setNotifications((prev) => [notif, ...prev]);
      };

      client.onOpen = () => console.log('✅ Notifications WebSocket connected');
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


  const handleLogin = async (loginData) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.login(loginData);
      if (response?.user?.id) {
        setCurrentUserId(response.user.id);
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
      if (response?.user?.id) {
        setCurrentUserId(response.user.id);
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
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setAuthMode('login');
    setForecast(null);
    setNotifications([]);
    setCurrentUserId(null);
  };

  const handleGetForecast = () => {
    if (forecastsClientRef.current) {
      forecastsClientRef.current.disconnect();
      setTimeout(() => forecastsClientRef.current?.connect(), 1000);
    }
  };

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

  if (isInitializing) {
    return (
      <div className="App">
        <Header showNotificationsButton={false} />
        <div className="loading">Проверка сессии...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        <Header showNotificationsButton={false} />
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

  return (
    <div className="App">
      <Header
        showNotificationsButton={true}
        onNotificationsClick={handleNotificationsClick}
        notificationCount={unreadCount}
      >
        <button onClick={handleLogout} className="logout-button">
          Выйти
        </button>
      </Header>

      <main className="main-content">
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading">Загрузка данных...</div>}

        <div className="dashboard">
          <div className="forecast-section">
            <ForecastDisplay forecast={forecast} />
          </div>

          <div className="transactions-section">
            <PieChartDisplay
              imageUrl={forecast?.charts?.pie_chart}
              chartData={forecast?.charts?.pie_chart_data}
              forecastData={forecast}
            />
          </div>
        </div>
      </main>

      {}
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
