import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin, onSwitchToRegister, onDemoLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [demoLoading, setDemoLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await onDemoLogin();
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Вход в FinPulse</h2>
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
            />
          </div>

          <button type="submit" className="auth-button">
            Войти
          </button>
        </form>

        {/* КНОПКА ДЕМО-ВХОДА - ДОЛЖНА БЫТЬ ЗДЕСЬ */}
        <div className="demo-login-section">
          <div className="demo-divider">
            <span>или</span>
          </div>
          <button 
            type="button" 
            className="demo-button"
            onClick={handleDemoLogin}
            disabled={demoLoading}
          >
            {demoLoading ? 'Вход...' : 'Демо-вход'}
          </button>
          <p className="demo-hint">
            Попробуйте сервис без регистрации с тестовым аккаунтом
          </p>
        </div>

        <div className="auth-switch">
          <p>Нет аккаунта? 
            <button onClick={onSwitchToRegister} className="switch-button">
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;