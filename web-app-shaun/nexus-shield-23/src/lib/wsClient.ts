// WebSocket client for live dashboard events
// Falls back to mock events if connection fails

export type DashboardEvent = {
  type: string;
  data: any;
};

export class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private listeners: ((event: DashboardEvent) => void)[] = [];
  private statusListener: ((status: string) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.statusListener?.('connected');
    };
    this.ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        this.listeners.forEach(fn => fn(event));
      } catch {}
    };
    this.ws.onclose = () => {
      this.statusListener?.('disconnected');
      this.reconnect();
    };
    this.ws.onerror = () => {
      this.statusListener?.('error');
      this.ws?.close();
    };
  }

  reconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => this.connect(), delay);
  }

  onEvent(fn: (event: DashboardEvent) => void) {
    this.listeners.push(fn);
  }

  onStatus(fn: (status: string) => void) {
    this.statusListener = fn;
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
