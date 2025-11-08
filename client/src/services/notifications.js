const DEFAULT_WS_URL = 'ws://localhost:8084/ws/notifications';

export class NotificationsClient {
  constructor({ token, url } = {}) {
    this.url = url || process.env.REACT_APP_NOTIFICATIONS_WS_URL || DEFAULT_WS_URL;
    this.token = token || localStorage.getItem('authToken');
    this.socket = null;
    this.onMessage = null;
    this.onOpen = null;
    this.onClose = null;
    this.onError = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimer = null;
  }

  connect() {
    const wsUrl = this.token ? `${this.url}?token=${encodeURIComponent(this.token)}` : this.url;
    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = (event) => {
        this.reconnectAttempts = 0;
        if (typeof this.onOpen === 'function') this.onOpen(event);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof this.onMessage === 'function') this.onMessage(data);
        } catch (e) {
          if (typeof this.onError === 'function') this.onError(e);
        }
      };

      this.socket.onerror = (event) => {
        if (typeof this.onError === 'function') this.onError(event);
      };

      this.socket.onclose = (event) => {
        if (typeof this.onClose === 'function') this.onClose(event);
        this.scheduleReconnect();
      };
    } catch (e) {
      if (typeof this.onError === 'function') this.onError(e);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delayMs = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), delayMs);
  }

  disconnect() {
    try {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, 'Client disconnect');
      }
    } catch (_) {}
    this.socket = null;
  }
}
