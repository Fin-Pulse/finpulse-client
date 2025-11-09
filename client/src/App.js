import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import TransactionList from './components/TransactionList';
import ForecastDisplay from './components/ForecastDisplay';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { apiService } from './services/api';
import { ForecastsClient } from './services/forecasts';

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

  // Восстановление сессии при загрузке приложения
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
      } catch (error) {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  // Загрузка уведомлений с сервера
  const loadNotifications = async (userId) => {
    if (!userId) return;

    try {
      const notificationsData = await apiService.getUserNotifications(userId);
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData);
      }
    } catch (error) {
      setNotifications([]);
    }
  };

  // Инициализация уведомлений после аутентификации
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      loadNotifications(currentUserId);
    } else if (!isAuthenticated) {
      setNotifications([]);
      setCurrentUserId(null);
    }
  }, [isAuthenticated, currentUserId]);

  // Инициализация WebSocket для прогнозов
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      // Создаем клиент для прогнозов
      const forecastsClient = new ForecastsClient({
        userId: currentUserId
      });

      forecastsClient.onForecast = (forecastData) => {
        console.log('📊 Received forecast data:', forecastData);
        setForecast(forecastData);
      };

      forecastsClient.onOpen = () => {
        console.log('✅ Forecast WebSocket connected');
      };

      forecastsClient.onError = (error) => {
        console.error('❌ Forecast WebSocket error:', error);
      };

      forecastsClient.onClose = () => {
        console.log('📊 Forecast WebSocket closed');
      };

      forecastsClientRef.current = forecastsClient;
      forecastsClient.connect();

      // Очистка при размонтировании
      return () => {
        if (forecastsClientRef.current) {
          forecastsClientRef.current.disconnect();
          forecastsClientRef.current = null;
        }
      };
    } else {
      // Отключаемся если пользователь вышел
      if (forecastsClientRef.current) {
        forecastsClientRef.current.disconnect();
        forecastsClientRef.current = null;
      }
      setForecast(null);
    }
  }, [isAuthenticated, currentUserId]);

  // Функция для входа
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
      setCurrentUserId(null);
    } finally {
      setLoading(false);
    }
  };

  // Функция для регистрации
  const handleRegister = async (registerData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.register({
        email: registerData.email,
        password: registerData.password,
        bank_client_id: registerData.bank_client_id,
        phone: registerData.phone,
        fullName: registerData.fullName || 'User'
      });
      
      if (response?.user?.id) {
        setCurrentUserId(response.user.id);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      setCurrentUserId(null);
    } finally {
      setLoading(false);
    }
  };

  // Функция для выхода
  const handleLogout = () => {
    // Отключаем WebSocket для прогнозов
    if (forecastsClientRef.current) {
      forecastsClientRef.current.disconnect();
      forecastsClientRef.current = null;
    }
    
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setAuthMode('login');
    setTransactions([]);
    setForecast(null);
    setNotifications([]);
    setCurrentUserId(null);
  };

  // Функция для получения прогноза (теперь через WebSocket)
  const handleGetForecast = async () => {
    // Прогнозы теперь приходят автоматически через WebSocket
    // Но можно попробовать переподключиться
    if (forecastsClientRef.current) {
      forecastsClientRef.current.disconnect();
      setTimeout(() => {
        if (forecastsClientRef.current) {
          forecastsClientRef.current.connect();
        }
      }, 1000);
    }
  };

  // Функция для показа/скрытия уведомлений
  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
  };

  // Функция для пометки уведомления как прочитанного
  const markAsRead = async (notificationId) => {
    setNotificationLoading(notificationId);
    
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setNotificationLoading(null);
    }
  };

  // Функция для удаления уведомления
  const deleteNotification = (notificationId) => {
    setNotifications(notifications.filter(notif => notif.id !== notificationId));
  };

  // Подсчет непрочитанных уведомлений
  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  // Пока инициализируемся, показываем загрузку
  if (isInitializing) {
    return (
      <div className="App">
        <Header showNotificationsButton={false} />
        <div className="loading">Проверка сессии...</div>
      </div>
    );
  }

  // Если пользователь не авторизован
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

  // Главный экран
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
            <div className="forecast-actions">
              <button 
                onClick={handleGetForecast} 
                className="get-forecast-button"
                disabled={loading}
                title="Обновить подключение к прогнозам"
              >
                {loading ? 'Загрузка...' : 'Обновить прогноз'}
              </button>
            </div>
          </div>
          
          <div className="transactions-section">
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </main>

      {/* Панель уведомлений */}
      {showNotifications && (
        <div className="notifications-overlay" onClick={() => setShowNotifications(false)}>
          <div 
            className="notifications-panel" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notifications-header">
              <h3>Уведомления</h3>
              <button 
                className="close-button"
                onClick={() => setShowNotifications(false)}
              >
                ×
              </button>
            </div>
            
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  Уведомлений пока нет
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.type?.toLowerCase()}`}
                  >
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="notification-actions">
                      {!notification.isRead && (
                        <button 
                          className={`mark-read-btn ${notificationLoading === notification.id ? 'loading' : ''}`}
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