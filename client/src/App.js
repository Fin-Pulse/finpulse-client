import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import TransactionList from './components/TransactionList';
import ForecastDisplay from './components/ForecastDisplay';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { apiService } from './services/api';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [forecast, setForecast] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Заглушка для уведомлений (потом заменим на WebSocket)
  const mockNotifications = [
    {
      id: 1,
      title: 'Новая транзакция',
      message: 'Поступила зарплата: 75 000 ₽',
      time: '5 минут назад',
      type: 'success',
      read: false
    },
    {
      id: 2,
      title: 'Превышен лимит',
      message: 'Превышен лимит по категории "Рестораны"',
      time: '2 часа назад',
      type: 'warning',
      read: false
    },
    {
      id: 3,
      title: 'Обновление системы',
      message: 'Добавлены новые категории расходов',
      time: 'Вчера',
      type: 'info',
      read: true
    }
  ];

  // Инициализация уведомлений
  useEffect(() => {
    if (isAuthenticated) {
      setNotifications(mockNotifications);
    }
  }, [isAuthenticated]);

  // Функция для входа
  const handleLogin = async (loginData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.login(loginData);
      console.log('Login successful:', response);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || 'Login failed');
      console.error('Login error:', err);
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
        clientId: registerData.bank_client_id,
        phone: registerData.phone,
        fullName: registerData.fullName || 'User'
      });
      console.log('Registration successful:', response);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для выхода
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setAuthMode('login');
    setTransactions([]);
    setForecast(0);
    setNotifications([]);
  };

  // Функция для подключения банка (получения транзакций)
  const handleConnectBank = async () => {
    setLoading(true);
    setError('');
    
    try {
      const transactionsData = await apiService.getTransactions();
      console.log('Raw transactions data:', transactionsData);
      
      setTransactions(transactionsData);
      setForecast(42350);
      
    } catch (err) {
      setError('Failed to fetch transactions: ' + err.message);
      console.error('Connect bank error:', err);
      
      const mockTransactions = [
        { id: 1, date: '2024-01-15', description: 'Продукты', amount: -2500 },
        { id: 2, date: '2024-01-14', description: 'Зарплата', amount: 50000 },
        { id: 3, date: '2024-01-13', description: 'Кафе', amount: -1200 },
      ];
      setTransactions(mockTransactions);
      setForecast(42350);
    } finally {
      setLoading(false);
    }
  };

  // Функция для показа/скрытия уведомлений
  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
  };

  // Функция для пометки уведомления как прочитанного
  const markAsRead = (notificationId) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  // Функция для удаления уведомления
  const deleteNotification = (notificationId) => {
    setNotifications(notifications.filter(notif => notif.id !== notificationId));
  };

  // Подсчет непрочитанных уведомлений
  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Если пользователь не авторизован, показываем экран входа/регистрации
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

  // Если пользователь авторизован, показываем главный экран
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
        {loading && <div className="loading">Загрузка транзакций...</div>}
        
        <div className="dashboard">
          <div className="forecast-section">
            <ForecastDisplay value={forecast} />
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
                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                  >
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{notification.time}</div>
                    </div>
                    <div className="notification-actions">
                      {!notification.read && (
                        <button 
                          className="mark-read-btn"
                          onClick={() => markAsRead(notification.id)}
                          title="Пометить как прочитанное"
                        >
                          ✓
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