import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export function useWebSocket(url: string, onMessage?: (msg: WebSocketMessage) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');

  useEffect(() => {
    ws.current = new window.WebSocket(url);
    ws.current.onopen = () => setStatus('open');
    ws.current.onclose = () => setStatus('closed');
    ws.current.onerror = () => setStatus('error');
    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (onMessage) onMessage(msg);
      } catch (e) {
        // ignore invalid messages
      }
    };
    return () => {
      ws.current?.close();
    };
  }, [url, onMessage]);

  return { status, ws: ws.current };
}
