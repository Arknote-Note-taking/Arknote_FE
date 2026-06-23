import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';
import API from '../services/api';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user, login } = useContext(AuthContext);

  // Helper to get user-specific storage key
  const getUserKey = () => user?.id ? `notifications_${user.id}` : 'notifications_anonymous';

  // Load notifications from DB, fallback to localStorage
  const loadNotifications = async () => {
    console.log('[Socket-Debug] loadNotifications called. User:', user?.email, 'Role:', user?.role, 'ID:', user?.id);
    if (!user) {
      setNotifications([]);
      return;
    }
    
    try {
      console.log('[Socket-Debug] Calling GET /notifications...');
      const res = await API.get('/notifications');
      console.log('[Socket-Debug] GET /notifications response data:', res.data);
      // If we got a list from DB, use it and update fallback cache
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
        localStorage.setItem(getUserKey(), JSON.stringify(res.data));
        return;
      } else {
        console.warn('[Socket-Debug] res.data is not an array:', res.data);
      }
    } catch (err) {
      console.error('[Socket-Debug] Error loading notifications from DB:', err.message, err.response?.data);
    }

    // Fallback: load from localStorage cache
    const fallbackKey = getUserKey();
    console.log('[Socket-Debug] Falling back to local storage cache under key:', fallbackKey);
    try {
      const stored = localStorage.getItem(fallbackKey);
      const list = stored ? JSON.parse(stored) : [];
      console.log('[Socket-Debug] Loaded from local cache:', list.length, 'items.');
      setNotifications(list);
    } catch (cacheErr) {
      console.error('[Socket-Debug] Failed to parse local cache:', cacheErr);
      setNotifications([]);
    }
  };

  const addNotification = (notif) => {
    setNotifications((prev) => {
      // Avoid duplicate notifications by checking ID
      if (prev.some((n) => n.id === notif.id)) return prev;
      const updated = [notif, ...prev].slice(0, 50);
      localStorage.setItem(getUserKey(), JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    // Update local state first for instant responsiveness
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(getUserKey(), JSON.stringify(updated));
      return updated;
    });

    try {
      await API.post('/notifications/read-all');
    } catch (err) {
      console.error('[SocketContext] Failed to mark read all in DB:', err);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;
    setNotifications([]);
    localStorage.removeItem(getUserKey());

    try {
      await API.delete('/notifications');
    } catch (err) {
      console.error('[SocketContext] Failed to clear notifications in DB:', err);
    }
  };

  const deleteNotification = async (id) => {
    if (!user) return;
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      localStorage.setItem(getUserKey(), JSON.stringify(updated));
      return updated;
    });

    try {
      await API.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('[SocketContext] Failed to delete notification in DB:', err);
    }
  };

  const markAsRead = async (id) => {
    if (!user) return;
    setNotifications((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(getUserKey(), JSON.stringify(updated));
      return updated;
    });

    try {
      await API.post(`/notifications/${id}/read`);
    } catch (err) {
      console.error('[SocketContext] Failed to mark single read in DB:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (user) {
      // 1. Initial Load from DB/localStorage
      loadNotifications();

      // 2. Open socket connection
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('[Socket-Debug] Connected to socket server with ID:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('[Socket-Debug] Socket connection error:', err.message);
      });

      // Admin Notifications
      if (user.role === 'admin') {
        console.log('Registering admin_notification listener for admin:', user.email);
        newSocket.on('admin_notification', (data) => {
          console.log('Received admin_notification on client:', data);
          let toastContent = null;

          if (data.type === 'user_delete_request') {
            toastContent = (
              <div className="flex flex-col text-xs">
                <span className="font-bold text-red-500">⚠️ Yêu cầu xóa tài khoản</span>
                <span>{data.message}</span>
              </div>
            );
          } else if (data.type === 'document_restore_request') {
            toastContent = (
              <div className="flex flex-col text-xs">
                <span className="font-bold text-primary">📄 Yêu cầu khôi phục tài liệu</span>
                <span>{data.message}</span>
              </div>
            );
          }

          if (toastContent) {
            toast(() => toastContent, { duration: 6000 });
          }

          addNotification(data);
        });
      }

      // User Notifications
      newSocket.on('user_notification', (data) => {
        console.log('Received user_notification on client:', data);
        if (data.recipient_id === user.id) {
          if (data.type === 'document_restored' || data.type === 'user_restored') {
            toast.success(data.message, { duration: 6000, icon: '🎉' });
            addNotification(data);
          }
        }
      });

      // Real-time payment success sync
      newSocket.on('payment_success', async (data) => {
        console.log('Received payment_success socket event:', data);
        if (data.userId === user.id) {
          try {
            const res = await API.get('/users/profile');
            if (res.data) {
              login(res.data);
              toast.success('Giao dịch thanh toán được xác nhận! Tài khoản của bạn đã được nâng cấp lên PRO. 🎉', { duration: 6000 });
            }
          } catch (err) {
            console.error('Failed to sync profile on payment_success socket event:', err);
            login({ ...user, is_pro: true });
            toast.success('Giao dịch thanh toán được xác nhận! Tài khoản của bạn đã được nâng cấp lên PRO. 🎉', { duration: 6000 });
          }
        }
      });

      return () => {
        newSocket.off('admin_notification');
        newSocket.off('user_notification');
        newSocket.off('payment_success');
        newSocket.close();
      };
    } else {
      setNotifications([]);
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        clearNotifications,
        deleteNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
