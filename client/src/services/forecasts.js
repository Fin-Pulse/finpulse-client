import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const getDefaultWsUrl = () => {
  if (process.env.REACT_APP_FORECASTS_WS_URL) {
    return process.env.REACT_APP_FORECASTS_WS_URL;
  }
  if (process.env.REACT_APP_API_BASE_URL) {
    return '/ws/forecasts';
  }
  
  return 'http://localhost:8084/ws/forecasts';
};

const DEFAULT_WS_URL = getDefaultWsUrl();

export class ForecastsClient {
  constructor({ userId, url } = {}) {
    this.url = url || DEFAULT_WS_URL;
    this.userId = userId;
    this.client = null;
    this.onForecast = null;
    this.onOpen = null;
    this.onClose = null;
    this.onError = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.isNginxMode = !!process.env.REACT_APP_API_BASE_URL;
  }

  connect() {
    if (this.isConnected || (this.client && this.client.connected)) {
      console.log('📊 Forecast WebSocket already connected');
      return;
    }

    if (!this.userId) {
      console.error('❌ User ID is required for forecast connection');
      return;
    }

    try {
      let wsUrl;
      if (this.isNginxMode) {
        wsUrl = `${this.url}?userId=${encodeURIComponent(this.userId)}`;
      } else {
        wsUrl = `${this.url}?userId=${encodeURIComponent(this.userId)}`;
      }
      
      console.log(`📊 Connecting to: ${wsUrl}`);
      console.log(`📊 Mode: ${this.isNginxMode ? 'Nginx' : 'Direct'}`);
      
      const socket = new SockJS(wsUrl);

      this.client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onConnect: (frame) => {
          console.log('✅ Forecast WebSocket connected:', frame);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          if (typeof this.onOpen === 'function') {
            this.onOpen(frame);
          }

          const destination = '/user/queue/forecasts';
          console.log(`📊 Subscribing to: ${destination}`);

          this.client.subscribe(destination, (message) => {
            try {
              const forecast = JSON.parse(message.body);
              console.log('📊 Received forecast:', forecast);
              if (typeof this.onForecast === 'function') {
                this.onForecast(forecast);
              }
            } catch (e) {
              console.error('❌ Error parsing forecast message:', e);
              if (typeof this.onError === 'function') {
                this.onError(e);
              }
            }
          });

          this.client.publish({
            destination: '/app/forecasts.subscribe'
          });
          
          console.log('📊 Forecast subscription request sent');
        },
        
        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame);
          this.isConnected = false;
          if (typeof this.onError === 'function') {
            this.onError(new Error(frame.headers['message'] || 'STOMP error'));
          }
          this.scheduleReconnect();
        },
        
        onWebSocketClose: (event) => {
          console.log('📊 Forecast WebSocket closed:', event);
          this.isConnected = false;
          if (typeof this.onClose === 'function') {
            this.onClose(event);
          }
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        },
        
        onWebSocketError: (event) => {
          console.error('❌ Forecast WebSocket error:', event);
          this.isConnected = false;
          if (typeof this.onError === 'function') {
            this.onError(event);
          }
          this.scheduleReconnect();
        }
      });

      this.client.activate();
      console.log('📊 Forecast WebSocket client activated');

    } catch (e) {
      console.error('❌ Error creating forecast WebSocket connection:', e);
      if (typeof this.onError === 'function') {
        this.onError(e);
      }
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached for forecast WebSocket');
      return;
    }

    const delayMs = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;
    
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log(`📊 Attempting to reconnect forecast WebSocket (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delayMs);
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
      console.log('📊 Forecast WebSocket disconnected');
    } catch (e) {
      console.error('❌ Error disconnecting forecast WebSocket:', e);
    }
  }

  setUserId(userId) {
    if (this.userId !== userId) {
      this.userId = userId;
      if (this.isConnected || (this.client && this.client.connected)) {
        console.log('📊 User ID changed, reconnecting WebSocket...');
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
      reconnectAttempts: this.reconnectAttempts,
      mode: this.isNginxMode ? 'Nginx' : 'Direct'
    };
  }
}

export default ForecastsClient;