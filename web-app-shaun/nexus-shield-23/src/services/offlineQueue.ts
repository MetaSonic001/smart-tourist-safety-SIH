// OfflineQueue: manages pending actions when offline, retries when online
// Usage: offlineQueue.enqueue(action)

export type OfflineAction = {
  type: string;
  payload: any;
  retryCount?: number;
  maxRetries?: number;
};

class OfflineQueue {
  private queue: OfflineAction[] = [];
  private processing = false;
  private storageKey = 'offlineQueue';

  constructor() {
    this.load();
    window.addEventListener('online', () => this.processQueue());
  }

  enqueue(action: OfflineAction) {
    action.retryCount = action.retryCount || 0;
    action.maxRetries = action.maxRetries || 3;
    this.queue.push(action);
    this.save();
    this.processQueue();
  }

  async processQueue() {
    if (!navigator.onLine || this.processing) return;
    this.processing = true;
    for (const action of [...this.queue]) {
      try {
        await this.execute(action);
        this.queue = this.queue.filter(a => a !== action);
        this.save();
      } catch (err) {
        action.retryCount!++;
        if (action.retryCount! > action.maxRetries!) {
          this.queue = this.queue.filter(a => a !== action);
          this.save();
        }
      }
    }
    this.processing = false;
  }

  async execute(action: OfflineAction) {
    // Implement per-action type
    switch (action.type) {
      case 'POST_INCIDENT':
        // Example: send incident to API
        await fetch('/api/incidents', {
          method: 'POST',
          body: JSON.stringify(action.payload),
          headers: { 'Content-Type': 'application/json' },
        });
        break;
      // Add more action types as needed
      default:
        throw new Error('Unknown action type');
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }

  load() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        this.queue = JSON.parse(raw);
      } catch {
        this.queue = [];
      }
    }
  }
}

export const offlineQueue = new OfflineQueue();
