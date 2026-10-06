import { useEffect, useState, useCallback, useRef } from 'react';

export function useWebSocket(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 5;

  const connect = useCallback(() => {
    if (!userId) return;
    
    const wsUrl = `ws://${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'}/ws/${userId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      retryCount.current = 0;
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
      
      if (data.type) {
        window.dispatchEvent(new CustomEvent(`ws:${data.type}`, { detail: data.payload }));
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      if (retryCount.current < maxRetries) {
        const timeout = Math.min(1000 * Math.pow(2, retryCount.current), 16000);
        setTimeout(connect, timeout);
        retryCount.current += 1;
      }
    };
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}