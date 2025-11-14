import React, { useRef, useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';

// Регистрируем все компоненты Chart.js
Chart.register(...registerables);

const PieChartDisplay = ({ imageUrl, forecastData, chartData }) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [showFallbackImage, setShowFallbackImage] = useState(false);
  const [chartError, setChartError] = useState(false);

  // Извлекаем данные для диаграммы из нового формата
  const pieChartData = chartData || forecastData?.charts?.pie_chart_data;
  const fallbackImageUrl = imageUrl || forecastData?.charts?.pie_chart;

  // Цветовая палитра для категорий
  const colorPalette = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#FF6384', '#C9CBCF', '#7CFFB2', '#FF6384', '#F7464A', '#46BFBD'
  ];

  // Форматирование валюты
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Создание диаграммы
  useEffect(() => {
    if (!pieChartData || chartError) {
      setShowFallbackImage(true);
      return;
    }

    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    // Уничтожаем предыдущую диаграмму
    if (chartInstance) {
      chartInstance.destroy();
    }

    try {
      const categories = Object.keys(pieChartData);
      const data = categories.map(category => pieChartData[category].percent);
      const amounts = categories.map(category => pieChartData[category].amount);

      const backgroundColors = categories.map((_, index) => 
        colorPalette[index % colorPalette.length]
      );

      const newChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: categories,
          datasets: [
            {
              data: data,
              backgroundColor: backgroundColors,
              borderColor: '#fff',
              borderWidth: 2,
              hoverOffset: 15
            }
          ]
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
                pointStyle: 'circle',
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const amount = amounts[context.dataIndex];
                  return `${label}: ${value}% (${formatCurrency(amount)})`;
                }
              }
            },
            title: {
              display: true,
              text: 'Распределение расходов по категориям',
              font: {
                size: 16
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
      setShowFallbackImage(false);
    } catch (error) {
      console.error('Ошибка при создании диаграммы:', error);
      setChartError(true);
      setShowFallbackImage(true);
    }

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [pieChartData, chartError]);

  // Обработчик ошибки загрузки fallback изображения
  const handleImageError = () => {
    console.error('Не удалось загрузить fallback изображение');
    setShowFallbackImage(false);
  };

  // Получение данных для анализа (адаптировано под новый формат)
  const getAnalysisData = () => {
    if (!forecastData) return null;

    // Новый формат данных
    if (forecastData.forecast) {
      return {
        financialMetrics: {
          currentForecast: forecastData.forecast.weekly_forecast,
          confidenceInterval: forecastData.forecast.confidence_interval,
          trend: forecastData.forecast.trend
        },
        metadata: forecastData.metadata || {}
      };
    }

    // Старый формат данных (для обратной совместимости)
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

  const formatPercentage = (value) => {
    if (!value && value !== 0) return '—';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Если нет данных для диаграммы и нет fallback изображения
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
        {analysisData?.metadata?.period_days && (
          <p className="chart-subtitle">
            На основе анализа за последние {analysisData.metadata.period_days} дней
          </p>
        )}
        {analysisData?.dataPeriod?.total_weeks && (
          <p className="chart-subtitle">
            На основе анализа за последние {analysisData.dataPeriod.total_weeks} недель
          </p>
        )}
      </div>
      
      {/* Область диаграммы */}
      <div className="chart-full-width">
        {showFallbackImage && fallbackImageUrl ? (
          // Показываем готовое изображение из minio
          <div className="chart-image-wrapper">
            <img 
              src={fallbackImageUrl} 
              alt="Круговая диаграмма распределения расходов по категориям" 
              className="chart-image-full"
              onError={handleImageError}
            />
          </div>
        ) : !chartError && pieChartData ? (
          // Рисуем диаграмму на фронтенде
          <div className="chart-canvas-wrapper">
            <canvas 
              ref={chartRef}
              style={{ width: '100%', height: '400px' }}
            />
          </div>
        ) : (
          // Заглушка если всё остальное не сработало
          <div className="no-chart-visual">
            <p>Не удалось отобразить данные диаграммы</p>
          </div>
        )}
      </div>

      {/* Аналитическая информация */}
      {analysisData && (
        <div className="analysis-below-chart">
          {/* Основные метрики */}
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
                  {analysisData.financialMetrics.confidenceInterval && (
                    <div className="metric-description">
                      Диапазон: {formatCurrency(analysisData.financialMetrics.confidenceInterval[0])} - {formatCurrency(analysisData.financialMetrics.confidenceInterval[1])}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Старые метрики для обратной совместимости */}
              {analysisData.financialMetrics.lastWeekAmount !== undefined && (
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
              )}
              
              {analysisData.financialMetrics.volatility !== undefined && (
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

              {analysisData.financialMetrics.trend && (
                <div className="metric-card">
                  <div className="metric-icon"></div>
                  <div className="metric-info">
                    <div className="metric-label">Тренд</div>
                    <div className="metric-value">
                      {analysisData.financialMetrics.trend === 'stable' ? 'Стабильный' : 
                       analysisData.financialMetrics.trend === 'growing' ? 'Рост' : 'Снижение'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Метаданные */}
          {analysisData.metadata && (
            <div className="analysis-section">
              <h4>Информация о прогнозе</h4>
              <div className="period-info">
                <div className="period-item">
                  <span className="period-label">ID пользователя:</span>
                  <span className="period-value">{analysisData.metadata.user_id}</span>
                </div>
                <div className="period-item">
                  <span className="period-label">Банковский ID:</span>
                  <span className="period-value">{analysisData.metadata.bank_client_id}</span>
                </div>
                <div className="period-item">
                  <span className="period-label">Сгенерировано:</span>
                  <span className="period-value">{formatDate(analysisData.metadata.generated_at)}</span>
                </div>
                <div className="period-item">
                  <span className="period-label">Период анализа:</span>
                  <span className="period-value">{analysisData.metadata.period_days} дней</span>
                </div>
              </div>
            </div>
          )}

          {/* Рекомендации (старый формат) */}
          {analysisData.recommendations?.nextSteps && analysisData.recommendations.nextSteps.length > 0 && (
            <div className="analysis-section">
              <h4>Рекомендуемые действия</h4>
              <div className="steps-list">
                {analysisData.recommendations.nextSteps.map((step, index) => (
                  <div key={index} className="step-card">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-text">{step}</div>
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