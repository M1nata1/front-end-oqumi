// src/pages/Policy/Policy.tsx
// Публичная страница — доступна без авторизации

import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { COLORS, FONTS } from "@/pages/Dashboard/dashboard.config";

const BRAND = { name: "Oqu", accent: "Mi" };
const UPDATED = "29 апреля 2026 г.";

const SECTIONS = [
  {
    id: "general",
    title: "1. Общие положения",
    body: [
      `Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, хранения, обработки и защиты персональных данных пользователей платформы OquMi (далее — «Платформа», «мы», «сервис»).`,
      `Используя Платформу, вы подтверждаете, что ознакомились с настоящей Политикой и даёте согласие на обработку ваших персональных данных в порядке и на условиях, изложенных в этом документе.`,
      `Платформа предназначена для лиц, достигших 16 лет. Если вы моложе, использование сервиса допустимо только с согласия родителей или законных представителей.`,
    ],
  },
  {
    id: "data-collected",
    title: "2. Какие данные мы собираем",
    body: [
      `При регистрации и использовании Платформы мы собираем следующие данные:`,
    ],
    list: [
      "Имя и фамилия — для персонализации вашего кабинета.",
      "Адрес электронной почты — для входа в систему и получения уведомлений.",
      "Пароль — хранится исключительно в хэшированном виде (bcrypt). Мы не имеем доступа к вашему исходному паролю.",
      "Прогресс обучения — пройденные уроки, результаты квизов и экзаменов.",
      "Технические данные — IP-адрес, тип браузера, операционная система, дата и время визита (только в агрегированном виде для диагностики).",
    ],
    after: `Мы не собираем платёжные реквизиты напрямую. Все транзакции обрабатываются сертифицированными платёжными провайдерами.`,
  },
  {
    id: "data-usage",
    title: "3. Как мы используем ваши данные",
    body: [
      `Собранные данные используются исключительно для следующих целей:`,
    ],
    list: [
      "Предоставление доступа к курсам, квизам и экзаменационным материалам.",
      "Отображение персонального прогресса и аналитики обучения.",
      "Отправка важных уведомлений о работе сервиса (технические письма, сброс пароля).",
      "Улучшение качества обучающего контента на основе агрегированной статистики.",
      "Обеспечение безопасности учётных записей и предотвращение несанкционированного доступа.",
    ],
    after: `Мы не продаём, не передаём и не сдаём в аренду ваши персональные данные третьим лицам в маркетинговых целях.`,
  },
  {
    id: "cookies",
    title: "4. Файлы cookie и локальное хранилище",
    body: [
      `Платформа использует localStorage браузера для хранения JWT-токенов авторизации и сессионных данных экзамена (например, ответов при прерванном сеансе). Эти данные хранятся только на вашем устройстве и не передаются на сторонние серверы.`,
      `Мы не используем сторонние рекламные cookie-трекеры и не передаём данные о поведении пользователей в рекламные сети.`,
    ],
  },
  {
    id: "storage",
    title: "5. Хранение и защита данных",
    body: [
      `Серверная инфраструктура Платформы размещена на Google Cloud Run (США). Передача данных между клиентом и сервером защищена протоколом TLS 1.3 (HTTPS).`,
      `Доступ к базе данных имеет ограниченный круг лиц — только разработчики и системные администраторы, подписавшие соглашение о неразглашении.`,
      `Мы применяем следующие меры безопасности:`,
    ],
    list: [
      "Хэширование паролей алгоритмом bcrypt с индивидуальной солью.",
      "JWT-авторизация с коротким временем жизни access-токена и ротацией refresh-токенов.",
      "Регулярное резервное копирование данных.",
      "Мониторинг подозрительной активности и автоматическая блокировка при множественных неудачных попытках входа.",
    ],
  },
  {
    id: "rights",
    title: "6. Ваши права",
    body: [
      `Вы в любое время вправе:`,
    ],
    list: [
      "Запросить копию всех персональных данных, которые мы о вас храним.",
      "Исправить неточные или устаревшие данные через настройки профиля.",
      "Удалить свою учётную запись и все связанные с ней данные — обратитесь в службу поддержки.",
      "Отозвать согласие на обработку данных. Это означает прекращение использования Платформы.",
      "Получить ваши данные в машиночитаемом формате (право на переносимость данных).",
    ],
    after: `Для реализации любого из перечисленных прав направьте запрос на адрес support@oqumi.kz. Мы ответим в течение 10 рабочих дней.`,
  },
  {
    id: "third-party",
    title: "7. Передача данных третьим лицам",
    body: [
      `Мы можем передавать ваши данные третьим лицам исключительно в следующих случаях:`,
    ],
    list: [
      "По требованию суда или уполномоченных государственных органов Республики Казахстан.",
      "Провайдерам инфраструктуры (Google Cloud) в минимально необходимом объёме для функционирования сервиса.",
      "С вашего явного письменного согласия.",
    ],
  },
  {
    id: "consent",
    title: "8. Согласие с условиями",
    body: [
      `Регистрируясь на Платформе или продолжая её использование, вы соглашаетесь с настоящей Политикой конфиденциальности в полном объёме.`,
      `Если вы не согласны с какими-либо положениями Политики, вы должны прекратить использование Платформы и направить запрос на удаление учётной записи.`,
      `Использование Платформы без авторизации (например, пробный экзамен) не требует предоставления персональных данных и происходит анонимно.`,
    ],
  },
  {
    id: "changes",
    title: "9. Изменения Политики",
    body: [
      `Мы оставляем за собой право вносить изменения в настоящую Политику. Актуальная версия всегда доступна по адресу /policy.`,
      `При внесении существенных изменений мы уведомим зарегистрированных пользователей по электронной почте не менее чем за 7 дней до вступления изменений в силу.`,
      `Продолжение использования Платформы после вступления изменений в силу означает ваше согласие с обновлённой Политикой.`,
    ],
  },
  {
    id: "contacts",
    title: "10. Контакты",
    body: [
      `По всем вопросам, связанным с обработкой персональных данных, обращайтесь:`,
    ],
    list: [
      "Email: support@oqumi.kz",
      "Платформа: OquMi — подготовка к КТ",
      "Юрисдикция: Республика Казахстан",
    ],
  },
];

export default function Policy() {
  const navigate = useNavigate();
  const isAuth   = useAuthStore(s => s.isAuth);

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#FF3A3A30}

        .pol-nav{
          padding:.9rem 2.5rem;
          background:${COLORS.bgPage}EC;
          backdrop-filter:blur(14px);
          border-bottom:1px solid ${COLORS.border};
          display:flex;align-items:center;justify-content:space-between;
          position:fixed;top:0;left:0;right:0;z-index:100;
        }
        .pol-logo{
          font-family:${FONTS.display};font-size:1.28rem;font-weight:800;
          letter-spacing:-.01em;cursor:pointer;
          transition:opacity .18s;
        }
        .pol-logo:hover{opacity:.72}
        .pol-cta{
          background:${COLORS.accent};color:#fff;border:none;
          padding:.45rem 1.2rem;border-radius:8px;
          font-family:${FONTS.body};font-weight:700;font-size:.8rem;cursor:pointer;
          transition:background .18s;
        }
        .pol-cta:hover{background:#E63946}

        .pol-toc-link{
          display:block;font-size:.78rem;color:${COLORS.textFaint};
          cursor:pointer;transition:color .15s;padding:.2rem 0;
          text-decoration:none;
        }
        .pol-toc-link:hover{color:${COLORS.accent}}

        .pol-section-title{
          font-family:${FONTS.display};font-size:1.1rem;font-weight:800;
          color:${COLORS.textPrimary};letter-spacing:-.01em;margin-bottom:1rem;
        }
        .pol-body-text{
          font-size:.875rem;color:${COLORS.textMuted};line-height:1.8;margin-bottom:.85rem;
        }
        .pol-list{
          padding-left:1.1rem;margin:.5rem 0 .85rem;display:flex;flex-direction:column;gap:.45rem;
        }
        .pol-list li{font-size:.85rem;color:${COLORS.textMuted};line-height:1.7}
        .pol-list li::marker{color:${COLORS.accent}}

        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .fu{animation:fadeUp .4s cubic-bezier(0.16,1,0.3,1) both}
        .fu1{animation-delay:.05s}.fu2{animation-delay:.12s}.fu3{animation-delay:.2s}

        @media(max-width:860px){.pol-layout{grid-template-columns:1fr !important}}
        @media(max-width:480px){.pol-main{padding:2rem 1.25rem !important}}
      `}</style>

      {/* Nav */}
      <nav className="pol-nav">
        <div className="pol-logo" onClick={() => navigate("/")}>
          {BRAND.name}<span style={{ color: COLORS.accent }}>{BRAND.accent}</span>
        </div>
        <button className="pol-cta" onClick={() => navigate(isAuth ? "/courses" : "/auth")}>
          {isAuth ? "Личный кабинет" : "Войти"}
        </button>
      </nav>
      <div aria-hidden style={{ height: "57px" }} />

      <div className="pol-layout" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem", padding: "3.5rem 2.5rem 6rem", alignItems: "start" }}>

        {/* ── Оглавление ── */}
        <aside style={{ position: "sticky", top: "80px" }} className="fu fu1">
          <p style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".75rem" }}>
            Содержание
          </p>
          {SECTIONS.map(s => (
            <a key={s.id} className="pol-toc-link" href={`#${s.id}`}
              onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
              {s.title}
            </a>
          ))}
        </aside>

        {/* ── Основной контент ── */}
        <main className="pol-main fu fu2" style={{ padding: "0" }}>

          {/* Hero */}
          <div style={{ marginBottom: "3rem" }}>
            <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
              Юридическая информация
            </p>
            <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-.03em", color: COLORS.textPrimary, lineHeight: 1.15, marginBottom: ".75rem" }}>
              Политика конфиденциальности
            </h1>
            <p style={{ fontSize: ".82rem", color: COLORS.textFaint }}>
              Последнее обновление: {UPDATED}
            </p>
          </div>

          {/* Разделитель */}
          <div style={{ height: "1px", background: COLORS.border, marginBottom: "3rem" }} />

          {/* Секции */}
          {SECTIONS.map((s, idx) => (
            <Fragment key={s.id}>
              <section id={s.id} style={{ marginBottom: "2.5rem", scrollMarginTop: "88px" }}>
                <h2 className="pol-section-title">{s.title}</h2>
                {s.body.map((t, i) => (
                  <p key={i} className="pol-body-text">{t}</p>
                ))}
                {s.list && (
                  <ul className="pol-list">
                    {s.list.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
                {s.after && <p className="pol-body-text">{s.after}</p>}
              </section>
              {idx < SECTIONS.length - 1 && (
                <div style={{ height: "1px", background: COLORS.border, marginBottom: "2.5rem" }} />
              )}
            </Fragment>
          ))}

          {/* Подпись */}
          <div style={{ marginTop: "3rem", padding: "1.25rem 1.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px" }}>
            <p style={{ fontSize: ".78rem", color: COLORS.textFaint, lineHeight: 1.7 }}>
              Продолжая использовать платформу <strong style={{ color: COLORS.textMuted }}>OquMi</strong>, вы подтверждаете, что прочитали и приняли настоящую Политику конфиденциальности. Документ вступает в силу с момента регистрации учётной записи или начала использования публичных функций сервиса.
            </p>
          </div>
        </main>

      </div>
    </div>
  );
}
