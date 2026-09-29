import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <section className="content-section" style={{ marginTop: 120 }}>
      <h2>{t("not_found_title")}</h2>
      <p>
        {t("not_found_body")} <Link to="/">{t("back_home")}</Link>
      </p>
    </section>
  );
}


