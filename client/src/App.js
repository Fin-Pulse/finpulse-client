import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import TransactionList from './components/TransactionList';
import ForecastDisplay from './components/ForecastDisplay';
import ConnectBankButton from './components/ConnectBankButton';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [forecast, setForecast] = useState(0);

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