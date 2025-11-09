import React, { useState } from 'react';
import './Register.css';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    bank_client_id: '',
    phone: '',
    fullName: ''
  });

 
  const formatPhoneNumber = (value) => {
    
    const numbers = value.replace(/\D/g, '');
    
    
    let formattedValue = numbers.substring(0, 11);
    
    if (formattedValue.length > 0) {
      formattedValue = '+7';
      
      if (numbers.length > 1) {
        formattedValue += '(' + numbers.substring(1, 4);
      }
      if (numbers.length > 4) {
        formattedValue += ')' + numbers.substring(4, 7); 
      }
      if (numbers.length > 7) {
        formattedValue += numbers.substring(7, 9); 
      }
      if (numbers.length > 9) {
        formattedValue += numbers.substring(9, 11); 
      }
    }
    
    return formattedValue;
  };

 
  const isValidPhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 11 && cleanPhone.startsWith('7');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      
      const formattedPhone = formatPhoneNumber(value);
      setFormData({
        ...formData,
        [name]: formattedPhone
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
   
    const cleanPhone = formData.phone.replace(/\D/g, '');
    const dataToSend = {
      ...formData,
      phone: cleanPhone
    };
    
    onRegister(dataToSend);
  };

  const isPhoneValid = isValidPhone(formData.phone);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Регистрация в FinPulse</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="example@mail.ru"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Не менее 6 символов"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bank_client_id" className="form-label">Bank Client ID</label>
            <input
              type="text"
              id="bank_client_id"
              name="bank_client_id"
              value={formData.bank_client_id}
              onChange={handleChange}
              className="form-input"
              placeholder="CL123456789"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Телефон</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-input phone-input ${formData.phone ? (!isPhoneValid ? 'phone-invalid' : '') : ''}`}
              placeholder="+7(900)1234567"
              required
              maxLength="15" 
            />
            {formData.phone && !isPhoneValid && (
              <div className="phone-hint">Введите корректный номер телефона (11 цифр)</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Полное имя</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="form-input"
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={formData.phone && !isPhoneValid}
          >
            Зарегистрироваться
          </button>
        </form>

        <div className="auth-switch">
          <p>Уже есть аккаунт? 
            <button onClick={onSwitchToLogin} className="switch-button">
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;