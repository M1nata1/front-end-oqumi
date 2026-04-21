// src/pages/Courses/CoursePage.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { API_BASE, mediaUrl } from "@/api/auth";

const PALETTE = ["#FF3A3A", "#3A8EFF", "#FF9F3A", "#3AFFB4", "#B43AFF"];
function slugColor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const COLORS = {
  bgPage: "#0D0D11", bgCard: "#13131A", bgCardHover: "#161620",
  border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,58,58,0.3)",
  accent: "#FF3A3A", textPrimary: "#FAFAFF", textBody: "#F0F0FF",
  textMuted: "#8888AA", textFaint: "#44445A",
};
const FONTS = {
  display: "'Syne', sans-serif",
  body: "'Nunito', sans-serif",
  googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Nunito:wght@400;600;700&display=swap",
};

interface ApiCourseDetail {
  category:    string;
  slug:        string;
  name:        string;
  description: string;
  image:       string | null;
  is_free:     boolean;
  cost:        string | null;
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

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем контекст категории если пришли из CategoryPage
  const locState = (location.state as { categoryCode?: string; categoryName?: string } | null);
  const categoryCode = locState?.categoryCode;
  const categoryName = locState?.categoryName;

  const color = slugColor(courseId ?? "");

  const [course,     setCourse]     = useState<ApiCourseDetail | null>(null);
  const [apiLessons, setApiLessons] = useState<ApiLesson[] | null>(null);
  const [courseQuiz, setCourseQuiz] = useState<{ id: number; title: string } | null>(null);
  const [forbidden,  setForbidden]  = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    setForbidden(false);
    setCourse(null);
    setApiLessons(null);
    setCourseQuiz(null);

    // Детали курса — необязательны, используем как источник заголовка/картинки
    const fetchCourse = fetch(`${API_BASE}/courses/${courseId}/`)
      .then(r => {
        if (r.status === 403) { setForbidden(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => { if (data) setCourse(data as ApiCourseDetail); })
      .catch(() => {});

    const fetchLessons = fetch(`${API_BASE}/courses/${courseId}/lessons/`)
      .then(r => {
        if (r.status === 403) { setForbidden(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => { if (data) setApiLessons(data as ApiLesson[]); })
      .catch(() => {});

    const fetchQuiz = fetch(`${API_BASE}/courses/${courseId}/quiz/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.id) setCourseQuiz({ id: data.id as number, title: data.title as string }); })
      .catch(() => {});

    Promise.all([fetchCourse, fetchLessons, fetchQuiz]).finally(() => setLoading(false));
  }, [courseId]);

  // Если уроки загрузились — страница рабочая, course_name берём из первого урока
  const courseName = course?.name ?? apiLessons?.[0]?.course_name ?? courseId;
  const courseCategory = categoryName ?? course?.category;

  if (!loading && !forbidden && apiLessons !== null && apiLessons.length === 0 && !course) {
    return <div style={{ color: "#fff", padding: "2rem" }}>Курс не найден</div>;
  }

  const imgUrl = mediaUrl(course?.image);

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .lesson-row{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-radius:9px;cursor:pointer;transition:background .15s;gap:1rem}
        .lesson-row:hover{background:rgba(255,255,255,0.04)}
        .lesson-arrow{color:${COLORS.textFaint};font-size:.85rem;transition:transform .15s,color .15s;flex-shrink:0}
        .lesson-row:hover .lesson-arrow{transform:translateX(3px);color:${COLORS.accent}}
      `}</style>

      <DashboardNav />

      {/* Баннер 403 */}
      {forbidden && (
        <div style={{ background: "rgba(255,58,58,0.08)", borderBottom: "1px solid rgba(255,58,58,0.18)", padding: ".85rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: ".85rem", color: "#FF6B6B", fontWeight: 600 }}>
            Для доступа к этому курсу нужна активная подписка
          </span>
          <button
            onClick={() => navigate("/subscription")}
            style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: "7px", padding: ".4rem 1rem", fontFamily: FONTS.body, fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}
          >
            Оформить подписку →
          </button>
        </div>
      )}

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".75rem", color: COLORS.textFaint, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <span
            style={{ cursor: "pointer", transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = COLORS.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = COLORS.textFaint)}
            onClick={() => navigate("/courses")}
          >
            Курсы
          </span>
          {courseCategory && (
            <>
              <span>/</span>
              <span
                style={{ cursor: categoryCode ? "pointer" : "default", transition: "color .15s" }}
                onMouseEnter={e => { if (categoryCode) e.currentTarget.style.color = COLORS.accent; }}
                onMouseLeave={e => (e.currentTarget.style.color = COLORS.textFaint)}
                onClick={() => { if (categoryCode) navigate(`/courses/c/${categoryCode}`); }}
              >
                {courseCategory}
              </span>
            </>
          )}
          <span>/</span>
          <span style={{ color: COLORS.textMuted }}>{courseName}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          {imgUrl ? (
            <img
              src={imgUrl}
              alt=""
              style={{ width: "52px", height: "52px", borderRadius: "14px", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "4px", background: color }} />
            </div>
          )}
          <div>
            {courseCategory && (
              <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".3rem" }}>
                {courseCategory}
              </p>
            )}
            <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary }}>
              {loading && !courseName ? "Загрузка..." : courseName}
            </h1>
          </div>
        </div>

        {/* Уроки */}
        {!loading && apiLessons && apiLessons.length > 0 && (
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontFamily: FONTS.display, fontSize: ".95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                Уроки
              </div>
              <div style={{ fontSize: ".68rem", color: COLORS.textFaint, marginTop: ".1rem" }}>
                {apiLessons.length} {apiLessons.length === 1 ? "урок" : "урока"}
              </div>
            </div>
            <div style={{ padding: ".5rem" }}>
              {apiLessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  className="lesson-row"
                  onClick={() => navigate(`/courses/${courseId}/${lesson.id}`, { state: { courseName, categoryName, categoryCode } })}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                    <span style={{ fontSize: ".65rem", fontWeight: 800, color: COLORS.textFaint, width: "20px", flexShrink: 0, textAlign: "right" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: ".85rem", fontWeight: 600, color: COLORS.textBody }}>
                      {lesson.title}
                    </span>
                    {lesson.auto_test && (
                      <span style={{ fontSize: ".62rem", color: COLORS.textFaint, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                        тест
                      </span>
                    )}
                  </div>
                  <span className="lesson-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Квиз курса */}
        {!loading && courseQuiz && (
          <div style={{
            marginTop: "1.25rem",
            background: "rgba(255,58,58,0.05)",
            border: `1px solid rgba(255,58,58,0.2)`,
            borderRadius: "14px",
            padding: "1.25rem 1.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
          }}>
            <div>
              <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".3rem" }}>
                Квиз по курсу
              </p>
              <p style={{ fontSize: ".9rem", fontWeight: 700, color: COLORS.textPrimary }}>
                {courseQuiz.title}
              </p>
            </div>
            <button
              onClick={() => navigate(`/exam/${courseQuiz.id}`)}
              style={{
                background: COLORS.accent, color: "#fff", border: "none",
                borderRadius: "8px", padding: ".55rem 1.25rem",
                fontFamily: FONTS.body, fontWeight: 700, fontSize: ".82rem", cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Пройти →
            </button>
          </div>
        )}

        {loading && (
          <div style={{ color: COLORS.textFaint, fontSize: ".85rem" }}>Загрузка уроков...</div>
        )}

        {!loading && !forbidden && apiLessons !== null && apiLessons.length === 0 && (
          <div style={{ color: COLORS.textFaint, fontSize: ".85rem", fontStyle: "italic" }}>Уроки скоро появятся</div>
        )}
      </main>
    </div>
  );
}
