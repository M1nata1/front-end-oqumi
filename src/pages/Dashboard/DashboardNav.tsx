// src/pages/Dashboard/DashboardNav.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { BRAND, COLORS, FONTS, COPY } from "./dashboard.config";

const NAV_LINKS = [
  { label: COPY.navCourses, href: "/courses", match: "/courses" },
  { label: COPY.navExam,    href: "/exam",    match: "/exam"    },
];

export default function DashboardNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);

  const isActive = (match: string) => {
    if (match === "/exam") {
      // /exam/trial is a public page without nav context — exclude
      return location.pathname === "/exam" || (
        location.pathname.startsWith("/exam/") && location.pathname !== "/exam/trial"
      );
    }
    return location.pathname === match || location.pathname.startsWith(match + "/");
  };

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрыть при клике вне меню
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    clearAuth();
    navigate("/", { replace: true });
  };

  // Инициал для аватара
  const initial = (user?.name ?? "?")[0].toUpperCase();

  return (
    <nav style={{
      padding: ".9rem 2.5rem",
      background: `${COLORS.bgPage}EC`,
      backdropFilter: "blur(14px)",
      borderBottom: `1px solid ${COLORS.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div
        onClick={() => navigate("/dashboard")}
        style={{ fontFamily: FONTS.display, fontSize: "1.28rem", fontWeight: 800, letterSpacing: "-.01em", color: COLORS.textBody, cursor: "pointer", transition: "opacity .18s", display: "inline-flex", alignItems: "center" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = ".72")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        {BRAND.name}<span style={{ color: COLORS.accent }}>{BRAND.accent}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {location.pathname !== "/dashboard" && NAV_LINKS.map(link => {
          const active = isActive(link.match);
          return (
            <span
              key={link.href}
              onClick={() => navigate(link.href)}
              style={{
                fontSize: ".82rem", fontWeight: 700,
                color: active ? COLORS.accent : COLORS.textMuted,
                cursor: "pointer",
                transition: "color .18s",
                position: "relative",
                paddingBottom: "2px",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = COLORS.textBody; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = COLORS.textMuted; }}
            >
              {link.label}
              {active && (
                <span style={{
                  position: "absolute", bottom: "-4px", left: 0, right: 0,
                  height: "2px", borderRadius: "99px",
                  background: COLORS.accent,
                }} />
              )}
            </span>
          );
        })}
      </div>

      {/* Дропдаун пользователя */}
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: ".55rem",
            background: open ? COLORS.bgCard : "transparent",
            border: `1px solid ${open ? COLORS.borderHover : COLORS.border}`,
            borderRadius: "10px", padding: ".45rem .8rem .45rem .55rem",
            cursor: "pointer", transition: "all .18s", fontFamily: FONTS.body,
          }}
        >
          {/* Аватар-инициал */}
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: ".72rem", fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {initial}
          </div>
          <span style={{ fontSize: ".82rem", fontWeight: 600, color: COLORS.textBody, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name ?? "Профиль"}
          </span>
          {/* Шеврон */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: "transform .18s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
            <path d="M2 4l4 4 4-4" stroke={COLORS.textFaint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Выпадающее меню */}
        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: "12px", minWidth: "180px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            overflow: "hidden", zIndex: 200,
          }}>
            {COPY.userMenu.map((item, i) => (
              <button
                key={item.key}
                onClick={() => {
                  setOpen(false);
                  if (item.key === "logout") { handleLogout(); return; }
                  navigate(item.href!);
                }}
                style={{
                  width: "100%", background: "none", border: "none",
                  borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none",
                  padding: ".75rem 1rem",
                  cursor: "pointer", transition: "background .14s",
                  fontFamily: FONTS.body, fontSize: ".84rem", fontWeight: 600,
                  color: item.key === "logout" ? "#FF6B6B" : COLORS.textBody,
                  textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = item.key === "logout" ? "rgba(255,58,58,0.08)" : "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
