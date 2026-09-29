import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function SimplePage({ title, titleKey, children }) {
  const { t } = useLanguage();
  return (
    <section className="content-section" style={{ marginTop: 120 }}>
      <h2>{titleKey ? t(titleKey) : title}</h2>
      {children ?? <p>{t("simple_placeholder")}</p>}
      <div className="simple-page-actions">
        <Link className="btn btn-secondary" to="/">
          {t("back_home")}
        </Link>
      </div>
    </section>
  );
}


