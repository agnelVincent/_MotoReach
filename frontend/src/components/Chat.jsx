import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Send, ImageIcon, X, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const ACCESS_TOKEN_KEY = 'accessToken';
const PAGE_SIZE = 50;

const getWebSocketBase = () => import.meta.env.VITE_WS_BASE;

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
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── Image preview state ───────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState(null);       // raw File object
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // local blob URL
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
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
    }
  }, []);

  // ── Open image picker ─────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Revoke any previous blob URL to avoid memory leaks
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    // Reset input so the same file can be re-selected if cancelled
    e.target.value = '';
  };

  // ── Cancel preview ────────────────────────────────────────────────────────
  const handleCancelPreview = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  // ── Upload & send image ───────────────────────────────────────────────────
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
      // Close preview — the WebSocket broadcast will append the message
      handleCancelPreview();
    } catch (err) {
      toast.error('Failed to send image. Please try again.');
    } finally {
      setIsSendingImage(false);
    }
  };

  // ── Scroll-position preservation when prepending older messages ───────────
  const preserveScrollOnPrepend = useCallback((prependFn) => {
    const container = scrollContainerRef.current;
    if (!container) { prependFn(); return; }
    const prevScrollHeight = container.scrollHeight;
    prependFn();
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight - prevScrollHeight;
    });
  }, []);

  // ── WebSocket setup ───────────────────────────────────────────────────────
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
          requestAnimationFrame(() => {
            requestAnimationFrame(() => scrollToBottom('instant'));
          });

        } else if (data.type === 'chat.message') {
          setMessages((prev) => [...prev, data.message]);
          setTimeout(() => scrollToBottom('smooth'), 0);

        } else if (data.type === 'chat.history_page') {
          setIsLoadingMore(false);
          if (!data.messages?.length) {
            setHasMore(false);
            return;
          }
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

  // ── Scroll handler — fetch older messages on scroll-up ───────────────────
  const handleScroll = useCallback((e) => {
    const container = e.currentTarget;
    if (
      container.scrollTop === 0 &&
      hasMore &&
      !isLoadingMore &&
      socketRef.current?.readyState === WebSocket.OPEN &&
      messages.length > 0
    ) {
      const oldestId = messages[0].id;
      setIsLoadingMore(true);
      socketRef.current.send(
        JSON.stringify({ type: 'fetch_history', before_id: oldestId })
      );
    }
  }, [hasMore, isLoadingMore, messages]);

  // ── Send text message ─────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: 'message', message: text }));
    setMessageInput('');
  };

  // ── Render a single message bubble ───────────────────────────────────────
  const renderMessage = (msg) => {
    const own = isOwn(msg.sender_id);
    const isImage = msg.message_type === 'image' && msg.image_url;

    return (
      <div
        key={msg.id}
        className={`flex mb-3 ${own ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[75%] rounded-2xl shadow-sm overflow-hidden ${
            own
              ? isImage
                ? 'rounded-br-none'
                : 'bg-blue-600 text-white rounded-br-none px-4 py-2'
              : isImage
              ? 'rounded-bl-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none px-4 py-2'
          }`}
        >
          {/* Sender name (only for others) */}
          {!own && !isImage && (
            <p className="text-xs font-semibold text-gray-600 mb-0.5">
              {msg.sender_name}
            </p>
          )}

          {/* Image message */}
          {isImage ? (
            <div className={`relative ${own ? 'bg-blue-600' : 'bg-gray-100'} px-2 pt-2`}>
              {!own && (
                <p className="text-xs font-semibold text-gray-600 mb-1 px-1">
                  {msg.sender_name}
                </p>
              )}
              <img
                src={msg.image_url}
                alt="Shared image"
                className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer"
                onClick={() => window.open(msg.image_url, '_blank')}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <p className={`mt-1 pb-1 px-1 text-[10px] ${own ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ) : (
            /* Text message */
            <>
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              <p className={`mt-1 text-[10px] ${own ? 'text-blue-100' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </>
          )}
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
      {/* Header */}
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

      {/* Messages area */}
      <div className="flex-1 bg-gray-50 flex flex-col min-h-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 custom-scrollbar"
        >
          {isLoadingMore && (
            <div className="flex justify-center py-2 mb-2">
              <span className="text-xs text-gray-400 italic">Loading older messages…</span>
            </div>
          )}
          {canChat && !isLoadingMore && !hasMore && messages.length > 0 && (
            <div className="flex justify-center py-2 mb-2">
              <span className="text-xs text-gray-400 italic">Beginning of conversation</span>
            </div>
          )}

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

      {/* ── Image Preview Panel ── */}
      {imagePreviewUrl && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="h-20 w-20 rounded-xl object-cover border border-gray-300 shadow-sm"
            />
            <button
              type="button"
              onClick={handleCancelPreview}
              disabled={isSendingImage}
              className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 font-medium truncate">{imageFile?.name}</p>
            <p className="text-xs text-gray-400">
              {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleImageSend}
            disabled={isSendingImage || !isConnected}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSendingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4 bg-white">
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

          {/* Image upload button */}
          <label
            htmlFor="chat-image-upload"
            className={`flex items-center justify-center w-11 h-11 rounded-lg border transition-all duration-200 ${
              isInputDisabled
                ? 'border-gray-200 opacity-40 cursor-not-allowed pointer-events-none'
                : imagePreviewUrl
                ? 'border-blue-500 bg-blue-50 cursor-pointer'
                : 'border-gray-300 hover:bg-gray-100 cursor-pointer'
            }`}
            title="Send image"
          >
            <ImageIcon className={`w-5 h-5 ${imagePreviewUrl ? 'text-blue-500' : 'text-gray-500'}`} />
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
