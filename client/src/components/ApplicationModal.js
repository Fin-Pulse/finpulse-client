import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './ApplicationModal.css';

const ApplicationModal = ({ isOpen, onClose, product, currentUserId }) => {
  const [formData, setFormData] = useState({
    amount: '',
    goal: '',
    customGoal: '',
    productType: product?.productType || 'deposit'
  });

  const [submitting, setSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', 'conflict', or null

  const goals = ['Накопления', 'Покупка недвижимости', 'Образование', 'Пенсия', 'Путешествия', 'Крупная покупка', 'Своя'];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Сброс формы при открытии
      setFormData({
        amount: '',
        goal: '',
        customGoal: '',
        productType: product?.productType || 'deposit'
      });
      setSubmissionStatus(null);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, product]);

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

  const isFormValid = () => {
    // Проверка обязательных полей
    if (!formData.amount.trim() || !formData.goal.trim()) {
      return false;
    }
    
    // Если выбрана своя цель, проверяем что она заполнена
    if (formData.goal === 'Своя' && !formData.customGoal.trim()) {
      return false;
    }
    
    // Проверка что сумма - число и больше 0
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return false;
    }
    
    // Проверка минимальной суммы
    if (product?.minAmount !== null && product?.minAmount !== undefined) {
      const minAmount = parseFloat(product.minAmount);
      if (amountNum < minAmount) {
        return false;
      }
    }
    
    // Проверка максимальной суммы
    if (product?.maxAmount !== null && product?.maxAmount !== undefined) {
      const maxAmount = parseFloat(product.maxAmount);
      if (amountNum > maxAmount) {
        return false;
      }
    }
    
    return true;
  };

  const getAmountError = () => {
    if (!formData.amount.trim()) {
      return null;
    }
    
    const amountNum = parseFloat(formData.amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      return 'Введите корректную сумму';
    }
    
    // Проверка минимальной суммы
    if (product?.minAmount !== null && product?.minAmount !== undefined) {
      const minAmount = parseFloat(product.minAmount);
      if (amountNum < minAmount) {
        return `Минимальная сумма: ${formatCurrency(minAmount)}`;
      }
    }
    
    // Проверка максимальной суммы
    if (product?.maxAmount !== null && product?.maxAmount !== undefined) {
      const maxAmount = parseFloat(product.maxAmount);
      if (amountNum > maxAmount) {
        return `Максимальная сумма: ${formatCurrency(maxAmount)}`;
      }
    }
    
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUserId) {
      return;
    }
    
    if (!isFormValid()) {
      return;
    }

    setSubmitting(true);

    try {
      // Формируем финальные данные для отправки
      const submissionData = {
        amount: parseFloat(formData.amount),
        goal: formData.goal === 'Своя' ? formData.customGoal : formData.goal,
        productType: formData.productType,
        productName: product?.productName,
        interestRate: product?.interestRate,
        reasons: product?.reasons,
        score: product?.score,
        suitability: product?.suitability,
        timestamp: new Date().toISOString()
      };
      
      // Подготавливаем данные для отправки на сервер с bankId
      const leadData = {
        userId: currentUserId,
        productId: product?.productId || 'string',
        bankId: product?.bankId || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        payload: submissionData
      };

      // Отправляем заявку на сервер
      await apiService.submitLead(leadData);
      
      // УСПЕШНАЯ ОТПРАВКА - показываем окно успеха
      setSubmissionStatus('success');
      
    } catch (error) {
      // ОШИБКА ОТПРАВКИ - проверяем тип ошибки
      console.error('Ошибка при отправке заявки:', error);
      
      if (error.status === 409) {
        // КОНФЛИКТ - заявка уже существует
        setSubmissionStatus('conflict');
      } else {
        // ДРУГАЯ ОШИБКА
        setSubmissionStatus('error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getAmountRangeText = () => {
    const parts = [];
    
    if (product?.minAmount !== null && product?.minAmount !== undefined) {
      parts.push(`от ${formatCurrency(product.minAmount)}`);
    }
    
    if (product?.maxAmount !== null && product?.maxAmount !== undefined) {
      parts.push(`до ${formatCurrency(product.maxAmount)}`);
    }
    
    return parts.length > 0 ? `Доступная сумма: ${parts.join(' ')}` : null;
  };

  const handleCloseMessage = () => {
    setSubmissionStatus(null);
    onClose();
  };

  if (!isOpen) return null;

  // Окно успешной отправки
  if (submissionStatus === 'success') {
    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Заявка отправлена</h2>
            <button className="close-button" onClick={handleCloseMessage}>×</button>
          </div>
          
          <div className="message-content">
            <div className="success-icon">✓</div>
            <h3>Спасибо за вашу заявку!</h3>
            <p>Мы свяжемся с вами в ближайшее время для уточнения деталей</p>
            <button 
              className="submit-button" 
              onClick={handleCloseMessage}
              style={{marginTop: '20px'}}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Окно конфликта - заявка уже существует
  if (submissionStatus === 'conflict') {
    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Заявка уже существует</h2>
            <button className="close-button" onClick={handleCloseMessage}>×</button>
          </div>
          
          <div className="message-content">
            <div className="warning-icon">⚠</div>
            <h3>Вы уже подавали заявку на этот продукт</h3>
            <p>Мы уже обрабатываем вашу предыдущую заявку. Пожалуйста, дождитесь ответа от банка.</p>
            <button 
              className="submit-button" 
              onClick={handleCloseMessage}
              style={{marginTop: '20px'}}
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Окно ошибки
  if (submissionStatus === 'error') {
    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Ошибка отправки</h2>
            <button className="close-button" onClick={handleCloseMessage}>×</button>
          </div>
          
          <div className="message-content">
            <div className="error-icon">⚠</div>
            <h3>Не удалось отправить заявку</h3>
            <p>Пожалуйста, попробуйте позже или обратитесь в поддержку</p>
            <div className="form-actions" style={{marginTop: '20px'}}>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={() => setSubmissionStatus(null)}
              >
                Назад к форме
              </button>
              <button 
                className="submit-button" 
                onClick={handleCloseMessage}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Оригинальная форма заявки
  const amountError = getAmountError();
  const isFormCurrentlyValid = isFormValid();

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Оставить заявку</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="product-info">
          <h3>{product?.productName || 'Банковский продукт'}</h3>
          <p className="interest-rate-badge">{product?.interestRate || '—'}%</p>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-group">
            <label htmlFor="amount">Сумма *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Введите сумму"
              min="0"
              step="any"
            />
            {amountError && (
              <div className="amount-error">{amountError}</div>
            )}
            {getAmountRangeText() && (
              <div className="amount-range-hint">{getAmountRangeText()}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="goal">Цель *</label>
            <select
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleInputChange}
            >
              <option value="">Выберите цель</option>
              {goals.map(goal => (
                <option key={goal} value={goal}>{goal}</option>
              ))}
            </select>
          </div>

          {formData.goal === 'Своя' && (
            <div className="form-group">
              <label htmlFor="customGoal">Ваша цель *</label>
              <input
                type="text"
                id="customGoal"
                name="customGoal"
                value={formData.customGoal}
                onChange={handleInputChange}
                placeholder="Опишите вашу цель"
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={submitting}>
              Отмена
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={!isFormCurrentlyValid || submitting}
            >
              {submitting ? 'Отправка...' : 'Оставить заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;