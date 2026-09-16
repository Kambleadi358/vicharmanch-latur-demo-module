// In-app notification center: fetch latest, unread count, mark-as-read.
// "Read" state is per-device via localStorage (no user account for the public).
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  category: string;
  created_at: string;
}

const READ_KEY = 'vicharmanch.notifications.read';

function readIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveRead(ids: Set<string>) {
  const arr = Array.from(ids).slice(-500);
  localStorage.setItem(READ_KEY, JSON.stringify(arr));
}

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id,title,body,link,category,created_at')
      .order('created_at', { ascending: false })
      .limit(40);
    if (data) setItems(data as AppNotification[]);
  }, []);

  useEffect(() => {
    refresh();
    // Poll for new notifications every 60s while the app is open.
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const read = readIds();
    setUnread(items.filter((n) => !read.has(n.id)).length);
  }, [items]);

  const markRead = useCallback((ids: string[]) => {
    const read = readIds();
    ids.forEach((id) => read.add(id));
    saveRead(read);
    setUnread(items.filter((n) => !read.has(n.id)).length);
  }, [items]);

  const markAllRead = useCallback(() => {
    const read = readIds();
    items.forEach((n) => read.add(n.id));
    saveRead(read);
    setUnread(0);
  }, [items]);

  return { items, unread, open, setOpen, refresh, markRead, markAllRead };
}
