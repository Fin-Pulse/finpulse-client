import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import TransactionList from './components/TransactionList';
import ForecastDisplay from './components/ForecastDisplay';
import ConnectBankButton from './components/ConnectBankButton';
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

  const handleRegister = async (registerData) => {
    setLoading(true);
    setError('');
    
    try {
      // Дополнительная валидация на фронтенде
      if (!registerData.phone || !registerData.bank_client_id) {
        throw new Error('Phone and Bank Client ID are required');
      }

      // Очистка данных
      const cleanedData = {
        email: registerData.email.trim(),
        password: registerData.password,
        bank_client_id: registerData.bank_client_id.trim(),
        phone: registerData.phone.trim(),
        fullName: (registerData.fullName || 'User').trim()
      };

      console.log('📝 Sending registration data:', cleanedData);

      const response = await apiService.register(cleanedData);
      console.log('Registration successful:', response);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Получаем транзакции с бэкенда
      const transactionsData = await apiService.getTransactions();
      console.log('Raw transactions data:', transactionsData);
      
      // Отображаем "сырые" данные как есть
      setTransactions(transactionsData);
      setForecast(42350); // Пока заглушка для прогноза
      
    } catch (err) {
      setError('Failed to fetch transactions: ' + err.message);
      console.error('Connect bank error:', err);
      
      // Заглушка на время разработки
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setAuthMode('login');
    setTransactions([]);
    setForecast(0);
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <Header />
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
      <Header />
      
      <main className="main-content">
        <div className="connect-section">
          <ConnectBankButton onClick={handleConnectBank} />
          <button onClick={handleLogout} className="logout-button">
            Выйти
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading">Загрузка транзакций...</div>}
        
        <div className="dashboard">
          <div className="forecast-section">
            <ForecastDisplay value={forecast} />
          </div>
          
          <div className="transactions-section">
            <h3>Сырые данные транзакций:</h3>
            <pre>{JSON.stringify(transactions, null, 2)}</pre>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;