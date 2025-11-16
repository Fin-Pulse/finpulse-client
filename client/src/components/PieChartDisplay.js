import React, { useRef, useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const PieChartDisplay = ({ imageUrl, forecastData, chartData }) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [showFallbackImage, setShowFallbackImage] = useState(false);
  const [chartError, setChartError] = useState(false);

  const pieChartData = chartData || forecastData?.chartUrls?.pie_chart_data;
  const fallbackImageUrl = imageUrl || forecastData?.chartUrls?.pie_chart;


  const colorPalette = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#7CFFB2', '#C9CBCF', '#F7464A', '#46BFBD', '#FDB45C', '#949FB1'
  ];

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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
    return `${value > 0 ? '+' : ''}${value}%`;
  };

  const getAnalysisData = () => {
    if (!forecastData) return null;

    if (forecastData.fullForecastData) {
      const { analysis, forecast, recommendations, next_steps, data_period } = forecastData.fullForecastData;
      
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
    }

    return {
      financialMetrics: {
        currentForecast: forecastData.forecastAmount,
        lastWeekAmount: forecastData.lastWeekAmount,
        changePercentage: forecastData.changePercentage,
        changeAmount: forecastData.forecastAmount - forecastData.lastWeekAmount,
        forecastMethod: forecastData.forecastMethod,
        volatility: null,
        deviation: null
      },
      statistics: {},
      trends: {},
      seasonality: {},
      recommendations: {
        insights: [],
        financialTips: {},
        budgetPlanning: {},
        nextSteps: []
      },
      dataPeriod: {
        total_weeks: 6,
        start_date: forecastData.forecastWeekStart,
        end_date: new Date(new Date(forecastData.forecastWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  };

  const analysisData = getAnalysisData();

  useEffect(() => {
    if (!pieChartData) {
      return;
    }

    const createChart = () => {
      const canvas = chartRef.current;
      if (!canvas) {
        console.log('❌ Canvas элемент не найден');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('❌ Не удалось получить контекст canvas');
        setChartError(true);
        return;
      }

      if (chartInstance) {
        chartInstance.destroy();
      }

      try {
        
        const categories = Object.keys(pieChartData);
        const percentages = categories.map(category => {
          const value = pieChartData[category];
          return typeof value === 'string' ? parseFloat(value) : value;
        });

        const backgroundColors = categories.map((_, index) => 
          colorPalette[index % colorPalette.length]
        );

        const totalForecast = forecastData?.forecastAmount;
        const categoryAmounts = {};
        if (totalForecast) {
          categories.forEach((category, index) => {
            categoryAmounts[category] = (percentages[index] / 100) * totalForecast;
          });
        }

        const newChartInstance = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: categories,
            datasets: [{
              data: percentages,
              backgroundColor: backgroundColors,
              borderColor: '#fff',
              borderWidth: 2,
              hoverOffset: 15
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const percentage = context.parsed;
                    let tooltipText = `${label}: ${percentage}%`;
                    
                    if (categoryAmounts[label]) {
                      const amount = categoryAmounts[label];
                      tooltipText += ` (${formatCurrency(amount)})`;
                    }
                    
                    return tooltipText;
                  }
                }
              }
            },
            animation: {
              animateScale: true,
              animateRotate: true
            }
          }
        });

        setChartInstance(newChartInstance);
        setChartError(false);
        setShowFallbackImage(false);
      } catch (error) {
        console.error('❌ Критическая ошибка при создании диаграммы:', error);
        setChartError(true);
        setShowFallbackImage(true);
      }
    };

    const timer = setTimeout(() => {
      createChart();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [pieChartData, forecastData]);

  const handleImageError = () => {
    console.error('Не удалось загрузить fallback изображение');
    setShowFallbackImage(false);
  };

  const translateCategory = (category) => {
    const translations = {
      'cafe': 'Кафе',
      'grocery': 'Продукты', 
      'transport': 'Транспорт',
      'restaurant': 'Рестораны',
      'entertainment': 'Развлечения',
      'shopping': 'Шоппинг',
      'health': 'Здоровье',
      'other': 'Другое'
    };
    return translations[category] || category;
  };

  if (!pieChartData && !fallbackImageUrl) {
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
        <p className="chart-subtitle">
          На основе анализа за последние {analysisData?.dataPeriod?.total_weeks || 6} недель
        </p>
      </div>
      
      {}
      <div className="chart-full-width">
        {showFallbackImage && fallbackImageUrl ? (
          // Показываем fallback ТОЛЬКО при критической ошибке
          <div className="chart-image-wrapper">
            <img 
              src={fallbackImageUrl} 
              alt="Круговая диаграмма распределения расходов по категориям" 
              className="chart-image-full"
              onError={handleImageError}
            />
            <div className="fallback-notice">
              <p>Используется резервное изображение</p>
            </div>
          </div>
        ) : (
          // Всегда пытаемся рисовать диаграмму
          <div className="chart-canvas-wrapper">
            <canvas 
              ref={chartRef}
              style={{ width: '100%', height: '400px' }}
            />
            {chartError && !showFallbackImage && (
              <div className="chart-error">
                <p>Не удалось отобразить интерактивную диаграмму</p>
              </div>
            )}
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
              
              {analysisData.financialMetrics.volatility && (
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
              )}

              {analysisData.financialMetrics.deviation && (
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
              )}
            </div>
          </div>

          {}
          {analysisData.dataPeriod && (
            <div className="analysis-section">
              <h4>Период анализа</h4>
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
              <h4>Рекомендуемые действия</h4>
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
              <h4>Ключевые инсайты</h4>
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