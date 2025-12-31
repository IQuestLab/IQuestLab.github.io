import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import SimplePage from "./pages/SimplePage.jsx";
import { useLanguage } from "./i18n/LanguageContext.jsx";

function ContactContent() {
  const { t } = useLanguage();
  const email = "research@iquestlab.com";

  return (
    <p>
      {t("contact_email_label")}：{" "}
      <a href={`mailto:${email}`} target="_blank" rel="noreferrer">
        {email}
      </a>
    </p>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/report" element={<SimplePage titleKey="page_report" />} />
        <Route
          path="/download"
          element={<SimplePage titleKey="page_download" />}
        />
        <Route
          path="/contact"
          element={
            <SimplePage titleKey="page_contact">
              <ContactContent />
            </SimplePage>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
