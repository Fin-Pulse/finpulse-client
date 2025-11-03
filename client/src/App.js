import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import TransactionList from './components/TransactionList';
import ForecastDisplay from './components/ForecastDisplay';
import ConnectBankButton from './components/ConnectBankButton';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [forecast, setForecast] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' или 'register'

  const handleLogin = (loginData) => {
    // Здесь будет API-запрос для входа
    console.log('Login data:', loginData);
    setIsAuthenticated(true);
  };

  const handleRegister = (registerData) => {
    // Здесь будет API-запрос для регистрации
    console.log('Register data:', registerData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthMode('login');
  };

  const handleConnectBank = () => {
    alert('Функционал подключения банка будет реализован позже');
    
    const mockTransactions = [
      { id: 1, date: '2024-01-15', description: 'Продукты', amount: -2500 },
      { id: 2, date: '2024-01-14', description: 'Зарплата', amount: 50000 },
      { id: 3, date: '2024-01-13', description: 'Кафе', amount: -1200 },
      { id: 4, date: '2024-01-12', description: 'Транспорт', amount: -800 },
    ];
    
    setTransactions(mockTransactions);
    setForecast(42350);
  };

  // Если пользователь не аутентифицирован, показываем формы входа/регистрации
  if (!isAuthenticated) {
    return (
      <div className="App">
        <Header />
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

  // Если пользователь аутентифицирован, показываем главный экран
  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <div className="connect-section">
          <ConnectBankButton onClick={handleConnectBank} />
        </div>
        
        <div className="dashboard">
          <div className="forecast-section">
            <ForecastDisplay value={forecast} />
          </div>
          
          <div className="transactions-section">
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;