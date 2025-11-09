import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const DEFAULT_WS_URL = 'http://localhost:8084/ws/notifications';

export class NotificationsClient {
  constructor({ token, userId, url } = {}) {
    this.url = url || process.env.REACT_APP_NOTIFICATIONS_WS_URL || DEFAULT_WS_URL;
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
      console.log('🔔 Notifications WebSocket already connected');
      return;
    }

    if (!this.userId) {
      console.error('❌ User ID is required for notifications connection');
      return;
    }

    try {
      const wsUrl = `${this.url}?userId=${encodeURIComponent(this.userId)}`;
      console.log(`🔔 Connecting to notifications at: ${wsUrl}`);
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
          const destination = '/user/queue/notifications';
          console.log(`🔔 Subscribing to: ${destination} (will be routed to /user/${this.userId}/queue/notifications)`);

          const subscription = this.client.subscribe(destination, (message) => {
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

          console.log(`✅ Subscribed to ${destination}, subscription ID: ${subscription.id}`);

          this.client.subscribe('/topic/notifications', (message) => {
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
          this.scheduleReconnect();
        },

        onWebSocketError: (event) => {
          console.error('❌ Notifications WebSocket error:', event);
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
      this.userId = userId;
      if (this.isConnected || (this.client && this.client.connected)) {
        this.disconnect();
        setTimeout(() => this.connect(), 1000);
      }
    }
  }
}
