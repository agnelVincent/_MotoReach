import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Send, ImageIcon, X, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { getWebSocketBase } from '../config/ws';

const ACCESS_TOKEN_KEY = 'accessToken';
const PAGE_SIZE = 50;

const Chat = ({
  serviceRequestId,
  canChat,
  headerTitle,
  headerSubtitle,
  headerIcon: HeaderIcon,
  gradientFrom = 'from-indigo-600',
  gradientTo = 'to-violet-600',
  disabledMessage = 'Chat will be available once a workshop is connected.',
}) => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isSendingImage, setIsSendingImage] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUserId = user?.id;
  const isOwn = (senderId) =>
    currentUserId != null && String(senderId) === String(currentUserId);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCancelPreview = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleImageSend = async () => {
    if (!canChat || !isConnected || !imageFile) return;
    setIsSendingImage(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      await axiosInstance.post(
        `/chat/upload-image/${serviceRequestId}/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      handleCancelPreview();
    } catch (err) {
      toast.error('Failed to send image. Please try again.');
    } finally {
      setIsSendingImage(false);
    }
  };

  const preserveScrollOnPrepend = useCallback((prependFn) => {
    const container = scrollContainerRef.current;
    if (!container) { prependFn(); return; }
    const prevScrollHeight = container.scrollHeight;
    prependFn();
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight - prevScrollHeight;
    });
  }, []);

  useEffect(() => {
    if (!serviceRequestId || !canChat) return;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return;

    const wsUrl = `${getWebSocketBase()}/ws/chat/${serviceRequestId}/?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      socket.send(JSON.stringify({ type: 'mark_read' }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat.history') {
          setMessages(data.messages || []);
          setHasMore((data.messages?.length ?? 0) === PAGE_SIZE);
          setIsLoadingMore(false);
          requestAnimationFrame(() => requestAnimationFrame(() => scrollToBottom('instant')));
        } else if (data.type === 'chat.message') {
          setMessages((prev) => [...prev, data.message]);
          setTimeout(() => scrollToBottom('smooth'), 0);
        } else if (data.type === 'chat.history_page') {
          setIsLoadingMore(false);
          if (!data.messages?.length) { setHasMore(false); return; }
          setHasMore(data.has_more ?? data.messages.length === PAGE_SIZE);
          preserveScrollOnPrepend(() => {
            setMessages((prev) => [...data.messages, ...prev]);
          });
        }
      } catch (error) {
        console.error('Failed to parse chat message', error);
        setIsLoadingMore(false);
      }
    };

    socket.onclose = () => setIsConnected(false);
    socket.onerror = () => setIsConnected(false);

    return () => {
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
      setMessages([]);
      setHasMore(true);
      setIsLoadingMore(false);
    };
  }, [serviceRequestId, canChat]);

  const handleScroll = useCallback((e) => {
    const container = e.currentTarget;
    if (
      container.scrollTop === 0 &&
      hasMore && !isLoadingMore &&
      socketRef.current?.readyState === WebSocket.OPEN &&
      messages.length > 0
    ) {
      const oldestId = messages[0].id;
      setIsLoadingMore(true);
      socketRef.current.send(JSON.stringify({ type: 'fetch_history', before_id: oldestId }));
    }
  }, [hasMore, isLoadingMore, messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: 'message', message: text }));
    setMessageInput('');
  };

  const renderMessage = (msg) => {
    const own = isOwn(msg.sender_id);
    const isImage = msg.message_type === 'image' && msg.image_url;
    const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Avatar letter
    const senderLetter = (msg.sender_name || '?').charAt(0).toUpperCase();

    return (
      <div key={msg.id} className={`chat-msg flex gap-2 mb-4 ${own ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar — only for others */}
        {!own && (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-display font-bold self-end mb-1">
            {senderLetter}
          </div>
        )}

        <div className={`flex flex-col max-w-[72%] ${own ? 'items-end' : 'items-start'}`}>
          {/* Sender name for others */}
          {!own && !isImage && (
            <span className="text-[10px] font-semibold text-indigo-500 mb-1 px-1 font-display tracking-wide">
              {msg.sender_name}
            </span>
          )}

          {isImage ? (
            <div className={`rounded-2xl overflow-hidden shadow-md ${own ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
              {!own && (
                <p className="text-[10px] font-semibold text-indigo-400 px-3 pt-2 font-display">
                  {msg.sender_name}
                </p>
              )}
              <img
                src={msg.image_url}
                alt="Shared image"
                className="max-w-full max-h-56 object-cover cursor-pointer block"
                style={{ minWidth: 120 }}
                onClick={() => window.open(msg.image_url, '_blank')}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className={`px-3 py-1.5 flex justify-end ${own ? 'bg-indigo-600' : 'bg-white'}`}>
                <span className={`text-[9px] ${own ? 'text-indigo-200' : 'text-gray-400'}`}>{timeStr}</span>
              </div>
            </div>
          ) : (
            <div className={`relative px-4 py-2.5 shadow-sm ${
              own
                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm'
                : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-body">{msg.content}</p>
              <p className={`mt-1 text-[9px] text-right ${own ? 'text-indigo-200' : 'text-gray-400'}`}>{timeStr}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isInputDisabled = !canChat || !isConnected;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'Geist', 'Inter', sans-serif; }

        .chat-container {
          display: flex;
          flex-direction: column;
          height: 600px;
          background: white;
          border-radius: 1.25rem;
          overflow: hidden;
          border: 1px solid #f1f5f9;
          box-shadow: 0 8px 32px rgba(99,102,241,0.08), 0 2px 8px rgba(0,0,0,0.04);
        }

        /* Header */
        .chat-header {
          background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .chat-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.5;
          pointer-events: none;
        }
        .chat-header-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          pointer-events: none;
        }

        /* Scrollable messages */
        .chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 1.25rem 1rem;
          background: #f8f9fc;
          background-image:
            radial-gradient(circle at 20px 20px, rgba(99,102,241,0.03) 1px, transparent 1px);
          background-size: 28px 28px;
          scrollbar-width: thin;
          scrollbar-color: #e0e7ff transparent;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 99px; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chat-msg { animation: msgIn 0.2s ease forwards; }

        /* Date chip */
        .date-chip {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0.75rem 0;
        }
        .date-chip span {
          font-family: 'Syne', sans-serif;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 2px 10px;
          border-radius: 99px;
        }

        /* Image preview */
        .img-preview-bar {
          border-top: 1px solid #f1f5f9;
          background: white;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        /* Input bar */
        .chat-input-bar {
          border-top: 1px solid #f1f5f9;
          padding: 0.875rem 1rem;
          background: white;
          flex-shrink: 0;
        }
        .chat-input-inner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8f9fc;
          border: 1.5px solid #e2e8f0;
          border-radius: 1rem;
          padding: 0.375rem 0.375rem 0.375rem 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .chat-input-inner:focus-within {
          border-color: #a5b4fc;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }
        .chat-text-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Geist', sans-serif;
          font-size: 0.875rem;
          color: #1e293b;
          min-width: 0;
        }
        .chat-text-input::placeholder { color: #94a3b8; }
        .chat-text-input:disabled { cursor: not-allowed; }

        .icon-btn {
          width: 36px; height: 36px;
          border-radius: 0.625rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }
        .icon-btn-img {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .icon-btn-img:hover:not(:disabled) {
          background: #ede9fe;
          color: #6366f1;
          border-color: #c4b5fd;
        }
        .icon-btn-img.active {
          background: #ede9fe;
          color: #6366f1;
          border-color: #c4b5fd;
        }
        .icon-btn-send {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: white;
          width: 40px; height: 40px;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px rgba(99,102,241,0.35);
        }
        .icon-btn-send:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5, #6d28d9);
          box-shadow: 0 6px 16px rgba(99,102,241,0.45);
          transform: translateY(-1px);
        }
        .icon-btn-send:disabled {
          background: #e2e8f0;
          box-shadow: none;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .send-img-btn {
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: white;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.8rem;
          border-radius: 0.75rem;
          transition: all 0.18s ease;
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
          flex-shrink: 0;
        }
        .send-img-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99,102,241,0.4);
        }
        .send-img-btn:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }

        /* Status dot */
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .status-dot.online  { background: #34d399; box-shadow: 0 0 0 2px rgba(52,211,153,0.3); }
        .status-dot.offline { background: #fbbf24; }
        .status-dot.away    { background: #94a3b8; }
      `}</style>

      <div className="chat-container font-body">

        {/* ── HEADER ── */}
        <div className="chat-header">
          <div className="chat-header-glow w-32 h-32 bg-white opacity-5 -top-8 -right-4" />
          <div className="chat-header-glow w-20 h-20 bg-violet-300 opacity-10 bottom-0 left-8" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
              {HeaderIcon && <HeaderIcon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-sm leading-tight truncate">{headerTitle}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`status-dot ${canChat && isConnected ? 'online' : canChat ? 'offline' : 'away'}`} />
                <p className="text-[11px] text-white/70 font-body">
                  {canChat
                    ? isConnected ? (headerSubtitle || 'Connected') : 'Connecting…'
                    : 'Unavailable'}
                </p>
              </div>
            </div>
          </div>

          {/* Message count badge */}
          {messages.length > 0 && (
            <div className="relative z-10 bg-white/15 border border-white/20 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
              <span className="font-display font-bold text-white text-xs">{messages.length}</span>
              <span className="text-white/60 text-[10px]">msgs</span>
            </div>
          )}
        </div>

        {/* ── MESSAGES ── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="chat-messages"
        >
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <div className="flex items-center gap-2 bg-white border border-indigo-100 rounded-full px-3 py-1 shadow-sm">
                <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                <span className="text-[10px] text-indigo-400 font-display font-semibold tracking-wide uppercase">Loading older messages</span>
              </div>
            </div>
          )}

          {canChat && !isLoadingMore && !hasMore && messages.length > 0 && (
            <div className="date-chip">
              <span>Beginning of conversation</span>
            </div>
          )}

          {canChat ? (
            messages.length > 0 ? (
              messages.map(renderMessage)
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center">
                  <Send className="w-5 h-5 text-indigo-300" />
                </div>
                <p className="font-body text-gray-400 text-sm">Start the conversation for this service.</p>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-300" />
              </div>
              <p className="font-body text-gray-400 text-sm leading-relaxed max-w-xs">{disabledMessage}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── IMAGE PREVIEW BAR ── */}
        {imagePreviewUrl && (
          <div className="img-preview-bar">
            <div className="relative flex-shrink-0">
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="h-16 w-16 rounded-xl object-cover border border-indigo-100 shadow-sm"
              />
              <button
                type="button"
                onClick={handleCancelPreview}
                disabled={isSendingImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-gray-800 text-sm truncate">{imageFile?.name}</p>
              <p className="font-body text-gray-400 text-xs mt-0.5">
                {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleImageSend}
              disabled={isSendingImage || !isConnected}
              className="send-img-btn"
            >
              {isSendingImage ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-3.5 h-3.5" /> Send</>
              )}
            </button>
          </div>
        )}

        {/* ── INPUT BAR ── */}
        <div className="chat-input-bar">
          <form onSubmit={handleSend}>
            <div className="chat-input-inner">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={
                  canChat
                    ? isConnected ? 'Type a message…' : 'Connecting to chat…'
                    : 'Chat unavailable for this service'
                }
                className="chat-text-input"
                disabled={isInputDisabled}
              />

              {/* Image upload */}
              <label
                htmlFor="chat-image-upload"
                className={`icon-btn icon-btn-img ${imagePreviewUrl ? 'active' : ''} ${isInputDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                title="Send image"
              >
                <ImageIcon className="w-4 h-4" />
              </label>
              <input
                ref={fileInputRef}
                id="chat-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isInputDisabled}
              />

              {/* Send */}
              <button
                type="submit"
                disabled={isInputDisabled || !messageInput.trim()}
                className="icon-btn icon-btn-send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

      </div>
    </>
  );
};

export default Chat;