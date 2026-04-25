// src/pages/Exam/ExamSessionPage.tsx
// Полный экзамен КТ с реальным API
// Route: /exam/session (protected)

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { API_BASE } from "@/api/auth";
import { COLORS, FONTS } from "@/pages/Dashboard/dashboard.config";

// ─── Types ────────────────────────────────────────────────────

interface ExamProblem {
  id:      number;
  type:    string;
  content: unknown;
  image:   string | null;
  audio:   string | null;
  options: string[];
}

interface ExamSubject {
  name:          string;
  total_problem: number;
  max_score:     number;
  problems:      ExamProblem[];
}

interface ExamData {
  total_duration_sec:  number;
  total_problem_count: number;
  total_score_sum:     number;
  subjects:            ExamSubject[];
}

interface CheckProblem {
  id:          number;
  correct:     number[];
  selected:    number[] | null;
  explanation: string | null;
  is_correct:  boolean;
}

interface CheckSubject {
  name:           string;
  total_score_get: number;
  problems:       CheckProblem[];
}

interface CheckResult {
  total_get_score: number;
  total_score_sum: number;
  subjects:        CheckSubject[];
}

// Flat question entry for navigation
interface FlatQ extends ExamProblem {
  subjectName:  string;
  subjectIdx:   number;
  localIdx:     number;
}

type Phase = "loading" | "exam" | "checking" | "result";

// ─── Helpers ──────────────────────────────────────────────────

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");
function formatTime(sec: number) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(ss)}`;
  return `${pad2(m)}:${pad2(ss)}`;
}

// ─── TipTap renderer ──────────────────────────────────────────

type TipTapNodeData = {
  type:    string;
  text?:   string;
  content?: TipTapNodeData[];
  marks?:  { type: string; attrs?: Record<string, unknown> }[];
  attrs?:  Record<string, unknown>;
};

function TTNode({ n }: { n: TipTapNodeData }): React.ReactElement | null {
  if (n.type === "text") {
    let el: React.ReactNode = n.text ?? "";
    for (const m of n.marks ?? []) {
      if (m.type === "bold")   el = <strong>{el}</strong>;
      if (m.type === "italic") el = <em>{el}</em>;
      if (m.type === "code")   el = <code style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", padding: "0 .3em", fontFamily: "ui-monospace,monospace", fontSize: ".85em" }}>{el}</code>;
    }
    return <>{el}</>;
  }

  const kids = Array.isArray(n.content) ? n.content.map((c, i) => <TTNode key={i} n={c} />) : null;

  switch (n.type) {
    case "doc":         return <>{kids}</>;
    case "paragraph":   return <p style={{ marginBottom: ".65rem", lineHeight: 1.65 }}>{kids}</p>;
    case "hardBreak":   return <br />;
    case "heading": {
      const lv = (n.attrs?.level as number) ?? 2;
      const Tag = `h${lv}` as "h1"|"h2"|"h3"|"h4"|"h5"|"h6";
      return <Tag style={{ fontWeight: 800, marginBottom: ".5rem", lineHeight: 1.3 }}>{kids}</Tag>;
    }
    case "bulletList":  return <ul style={{ paddingLeft: "1.4rem", marginBottom: ".65rem" }}>{kids}</ul>;
    case "orderedList": return <ol style={{ paddingLeft: "1.4rem", marginBottom: ".65rem" }}>{kids}</ol>;
    case "listItem":    return <li style={{ marginBottom: ".25rem" }}>{kids}</li>;
    case "blockquote":  return (
      <blockquote style={{ borderLeft: "3px solid rgba(255,255,255,0.1)", paddingLeft: ".9rem", color: "#B4B4D8", marginBottom: ".65rem" }}>
        {kids}
      </blockquote>
    );
    case "codeBlock":   return (
      <pre style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: ".75rem 1rem", marginBottom: ".65rem", overflowX: "auto" }}>
        <code style={{ fontFamily: "ui-monospace,monospace", fontSize: ".82rem", color: "#7BB8FF" }}>{kids}</code>
      </pre>
    );
    case "table":       return (
      <div style={{ overflowX: "auto", marginBottom: ".75rem" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: ".85rem" }}>
          <tbody>{kids}</tbody>
        </table>
      </div>
    );
    case "tableRow":    return <tr>{kids}</tr>;
    case "tableHeader": return (
      <th style={{ border: "1px solid rgba(255,255,255,0.1)", padding: ".45rem .75rem", background: "rgba(255,255,255,0.05)", fontWeight: 700, textAlign: "left", color: "#FAFAFF" }}>
        {kids}
      </th>
    );
    case "tableCell":   return (
      <td style={{ border: "1px solid rgba(255,255,255,0.07)", padding: ".45rem .75rem", verticalAlign: "top", color: "#F0F0FF" }}>
        {kids}
      </td>
    );
    default:            return <>{kids}</>;
  }
}

function TipTapContent({ content }: { content: unknown }) {
  if (typeof content === "string") return <p style={{ lineHeight: 1.65 }}>{content}</p>;
  if (!content || typeof content !== "object") return null;
  const obj = content as Record<string, unknown>;
  if (typeof obj.text === "string") return <p style={{ lineHeight: 1.65 }}>{obj.text}</p>;
  // Unwrap double-wrapped content: { content: { type: "doc", ... } }
  const node = (!obj.type && obj.content && typeof obj.content === "object" && !Array.isArray(obj.content))
    ? obj.content as TipTapNodeData
    : obj as TipTapNodeData;
  return <TTNode n={node} />;
}

// ─── Custom audio player ──────────────────────────────────────
function AudioPlayer({ src }: { src: string }) {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume,   setVolume]   = useState(1);
  const [muted,    setMuted]    = useState(false);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause(); else a.play();
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !muted;
    setMuted(!muted);
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div style={{
      marginTop: "1rem", background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`, borderRadius: "12px",
      padding: ".85rem 1.1rem", display: "flex", alignItems: "center", gap: "1rem",
    }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={e => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        style={{
          width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0, cursor: "pointer",
          background: COLORS.accent, border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background .15s, transform .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = COLORS.accentHover; e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = COLORS.accent; e.currentTarget.style.transform = "scale(1)"; }}
      >
        {playing
          ? <svg width="10" height="12" viewBox="0 0 10 12" fill="#fff"><rect x="0" y="0" width="3.5" height="12" rx="1"/><rect x="6.5" y="0" width="3.5" height="12" rx="1"/></svg>
          : <svg width="11" height="12" viewBox="0 0 11 12" fill="#fff"><path d="M1 1l9 5-9 5V1z"/></svg>
        }
      </button>

      {/* Time */}
      <span style={{ fontFamily: FONTS.display, fontSize: ".75rem", fontWeight: 700, color: COLORS.textFaint, flexShrink: 0, fontVariantNumeric: "tabular-nums", minWidth: "70px" }}>
        {fmt(current)} / {fmt(duration)}
      </span>

      {/* Seek bar */}
      <div style={{ flex: 1, position: "relative", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", cursor: "pointer" }}>
        <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: COLORS.accent, borderRadius: "2px", pointerEvents: "none" }} />
        <input
          type="range" min={0} max={duration || 1} step={0.01} value={current}
          onChange={seek}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", margin: 0,
          }}
        />
      </div>

      {/* Mute */}
      <button
        onClick={toggleMute}
        style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px", flexShrink: 0, opacity: muted ? 0.45 : 1, transition: "opacity .15s" }}
      >
        {muted
          ? <svg width="18" height="16" viewBox="0 0 18 16" fill="none"><path d="M1 5h3l5-4v14l-5-4H1V5z" fill={COLORS.textFaint}/><line x1="13" y1="5" x2="17" y2="11" stroke={COLORS.accent} strokeWidth="1.5" strokeLinecap="round"/><line x1="17" y1="5" x2="13" y2="11" stroke={COLORS.accent} strokeWidth="1.5" strokeLinecap="round"/></svg>
          : <svg width="18" height="16" viewBox="0 0 18 16" fill="none"><path d="M1 5h3l5-4v14l-5-4H1V5z" fill={COLORS.textFaint}/><path d="M13 4c1.5 1 2.5 2.8 2.5 5s-1 4-2.5 5" stroke={COLORS.textFaint} strokeWidth="1.5" strokeLinecap="round"/></svg>
        }
      </button>

      {/* Volume */}
      <div style={{ position: "relative", width: "64px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, width: `${(muted ? 0 : volume) * 100}%`, background: COLORS.accent, borderRadius: "2px", pointerEvents: "none" }} />
        <input
          type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
          onChange={changeVolume}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }}
        />
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb{
          -webkit-appearance:none;width:14px;height:14px;
          border-radius:50%;background:${COLORS.accent};cursor:pointer;
          box-shadow:0 0 0 3px ${COLORS.accentSoft};
        }
        input[type=range]::-moz-range-thumb{
          width:14px;height:14px;border:none;
          border-radius:50%;background:${COLORS.accent};cursor:pointer;
        }
      `}</style>
    </div>
  );
}

// plain-text fallback for result list
function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: string; content?: unknown[] };
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) return n.content.map(extractText).join(" ").replace(/\s+/g, " ").trim();
  return "";
}
function problemText(content: unknown): string {
  if (typeof content === "string") return content;
  const obj = content as Record<string, unknown> | null;
  if (obj && typeof obj.text === "string") return obj.text;
  return extractText(content) || "—";
}

const SUBJECT_COLORS = ["#3A8EFF", "#FF3A3A", "#3AFFB4", "#FF9F3A", "#B43AFF"];
const subjectColor = (i: number) => SUBJECT_COLORS[i % SUBJECT_COLORS.length];

const EXAM_SESSION_KEY = "oqumi_exam_session";
interface SavedSession {
  examStartTime:  number;
  totalDuration:  number;
  profileSlug:    string | null;
  answers:        Record<number, number[]>;
  examData:       ExamData;
}
function loadSession(profileSlug: string | null): SavedSession | null {
  try {
    const raw = localStorage.getItem(EXAM_SESSION_KEY);
    if (!raw) return null;
    const s: SavedSession = JSON.parse(raw);
    if (s.profileSlug !== profileSlug) return null;
    return s;
  } catch { return null; }
}
function saveSession(patch: Partial<SavedSession>) {
  try {
    const raw = localStorage.getItem(EXAM_SESSION_KEY);
    const prev: SavedSession = raw ? JSON.parse(raw) : {};
    localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch { /* quota exceeded or private mode */ }
}
function clearSession() {
  try { localStorage.removeItem(EXAM_SESSION_KEY); } catch { /* ignore */ }
}

// ─── Main component ────────────────────────────────────────────

export default function ExamSessionPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const accessToken = useAuthStore(s => s.accessToken);
  const profileSlug = (location.state as { profileSlug?: string | null } | null)?.profileSlug ?? null;

  const [phase,       setPhase]       = useState<Phase>("loading");
  const [examData,    setExamData]    = useState<ExamData | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [current,     setCurrent]     = useState(0);
  const [answers,     setAnswers]     = useState<Record<number, number[]>>({});
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [activeTab,   setActiveTab]   = useState(0);
  const [resultTab,   setResultTab]   = useState(0);
  const timerRef    = useRef<number | null>(null);
  const fetched     = useRef(false);
  const answersRef  = useRef<Record<number, number[]>>({});

  // ── Fetch exam ──────────────────────────────────────────────
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    // Restore saved session if available
    const saved = loadSession(profileSlug);
    if (saved) {
      const elapsed    = Math.floor((Date.now() - saved.examStartTime) / 1000);
      const remaining  = saved.totalDuration - elapsed;
      if (remaining > 0) {
        setExamData(saved.examData);
        setAnswers(saved.answers);
        answersRef.current = saved.answers;
        setTimeLeft(remaining);
        setPhase("exam");
        return;
      }
      // Time expired while away — clear and submit empty
      clearSession();
    }

    const url = profileSlug
      ? `${API_BASE}/exam/?subject=${encodeURIComponent(profileSlug)}`
      : `${API_BASE}/exam/`;

    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: ExamData | null) => {
        if (!data) { navigate("/exam", { replace: true }); return; }
        setExamData(data);
        setTimeLeft(data.total_duration_sec);
        setPhase("exam");
        saveSession({
          examStartTime: Date.now(),
          totalDuration: data.total_duration_sec,
          profileSlug,
          answers: {},
          examData: data,
        });
      })
      .catch(() => navigate("/exam", { replace: true }));
  }, [accessToken, profileSlug, navigate]);

  // ── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "exam") return;
    const start   = Date.now();
    const initial = timeLeft;
    timerRef.current = window.setInterval(() => {
      const next = initial - Math.floor((Date.now() - start) / 1000);
      if (next <= 0) { setTimeLeft(0); submitExam(); }
      else setTimeLeft(next);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flat question list ──────────────────────────────────────
  const flatQ = useMemo<FlatQ[]>(() => {
    if (!examData) return [];
    return examData.subjects.flatMap((s, si) =>
      s.problems.map((p, li) => ({ ...p, subjectName: s.name, subjectIdx: si, localIdx: li }))
    );
  }, [examData]);

  // Sync active subject tab when navigating questions
  useEffect(() => {
    if (flatQ.length > 0) setActiveTab(flatQ[current]?.subjectIdx ?? 0);
  }, [current, flatQ]);

  const subjectStart = useMemo(() => {
    if (!examData) return [];
    let acc = 0;
    return examData.subjects.map(s => { const v = acc; acc += s.problems.length; return v; });
  }, [examData]);

  // ── Answer toggling ─────────────────────────────────────────
  const toggleAnswer = (qId: number, optIdx: number, type: string) => {
    setAnswers(prev => {
      const cur = prev[qId] ?? [];
      const next = type === "single"
        ? cur.includes(optIdx) ? [] : [optIdx]
        : cur.includes(optIdx) ? cur.filter(x => x !== optIdx) : [...cur, optIdx];
      const updated = { ...prev, [qId]: next };
      answersRef.current = updated;
      saveSession({ answers: updated });
      return updated;
    });
  };

  // ── Submit ──────────────────────────────────────────────────
  const submitExam = async () => {
    if (!examData) return;
    if (timerRef.current) clearInterval(timerRef.current);
    clearSession();
    setPhase("checking");

    const snapshot = answersRef.current;
    const payload = examData.subjects.map(s => ({
      name: s.name,
      problems: s.problems.map(p => ({
        id:       p.id,
        selected: (snapshot[p.id] ?? []).length > 0 ? snapshot[p.id] : null,
      })),
    }));

    try {
      const res = await fetch(`${API_BASE}/exam/check/`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data: CheckResult = res.ok ? await res.json() : {
        total_get_score: 0,
        total_score_sum: examData.total_score_sum,
        subjects: examData.subjects.map(s => ({
          name: s.name, total_score_get: 0,
          problems: s.problems.map(p => ({ id: p.id, correct: [], selected: snapshot[p.id] ?? null, explanation: null, is_correct: false })),
        })),
      };
      setCheckResult(data);
      setResultTab(0);
      setPhase("result");
    } catch {
      setPhase("result");
    }
  };

  // ─── Loading ───────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div style={{ background: COLORS.bgPage, minHeight: "100vh", fontFamily: FONTS.body }}>
        <link href={FONTS.googleUrl} rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
          .skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);background-size:1200px 100%;animation:shimmer 1.4s infinite;border-radius:8px}
        `}</style>
        <nav style={{ padding: ".9rem 2rem", background: `${COLORS.bgPage}EC`, backdropFilter: "blur(14px)", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="skel" style={{ width: "100px", height: "20px" }} />
          <div className="skel" style={{ width: "80px", height: "32px", borderRadius: "8px" }} />
        </nav>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 200px", gap: "1.25rem" }}>
          <div>
            <div className="skel" style={{ height: "14px", width: "120px", marginBottom: "1rem" }} />
            <div className="skel" style={{ height: "80px", marginBottom: "1.5rem" }} />
            {[0,1,2,3].map(i => <div key={i} className="skel" style={{ height: "50px", marginBottom: ".6rem" }} />)}
          </div>
          <div className="skel" style={{ height: "300px" }} />
        </div>
      </div>
    );
  }

  if (!examData) return null;

  // ─── Result phase ──────────────────────────────────────────
  if (phase === "result" && checkResult) {
    const tabSub   = checkResult.subjects[resultTab];
    const pct      = checkResult.total_score_sum > 0
      ? Math.round((checkResult.total_get_score / checkResult.total_score_sum) * 100)
      : 0;
    const grade    = pct >= 85 ? { label: "Отлично",     color: "#4ADE80" }
                   : pct >= 65 ? { label: "Хорошо",      color: "#60A5FA" }
                   : pct >= 45 ? { label: "Удовлетворит.", color: "#FBBF24" }
                   :             { label: "Не сдан",      color: COLORS.accent };

    return (
      <div style={{ background: COLORS.bgPage, minHeight: "100vh", fontFamily: FONTS.body, color: COLORS.textBody }}>
        <link href={FONTS.googleUrl} rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
          @keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
          .fu1{animation:fadeUp .45s ease both .05s}
          .fu2{animation:fadeUp .45s ease both .15s}
          .fu3{animation:fadeUp .45s ease both .26s}
          .fu4{animation:fadeUp .45s ease both .36s}
          .num{font-variant-numeric:tabular-nums lining-nums;font-feature-settings:"tnum","lnum"}

          .r-tab{
            padding:.5rem 1.1rem;border-radius:8px;font-size:.82rem;font-weight:700;
            cursor:pointer;border:1.5px solid transparent;
            font-family:${FONTS.body};color:${COLORS.textFaint};
            background:transparent;transition:all .16s;display:flex;align-items:center;gap:.5rem
          }
          .r-tab.active{color:${COLORS.textPrimary};border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)}
          .r-tab:hover:not(.active){color:${COLORS.textMuted};background:rgba(255,255,255,0.03)}

          .q-row{
            padding:1rem 1.25rem;border-radius:12px;margin-bottom:.6rem;
            border:1px solid transparent;display:flex;align-items:flex-start;gap:1rem;
            transition:transform .16s
          }
          .q-row:hover{transform:translateX(2px)}
          .q-row.correct{background:rgba(34,197,94,0.05);border-color:rgba(34,197,94,0.18)}
          .q-row.wrong{background:rgba(255,58,58,0.05);border-color:rgba(255,58,58,0.16)}
          .q-row.skipped{background:rgba(255,255,255,0.02);border-color:rgba(255,255,255,0.06)}

          .sub-card{
            background:${COLORS.bgCard};border:1px solid ${COLORS.border};
            border-radius:14px;padding:1.25rem 1.4rem;
            display:flex;flex-direction:column;gap:.6rem;overflow:hidden;position:relative
          }
          .progress-bar-bg{height:4px;border-radius:2px;background:rgba(255,255,255,0.06);overflow:hidden}
          .progress-bar-fill{height:100%;border-radius:2px;transition:width .6s ease}

          .badge{
            display:inline-flex;align-items:center;padding:.25rem .7rem;
            border-radius:20px;font-size:.72rem;font-weight:700;letter-spacing:.04em
          }
        `}</style>

        {/* Nav */}
        <nav style={{ padding: ".9rem 2rem", background: `${COLORS.bgPage}EC`, backdropFilter: "blur(14px)", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div
            onClick={() => navigate("/exam")}
            style={{ fontFamily: FONTS.display, fontSize: "1.28rem", fontWeight: 800, color: COLORS.textBody, cursor: "pointer", transition: "opacity .18s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = ".72")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Oqu<span style={{ color: COLORS.accent }}>Mi</span>
          </div>
        </nav>

        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 3rem 5rem" }}>

          {/* ── Hero score ── */}
          <div className="fu1" style={{ display: "flex", alignItems: "center", gap: "2.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "20px", padding: "2rem 2.5rem", marginBottom: "1.5rem" }}>

            {/* Big score number */}
            <div style={{ flexShrink: 0, textAlign: "center", minWidth: "130px" }}>
              <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".4rem" }}>
                Результат
              </p>
              <div className="num" style={{ fontFamily: FONTS.display, fontSize: "clamp(3.2rem,7vw,4.5rem)", fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1 }}>
                {checkResult.total_get_score}
              </div>
              <p style={{ fontSize: ".82rem", color: COLORS.textFaint, marginTop: ".3rem" }}>
                из {checkResult.total_score_sum}
              </p>
            </div>

            {/* Divider */}
            <div style={{ width: "1px", alignSelf: "stretch", background: COLORS.border, flexShrink: 0 }} />

            {/* Right: grade + progress */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <span
                  className="badge"
                  style={{ background: `${grade.color}18`, border: `1px solid ${grade.color}40`, color: grade.color }}
                >
                  {grade.label}
                </span>
                <span className="num" style={{ fontSize: "1rem", fontWeight: 700, color: COLORS.textMuted }}>
                  {pct}%
                </span>
              </div>

              {/* Overall progress bar */}
              <div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: grade.color }} />
                </div>
              </div>

              {/* Correct / wrong counts */}
              <div style={{ display: "flex", gap: "1.75rem" }}>
                {(() => {
                  const total   = checkResult.subjects.reduce((s, sub) => s + sub.problems.length, 0);
                  const correct = checkResult.subjects.reduce((s, sub) => s + sub.problems.filter(p => p.is_correct).length, 0);
                  const wrong   = total - correct;
                  return (
                    <>
                      <div>
                        <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".2rem" }}>Верно</p>
                        <p className="num" style={{ fontFamily: FONTS.display, fontSize: "1.3rem", fontWeight: 800, color: "#4ADE80" }}>{correct}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".2rem" }}>Неверно</p>
                        <p className="num" style={{ fontFamily: FONTS.display, fontSize: "1.3rem", fontWeight: 800, color: COLORS.accent }}>{wrong}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".2rem" }}>Вопросов</p>
                        <p className="num" style={{ fontFamily: FONTS.display, fontSize: "1.3rem", fontWeight: 800, color: COLORS.textPrimary }}>{total}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ── Subject cards ── */}
          <div className="fu2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: ".85rem", marginBottom: "2rem" }}>
            {checkResult.subjects.map((s, i) => {
              const maxScore  = examData.subjects.find(es => es.name === s.name)?.max_score ?? 0;
              const subPct    = maxScore > 0 ? Math.round((s.total_score_get / maxScore) * 100) : 0;
              const color     = subjectColor(i);
              const correct   = s.problems.filter(p => p.is_correct).length;
              return (
                <div key={s.name} className="sub-card">
                  {/* Color top accent */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: color, borderRadius: "14px 14px 0 0" }} />

                  <p style={{ fontSize: ".62rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".1em", marginTop: ".25rem" }}>
                    {s.name}
                  </p>

                  <div style={{ display: "flex", alignItems: "flex-end", gap: ".5rem" }}>
                    <div className="num" style={{ fontFamily: FONTS.display, fontSize: "2rem", fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1 }}>
                      {s.total_score_get}
                    </div>
                    <span style={{ fontSize: ".78rem", color: COLORS.textFaint, paddingBottom: ".2rem" }}>
                      / {maxScore > 0 ? maxScore : "?"} балл.
                    </span>
                  </div>

                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${subPct}%`, background: color }} />
                  </div>

                  <p style={{ fontSize: ".7rem", color: COLORS.textFaint }}>
                    {correct} из {s.problems.length} верно · {subPct}%
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Per-question breakdown ── */}
          <div className="fu3">

            {/* Section label */}
            <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: "1rem" }}>
              Разбор вопросов
            </p>

            {/* Tabs */}
            <div style={{ display: "flex", gap: ".4rem", marginBottom: "1.25rem", flexWrap: "wrap", justifyContent: "center", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: ".4rem" }}>
              {checkResult.subjects.map((s, i) => {
                const correct = s.problems.filter(p => p.is_correct).length;
                const color   = subjectColor(i);
                return (
                  <button key={s.name} className={`r-tab${resultTab === i ? " active" : ""}`} onClick={() => setResultTab(i)}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                    {s.name}
                    <span style={{
                      padding: ".1rem .45rem", borderRadius: "20px", fontSize: ".68rem", fontWeight: 700,
                      background: resultTab === i ? `${color}18` : "transparent",
                      color: resultTab === i ? color : COLORS.textFaint,
                    }}>
                      {correct}/{s.problems.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Question rows */}
            {tabSub && (
              <div className="fu4">
                {tabSub.problems.map((p, i) => {
                  const orig     = examData.subjects.find(s => s.name === tabSub.name)?.problems.find(pr => pr.id === p.id);
                  const skipped  = !p.selected || p.selected.length === 0;
                  const rowClass = p.is_correct ? "correct" : skipped ? "skipped" : "wrong";
                  return (
                    <div key={p.id} className={`q-row ${rowClass}`}>

                      {/* Index badge */}
                      <div style={{
                        flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: p.is_correct ? "rgba(74,222,128,0.12)" : skipped ? "rgba(255,255,255,0.05)" : "rgba(255,58,58,0.1)",
                        border: `1px solid ${p.is_correct ? "rgba(74,222,128,0.25)" : skipped ? "rgba(255,255,255,0.08)" : "rgba(255,58,58,0.22)"}`,
                      }}>
                        <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: ".65rem", color: p.is_correct ? "#4ADE80" : skipped ? COLORS.textFaint : COLORS.accent }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: ".86rem", fontWeight: 600, color: COLORS.textPrimary, marginBottom: ".45rem", lineHeight: 1.55 }}>
                          {orig ? problemText(orig.content) : `Вопрос ${p.id}`}
                        </p>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem .9rem" }}>
                          {orig && p.correct.length > 0 && (
                            <span style={{ fontSize: ".75rem", color: "#4ADE80", display: "flex", alignItems: "center", gap: ".3rem" }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              {p.correct.map(ci => orig.options[ci]).filter(Boolean).join(", ")}
                            </span>
                          )}
                          {!p.is_correct && !skipped && p.selected && orig && (
                            <span style={{ fontSize: ".75rem", color: "#FF6B6B", display: "flex", alignItems: "center", gap: ".3rem" }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round"/></svg>
                              {p.selected.map(si => orig.options[si]).filter(Boolean).join(", ")}
                            </span>
                          )}
                          {skipped && (
                            <span style={{ fontSize: ".75rem", color: COLORS.textFaint }}>Пропущен</span>
                          )}
                        </div>

                        {p.explanation && (
                          <div style={{ marginTop: ".5rem", padding: ".5rem .75rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", borderLeft: `3px solid ${COLORS.border}` }}>
                            <p style={{ fontSize: ".74rem", color: COLORS.textMuted, lineHeight: 1.6 }}>
                              {p.explanation}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status icon */}
                      <div style={{
                        flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: p.is_correct ? "rgba(74,222,128,0.15)" : skipped ? "rgba(255,255,255,0.04)" : "rgba(255,58,58,0.12)",
                      }}>
                        {p.is_correct
                          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#4ADE80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : skipped
                            ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v4M5 7.5v.5" stroke="#7878A8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    );
  }

  // ─── Exam phase ────────────────────────────────────────────
  const q            = flatQ[current];
  const sel          = answers[q?.id] ?? [];
  const answeredCount = flatQ.filter(fq => (answers[fq.id] ?? []).length > 0).length;
  const warn         = timeLeft <= 300 && timeLeft > 0;
  const activeSub    = examData.subjects[activeTab];

  return (
    <div style={{ background: COLORS.bgPage, minHeight: "100vh", fontFamily: FONTS.body, color: COLORS.textBody }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#FF3A3A30}
        .num{font-variant-numeric:tabular-nums lining-nums;font-feature-settings:"tnum","lnum"}

        .opt{
          background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:10px;
          padding:.85rem 1rem;cursor:pointer;transition:all .18s;
          display:flex;align-items:flex-start;gap:.75rem;
          font-size:.9rem;line-height:1.55;text-align:left;color:${COLORS.textBody};
          font-family:${FONTS.body};width:100%;
        }
        .opt:hover:not(.chosen){border-color:rgba(255,58,58,.28);background:rgba(255,58,58,0.04)}
        .opt.chosen{border-color:${COLORS.accent};background:${COLORS.accentSoft}}

        .q-cell{
          width:34px;height:34px;border-radius:6px;
          display:flex;align-items:center;justify-content:center;
          font-size:.72rem;font-weight:700;cursor:pointer;
          border:1.5px solid rgba(255,255,255,0.06);
          color:${COLORS.textFaint};background:transparent;
          transition:all .14s;font-family:${FONTS.body};
        }
        .q-cell:hover:not(.cur){border-color:rgba(255,58,58,.3);color:${COLORS.textMuted}}
        .q-cell.ans{background:rgba(58,142,255,0.12);border-color:rgba(58,142,255,0.32);color:#7BB8FF}
        .q-cell.cur{border-color:${COLORS.accent}!important;color:${COLORS.textPrimary}!important;background:${COLORS.accentSoft}!important}

        .sub-tab{
          padding:.42rem .9rem;border-radius:7px;font-size:.78rem;font-weight:700;
          cursor:pointer;transition:all .16s;border:1.5px solid transparent;
          font-family:${FONTS.body};color:${COLORS.textFaint};background:transparent;
          width:100%;text-align:left;
        }
        .sub-tab:hover:not(.active){color:${COLORS.textMuted}}

        .btn-ghost{background:transparent;color:${COLORS.textBody};border:1px solid rgba(255,255,255,.13);padding:.7rem 1.75rem;border-radius:8px;font-family:${FONTS.body};font-weight:600;font-size:.875rem;cursor:pointer;transition:all .18s}
        .btn-ghost:hover{border-color:${COLORS.accent};color:${COLORS.accent}}
        .btn-ghost:disabled{opacity:.35;pointer-events:none}
        .btn-red{background:${COLORS.accent};color:#fff;border:none;padding:.7rem 1.75rem;border-radius:8px;font-family:${FONTS.body};font-weight:700;font-size:.875rem;cursor:pointer;transition:all .18s}
        .btn-red:hover{background:${COLORS.accentHover};transform:translateY(-1px)}

        @keyframes timerPulse{0%,100%{opacity:1}50%{opacity:.65}}
        .timer-warn{color:${COLORS.accent}!important;animation:timerPulse 1s ease-in-out infinite}
      `}</style>

      {/* ── Nav (TrialExam style) ── */}
      <nav className="exam-nav" style={{
        padding: ".7rem 1.75rem",
        background: `${COLORS.bgPage}F2`, backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 200, gap: "1.5rem",
      }}>
        {/* Logo */}
        <div style={{ fontFamily: FONTS.display, fontSize: "1.28rem", fontWeight: 800, color: COLORS.textBody, flexShrink: 0 }}>
          Oqu<span style={{ color: COLORS.accent }}>Mi</span>
        </div>

        {/* Center group */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>

          {/* Timer */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: ".6rem", fontWeight: 700, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: ".15rem" }}>
              Осталось
            </div>
            <div className={`num${warn ? " timer-warn" : ""}`} style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: "1.55rem", letterSpacing: "-.01em", color: COLORS.textPrimary }}>
              {formatTime(timeLeft)}
            </div>
          </div>

          <div style={{ width: "1px", height: "36px", background: COLORS.border }} />

          {/* Per-subject answered counters */}
          <div className="exam-nav-subjects" style={{ display: "flex", gap: "1.25rem" }}>
            {examData.subjects.map((s, i) => {
              const color = subjectColor(i);
              const cnt   = s.problems.filter(p => (answers[p.id] ?? []).length > 0).length;
              return (
                <div
                  key={s.name}
                  style={{ textAlign: "center", cursor: "pointer", opacity: activeTab === i ? 1 : 0.55, transition: "opacity .18s" }}
                  onClick={() => { setActiveTab(i); setCurrent(subjectStart[i]); }}
                >
                  <div style={{ fontSize: ".6rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".15rem" }}>
                    {s.name}
                  </div>
                  <div className="num" style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: ".95rem", color: COLORS.textPrimary }}>
                    {cnt}<span style={{ fontSize: ".75rem", fontWeight: 400, color: COLORS.textFaint }}>/{s.problems.length}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ width: "1px", height: "36px", background: COLORS.border }} />

          {/* Total */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: ".6rem", fontWeight: 700, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: ".15rem" }}>
              Всего
            </div>
            <div className="num" style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: ".95rem", color: COLORS.textPrimary }}>
              {answeredCount}<span style={{ fontSize: ".75rem", fontWeight: 400, color: COLORS.textFaint }}>/{flatQ.length}</span>
            </div>
          </div>
        </div>

        {/* Finish button */}
        <button
          style={{ background: COLORS.accentSoft, color: COLORS.accent, border: `1px solid ${COLORS.accentBorder}`, borderRadius: "8px", padding: ".45rem 1.1rem", fontFamily: FONTS.body, fontWeight: 700, fontSize: ".8rem", cursor: "pointer", transition: "all .18s", whiteSpace: "nowrap", flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = COLORS.accent; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = COLORS.accentSoft; e.currentTarget.style.color = COLORS.accent; }}
          onClick={submitExam}
          disabled={phase === "checking"}
        >
          {phase === "checking" ? "Проверяем…" : "Завершить тест"}
        </button>
      </nav>

      {/* ── Body ── */}
      <div className="exam-grid" style={{ maxWidth: "1160px", margin: "0 auto", padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 248px", gap: "1.25rem", alignItems: "start" }}>

        {/* ── Question area ── */}
        {q && (
          <div>
            {/* Subject badge + question number */}
            <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: subjectColor(q.subjectIdx) }} />
                <span style={{ fontSize: ".68rem", fontWeight: 700, color: subjectColor(q.subjectIdx), textTransform: "uppercase", letterSpacing: ".09em" }}>
                  {q.subjectName}
                </span>
              </div>
              <div style={{ width: "1px", height: "10px", background: COLORS.border }} />
              <span className="num" style={{ fontSize: ".7rem", color: COLORS.textFaint }}>
                Вопрос {q.localIdx + 1} из {examData.subjects[q.subjectIdx].problems.length}
              </span>
              {sel.length > 0 && (
                <>
                  <div style={{ width: "1px", height: "10px", background: COLORS.border }} />
                  <span style={{ fontSize: ".7rem", fontWeight: 700, color: "#4ADE80" }}>✓ Отмечен</span>
                </>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: "3px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", marginBottom: "1.1rem", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${((q.localIdx + 1) / examData.subjects[q.subjectIdx].problems.length) * 100}%`,
                background: subjectColor(q.subjectIdx),
                borderRadius: "2px", transition: "width .28s ease",
              }} />
            </div>

            {/* Question card */}
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.5rem 1.75rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "1rem", color: COLORS.textPrimary, lineHeight: 1.72, fontWeight: 600 }}>
                <TipTapContent content={q.content} />
              </div>
              {q.image && (
                <img src={q.image} alt="" style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "10px", marginTop: "1rem", display: "block" }} />
              )}
              {q.audio && <AudioPlayer src={q.audio} />}
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: "1.5rem" }}>
              {q.options.map((opt, oi) => {
                const isChosen = sel.includes(oi);
                return (
                  <button
                    key={oi}
                    className={`opt${isChosen ? " chosen" : ""}`}
                    onClick={() => toggleAnswer(q.id, oi, q.type)}
                  >
                    <div style={{
                      width: "26px", height: "26px",
                      borderRadius: q.type === "single" ? "50%" : "6px",
                      flexShrink: 0,
                      border: `1.5px solid ${isChosen ? COLORS.accent : "rgba(255,255,255,0.1)"}`,
                      background: isChosen ? COLORS.accentSoft : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".7rem", fontWeight: 800,
                      color: isChosen ? COLORS.accent : COLORS.textFaint,
                      transition: "all .15s",
                    }}>
                      {String.fromCharCode(65 + oi)}
                    </div>
                    <span style={{ paddingTop: "1px" }}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
              <button className="btn-ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
                ← Предыдущий
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn-red" onClick={() => { if (current < flatQ.length - 1) setCurrent(c => c + 1); else submitExam(); }}>
                {current < flatQ.length - 1 ? "Следующий →" : "Завершить тест"}
              </button>
            </div>
          </div>
        )}

        {/* ── Sidebar ── */}
        <div className="exam-sidebar-wrap" style={{ position: "sticky", top: "76px", display: "flex", flexDirection: "column", gap: ".75rem" }}>

          {/* Subject tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
            {examData.subjects.map((s, i) => {
              const color = subjectColor(i);
              const isAct = activeTab === i;
              return (
                <button
                  key={s.name}
                  className={`sub-tab${isAct ? " active" : ""}`}
                  style={{ borderColor: isAct ? color + "40" : "transparent", color: isAct ? color : undefined, background: isAct ? color + "0D" : undefined }}
                  onClick={() => { setActiveTab(i); setCurrent(subjectStart[i]); }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>

          {/* Question grid */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: ".9rem" }}>
            <div style={{ fontSize: ".62rem", fontWeight: 700, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: ".7rem" }}>
              {activeSub?.name}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "3px" }}>
              {activeSub?.problems.map((p, li) => {
                const gi    = subjectStart[activeTab] + li;
                const isAns = (answers[p.id] ?? []).length > 0;
                const isCur = gi === current;
                return (
                  <button
                    key={p.id}
                    className={`q-cell${isCur ? " cur" : isAns ? " ans" : ""}`}
                    onClick={() => setCurrent(gi)}
                  >
                    {li + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: ".8rem", display: "flex", flexDirection: "column", gap: ".35rem", borderTop: `1px solid ${COLORS.border}`, paddingTop: ".7rem" }}>
              {[
                { color: "rgba(58,142,255,0.12)", border: "rgba(58,142,255,0.32)", label: "Отмечен" },
                { color: COLORS.accentSoft,       border: COLORS.accent,           label: "Текущий" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: ".45rem" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: item.color, border: `1.5px solid ${item.border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: ".65rem", color: COLORS.textFaint }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total counter */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: ".7rem 1rem", textAlign: "center" }}>
            <div className="num" style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: "1.1rem", color: COLORS.textPrimary }}>
              {answeredCount}<span style={{ fontWeight: 400, fontSize: ".75rem", color: COLORS.textFaint }}>/{flatQ.length}</span>
            </div>
            <div style={{ fontSize: ".62rem", color: COLORS.textFaint, marginTop: ".2rem", textTransform: "uppercase", letterSpacing: ".07em" }}>
              отмечено
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
