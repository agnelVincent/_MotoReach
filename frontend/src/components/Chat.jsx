import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Send } from 'lucide-react';

const ACCESS_TOKEN_KEY = 'accessToken';

const getWebSocketBase = () => {
  return import.meta.env.VITE_WS_BASE;
};



const Chat = ({
  serviceRequestId,
  canChat,
  headerTitle,
  headerSubtitle,
  headerIcon: HeaderIcon,
  gradientFrom = 'from-blue-600',
  gradientTo = 'to-indigo-600',
  disabledMessage = 'Chat will be available once a workshop is connected.',
}) => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const currentUserId = user?.id;

  useEffect(() => {
    if (!serviceRequestId || !canChat) {
      return;
    }

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      return;
    }

    const wsBase = getWebSocketBase();
    const wsUrl = `${wsBase}/ws/chat/${serviceRequestId}/?token=${encodeURIComponent(
      token
    )}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      // Mark messages as read on open
      socket.send(JSON.stringify({ type: 'mark_read' }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat.history') {
          setMessages(data.messages || []);
        } else if (data.type === 'chat.message') {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (error) {
        console.error('Failed to parse chat message', error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [serviceRequestId, canChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'message',
        message: text,
      })
    );
    setMessageInput('');
  };

  const renderMessage = (msg) => {
    const isOwn = currentUserId && msg.sender_id === currentUserId;

    return (
      <div
        key={msg.id}
        className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          {!isOwn && (
            <p className="text-xs font-semibold text-gray-600 mb-0.5">
              {msg.sender_name}
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
          <p
            className={`mt-1 text-[10px] ${
              isOwn ? 'text-blue-100' : 'text-gray-400'
            }`}
          >
            {new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  };

  const isInputDisabled = !canChat || !isConnected;

  return (
    <div
      className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
      style={{ height: '600px' }}
    >
      <div
        className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {HeaderIcon && <HeaderIcon className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="text-white font-bold truncate">{headerTitle}</h3>
            <p className="text-xs text-white/80 truncate">
              {headerSubtitle || (canChat ? 'Connected' : 'Unavailable')}
            </p>
          </div>
        </div>
        {!isConnected && canChat && (
          <span className="text-xs text-white/80 italic">Connecting...</span>
        )}
      </div>

      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {canChat ? (
            messages.length > 0 ? (
              messages.map(renderMessage)
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400 italic text-sm">
                  Start the conversation for this service.
                </p>
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 italic text-sm text-center max-w-xs">
                {disabledMessage}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 p-4 bg-white"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={
              canChat
                ? isConnected
                  ? 'Type your message...'
                  : 'Connecting to chat...'
                : 'Chat unavailable for this service'
            }
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
            disabled={isInputDisabled}
          />
          <button
            type="submit"
            disabled={isInputDisabled || !messageInput.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;

