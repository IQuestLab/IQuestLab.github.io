import { Link, NavLink, Outlet } from "react-router-dom";
import { assetUrl } from "../utils/assetUrl.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const navLinkClassName = ({ isActive }) => {
  // 保持原视觉：仍然用 a 的样式，active 不额外加样式（避免界面变化）
  return isActive ? "active" : undefined;
};

export default function Layout() {
  const { lang, toggleLang, t } = useLanguage();
  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const yearText =
    currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`;

  return (
    <div className="layout-shell">
      {/* 顶部导航 */}
      <header className="navbar">
        <div className="nav-container">
          <Link to="/" aria-label={t("nav_home_aria")}>
            <img
              src={assetUrl("images/logo-full.jpg")}
              alt={t("nav_logo_alt")}
              className="logo"
            />
          </Link>

          <nav className="nav-links">
            <button
              type="button"
              className="nav-lang-toggle"
              onClick={toggleLang}
              aria-label={lang === "en" ? t("lang_to_zh") : t("lang_to_en")}
              title={lang === "en" ? t("lang_to_zh") : t("lang_to_en")}
            >
              {t("lang_button")}
            </button>
            <NavLink to="/contact" className={navLinkClassName}>
              {t("nav_contact")}
            </NavLink>
          </nav>
        </div>
      </header>

      <div className="layout-main">
        <Outlet />
      </div>

      {/* 底部 */}
      <footer className="footer">
        <p>
          <small>{t("footer_rights").replace("{year}", yearText)}</small>
        </p>
      </footer>
    </div>
  );
}
