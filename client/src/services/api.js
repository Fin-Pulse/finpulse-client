const API_CONFIG = {
  USER_SERVICE: 'http://localhost:8081',
  AGGREGATION_SERVICE: 'http://localhost:8082'
};

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  async request(service, endpoint, options = {}) {
    const baseUrl = service === 'user' ? API_CONFIG.USER_SERVICE : API_CONFIG.AGGREGATION_SERVICE;
    const url = `${baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Более надежная обработка body
    if (config.body && typeof config.body === 'object') {
      // Очищаем данные перед отправкой
      const cleanedBody = {};
      Object.keys(config.body).forEach(key => {
        if (config.body[key] !== undefined && config.body[key] !== null) {
          cleanedBody[key] = String(config.body[key]).trim(); // Приводим к строке и убираем пробелы
        }
      });
      config.body = JSON.stringify(cleanedBody);
    }

    console.log(`🚀 Making request to: ${url}`);
    console.log('📦 Request config:', {
      method: config.method,
      headers: config.headers,
      body: config.body
    });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Response from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Регистрация - через user service (8081)
  async register(userData) {
    // Валидация и очистка данных
    const cleanedData = {
    email: String(userData.email || '').trim(),
    password: String(userData.password || '').trim(),
    bank_client_id: String(userData.bank_client_id || '').trim(),
    clientId: String(userData.bank_client_id || '').trim(), // дублируем поле
    bankClientId: String(userData.bank_client_id || '').trim(), // и еще вариант
    phone: String(userData.phone || '').trim(),
    fullName: String(userData.fullName || 'User').trim()
  };

    console.log('🔍 Cleaned registration data:', cleanedData);

    // Проверка обязательных полей
    if (!cleanedData.email || !cleanedData.password || !cleanedData.bank_client_id || !cleanedData.phone) {
      throw new Error('All fields are required');
    }

    return this.request('user', '/api/bank/auth/register', {
      method: 'POST',
      body: cleanedData
    });
  }

  // Вход - через user service (8081)
  async login(credentials) {
    const data = await this.request('user', '/api/bank/auth/login', {
      method: 'POST',
      body: {
        email: credentials.email,
        password: credentials.password
      },
    });
    
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    
    return data;
  }

  // Получить профиль - через user service (8081)
  async getProfile() {
    return this.request('user', '/api/bank/users/me');
  }

  // Получить транзакции - через aggregation service (8082)
  async getTransactions() {
    return this.request('aggregation', '/api/bank/transactions');
  }
}

export const apiService = new ApiService();