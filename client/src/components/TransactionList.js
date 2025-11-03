import React from 'react';
import './TransactionList.css';

const TransactionList = ({ transactions }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (transactions.length === 0) {
    return (
      <div className="transaction-list">
        <h3 className="transaction-list-title">Транзакции</h3>
        <div className="empty-state">
          <p>Нет данных о транзакциях</p>
          <p className="empty-state-hint">
            Нажмите "Подключить банк" для загрузки данных
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      <h3 className="transaction-list-title">Последние транзакции</h3>
      <div className="transactions-container">
        {transactions.map(transaction => (
          <div key={transaction.id} className="transaction-item">
            <div className="transaction-info">
              <div className="transaction-description">
                {transaction.description}
              </div>
              <div className="transaction-date">
                {formatDate(transaction.date)}
              </div>
            </div>
            <div className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(transaction.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;