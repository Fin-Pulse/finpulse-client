import React from 'react';
import './ForecastDisplay.css';

const ForecastDisplay = ({ value }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="forecast-display">
      <h3 className="forecast-title">Прогноз на конец месяца</h3>
      <div className="forecast-value">
        {value > 0 ? formatCurrency(value) : '—'}
      </div>
      <p className="forecast-description">
        {value > 0 
          ? 'Ожидаемый остаток средств' 
          : 'Подключите банк для получения прогноза'
        }
      </p>
    </div>
  );
};

export default ForecastDisplay;