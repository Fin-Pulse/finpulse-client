import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
const getDefaultWsUrl = (path) => {
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${window.location.host}${path}`;
};




const DEFAULT_WS_URL = getDefaultWsUrl('/ws/notifications');

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
  }

  connect() {
    if (this.isConnected || (this.client && this.client.connected)) {
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

          this.isConnected = true;
          this.reconnectAttempts = 0;

          if (typeof this.onOpen === 'function') this.onOpen(frame);
          const userDestination = '/user/queue/notifications';

          const userSubscription = this.client.subscribe(userDestination, (message) => {
            try {
              const notification = JSON.parse(message.body);
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

          const broadcastSubscription = this.client.subscribe('/topic/notifications', (message) => {
            try {
              const notification = JSON.parse(message.body);
              if (typeof this.onNotification === 'function') {
                this.onNotification(notification);
              }
            } catch (e) {
              console.error('❌ Error parsing broadcast notification:', e);
            }
          });

        },

        onStompError: (frame) => {
          console.error('❌ STOMP error (notifications):', frame);
          this.isConnected = false;
          if (typeof this.onError === 'function') this.onError(frame);
          this.scheduleReconnect();
        },

        onWebSocketClose: (event) => {
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
    } catch (e) {
      console.error('❌ Error disconnecting notifications WS:', e);
    }
  }

  setUserId(userId) {
    if (this.userId !== userId) {
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
    } catch (error) {
      console.error('❌ Error sending test message:', error);
    }
  }
}

export default NotificationsClient;