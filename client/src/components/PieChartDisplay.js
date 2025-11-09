import React from 'react';

const PieChartDisplay = ({ imageUrl, forecastData }) => {

  const renderValue = (value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {

      if (value.message) return value.message;
      if (value.advice) return value.advice;
      if (value.type) return value.type;

      return JSON.stringify(value);
    }
    return String(value);
  };


  const getAnalysisData = () => {
    if (!forecastData) return null;

    const { analysis, forecast, recommendations, next_steps, data_period } = forecastData;
    
    return {
      financialMetrics: {
        currentForecast: forecast?.forecast,
        lastWeekAmount: forecast?.last_week,
        changePercentage: forecast?.change_pct,
        changeAmount: forecast?.change,
        forecastMethod: forecast?.method,
        volatility: analysis?.volatility,
        deviation: analysis?.last_week_deviation
      },
      
      statistics: analysis?.statistics || {},

      trends: analysis?.trends || {},
      

      seasonality: analysis?.seasonality || {},

      recommendations: {
        insights: recommendations?.insights || [],
        financialTips: recommendations?.financial_tips || {},
        budgetPlanning: recommendations?.budget_planning || {},
        nextSteps: next_steps || []
      },
      

      dataPeriod: data_period || {}
    };
  };

  const analysisData = getAnalysisData();

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return '—';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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

  if (!imageUrl && !analysisData) {
    return (
      <div className="pie-chart-container">
        <div className="no-chart">
          <p>Данные для анализа пока недоступны</p>
          <p className="chart-hint">Анализ расходов появится после получения прогноза</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pie-chart-container">
      <div className="chart-header">
        <h3>Детальный анализ расходов</h3>
        <p className="chart-subtitle">На основе анализа за последние {analysisData?.dataPeriod?.total_weeks || 6} недель</p>
      </div>
      
      {}
      <div className="chart-full-width">
        {imageUrl ? (
          <div className="chart-image-wrapper">
            <img 
              src={imageUrl} 
              alt="Круговая диаграмма распределения расходов по категориям" 
              className="chart-image-full"
              onError={(e) => {
                console.error('Failed to load chart image');
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="chart-fallback" style={{display: 'none'}}>
              <p>Не удалось загрузить график</p>
            </div>
          </div>
        ) : (
          <div className="no-chart-visual">
            <p>График временно недоступен</p>
          </div>
        )}
      </div>

      {}
      {analysisData && (
        <div className="analysis-below-chart">
          {}
          <div className="analysis-section main-metrics">
            <h4>Финансовые показатели</h4>
            <div className="metrics-grid">
              <div className="metric-card primary">
                <div className="metric-icon"></div>
                <div className="metric-info">
                  <div className="metric-label">Прогноз на неделю</div>
                  <div className="metric-value">
                    {formatCurrency(analysisData.financialMetrics.currentForecast)}
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon"></div>
                <div className="metric-info">
                  <div className="metric-label">Траты за прошлую неделю</div>
                  <div className="metric-value">
                    {formatCurrency(analysisData.financialMetrics.lastWeekAmount)}
                  </div>
                  <div className={`metric-change ${analysisData.financialMetrics.changePercentage < 0 ? 'positive' : 'negative'}`}>
                    {formatPercentage(analysisData.financialMetrics.changePercentage)}
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon"></div>
                <div className="metric-info">
                  <div className="metric-label">Волатильность расходов</div>
                  <div className="metric-value">
                    {analysisData.financialMetrics.volatility?.toFixed(1)}%
                  </div>
                  <div className="metric-description">
                    Стабильность ваших трат
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon"></div>
                <div className="metric-info">
                  <div className="metric-label">Отклонение от тренда</div>
                  <div className="metric-value">
                    {analysisData.financialMetrics.deviation?.toFixed(1)}%
                  </div>
                  <div className="metric-description">
                    На прошлой неделе
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          {analysisData.dataPeriod && (
            <div className="analysis-section">
              <h4> Период анализа</h4>
              <div className="period-info">
                <div className="period-item">
                  <span className="period-label">Начало периода:</span>
                  <span className="period-value">{formatDate(analysisData.dataPeriod.start_date)}</span>
                </div>
                <div className="period-item">
                  <span className="period-label">Конец периода:</span>
                  <span className="period-value">{formatDate(analysisData.dataPeriod.end_date)}</span>
                </div>
                <div className="period-item">
                  <span className="period-label">Всего недель:</span>
                  <span className="period-value">{analysisData.dataPeriod.total_weeks}</span>
                </div>
              </div>
            </div>
          )}

          {}
          {analysisData.recommendations.nextSteps && analysisData.recommendations.nextSteps.length > 0 && (
            <div className="analysis-section">
              <h4> Рекомендуемые действия</h4>
              <div className="steps-list">
                {analysisData.recommendations.nextSteps.map((step, index) => (
                  <div key={index} className="step-card">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-text">{renderValue(step)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {analysisData.recommendations.insights && analysisData.recommendations.insights.length > 0 && (
            <div className="analysis-section">
              <h4> Ключевые инсайты</h4>
              <div className="insights-list">
                {analysisData.recommendations.insights.map((insight, index) => (
                  <div key={index} className="insight-card">
                    <div className="insight-icon"></div>
                    <div className="insight-text">{renderValue(insight)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}          
        </div>
      )}
    </div>
  );
};

export default PieChartDisplay;