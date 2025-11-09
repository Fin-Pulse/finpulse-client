const API_CONFIG = {
  USER_SERVICE: 'http://localhost:8081',
  AGGREGATION_SERVICE: 'http://localhost:8082',
  NOTIFICATION_SERVICE: 'http://localhost:8084'  
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

    if (config.body && typeof config.body === 'object') {
      const cleanedBody = {};
      Object.keys(config.body).forEach(key => {
        if (config.body[key] !== undefined && config.body[key] !== null) {
          cleanedBody[key] = String(config.body[key]).trim();
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

      if ((config.method === 'PUT' || config.method === 'PATCH') && response.status === 200) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`✅ Response from ${endpoint}:`, data);
          return data;
        } else {
          console.log(`✅ PUT/PATCH request successful for ${endpoint}`);
          return { success: true };
        }
      }

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
    console.log(`🔔 Starting markNotificationAsRead for notification: ${notificationId}`);
    console.log(`🔔 Token present: ${!!this.token}`);
    
    if (!this.token) {
      console.error('❌ No auth token available for markNotificationAsRead');
      throw new Error('Authentication required');
    }

    console.log(`🔔 Making PUT request to notification service: /api/notifications/${notificationId}/read`);
    
    try {
      const result = await this.request('notification', `/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      console.log(`✅ Successfully marked notification ${notificationId} as read:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to mark notification ${notificationId} as read:`, error);

      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.error('🔍 CORS or network error detected. Check:');
        console.error('🔍 - Is the notification service running on port 8084?');
        console.error('🔍 - Is CORS configured on the backend?');
        console.error('🔍 - Is the endpoint correct?');
      }
      
      throw error;
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

    console.log('🔍 Cleaned registration data:', cleanedData);

    if (!cleanedData.email || !cleanedData.password || !cleanedData.bank_client_id || !cleanedData.phone) {
      throw new Error('All fields are required');
    }

    const data = await this.request('user', '/api/bank/auth/register', {
      method: 'POST',
      body: cleanedData
    });
    
    if (data.accessToken) {
      this.setToken(data.accessToken);
      console.log('🔑 Token set successfully after registration');
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
      console.log('🔑 Token set successfully after login');
    }
    
    return data;
  }

  async getProfile() {
    return this.request('user', '/api/bank/users/me');
  }

  async getTransactions() {
    return this.request('aggregation', '/api/bank/transactions');
  }
}

export const apiService = new ApiService();