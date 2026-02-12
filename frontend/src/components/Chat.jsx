import React, { useState, useEffect, useRef } from 'react';
import { Send, Wrench, User } from 'lucide-react';

const Chat = ({ 
  serviceRequestId, 
  currentRole, 
  otherPartyName, 
  disabled = false,
  title = null,
  subtitle = null,
  className = ""
}) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Load initial messages
  const loadMessages = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:8000/api/service-requests/${serviceRequestId}/messages/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      setSocketError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      const token = getAuthToken();
      await fetch(
        `http://localhost:8000/api/service-requests/${serviceRequestId}/messages/mark-read/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    if (disabled || !serviceRequestId) return;

    const token = getAuthToken();
    if (!token) {
      setSocketError('Authentication required');
      return;
    }

    // Try different ports for WebSocket connection
    const wsPorts = [8000, 8001];
    let currentPortIndex = 0;

    const tryConnect = () => {
      const port = wsPorts[currentPortIndex];
      const wsUrl = `ws://localhost:${port}/ws/service-chat/${serviceRequestId}/?token=${token}`;
      
      console.log(`Attempting WebSocket connection on port ${port}...`);
      
      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log(`WebSocket connected on port ${port}`);
          setSocketConnected(true);
          setSocketError(null);
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        socket.onmessage = (event) => {
          try {
            const messageData = JSON.parse(event.data);
            setMessages(prev => [...prev, messageData]);
            
            // Mark messages as read when we receive new messages
            if (currentRole) {
              markMessagesAsRead();
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setSocketConnected(false);
          
          // Try next port if this one failed and we haven't tried all ports
          if (event.code !== 1000 && currentPortIndex < wsPorts.length - 1 && !reconnectTimeoutRef.current) {
            currentPortIndex++;
            console.log(`Trying next port ${wsPorts[currentPortIndex]}...`);
            setTimeout(tryConnect, 1000);
          }
          // Attempt to reconnect after 3 seconds if not a normal closure
          else if (event.code !== 1000 && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect...');
              currentPortIndex = 0; // Reset to first port
              tryConnect();
            }, 3000);
          }
        };

        socket.onerror = (error) => {
          console.error(`WebSocket error on port ${port}:`, error);
          setSocketError('Connection error');
          setSocketConnected(false);
        };

      } catch (error) {
        console.error(`Error creating WebSocket on port ${port}:`, error);
        setSocketError('Failed to connect');
        
        // Try next port
        if (currentPortIndex < wsPorts.length - 1) {
          currentPortIndex++;
          setTimeout(tryConnect, 1000);
        }
      }
    };

    tryConnect();
  };

  // Send message
  const sendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !socketConnected || sending) return;

    setSending(true);
    
    try {
      const message = {
        type: 'chat.message',
        content: content
      };

      socketRef.current.send(JSON.stringify(message));
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setSocketError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (!disabled && serviceRequestId) {
      loadMessages();
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [serviceRequestId, disabled]);

  // Mark messages as read when chat gets focus
  useEffect(() => {
    const handleFocus = () => {
      if (currentRole && !disabled) {
        markMessagesAsRead();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentRole, disabled, serviceRequestId]);

  const displayTitle = title || otherPartyName || 'Chat';
  const displaySubtitle = subtitle || (disabled ? 'Finding Workshop...' : 'Connected');

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col ${className}`} style={{ height: '600px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {currentRole === 'workshop' ? <User className="w-5 h-5 text-white" /> : <Wrench className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="text-white font-bold">{displayTitle}</h3>
            <p className="text-blue-100 text-xs">{displaySubtitle}</p>
          </div>
        </div>
        
        {/* Connection status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-white text-xs">
            {socketConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : disabled ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 italic">Chat will be available once connected to a workshop.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 italic">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isMine = (
                (currentRole === 'user' && message.sender_type === 'USER') ||
                (currentRole === 'workshop' && message.sender_type === 'WORKSHOP')
              );

              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isMine
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display */}
      {socketError && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-red-600 text-sm">{socketError}</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            disabled={disabled || !socketConnected || sending}
          />
          <button
            onClick={sendMessage}
            disabled={disabled || !socketConnected || sending || !messageInput.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 disabled:bg-gray-400"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;