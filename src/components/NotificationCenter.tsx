import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const CATEGORY_LABEL: Record<string, string> = {
  notice: "सूचना",
  program: "कार्यक्रम",
  quiz: "प्रश्नमंजुषा",
  accounts: "खाते",
  spardha: "स्पर्धा",
  general: "सामान्य",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "आत्ता";
  if (m < 60) return `${m} मिनि अगो";
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} तास अगो`;
  const d = Math.floor(h / 24);
  return `${d} दिवस अगो`;
}

const NotificationCenter = () => {
  const { items, unread, open, setOpen, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const onOpen = (next: boolean) => {
    setOpen(next);
    if (next) setDismissed(false);
  };

  const onItemClick = (n: { id: string; link: string | null }) => {
    markRead([n.id]);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={onOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="सूचना केंद्र"
          className="relative text-primary-foreground p-2 rounded-md hover:bg-primary-foreground/10 transition-colors"
        >
          <Bell size={20} />
          {unread > 0 && !dismissed && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-primary-foreground text-[10px] font-bold border border-primary">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <p className="text-sm font-semibold">सूचना केंद्र</p>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button
                onClick={() => {
                  markAllRead();
                  setDismissed(true);
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
              >
                <CheckCheck size={14} /> वाचलेले
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <ScrollArea className="h-[60vh] max-h-96">
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              कोणतीही सूचना नाही
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const isUnread = !(
                  localStorage.getItem("vicharmanch.notifications.read") &&
                  JSON.parse(localStorage.getItem("vicharmanch.notifications.read") || "[]").includes(n.id)
                );
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => onItemClick(n)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors ${
                        isUnread ? "bg-accent/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isUnread && (
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {CATEGORY_LABEL[n.category] || n.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1 truncate">{n.title}</p>
                          {n.body && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
