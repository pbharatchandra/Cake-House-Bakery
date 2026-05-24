import React, { useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import toast, { Toaster } from "react-hot-toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationListener() {
  const { user } = useAuth();
  const knownStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Basic permissions on mount for normal toasts 
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Register Service Worker for true background pushing
    const registerPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const res = await fetch('/api/notifications/vapid-public-key');
          if (!res.ok) return;
          const { publicKey } = await res.json();
          
          const registration = await navigator.serviceWorker.register('/sw.js');
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          });
          
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ subscription, userId: user.id })
          });
        } catch (err) {
          console.error("Push registration failed", err);
        }
      }
    };
    
    // Attempt registration
    if ("Notification" in window && Notification.permission === "granted") {
      registerPush();
    } else if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          registerPush();
        }
      });
    }

    let initialLoad = true;

    // We can fetch just once to get the baseline, since the SW handles incoming push notifications, but we can also poll to update UI toasts in-app
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        const currentOrders = data.orders || [];

        currentOrders.forEach((order: any) => {
          const oldStatus = knownStatusRef.current[order.id];
          if (!initialLoad && oldStatus && oldStatus !== order.status) {
            // Status changed (in-app toast notification fallback, push background is handled natively)
            let message = `Order #${order.id.slice(-6)} status: ${order.status}`;
            let icon = "ℹ️";

            if (order.status === "READY") {
              message = `Your order #${order.id.slice(-6)} is ready for pickup!`;
              icon = "🎉";
              toast.success(message, { duration: 6000, icon });
            } else if (order.status === "DELIVERED") {
              message = `Order #${order.id.slice(-6)} has been completed. Enjoy!`;
              icon = "✅";
              toast.success(message, { duration: 6000, icon });
            } else if (order.status === "PREPARING") {
              message = `We started preparing your order #${order.id.slice(-6)}.`;
              icon = "👨‍🍳";
              toast(message, { icon });
            } else if (order.status === "CANCELLED") {
              message = `Your order #${order.id.slice(-6)} was cancelled.`;
              icon = "❌";
              toast.error(message);
            }
          }
          knownStatusRef.current[order.id] = order.status;
        });

        initialLoad = false;
      } catch (error) {
        console.error("Failed to fetch orders for notification:", error);
      }
    };

    fetchOrders(); // immediate
    const interval = setInterval(fetchOrders, 30000); // Poll slower, rely on push

    return () => clearInterval(interval);
  }, [user]);

  return <Toaster position="top-right" />;
}
