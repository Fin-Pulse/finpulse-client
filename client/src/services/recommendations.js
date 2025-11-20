import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const getDefaultWsUrl = (path) => {
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${window.location.host}${path}`;
};

const DEFAULT_WS_URL = getDefaultWsUrl('/ws/recommendations');

export class RecommendationsClient {
  constructor({ userId, url } = {}) {
    this.url = url || DEFAULT_WS_URL;
    this.userId = userId;
    this.client = null;

    this.onRecommendation = null;
    this.onOpen = null;
    this.onClose = null;
    this.onError = null;

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimer = null;
    this.isConnected = false;
  }

  connect() {
    if (this.isConnected || (this.client && this.client.connected)) return;
    if (!this.userId) {
      console.error('❌ User ID is required for recommendations WS');
      return;
    }

    try {
      const wsUrl = `${this.url}?userId=${encodeURIComponent(this.userId)}`;
      const socket = new SockJS(wsUrl);

      this.client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: (frame) => {
          this.isConnected = true;
          this.reconnectAttempts = 0;

          if (typeof this.onOpen === 'function') this.onOpen(frame);

          const destination = '/user/queue/recommendations';

          this.client.subscribe(destination, (message) => {
            try {
              const rec = JSON.parse(message.body);
              if (typeof this.onRecommendation === 'function') {
                this.onRecommendation(rec);
              }
            } catch (e) {
              console.error('❌ Error parsing recommendation message:', e);
              if (typeof this.onError === 'function') this.onError(e);
            }
          });

          this.client.publish({
            destination: '/app/recommendations.subscribe'
          });
        },

        onStompError: (frame) => {
          this.isConnected = false;
          if (typeof this.onError === 'function')
            this.onError(new Error(frame.headers['message'] || 'STOMP error'));
          this.scheduleReconnect();
        },

        onWebSocketClose: (event) => {
          this.isConnected = false;
          if (typeof this.onClose === 'function') this.onClose(event);
          if (event.code !== 1000) this.scheduleReconnect();
        },

        onWebSocketError: (event) => {
          this.isConnected = false;
          if (typeof this.onError === 'function') this.onError(event);
          this.scheduleReconnect();
        }
      });

      this.client.activate();
    } catch (e) {
      console.error('❌ WS error:', e);
      if (typeof this.onError === 'function') this.onError(e);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delayMs = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts++;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), delayMs);
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.client?.connected) this.client.deactivate();
    this.client = null;
    this.isConnected = false;
  }

  setUserId(userId) {
    if (this.userId !== userId) {
      this.userId = userId;
      if (this.isConnected) {
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
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export default RecommendationsClient;
