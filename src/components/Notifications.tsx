import { useEffect, useState } from "react";
import { api, Notification } from "@/lib/api";
import { Bell } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await api.getNotifications();
        setNotifications(data.notifications);
      } catch (error) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      // Optionally handle error
    }
  };

  return (
    <div className="relative">
      <button
        className="relative"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {notifications.some((n) => !n.is_read) && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 p-4">
          <h4 className="font-bold mb-2">Notifications</h4>
          {loading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-gray-500 text-sm">No notifications</div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-2 rounded flex flex-col gap-1 ${n.is_read ? "bg-gray-100" : "bg-blue-50"}`}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  style={{ cursor: n.is_read ? "default" : "pointer" }}
                >
                  <div className="text-sm font-medium">{n.title || "Notification"}</div>
                  <div className="text-sm">{n.message}</div>
                  <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                  {!n.is_read && <span className="text-xs text-blue-600">Mark as read</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 