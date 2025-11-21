const API_CONFIG = {
    USER_SERVICE: 'http://178.72.136.220:8080', 
    AGGREGATION_SERVICE: 'http://178.72.136.220:8080',
    NOTIFICATION_SERVICE: 'http://178.72.136.220:8080',
    LEAD_SERVICE: 'http://178.72.136.220:8080'
};

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Функция для извлечения сообщения об ошибке из ответа сервера
  extractErrorMessage(error) {
    try {
      // Если ошибка уже в формате строки
      if (typeof error === 'string') {
        return error;
      }
      
      // Если ошибка в формате { "error": "message" }
      if (error.error) {
        return error.error;
      }
      
      // Если ошибка в формате { "message": "text" }
      if (error.message) {
        return error.message;
      }
      
      // Если это объект с другими полями
      if (typeof error === 'object') {
        const firstKey = Object.keys(error)[0];
        if (firstKey) {
          return error[firstKey];
        }
      }
      
      return 'Произошла неизвестная ошибка';
    } catch (e) {
      return 'Произошла ошибка при обработке ответа сервера';
    }
  }

  async request(service, endpoint, options = {}) {
    let baseUrl;
    
    switch(service) {
      case 'user':
        baseUrl = API_CONFIG.USER_SERVICE;
        break;
      case 'aggregation':
        baseUrl = API_CONFIG.AGGREGATION_SERVICE;
        break;
      case 'notification':
        baseUrl = API_CONFIG.NOTIFICATION_SERVICE;
        break;
      case 'lead':
        baseUrl = API_CONFIG.LEAD_SERVICE;
        break;
      default:
        baseUrl = API_CONFIG.USER_SERVICE;
    }
    
    const url = `${baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Очистка данных для всех сервисов кроме lead
    if (config.body && typeof config.body === 'object' && service !== 'lead') {
      const cleanedBody = {};
      Object.keys(config.body).forEach(key => {
        if (config.body[key] !== undefined && config.body[key] !== null) {
          cleanedBody[key] = String(config.body[key]).trim();
        }
      });
      config.body = JSON.stringify(cleanedBody);
    } else if (config.body && typeof config.body === 'object') {
      // Для lead сервиса просто преобразуем в JSON без очистки
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        const errorText = await response.text();
        console.error('❌ Authentication failed, clearing token');
        this.clearToken();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        // СОЗДАЕМ ОШИБКУ С СТАТУСОМ
        const error = new Error(this.extractErrorMessage(errorData));
        error.status = 401;
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        // СОЗДАЕМ ОШИБКУ С СТАТУСОМ
        const error = new Error(this.extractErrorMessage(errorData));
        error.status = response.status;
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      
      // Если это уже наша обработанная ошибка (с статусом), просто пробрасываем её
      if (error.status) {
        throw error;
      }
      
      // Если это уже наша обработанная ошибка (без статуса), но с сообщением
      if (error.message && error.message !== 'Failed to fetch') {
        throw error;
      }
      
      // Для сетевых ошибок и других случаев
      const networkError = new Error('Ошибка соединения с сервером. Проверьте интернет-соединение и попробуйте снова.');
      networkError.status = 0; // Сетевые ошибки не имеют HTTP статуса
      throw networkError;
    }
  }

  async register(userData) {
    const cleanedData = {
      email: String(userData.email || '').trim(),
      password: String(userData.password || '').trim(),
      bank_client_id: String(userData.bank_client_id || '').trim(),
      clientId: String(userData.bank_client_id || '').trim(), 
      bankClientId: String(userData.bank_client_id || '').trim(), 
      phone: String(userData.phone || '').trim(),
      fullName: String(userData.fullName || 'User').trim()
    };

    if (!cleanedData.email || !cleanedData.password || !cleanedData.bank_client_id || !cleanedData.phone) {
      throw new Error('Все поля обязательны для заполнения');
    }

    const data = await this.request('user', '/api/bank/auth/register', {
      method: 'POST',
      body: cleanedData
    });
    
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    
    return data;
  }

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

  // ДОБАВЛЕН МЕТОД ДЛЯ ДЕМО-ВХОДА
  async demoLogin() {
    const data = await this.request('user', '/api/bank/auth/demo-login', {
      method: 'POST'
    });
    
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    
    return data;
  }

  async getProfile() {
    return this.request('user', '/api/bank/users/me');
  }

  async getTransactions() {
    return this.request('aggregation', '/api/verification/transactions');
  }

  async getUserNotifications(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.request('notification', `/api/notifications/user/${userId}`);
  }

  async getUnreadNotifications(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.request('notification', `/api/notifications/user/${userId}/unread`);
  }

  async getUnreadCount(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.request('notification', `/api/notifications/user/${userId}/unread-count`);
  }

  async markNotificationAsRead(notificationId) {
    if (!this.token) {
      console.error('❌ No auth token available for markNotificationAsRead');
      throw new Error('Authentication required');
    }

    try {
      const result = await this.request('notification', `/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to mark notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  // Метод для отправки заявок
  async submitLead(leadData) {
    if (!leadData.userId) {
      throw new Error('User ID is required for lead submission');
    }

    if (!leadData.productId) {
      throw new Error('Product ID is required for lead submission');
    }

    return this.request('lead', '/leads/new', {
      method: 'POST',
      body: leadData
    });
  }
}

export const apiService = new ApiService();