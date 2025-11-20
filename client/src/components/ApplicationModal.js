import React, { useState, useEffect } from 'react';
import './ApplicationModal.css';

const ApplicationModal = ({ isOpen, onClose, product }) => {
  const [formData, setFormData] = useState({
    amount: '',
    goal: '',
    customGoal: '',
    productType: product?.productType || 'deposit'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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
      setErrors({});
      setTouched({});
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

  const validateForm = () => {
    const newErrors = {};

    // Валидация суммы
    if (!formData.amount.trim()) {
      newErrors.amount = 'Поле обязательно для заполнения';
    } else {
      const amountNum = parseFloat(formData.amount);
      
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Введите корректную сумму';
      } else {
        // Проверка минимальной суммы
        if (product?.minAmount !== null && product?.minAmount !== undefined) {
          const minAmount = parseFloat(product.minAmount);
          if (amountNum < minAmount) {
            newErrors.amount = `Минимальная сумма: ${formatCurrency(minAmount)}`;
          }
        }
        
        // Проверка максимальной суммы
        if (product?.maxAmount !== null && product?.maxAmount !== undefined) {
          const maxAmount = parseFloat(product.maxAmount);
          if (amountNum > maxAmount) {
            newErrors.amount = `Максимальная сумма: ${formatCurrency(maxAmount)}`;
          }
        }
      }
    }

    // Валидация цели
    if (!formData.goal.trim()) {
      newErrors.goal = 'Поле обязательно для заполнения';
    }

    // Валидация кастомной цели
    if (formData.goal === 'Своя' && !formData.customGoal.trim()) {
      newErrors.customGoal = 'Поле обязательно для заполнения';
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    const newFormData = {
      ...formData,
      [name]: value
    };

    setFormData(newFormData);

    // Если пользователь начал вводить данные, помечаем поле как "тронутое"
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }

    // Валидация в реальном времени только для тронутых полей
    if (touched[name]) {
      const newErrors = validateForm();
      setErrors(newErrors);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Валидируем все поля после потери фокуса
    const newErrors = validateForm();
    setErrors(newErrors);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Помечаем все поля как тронутые
    const allTouched = {
      amount: true,
      goal: true,
      customGoal: true
    };
    setTouched(allTouched);

    // Валидируем всю форму
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Формируем финальные данные для отправки
    const submissionData = {
      ...formData,
      productName: product?.productName,
      productId: product?.productId,
      interestRate: product?.interestRate,
      finalGoal: formData.goal === 'Своя' ? formData.customGoal : formData.goal,
      amount: parseFloat(formData.amount),
      // Добавляем дополнительные данные из нового формата
      reasons: product?.reasons,
      score: product?.score,
      suitability: product?.suitability
    };

    console.log('Данные заявки:', submissionData);
    
    // Здесь будет отправка на бэкенд
    // Пример: apiService.submitApplication(submissionData);
    alert('Заявка успешно отправлена! С вами свяжутся в ближайшее время.');
    onClose();
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

  const isFormValid = () => {
    const validationErrors = validateForm();
    return Object.keys(validationErrors).length === 0;
  };

  if (!isOpen) return null;

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
              onBlur={handleBlur}
              placeholder="Введите сумму"
              min="0"
              step="1000"
            />
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
              onBlur={handleBlur}
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
                onBlur={handleBlur}
                placeholder="Опишите вашу цель"
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Отмена
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={!isFormValid()}
            >
              Оставить заявку
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;