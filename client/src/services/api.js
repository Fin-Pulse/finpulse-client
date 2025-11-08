const API_CONFIG = {
  USER_SERVICE: 'http://localhost:8081',
  AGGREGATION_SERVICE: 'http://localhost:8082',
  NOTIFICATION_SERVICE: 'http://localhost:8084'  // Добавил notification service
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
    let baseUrl;
    
    // Определяем baseUrl в зависимости от сервиса
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
        console.error(`❌ HTTP Error ${response.status} for ${endpoint}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Для PUT/PATCH запросов без тела возвращаем успех
      if ((config.method === 'PUT' || config.method === 'PATCH') && response.status === 200) {
        // Проверяем, есть ли тело ответа
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`✅ Response from ${endpoint}:`, data);
          return data;
        } else {
          // Пустой ответ - возвращаем успех
          console.log(`✅ PUT/PATCH request successful for ${endpoint}`);
          return { success: true };
        }
      }
      
      // Проверяем Content-Type перед парсингом JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ Response from ${endpoint}:`, data);
        return data;
      } else {
        const text = await response.text();
        console.log(`✅ Response from ${endpoint} (text):`, text);
        return text;
      }
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Получить все уведомления пользователя - через notification service (8084)
  async getUserNotifications(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.request('notification', `/api/notifications/user/${userId}`);
  }

  // Получить непрочитанные уведомления - через notification service (8084)
  async getUnreadNotifications(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.request('notification', `/api/notifications/user/${userId}/unread`);
  }

  // Получить количество непрочитанных уведомлений - через notification service (8084)
  async getUnreadCount(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.request('notification', `/api/notifications/user/${userId}/unread-count`);
  }

  // Метод для отметки уведомления как прочитанного
  async markNotificationAsRead(notificationId) {
    console.log(`🔔 Starting markNotificationAsRead for notification: ${notificationId}`);
    console.log(`🔔 Token present: ${!!this.token}`);
    
    if (!this.token) {
      console.error('❌ No auth token available for markNotificationAsRead');
      throw new Error('Authentication required');
    }

    console.log(`🔔 Making PUT request to notification service: /api/notifications/${notificationId}/read`);
    
    try {
      // Используем PUT согласно Swagger API
      const result = await this.request('notification', `/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      console.log(`✅ Successfully marked notification ${notificationId} as read:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to mark notification ${notificationId} as read:`, error);
      
      // Дополнительная диагностика для CORS ошибок
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.error('🔍 CORS or network error detected. Check:');
        console.error('🔍 - Is the notification service running on port 8084?');
        console.error('🔍 - Is CORS configured on the backend?');
        console.error('🔍 - Is the endpoint correct?');
      }
      
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

    const data = await this.request('user', '/api/bank/auth/register', {
      method: 'POST',
      body: cleanedData
    });
    
    // Если регистрация вернула токен, сохраняем его
    if (data.accessToken) {
      this.setToken(data.accessToken);
      console.log('🔑 Token set successfully after registration');
    }
    
    return data;
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
      console.log('🔑 Token set successfully after login');
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