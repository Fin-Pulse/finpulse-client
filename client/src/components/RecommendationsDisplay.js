import React, { useState } from 'react';
import ApplicationModal from './ApplicationModal';
import './RecommendationsDisplay.css';

const RecommendationsDisplay = ({ recommendations, currentUserId }) => {
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    const num = parseFloat(amount);
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleCardClick = (productId) => {
    setExpandedCardId(expandedCardId === productId ? null : productId);
  };

  const handleOpenModal = (rec) => {
    setSelectedProduct({
      ...rec.product,
      productId: rec.product_id || rec.product.productId,
      bankId: rec.product.bank_id, // Добавляем bankId
      reasons: rec.reasons,
      score: rec.score,
      suitability: rec.suitability
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return (
      <div className="recommendations-section empty">
        <h3 className="recommendations-title">Специальные предложения</h3>
        <div className="no-recommendations">
          На данный момент нет доступных предложений
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="recommendations-section">
        <h3 className="recommendations-title">Специальные предложения</h3>
        
        <div className="recommendations-grid">
          {recommendations.slice(0, 4).map((rec, index) => {
            const product = rec.product || {};
            const productId = rec.product_id || product.productId || `product-${index}`;
            const isExpanded = expandedCardId === productId;

            return (
              <div 
                key={productId} 
                className={`recommendation-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => handleCardClick(productId)}
              >
                {/* Основная информация - всегда видна */}
                <div className="recommendation-main">
                  <div className="recommendation-header">
                    <h4 className="product-name">{product.productName || 'Банковский продукт'}</h4>
                    <div className="interest-rate">{product.interestRate || '—'}%</div>
                  </div>
                  <p className="product-description">{product.description || 'Описание продукта'}</p>
                  
                  <div className="mobile-indicator">
                    {isExpanded ? '▲ Свернуть' : '▼ Подробнее'}
                  </div>
                </div>

                {/* Дополнительная информация - показывается при наведении/раскрытии */}
                <div className="recommendation-details">
                  <div className="product-details">
                    <div className="detail-item">
                      <span className="detail-label">Мин. сумма:</span>
                      <span className="detail-value">
                        {product.minAmount ? formatCurrency(parseFloat(product.minAmount)) : '—'}
                      </span>
                    </div>
                    
                    {product.maxAmount && (
                      <div className="detail-item">
                        <span className="detail-label">Макс. сумма:</span>
                        <span className="detail-value">
                          {formatCurrency(parseFloat(product.maxAmount))}
                        </span>
                      </div>
                    )}

                    {product.termMonths && (
                      <div className="detail-item">
                        <span className="detail-label">Срок:</span>
                        <span className="detail-value">{product.termMonths} мес.</span>
                      </div>
                    )}
                  </div>

                  <div className="recommendation-meta">
                    <div className="score-indicator">
                      <span className="score-label">Совпадение:</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ width: `${(rec.score / 4 * 100).toFixed(0)}%` }}
                        ></div>
                      </div>
                      <span className="score-value">{((rec.score / 4) * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="match-info">
                    <div className="reasons-list">
                      {rec.reasons && rec.reasons.length > 0 ? (
                        rec.reasons.map((reason, index) => (
                          <div key={index} className="reason-item">
                            {reason}
                          </div>
                        ))
                      ) : (
                        <div className="reason-item">Рекомендуется для вас</div>
                      )}
                    </div>
                  </div>

                  <button 
                    className="action-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(rec);
                    }}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ApplicationModal 
        isOpen={modalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default RecommendationsDisplay;