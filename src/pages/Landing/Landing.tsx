// src/pages/Landing/Landing.tsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { COLORS, FONTS, EXAM_DEMO, EXAM_CTA, parseHMS } from "./landing.config";
import LandingNav        from "./LandingNav";
import LandingHero       from "./LandingHero";
import LandingCourses    from "./LandingCourses";
import LandingHowItWorks from "./LandingHowItWorks";
import LandingExamCta    from "./LandingExamCta";
import LandingFooter     from "./LandingFooter";

export default function Landing() {
  const navigate = useNavigate();
  const isAuth   = useAuthStore(s => s.isAuth);
  const [scrolled, setScrolled] = useState(false);
  const initialSeconds = useMemo(() => parseHMS(EXAM_DEMO.timer), []);
  const [left, setLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const t0 = Date.now();
    let raf: number | null = null;
    let last = left;
    const tick = () => {
      const next = initialSeconds - Math.floor((Date.now() - t0) / 1000);
      if (next !== last) { last = next; setLeft(next); }
      if (next > 0) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [initialSeconds]);

  // Универсальный обработчик действий из nav и footer
  const handleAction = (action: string) => {
    if (action.startsWith("scroll:")) {
      const selector = action.replace("scroll:", "");
      document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action.startsWith("route:")) {
      navigate(action.replace("route:", ""));
    }
  };

  // Кнопки CTA требуют авторизации
  const handleCTA     = () => navigate(isAuth ? "/courses" : "/auth");
  const handleCourses = () => document.querySelector("#courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
  // Пробный КТ — публичный, не требует авторизации
  const handleTrialExam = () => navigate(EXAM_CTA.route);

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh", overflowX: "hidden" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:${COLORS.accent}30}
        .nav-link{font-size:.82rem;font-weight:600;color:${COLORS.textMuted};cursor:pointer;transition:color .18s}
        .nav-link:hover{color:${COLORS.accent}}
        .logo-link{display:inline-flex;align-items:center;font-family:${FONTS.display};font-size:1.28rem;font-weight:900;letter-spacing:-.01em;color:${COLORS.textBody};cursor:pointer;width:fit-content;transition:opacity .18s ease,filter .18s ease,transform .18s ease}
        .logo-link:hover{opacity:.72;filter:brightness(1.04);transform:translateY(-1px)}
        .btn-red{background:${COLORS.accent};color:#fff;border:none;padding:.7rem 1.75rem;border-radius:8px;font-family:${FONTS.body};font-weight:700;font-size:.875rem;cursor:pointer;transition:all .18s}
        .btn-red:hover{background:${COLORS.accentHover};transform:translateY(-1px)}
        .btn-ghost{background:transparent;color:${COLORS.textBody};border:1px solid rgba(255,255,255,.15);padding:.7rem 1.75rem;border-radius:8px;font-family:${FONTS.body};font-weight:600;font-size:.875rem;cursor:pointer;transition:all .18s}
        .btn-ghost:hover{border-color:${COLORS.accent};color:${COLORS.accent}}
        .section-label{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${COLORS.accent};margin-bottom:.6rem}
        .chip{display:flex;align-items:center;gap:.7rem;background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:10px;padding:.8rem 1rem;transition:border-color .18s;cursor:pointer}
        .chip:hover{border-color:${COLORS.borderHover}}
        .step{background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:12px;padding:1.6rem;transition:border-color .18s}
        .step:hover{border-color:rgba(255,58,58,.3)}
        .feat-tag{font-size:.72rem;font-weight:700;color:${COLORS.accentText};background:${COLORS.accentSoft};border:1px solid ${COLORS.accentBorder};border-radius:6px;padding:.3rem .7rem}
        .footer-link{font-size:.72rem;color:${COLORS.textGhost};cursor:pointer;transition:color .18s}
        .footer-link:hover{color:${COLORS.accent}}
        @keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .f1{animation:fu .55s .05s ease forwards;opacity:0}
        .f2{animation:fu .55s .18s ease forwards;opacity:0}
        .f3{animation:fu .55s .3s ease forwards;opacity:0}
        .f4{animation:fu .55s .42s ease forwards;opacity:0}
        @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .bob{animation:bob 5s ease-in-out infinite}
        .num{font-variant-numeric:tabular-nums lining-nums;font-feature-settings:"tnum","lnum";letter-spacing:0;text-rendering:optimizeLegibility}
      `}</style>

      <LandingNav scrolled={scrolled} isAuth={isAuth} onAction={handleAction} onCTA={handleCTA} />

      <LandingHero left={left} onCTA={handleCTA} onCourses={handleCourses} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2.5rem" }}>
        <div style={{ height: "1px", background: COLORS.border }} />
      </div>

      <LandingCourses onCTA={handleCTA} />

      <LandingHowItWorks />

      <LandingExamCta onStart={handleTrialExam} />

      <LandingFooter onAction={handleAction} />
    </div>
  );
}
