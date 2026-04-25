// src/pages/Courses/CategoryPage.tsx

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { API_BASE, mediaUrl } from "@/api/auth";
import type { ApiCategory, ApiCourse } from "./Courses";

const COLORS = {
  bgPage: "#0D0D11", bgCard: "#13131A", bgCardHover: "#161620",
  border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,255,255,0.14)",
  accent: "#FF3A3A", textPrimary: "#FAFAFF", textBody: "#F0F0FF",
  textMuted: "#B4B4D8", textFaint: "#7878A8",
};
const FONTS = {
  display: "'Syne', sans-serif",
  body: "'Nunito', sans-serif",
  googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Nunito:wght@400;600;700&display=swap",
};

const BANNER_PALETTE: { bg: string; bar: string }[] = [
  { bg: "#0F2F5C", bar: "#3A8EFF" },
  { bg: "#5C0F0F", bar: "#FF3A3A" },
  { bg: "#0F5C25", bar: "#3AFFB4" },
  { bg: "#4A3A0A", bar: "#FF9F3A" },
  { bg: "#3A0F5C", bar: "#B43AFF" },
  { bg: "#0F4A4A", bar: "#3AFFEF" },
  { bg: "#5C3A0F", bar: "#FFD03A" },
];
function slugPalette(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return BANNER_PALETTE[h % BANNER_PALETTE.length];
}

const LESSONS_KEY = "oqumi_visited_lessons";
function loadVisitedLessons(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(LESSONS_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function markLessonVisited(id: number) {
  const v = loadVisitedLessons();
  v.add(id);
  localStorage.setItem(LESSONS_KEY, JSON.stringify([...v]));
}

interface ApiLesson {
  id:        number;
  title:     string;
  auto_test: boolean;
  priority:  number;
}

export default function CategoryPage() {
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const navigate  = useNavigate();
  const location  = useLocation();

  const stateCategory = (location.state as { category?: ApiCategory } | null)?.category;
  const [category,       setCategory]       = useState<ApiCategory | null>(stateCategory ?? null);
  const [loading,        setLoading]        = useState(!stateCategory);
  const [lessonsMap,     setLessonsMap]     = useState<Record<string, ApiLesson[]>>({});
  const [lessonsLoading, setLessonsLoading] = useState<Record<string, boolean>>({});
  const [search,         setSearch]         = useState("");
  const [visitedLessons, setVisitedLessons] = useState<Set<number>>(loadVisitedLessons);

  // 1. Загружаем категорию если нет в state
  useEffect(() => {
    if (stateCategory) return;
    fetch(`${API_BASE}/courses/categories/?page_size=100`)
      .then(r => r.ok ? r.json() : { result: [] })
      .then(data => {
        const found = (data.result as ApiCategory[]).find(c => c.code === categoryCode);
        setCategory(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryCode, stateCategory]);

  // 2. Когда категория загружена — грузим уроки всех модулей параллельно
  useEffect(() => {
    if (!category || category.courses.length === 0) return;
    const initLoading: Record<string, boolean> = {};
    category.courses.forEach(m => { initLoading[m.slug] = true; });
    setLessonsLoading(initLoading);

    category.courses.forEach(mod => {
      fetch(`${API_BASE}/courses/${mod.slug}/lessons/`)
        .then(r => r.ok ? r.json() : [])
        .then((data: ApiLesson[]) => setLessonsMap(prev => ({ ...prev, [mod.slug]: data })))
        .catch(() => setLessonsMap(prev => ({ ...prev, [mod.slug]: [] })))
        .finally(() => setLessonsLoading(prev => ({ ...prev, [mod.slug]: false })));
    });
  }, [category]);

  const filtered = useMemo(() => {
    if (!category) return [];
    return category.courses.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [category, search]);

  function handleLessonClick(mod: ApiCourse, lesson: ApiLesson) {
    markLessonVisited(lesson.id);
    setVisitedLessons(prev => new Set([...prev, lesson.id]));
    navigate(`/courses/${mod.slug}/${lesson.id}`, {
      state: {
        courseName:   mod.name,
        categoryName: category?.name,
        categoryCode: category?.code,
      },
    });
  }

  // Считаем общий прогресс по всем модулям
  const totalLessons   = Object.values(lessonsMap).reduce((s, l) => s + l.length, 0);
  const visitedInCat   = Object.values(lessonsMap)
    .flat()
    .filter(l => visitedLessons.has(l.id)).length;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ background: COLORS.bgPage, minHeight: "100vh", fontFamily: FONTS.body }}>
        <style>{`@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}.skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:1200px 100%;animation:shimmer 1.4s infinite;border-radius:8px}`}</style>
        <DashboardNav />
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 3rem" }}>
          <div className="skel" style={{ height: "13px", width: "80px", marginBottom: "1rem" }} />
          <div className="skel" style={{ height: "36px", width: "280px", marginBottom: ".75rem" }} />
          <div className="skel" style={{ height: "46px", marginBottom: "1.75rem" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "16px", overflow: "hidden" }}>
                <div className="skel" style={{ height: "120px" }} />
                <div style={{ padding: "1rem" }}>
                  {[0,1,2,3].map(j => (
                    <div key={j} className="skel" style={{ height: "36px", marginBottom: ".4rem" }} />
                  ))}
                  <div className="skel" style={{ height: "4px", marginTop: ".75rem" }} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ background: COLORS.bgPage, minHeight: "100vh" }}>
        <DashboardNav />
        <div style={{ padding: "3rem 2rem", color: "#fff" }}>Курс не найден</div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .lesson-row{
          display:flex;align-items:center;justify-content:space-between;
          padding:.6rem .75rem;border-radius:8px;cursor:pointer;
          transition:background .15s;gap:.75rem;
        }
        .lesson-row:hover{background:rgba(255,255,255,0.05)}
        .lesson-arrow{color:${COLORS.textFaint};font-size:.8rem;transition:transform .15s,color .15s;flex-shrink:0}
        .lesson-row:hover .lesson-arrow{transform:translateX(3px);color:${COLORS.accent}}
        .c-search{
          width:100%;background:${COLORS.bgCard};border:1px solid ${COLORS.border};
          border-radius:12px;padding:.75rem 1rem .75rem 2.75rem;
          color:${COLORS.textPrimary};font-family:${FONTS.body};font-size:.9rem;
          outline:none;transition:border-color .2s;
        }
        .c-search:focus{border-color:rgba(255,255,255,0.22)}
        .c-search::placeholder{color:${COLORS.textFaint}}
        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        .skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:1200px 100%;animation:shimmer 1.4s infinite;border-radius:8px}
        @media(max-width:900px){ .m-grid{grid-template-columns:1fr 1fr !important} }
        @media(max-width:560px){ .m-grid{grid-template-columns:1fr !important} }
      `}</style>

      <DashboardNav />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 3rem" }}>

        {/* Breadcrumb */}
        <div className="fade-up-1" style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".75rem", color: COLORS.textFaint, marginBottom: "1rem" }}>
          <span
            style={{ cursor: "pointer", transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = COLORS.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = COLORS.textFaint)}
            onClick={() => navigate("/courses")}
          >
            Курсы
          </span>
          <span>/</span>
          <span style={{ color: COLORS.textMuted }}>{category.name}</span>
        </div>

        {/* Header */}
        <p className="fade-up-1" style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".4rem" }}>
          Курс
        </p>
        <h1 className="fade-up-2" style={{ fontFamily: FONTS.display, fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: "1.75rem" }}>
          {category.name}
        </h1>

        {/* Search + counter */}
        <div className="fade-up-3" style={{ position: "relative", marginBottom: ".65rem" }}>
          <svg style={{ position: "absolute", left: ".9rem", top: "50%", transform: "translateY(-50%)", opacity: .4, pointerEvents: "none" }} width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="#FAFAFF" strokeWidth="1.6"/>
            <path d="M13 13l3.5 3.5" stroke="#FAFAFF" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input
            className="c-search"
            type="text"
            placeholder="Поиск модуля..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <p className="fade-up-3" style={{ fontSize: ".75rem", color: COLORS.textFaint, marginBottom: "1.75rem" }}>
          {totalLessons === 0
            ? `${category.courses.length} модулей доступно`
            : `Пройдено ${visitedInCat} из ${totalLessons} уроков`}
        </p>

        {/* Empty */}
        {filtered.length === 0 && (
          <div style={{ color: COLORS.textFaint, fontSize: ".85rem", fontStyle: "italic" }}>
            {search ? "Ничего не найдено" : "Модули скоро появятся"}
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="m-grid fade-up-4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem", alignItems: "start" }}>
            {filtered.map((mod: ApiCourse) => {
              const { bg, bar } = slugPalette(mod.slug);
              const imgUrl      = mediaUrl(mod.image);
              const lessons     = lessonsMap[mod.slug] ?? [];
              const isLoading   = lessonsLoading[mod.slug] ?? false;
              const visitedInMod = lessons.filter(l => visitedLessons.has(l.id)).length;
              const progress    = lessons.length > 0 ? visitedInMod / lessons.length : 0;

              return (
                <div key={mod.slug} style={{
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}>
                  {/* Banner */}
                  <div style={{
                    height: "120px",
                    background: imgUrl
                      ? `url(${imgUrl}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)`,
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: ".9rem 1.1rem",
                    flexShrink: 0,
                  }}>
                    {imgUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} />}
                    <span style={{
                      position: "relative",
                      fontFamily: FONTS.display,
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "#FAFAFF",
                      letterSpacing: "-.01em",
                      textShadow: "0 1px 6px rgba(0,0,0,.5)",
                    }}>
                      {mod.name}
                    </span>
                    {visitedInMod > 0 && (
                      <span style={{
                        position: "absolute", top: ".65rem", right: ".65rem",
                        fontSize: ".58rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                        background: "rgba(255,255,255,.12)", backdropFilter: "blur(4px)",
                        color: "#FAFAFF", padding: ".2rem .5rem", borderRadius: "20px",
                      }}>
                        {visitedInMod}/{lessons.length}
                      </span>
                    )}
                  </div>

                  {/* Lessons */}
                  <div style={{ padding: ".5rem", flex: 1 }}>
                    {isLoading ? (
                      <div style={{ padding: ".25rem" }}>
                        {[0,1,2].map(i => (
                          <div key={i} className="skel" style={{ height: "34px", marginBottom: ".35rem" }} />
                        ))}
                      </div>
                    ) : lessons.length === 0 ? (
                      <div style={{ padding: ".75rem 1rem", fontSize: ".8rem", color: COLORS.textFaint, fontStyle: "italic" }}>
                        Уроки скоро появятся
                      </div>
                    ) : (
                      lessons.map((lesson, i) => {
                        const done = visitedLessons.has(lesson.id);
                        return (
                          <div
                            key={lesson.id}
                            className="lesson-row"
                            onClick={() => handleLessonClick(mod, lesson)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: ".6rem", minWidth: 0 }}>
                              <span style={{
                                fontSize: ".6rem", fontWeight: 800,
                                color: done ? bar : COLORS.textFaint,
                                width: "18px", flexShrink: 0, textAlign: "right",
                              }}>
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span style={{
                                fontSize: ".82rem", fontWeight: 600,
                                color: done ? COLORS.textPrimary : COLORS.textBody,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {lesson.title}
                              </span>
                              {lesson.auto_test && (
                                <span style={{ fontSize: ".58rem", color: COLORS.textFaint, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", flexShrink: 0 }}>
                                  тест
                                </span>
                              )}
                            </div>
                            <span className="lesson-arrow">
                              {done ? "✓" : "→"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ padding: "0 1rem 1rem" }}>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${progress * 100}%`,
                        background: bar,
                        borderRadius: "99px",
                        transition: "width .4s ease",
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
