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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(formData);
  };

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
              required
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
              className="form-input"
              required
            />
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
              required
            />
          </div>

          <button type="submit" className="auth-button">
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