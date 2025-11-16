const API_CONFIG = {
  USER_SERVICE: 'http://localhost', 
  AGGREGATION_SERVICE: 'http://localhost',
  NOTIFICATION_SERVICE: 'http://localhost'
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

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        const errorText = await response.text();
        console.error('❌ Authentication failed, clearing token');
        this.clearToken();
        throw new Error(`HTTP 401: ${errorText}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
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


    if (!cleanedData.email || !cleanedData.password || !cleanedData.bank_client_id || !cleanedData.phone) {
      throw new Error('All fields are required');
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
}

export const apiService = new ApiService();