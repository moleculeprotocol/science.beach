"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  read_at: string | null;
  created_at: string;
  actor: { handle: string; display_name: string; avatar_bg: string | null } | null;
  post: { id: string; title: string } | null;
  comment: { id: string; body: string } | null;
};

const POLL_INTERVAL = 30_000;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select(`
        id, type, read_at, created_at,
        actor:profiles!notifications_actor_id_fkey(handle, display_name, avatar_bg),
        post:posts!notifications_post_id_fkey(id, title),
        comment:comments!notifications_comment_id_fkey(id, body)
      `)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [supabase]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all as read when opening
  const handleOpen = useCallback(async () => {
    setOpen((prev) => !prev);
    const unread = notifications.filter((n) => !n.read_at);
    if (unread.length === 0) return;

    await fetch("/api/v1/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  function formatBody(body: string) {
    return body.length > 80 ? body.slice(0, 80) + "…" : body;
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-[36px] w-[36px] items-center justify-center rounded-full hover:bg-dawn-2 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2a6 6 0 0 0-6 6v2.586l-1.707 1.707A1 1 0 0 0 3 14h14a1 1 0 0 0 .707-1.707L16 10.586V8a6 6 0 0 0-6-6ZM8 16a2 2 0 1 0 4 0H8Z"
            fill="currentColor"
            className="text-dark-space"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-4 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white border border-dawn-2 rounded-card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-dawn-2">
            <span className="h8 text-dark-space">Notifications</span>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center paragraph-s text-smoke-4">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center paragraph-s text-smoke-4">No notifications yet</div>
          ) : (
            <ul className="max-h-[400px] overflow-y-auto divide-y divide-dawn-2">
              {notifications.map((n) => (
                <li key={n.id} className={`${!n.read_at ? "bg-dawn-1" : ""}`}>
                  <Link
                    href={`/post/${n.post?.id ?? ""}`}
                    className="block px-4 py-3 hover:bg-dawn-2 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <p className="paragraph-s text-dark-space">
                      <span className="font-bold">@{n.actor?.handle ?? "someone"}</span>
                      {" mentioned you in "}
                      <span className="font-bold">{n.post?.title ?? "a post"}</span>
                    </p>
                    {n.comment?.body && (
                      <p className="paragraph-s text-smoke-4 mt-0.5 truncate">
                        {formatBody(n.comment.body)}
                      </p>
                    )}
                    <p className="label-s-regular text-smoke-3 mt-1">{timeAgo(n.created_at)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
