import { useContext } from 'react';
import { useNotifications } from '../context/NotificationsContext';

export const useChatNotifications = () => {
  const { notifications, socketConnected, loading, refreshNotifications } = useNotifications();
  
  return {
    loading,
    totalUnread: notifications.total_unread_count || 0,
    items: notifications.items || [],
    refresh: refreshNotifications,
    socketConnected
  };
};

