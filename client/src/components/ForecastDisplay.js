import React from 'react';
import './ForecastDisplay.css';

const ForecastDisplay = ({ forecast }) => {
  const formatCurrency = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!forecast) {
    return (
      <div className="forecast-display">
        <h3 className="forecast-title">Прогноз на следующую неделю</h3>
        <div className="forecast-value">—</div>
        <p className="forecast-description">
          Ожидание данных прогноза...
        </p>
      </div>
    );
  }

  const forecastAmount = forecast.forecastAmount;
  const confidenceMin = forecast.confidenceMin;
  const confidenceMax = forecast.confidenceMax;
  const changePercentage = forecast.changePercentage;
  const lastWeekAmount = forecast.lastWeekAmount;
  const weekStart = forecast.forecastWeekStart;
  const chartUrls = forecast.chartUrls || {};

  const changeColor = changePercentage > 0 ? '#d32f2f' : changePercentage < 0 ? '#2e7d32' : '#666';
  const changeIcon = changePercentage > 0 ? '↑' : changePercentage < 0 ? '↓' : '→';

  return (
    <div className="forecast-display">
      <h3 className="forecast-title">Прогноз на следующую неделю</h3>
      
      {weekStart && (
        <div className="forecast-week">
          Неделя с {formatDate(weekStart)}
        </div>
      )}

      <div className="forecast-value">
        {formatCurrency(forecastAmount)}
      </div>

      {changePercentage !== null && changePercentage !== undefined && (
        <div className="forecast-change" style={{ color: changeColor }}>
          <span className="change-icon">{changeIcon}</span>
          <span className="change-value">
            {Math.abs(changePercentage).toFixed(1)}%
          </span>
          {lastWeekAmount && (
            <span className="change-label">
              {' '}от {formatCurrency(lastWeekAmount)} на прошлой неделе
            </span>
          )}
        </div>
      )}

      {(confidenceMin || confidenceMax) && (
        <div className="forecast-confidence">
          <div className="confidence-label">Диапазон:</div>
          <div className="confidence-range">
            {formatCurrency(confidenceMin)} — {formatCurrency(confidenceMax)}
          </div>
        </div>
      )}

      <p className="forecast-description">
        {forecastAmount > 0 
          ? 'Ожидаемые траты на основе анализа ваших транзакций' 
          : 'Подключите банк для получения прогноза'
        }
      </p>
    </div>
  );
};

export default ForecastDisplay;
