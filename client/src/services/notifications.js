import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
const getDefaultWsUrl = () => {
  if (process.env.REACT_APP_NOTIFICATIONS_WS_URL) {
    return process.env.REACT_APP_NOTIFICATIONS_WS_URL;
  }
  if (process.env.REACT_APP_API_BASE_URL) {
    return '/ws/notifications';
  }
  return 'http://localhost:8084/ws/notifications';
};

const DEFAULT_WS_URL = getDefaultWsUrl();

export class NotificationsClient {
  constructor({ token, userId, url } = {}) {
    this.url = url || DEFAULT_WS_URL;
    this.token = token || localStorage.getItem('authToken');
    this.userId = userId;
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimer = null;

    this.onNotification = null;
    this.onOpen = null;
    this.onClose = null;
    this.onError = null;
    this.isNginxMode = !!process.env.REACT_APP_API_BASE_URL;
  }

  connect() {
    if (this.isConnected || (this.client && this.client.connected)) {
      console.log('🔔 Notifications WebSocket already connected');
      return;
    }

    if (!this.userId) {
      console.error('❌ User ID is required for notifications connection');
      return;
    }

    if (!this.token) {
      console.error('❌ Authentication token is required for notifications connection');
      return;
    }

    try {
      const wsUrl = `${this.url}?userId=${encodeURIComponent(this.userId)}`;
      console.log(`🔔 Connecting to notifications at: ${wsUrl}`);
      console.log(`🔔 Mode: ${this.isNginxMode ? 'Nginx' : 'Direct'}`);
      console.log(`🔔 User ID: ${this.userId}`);
      
      const socket = new SockJS(wsUrl);

      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${this.token}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: (frame) => {
          console.log('✅ Notifications WebSocket connected:', frame);
          console.log(`🔔 Connected with userId: ${this.userId}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;

          if (typeof this.onOpen === 'function') this.onOpen(frame);
          const userDestination = '/user/queue/notifications';
          console.log(`🔔 Subscribing to: ${userDestination}`);

          const userSubscription = this.client.subscribe(userDestination, (message) => {
            try {
              console.log('📩 Raw notification message received:', message);
              const notification = JSON.parse(message.body);
              console.log('📩 Parsed notification:', notification);
              if (typeof this.onNotification === 'function') {
                this.onNotification(notification);
              } else {
                console.warn('⚠️ onNotification callback is not set');
              }
            } catch (e) {
              console.error('❌ Error parsing notification:', e);
              console.error('❌ Message body:', message.body);
              if (typeof this.onError === 'function') this.onError(e);
            }
          });

          console.log(`✅ Subscribed to ${userDestination}, subscription ID: ${userSubscription.id}`);
          const broadcastSubscription = this.client.subscribe('/topic/notifications', (message) => {
            try {
              const notification = JSON.parse(message.body);
              console.log('📢 Broadcast notification:', notification);
              if (typeof this.onNotification === 'function') {
                this.onNotification(notification);
              }
            } catch (e) {
              console.error('❌ Error parsing broadcast notification:', e);
            }
          });

          console.log(`✅ Subscribed to /topic/notifications, subscription ID: ${broadcastSubscription.id}`);
        },

        onStompError: (frame) => {
          console.error('❌ STOMP error (notifications):', frame);
          this.isConnected = false;
          if (typeof this.onError === 'function') this.onError(frame);
          this.scheduleReconnect();
        },

        onWebSocketClose: (event) => {
          console.warn('🔔 Notifications WebSocket closed:', event);
          this.isConnected = false;
          if (typeof this.onClose === 'function') this.onClose(event);
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        },

        onWebSocketError: (event) => {
          console.error('❌ Notifications WebSocket error:', event);
          this.isConnected = false;
          if (typeof this.onError === 'function') this.onError(event);
          this.scheduleReconnect();
        },
      });

      this.client.activate();
      console.log('🔔 Notifications WebSocket client activated');

    } catch (error) {
      console.error('❌ Error connecting notifications WebSocket:', error);
      if (typeof this.onError === 'function') this.onError(error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached for notifications');
      return;
    }

    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log(`🔁 Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  disconnect() {
    try {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      if (this.client) {
        if (this.client.connected) {
          this.client.deactivate();
        }
        this.client = null;
      }
      this.isConnected = false;
      console.log('🔌 Notifications WebSocket disconnected');
    } catch (e) {
      console.error('❌ Error disconnecting notifications WS:', e);
    }
  }

  setUserId(userId) {
    if (this.userId !== userId) {
      console.log(`🔔 User ID changed from ${this.userId} to ${userId}, reconnecting...`);
      this.userId = userId;
      if (this.isConnected || (this.client && this.client.connected)) {
        this.disconnect();
        setTimeout(() => this.connect(), 1000);
      }
    }
  }

  setToken(token) {
    if (this.token !== token) {
      console.log('🔔 Token updated, reconnecting...');
      this.token = token;
      if (this.isConnected || (this.client && this.client.connected)) {
        this.disconnect();
        setTimeout(() => this.connect(), 1000);
      }
    }
  }
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      url: this.url,
      userId: this.userId,
      hasToken: !!this.token,
      reconnectAttempts: this.reconnectAttempts,
      mode: this.isNginxMode ? 'Nginx' : 'Direct'
    };
  }
  sendTestMessage(message) {
    if (!this.isConnected || !this.client) {
      console.error('❌ Cannot send test message: WebSocket not connected');
      return;
    }

    try {
      this.client.publish({
        destination: '/app/test',
        body: JSON.stringify({ message, timestamp: new Date().toISOString() })
      });
      console.log('📤 Test message sent');
    } catch (error) {
      console.error('❌ Error sending test message:', error);
    }
  }
}

export default NotificationsClient;