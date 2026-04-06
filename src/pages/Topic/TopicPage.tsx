// src/pages/Topic/TopicPage.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import ImageExtension from "@tiptap/extension-image";
import { createLowlight, common } from "lowlight";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { API_BASE, MEDIA_BASE } from "@/api/auth";

// ── Динамический импорт контента уроков и тестов (только для локальных slug) ──
const LESSON_CONTENT: Record<string, () => Promise<{ default: unknown }>> = {
  "relational-db": () => import("@/data/lessons/relational-db.json"),
};

const LESSON_QUIZ: Record<string, () => Promise<{ default: unknown[] }>> = {
  "relational-db": () => import("@/data/quizzes/relational-db.json"),
};

interface QuizQuestion {
  id:      number;
  type:    "single" | "multiple";
  text:    string;
  options: string[];
  correct: number[];
}

interface ApiLesson {
  id:          number;
  course:      number;
  course_name: string;
  title:       string;
  content:     object;
  image:       string | null;
  is_draft:    boolean;
  auto_test:   boolean;
  priority:    number;
}

/** Рекурсивно заменяет /media/... → http://127.0.0.1:8000/media/... в TipTap JSON */
function fixMediaUrls(node: unknown): unknown {
  if (!node || typeof node !== "object") return node;
  if (Array.isArray(node)) return node.map(fixMediaUrls);
  const obj = node as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (key === "src" && typeof val === "string" && val.startsWith("/media/")) {
      result[key] = `${MEDIA_BASE}${val}`;
    } else {
      result[key] = fixMediaUrls(val);
    }
  }
  return result;
}

const lowlight = createLowlight(common);

// ── TOC — извлечение заголовков из TipTap JSON ──────────────
interface TocItem { id: string; level: number; text: string }

function extractText(nodes: unknown[]): string {
  if (!Array.isArray(nodes)) return "";
  return nodes.map(n => {
    if (!n || typeof n !== "object") return "";
    const node = n as Record<string, unknown>;
    if (node.type === "text") return String(node.text ?? "");
    return extractText(node.content as unknown[]);
  }).join("");
}

function extractHeadings(content: unknown): TocItem[] {
  const items: TocItem[] = [];
  const seen: Record<string, number> = {};

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "heading") {
      const level = (n.attrs as Record<string, unknown>)?.level as number ?? 2;
      const text  = extractText(n.content as unknown[]);
      if (!text) return;
      const base = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      const slug = seen[base] ? `${base}-${seen[base]++}` : base;
      if (!seen[base]) seen[base] = 1;
      items.push({ id: slug, level, text });
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }

  walk(content);
  return items;
}

// ── Стили ────────────────────────────────────────────────────
const COLORS = {
  bgPage: "#0D0D11", bgCard: "#13131A", bgSidebar: "#0A0A0E",
  border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,58,58,0.3)",
  accent: "#FF3A3A", textPrimary: "#FAFAFF", textBody: "#F0F0FF",
  textMuted: "#8888AA", textFaint: "#44445A",
};
const FONTS = {
  display: "'Syne', sans-serif",
  body: "'Nunito', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Nunito:wght@400;600;700&display=swap",
};

function isNumericId(id: string | undefined): boolean {
  return !!id && /^\d+$/.test(id);
}

export default function TopicPage() {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Контекст от CoursePage (название модуля для хлебных крошек)
  const locState   = (location.state as { courseName?: string } | null);
  const stateCourseName = locState?.courseName;

  const useApi = isNumericId(topicId);

  // ── Состояние ────────────────────────────────────────────────
  const [content, setContent]     = useState<unknown>(null);
  const [quiz,    setQuiz]        = useState<QuizQuestion[]>([]);
  const [answers, setAnswers]     = useState<Record<number, number[]>>({});
  const [checked, setChecked]     = useState(false);

  // TOC
  const [tocItems,  setTocItems]  = useState<TocItem[]>([]);
  const [activeId,  setActiveId]  = useState<string>("");

  // API-режим
  const [apiLessons, setApiLessons] = useState<ApiLesson[] | null>(null);
  const [apiLoading, setApiLoading] = useState(useApi);

  // ── Загрузка API-уроков ───────────────────────────────────────
  useEffect(() => {
    if (!useApi) return;
    setApiLoading(true);
    fetch(`${API_BASE}/courses/${courseId}/lessons/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setApiLessons(data as ApiLesson[]); })
      .catch(() => {})
      .finally(() => setApiLoading(false));
  }, [courseId, useApi]);

  const apiLesson = useMemo(
    () => apiLessons?.find(l => String(l.id) === topicId) ?? null,
    [apiLessons, topicId],
  );

  // ── Загрузка контента ─────────────────────────────────────────
  useEffect(() => {
    if (useApi) {
      if (apiLesson) setContent(fixMediaUrls(apiLesson.content));
      return;
    }
    const loader = LESSON_CONTENT[topicId ?? ""];
    if (loader) loader().then(m => setContent(m.default));
    else setContent(null);

    const quizLoader = LESSON_QUIZ[topicId ?? ""];
    if (quizLoader) quizLoader().then(m => { setQuiz(m.default as QuizQuestion[]); setAnswers({}); setChecked(false); });
    else { setQuiz([]); setAnswers({}); setChecked(false); }
  }, [topicId, useApi, apiLesson]);

  // TipTap editor в read-only режиме
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
      ImageExtension.configure({ inline: false }),
    ],
    content: undefined,
    editable: false,
  });

  useEffect(() => {
    if (editor && content) editor.commands.setContent(content as object);
  }, [editor, content]);

  // ── TOC: извлекаем заголовки из JSON ────────────────────────
  useEffect(() => {
    if (content) setTocItems(extractHeadings(content));
    else         setTocItems([]);
  }, [content]);

  // ── TOC: ставим id на DOM-заголовки после рендера TipTap ────
  useEffect(() => {
    if (!tocItems.length) return;
    const container = document.querySelector(".tiptap-content");
    if (!container) return;
    const els = container.querySelectorAll("h1,h2,h3,h4");
    els.forEach((el, i) => { if (tocItems[i]) el.id = tocItems[i].id; });
  }, [tocItems, content]);

  // ── TOC: подсвечиваем активный заголовок ────────────────────
  useEffect(() => {
    if (!tocItems.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-64px 0px -70% 0px" },
    );
    tocItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tocItems]);

  // ── Навигация prev/next ───────────────────────────────────────
  const allLessons = useMemo(
    () => apiLessons?.map(l => ({ id: String(l.id), title: l.title })) ?? [],
    [apiLessons],
  );

  const currentIdx = allLessons.findIndex(l => l.id === topicId);

  // ── Заголовок урока ───────────────────────────────────────────
  // course_name из API = название модуля (например "База данных")
  const lessonTitle  = apiLesson?.title ?? (apiLoading ? "Загрузка..." : "Урок не найден");
  const moduleLabel  = apiLesson?.course_name ?? stateCourseName ?? "";

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}

        /* ── Сайдбар ── */
        .topic-layout{display:grid;grid-template-columns:248px 1fr 220px;min-height:calc(100vh - 57px);align-items:start}
        .topic-sidebar{
          position:sticky;top:57px;height:calc(100vh - 57px);
          overflow-y:auto;background:${COLORS.bgSidebar};
          border-right:1px solid ${COLORS.border};padding:1.25rem 0;
        }
        .sidebar-mod{padding:.5rem 1.25rem .25rem;font-size:.62rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${COLORS.textFaint}}
        .sidebar-lesson{
          display:flex;align-items:center;gap:.6rem;
          padding:.55rem 1.25rem;font-size:.82rem;font-weight:600;
          color:${COLORS.textMuted};cursor:pointer;transition:all .15s;
          border-left:2px solid transparent;
        }
        .sidebar-lesson:hover{color:${COLORS.textBody};background:rgba(255,255,255,0.03)}
        .sidebar-lesson.active{color:${COLORS.accent};border-left-color:${COLORS.accent};background:rgba(255,58,58,0.05)}

        /* ── Основной контент ── */
        .topic-main{padding:2.5rem 2.5rem;max-width:100%}

        /* ── TOC (содержание справа) ── */
        .topic-toc{
          position:sticky;top:57px;height:calc(100vh - 57px);
          overflow-y:auto;padding:2rem 1.25rem 2rem 0.75rem;
          border-left:1px solid ${COLORS.border};
        }
        .toc-title{
          font-size:.6rem;font-weight:800;letter-spacing:.12em;
          text-transform:uppercase;color:${COLORS.textFaint};
          margin-bottom:.75rem;padding-left:.5rem;
        }
        .toc-item{
          display:block;padding:.3rem .5rem;border-radius:5px;
          font-size:.75rem;font-weight:600;line-height:1.4;
          color:${COLORS.textFaint};cursor:pointer;
          transition:color .14s,background .14s;
          border-left:2px solid transparent;
          text-decoration:none;
        }
        .toc-item:hover{color:${COLORS.textBody};background:rgba(255,255,255,0.03)}
        .toc-item.active{color:${COLORS.accent};border-left-color:${COLORS.accent};background:rgba(255,58,58,0.05)}

        /* ── TipTap типографика ── */
        .tiptap-content{color:${COLORS.textBody};font-size:.95rem;line-height:1.85}

        .tiptap-content h1,.tiptap-content h2,.tiptap-content h3,.tiptap-content h4{
          font-family:${FONTS.display};font-weight:800;color:${COLORS.textPrimary};
          letter-spacing:-.02em;margin-top:2rem;margin-bottom:.75rem
        }
        .tiptap-content h1{font-size:1.9rem}
        .tiptap-content h2{font-size:1.4rem;padding-bottom:.5rem;border-bottom:1px solid ${COLORS.border}}
        .tiptap-content h3{font-size:1.1rem;color:${COLORS.textBody}}
        .tiptap-content h4{font-size:.95rem}

        .tiptap-content p{margin-bottom:1rem}

        .tiptap-content strong{font-weight:800;color:${COLORS.textPrimary}}
        .tiptap-content em{font-style:italic;color:#C8C8E8}

        .tiptap-content code{
          font-family:${FONTS.mono};font-size:.82em;
          background:rgba(255,255,255,0.07);
          color:#B4C6FF;
          padding:.15em .45em;border-radius:5px;
        }

        .tiptap-content pre{
          background:#0C0C12;border:1px solid rgba(255,255,255,0.09);
          border-radius:10px;padding:1.25rem 1.5rem;overflow-x:auto;
          margin:1.25rem 0;
        }
        .tiptap-content pre code{
          background:none;color:#C8D3F5;padding:0;font-size:.85rem;line-height:1.7
        }

        /* Подсветка синтаксиса */
        .tiptap-content .hljs-keyword{color:#C792EA}
        .tiptap-content .hljs-string{color:#C3E88D}
        .tiptap-content .hljs-number{color:#F78C6C}
        .tiptap-content .hljs-comment{color:#546E7A;font-style:italic}
        .tiptap-content .hljs-built_in,.tiptap-content .hljs-literal{color:#82AAFF}
        .tiptap-content .hljs-title,.tiptap-content .hljs-function{color:#82AAFF}
        .tiptap-content .hljs-attr,.tiptap-content .hljs-attribute{color:#FFCB6B}
        .tiptap-content .hljs-type,.tiptap-content .hljs-selector-tag{color:#FFCB6B}
        .tiptap-content .hljs-variable{color:#F07178}
        .tiptap-content .hljs-operator,.tiptap-content .hljs-punctuation{color:#89DDFF}

        .tiptap-content blockquote{
          border-left:3px solid ${COLORS.accent};
          padding:.75rem 1.25rem;margin:1.25rem 0;
          background:rgba(255,58,58,0.05);border-radius:0 8px 8px 0;
          color:${COLORS.textMuted};font-size:.88rem;
        }
        .tiptap-content blockquote strong{color:${COLORS.accent}}

        .tiptap-content ul,.tiptap-content ol{
          padding-left:1.5rem;margin-bottom:1rem
        }
        .tiptap-content li{margin-bottom:.4rem}
        .tiptap-content ul li::marker{color:${COLORS.accent}}
        .tiptap-content ol li::marker{color:${COLORS.accent};font-weight:700}

        .tiptap-content hr{
          border:none;border-top:1px solid ${COLORS.border};margin:2rem 0
        }

        .tiptap-content img{max-width:100%;border-radius:8px;margin:1rem 0}

        .tiptap-content .ProseMirror{outline:none}

        /* ── Тест ── */
        .quiz-opt{
          display:flex;align-items:flex-start;gap:.75rem;
          padding:.85rem 1rem;border-radius:10px;
          border:1px solid ${COLORS.border};cursor:pointer;
          transition:all .16s;font-size:.88rem;line-height:1.5;
          background:${COLORS.bgCard};color:${COLORS.textBody};
          text-align:left;width:100%;font-family:${FONTS.body};
        }
        .quiz-opt:hover:not(.quiz-opt--disabled){border-color:rgba(255,58,58,.3);background:rgba(255,58,58,0.04)}
        .quiz-opt--selected{border-color:${COLORS.accent}!important;background:rgba(255,58,58,0.08)!important}
        .quiz-opt--correct{border-color:#22c55e!important;background:rgba(34,197,94,0.08)!important;color:#4ade80!important}
        .quiz-opt--wrong{border-color:#ef4444!important;background:rgba(239,68,68,0.08)!important;color:#f87171!important}
        .quiz-opt--missed{border-color:#22c55e!important;background:rgba(34,197,94,0.05)!important}
        .quiz-opt--disabled{cursor:default}

        .quiz-marker{
          width:20px;height:20px;border-radius:50%;border:1.5px solid currentColor;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;margin-top:1px;font-size:.65rem;font-weight:800;
          transition:all .16s;
        }
        .quiz-opt--selected .quiz-marker{background:${COLORS.accent};border-color:${COLORS.accent};color:#fff}
        .quiz-opt--correct  .quiz-marker{background:#22c55e;border-color:#22c55e;color:#fff}
        .quiz-opt--wrong    .quiz-marker{background:#ef4444;border-color:#ef4444;color:#fff}
        .quiz-opt--missed   .quiz-marker{border-color:#22c55e;color:#22c55e}

        .quiz-submit{
          background:${COLORS.accent};color:#fff;border:none;
          border-radius:10px;padding:.75rem 2rem;
          font-family:${FONTS.body};font-weight:700;font-size:.875rem;
          cursor:pointer;transition:all .18s;
        }
        .quiz-submit:hover{background:#FF5555;transform:translateY(-1px)}
        .quiz-submit:disabled{opacity:.45;cursor:not-allowed;transform:none}

        /* ── Навигация по урокам ── */
        .lesson-nav-btn{
          background:${COLORS.bgCard};border:1px solid ${COLORS.border};
          border-radius:10px;padding:.65rem 1.1rem;font-family:${FONTS.body};
          font-size:.8rem;font-weight:700;color:${COLORS.textMuted};
          cursor:pointer;transition:all .18s;
        }
        .lesson-nav-btn:hover:not(:disabled){border-color:${COLORS.borderHover};color:${COLORS.textBody}}
        .lesson-nav-btn:disabled{opacity:.3;cursor:not-allowed}

        @media(max-width:1100px){
          .topic-layout{grid-template-columns:248px 1fr !important}
          .topic-toc{display:none !important}
        }
        @media(max-width:900px){
          .topic-layout{grid-template-columns:1fr !important}
          .topic-sidebar{display:none !important}
          .topic-main{padding:2rem 1.25rem !important}
        }
      `}</style>

      <DashboardNav />

      <div className="topic-layout">

        {/* ── Сайдбар ── */}
        <aside className="topic-sidebar">
          {/* Breadcrumb */}
          <div style={{ padding: ".25rem 1.25rem 1rem", borderBottom: `1px solid ${COLORS.border}`, marginBottom: ".5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".72rem", color: COLORS.textFaint }}>
              <span style={{ cursor: "pointer", transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = COLORS.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = COLORS.textFaint)}
                onClick={() => navigate("/courses")}>
                Курсы
              </span>
              <span>/</span>
              <span style={{ cursor: "pointer", transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = COLORS.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = COLORS.textFaint)}
                onClick={() => navigate(`/courses/${courseId}`)}>
                {moduleLabel || courseId}
              </span>
            </div>
          </div>

          {/* Плоский список уроков из API */}
          {apiLoading && (
            <div style={{ padding: ".75rem 1.25rem", fontSize: ".78rem", color: COLORS.textFaint }}>Загрузка...</div>
          )}
          {apiLessons?.map((l, i) => (
            <div
              key={l.id}
              className={`sidebar-lesson${String(l.id) === topicId ? " active" : ""}`}
              onClick={() => navigate(`/courses/${courseId}/${l.id}`, { state: locState })}
            >
              <span style={{ fontSize: ".6rem", fontWeight: 800, width: "16px", flexShrink: 0, textAlign: "right" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {l.title}
            </div>
          ))}
        </aside>

        {/* ── Основной контент ── */}
        <div>
          <article className="topic-main">
            {/* Заголовок урока */}
            <div style={{ marginBottom: "2rem" }}>
              {moduleLabel && (
                <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".4rem" }}>
                  {moduleLabel}
                </p>
              )}
              <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary }}>
                {lessonTitle}
              </h1>
              {apiLesson?.auto_test && (
                <div style={{ fontSize: ".75rem", color: COLORS.textFaint, marginTop: ".5rem" }}>тест</div>
              )}
            </div>

            {/* Статья */}
            {(apiLoading && useApi) ? (
              <div style={{ color: COLORS.textFaint, fontSize: ".9rem" }}>Загрузка...</div>
            ) : content ? (
              <div className="tiptap-content">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div style={{ color: COLORS.textFaint, fontSize: ".9rem" }}>Загрузка...</div>
            )}

            {/* ── Тест (только для slug-уроков с локальным квизом) ── */}
            {quiz.length > 0 && (
              <div style={{ marginTop: "3rem", paddingTop: "2.5rem", borderTop: `1px solid ${COLORS.border}` }}>
                <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
                  Тест по теме
                </p>
                <h2 style={{ fontFamily: FONTS.display, fontSize: "1.3rem", fontWeight: 800, color: COLORS.textPrimary, marginBottom: "2rem" }}>
                  Проверь себя
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  {quiz.map((q, qi) => {
                    const selected = answers[q.id] ?? [];
                    const isMultiple = q.type === "multiple";

                    const toggle = (oi: number) => {
                      if (checked) return;
                      setAnswers(prev => {
                        const cur = prev[q.id] ?? [];
                        if (isMultiple) {
                          return { ...prev, [q.id]: cur.includes(oi) ? cur.filter(x => x !== oi) : [...cur, oi] };
                        }
                        return { ...prev, [q.id]: [oi] };
                      });
                    };

                    const getOptClass = (oi: number) => {
                      let cls = "quiz-opt";
                      if (checked) {
                        cls += " quiz-opt--disabled";
                        const isCorrect = q.correct.includes(oi);
                        const isSelected = selected.includes(oi);
                        if (isSelected && isCorrect)       cls += " quiz-opt--correct";
                        else if (isSelected && !isCorrect) cls += " quiz-opt--wrong";
                        else if (!isSelected && isCorrect) cls += " quiz-opt--missed";
                      } else {
                        if (selected.includes(oi)) cls += " quiz-opt--selected";
                      }
                      return cls;
                    };

                    return (
                      <div key={q.id}>
                        <div style={{ display: "flex", gap: ".6rem", marginBottom: "1rem", alignItems: "baseline" }}>
                          <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: ".75rem", color: COLORS.accent, flexShrink: 0 }}>
                            {String(qi + 1).padStart(2, "0")}
                          </span>
                          <p style={{ fontSize: ".92rem", fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.55 }}>
                            {q.text}
                          </p>
                        </div>
                        {isMultiple && (
                          <p style={{ fontSize: ".72rem", color: COLORS.textFaint, marginBottom: ".75rem" }}>
                            Выберите все верные варианты
                          </p>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                          {q.options.map((opt, oi) => (
                            <button key={oi} className={getOptClass(oi)} onClick={() => toggle(oi)}>
                              <span className="quiz-marker">
                                {checked && q.correct.includes(oi) ? "✓" :
                                 checked && selected.includes(oi) && !q.correct.includes(oi) ? "✗" : ""}
                              </span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {checked && (() => {
                  const score = quiz.filter(q => {
                    const sel = answers[q.id] ?? [];
                    return sel.length === q.correct.length && q.correct.every(c => sel.includes(c));
                  }).length;
                  return (
                    <div style={{
                      marginTop: "1.5rem", padding: "1rem 1.25rem", borderRadius: "12px",
                      background: score === quiz.length ? "rgba(34,197,94,0.08)" : "rgba(255,58,58,0.08)",
                      border: `1px solid ${score === quiz.length ? "rgba(34,197,94,0.2)" : "rgba(255,58,58,0.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem",
                    }}>
                      <div>
                        <div style={{ fontSize: ".95rem", fontWeight: 700, color: score === quiz.length ? "#4ade80" : COLORS.textPrimary }}>
                          {score === quiz.length ? "Отлично! Все верно." : `${score} из ${quiz.length} правильно`}
                        </div>
                        <div style={{ fontSize: ".75rem", color: COLORS.textFaint, marginTop: ".2rem" }}>
                          {score < quiz.length ? "Перечитай тему и попробуй снова" : "Можно переходить к следующему уроку"}
                        </div>
                      </div>
                      <button
                        className="quiz-submit"
                        style={{ background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, fontSize: ".8rem", padding: ".5rem 1rem" }}
                        onClick={() => { setAnswers({}); setChecked(false); }}
                      >
                        Пройти снова
                      </button>
                    </div>
                  );
                })()}

                {!checked && (
                  <button
                    className="quiz-submit"
                    style={{ marginTop: "1.5rem" }}
                    disabled={Object.keys(answers).length < quiz.length}
                    onClick={() => setChecked(true)}
                  >
                    Проверить ответы
                  </button>
                )}
              </div>
            )}

            {/* Навигация: пред / след */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3rem", paddingTop: "2rem", borderTop: `1px solid ${COLORS.border}` }}>
              <button
                className="lesson-nav-btn"
                disabled={currentIdx <= 0}
                onClick={() => { const prev = allLessons[currentIdx - 1]; if (prev) navigate(`/courses/${courseId}/${prev.id}`); }}
              >
                ← Предыдущий урок
              </button>
              <button
                className="lesson-nav-btn"
                disabled={currentIdx < 0 || currentIdx >= allLessons.length - 1}
                onClick={() => { const next = allLessons[currentIdx + 1]; if (next) navigate(`/courses/${courseId}/${next.id}`); }}
              >
                Следующий урок →
              </button>
            </div>
          </article>
        </div>

        {/* ── TOC — содержание темы ── */}
        <aside className="topic-toc">
          {tocItems.length > 0 && (
            <>
              <div className="toc-title">Содержание</div>
              {tocItems.map(item => (
                <div
                  key={item.id}
                  className={`toc-item${activeId === item.id ? " active" : ""}`}
                  style={{ paddingLeft: `${(item.level - 1) * 10 + 8}px` }}
                  onClick={() => {
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {item.text}
                </div>
              ))}
            </>
          )}
        </aside>

      </div>
    </div>
  );
}
