import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiGitBranch,
  FiCpu,
  FiHardDrive,
  FiCheckCircle,
  FiRefreshCw,
  FiServer,
  FiShuffle,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiFileText,
} from "react-icons/fi";
import { assetUrl } from "../utils/assetUrl.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function HomePage() {
  const { t } = useLanguage();
  const demoSrc = (fileName) => assetUrl(`demo/${fileName}`);
  const loopDemoSrc = (fileName) => assetUrl(`demo_loop/${fileName}`);

  const sections = useMemo(
    () => [
      { id: "features", label: t("section_features") },
      { id: "pipeline", label: t("section_pipeline") },
      { id: "benchmark", label: t("section_benchmark") },
      { id: "specs", label: t("section_specs") },
      { id: "loop", label: t("section_loop") },
      { id: "showcases", label: t("section_showcases") },
    ],
    [t]
  );

  const [activeSection, setActiveSection] = useState("hero");
  // 点击导航后的短暂“锁定”：避免滚动动画开始时 ScrollSpy 立即把高亮切回上一段造成闪烁
  const scrollLockRef = useRef(null);

  useEffect(() => {
    // OLMo 风格：正文始终清晰展示；只对媒体（图片/iframe）做轻量入场动效
    const items = Array.from(
      document.querySelectorAll(".home-page [data-reveal]")
    );
    if (!items.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        }
      },
      {
        root: null,
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // ScrollSpy：明确用户进入了哪个区域（不改变文字呈现）
    const els = Array.from(
      document.querySelectorAll(".home-page [data-section]")
    );
    if (!els.length) return;

    const lastSectionId = sections[sections.length - 1]?.id;

    // 采用“marker 线”判定：在导航栏下方放一条参考线，
    // 哪个 section 覆盖这条线（top <= markerY < bottom）就认为它是 active。
    // 这样不会被“上一段很长导致 intersectionRatio 更大”所干扰。
    const getMarkerY = () => {
      const nav = document.querySelector(".navbar");
      const navH = nav?.getBoundingClientRect().height ?? 0;
      return navH + 24; // marker 线位于 navbar 下方一点点，更贴近用户视觉“当前段落”的感知
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const markerY = getMarkerY();

      // 点击锁定：点击后短时间内保持高亮目标项，直到目标项覆盖 marker 线
      const lock = scrollLockRef.current;
      if (lock && lock.id && typeof lock.until === "number") {
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        if (now < lock.until) {
          const target = document.getElementById(lock.id);
          if (target) {
            const r = target.getBoundingClientRect();
            const reached = r.top <= markerY && r.bottom > markerY;
            if (!reached) {
              setActiveSection((prev) => (prev === lock.id ? prev : lock.id));
              return;
            }
          }
        }
        // 过期或已到达：解除锁定，恢复正常 ScrollSpy
        scrollLockRef.current = null;
      }

      // 正常情况：找到覆盖 marker 线的 section（从后往前找，匹配“最深的当前段”）
      let activeEl = null;
      for (let i = els.length - 1; i >= 0; i--) {
        const rect = els[i].getBoundingClientRect();
        if (rect.top <= markerY && rect.bottom > markerY) {
          activeEl = els[i];
          break;
        }
      }

      // 底部兜底：滚到页面最底部时强制选中最后一个导航项（通常是“使用示例”）
      if (lastSectionId) {
        const doc = document.documentElement;
        const bottom = window.scrollY + window.innerHeight;
        const docH = doc.scrollHeight;
        if (bottom >= docH - 2) {
          setActiveSection((prev) =>
            prev === lastSectionId ? prev : lastSectionId
          );
          return;
        }
      }

      const id = activeEl?.getAttribute("id");
      if (id) setActiveSection(id);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [sections]);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (!section) return;

    // 更“准”的落点：对齐到该 section 的标题，而不是 section 顶部（否则会叠加 section 内 padding）
    const target =
      section.querySelector("h2") ||
      section.querySelector("h3") ||
      section.querySelector(".content-section") ||
      section;

    const nav = document.querySelector(".navbar");
    const navH = nav?.getBoundingClientRect().height ?? 0;
    const y = target.getBoundingClientRect().top + window.scrollY - navH - 12;

    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  return (
    <main className="home-page">
      <nav className="section-nav" aria-label={t("home_section_nav_aria")}>
        <div className="section-nav-inner">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={[
                "section-nav-item",
                activeSection === s.id ? "is-active" : "",
              ].join(" ")}
              onClick={(e) => {
                e.preventDefault();
                // 点击时先更新选中态，避免滚动动画过程中短暂“跳回”上一段
                setActiveSection(s.id);
                scrollLockRef.current = {
                  id: s.id,
                  // 1.2s 基本覆盖 smooth scroll 的启动与大多数滚动距离；到达目标后会提前解锁
                  until:
                    (typeof performance !== "undefined"
                      ? performance.now()
                      : Date.now()) + 1200,
                };
                scrollToSection(s.id);
              }}
            >
              <span className="section-nav-label">{s.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* 主视觉区 */}
      <section
        id="hero"
        data-section
        className="hero page-section section-hero"
        aria-label="Hero"
      >
        <div className="content-section">
          <div className="hero-image hero-image--no-border" data-reveal>
            <img
              src={assetUrl("images/iquest.svg")}
              alt={t("home_hero_image_alt")}
            />
          </div>
          <p className="subtitle">
            <span className="subtitle-lead">{t("home_hero_lead")}</span>
            <span
              className="subtitle-models"
              aria-label={t("home_hero_models_aria")}
            >
              <span className="subtitle-chip">7B</span>
              <span className="subtitle-chip">14B</span>
              <span className="subtitle-chip">40B</span>
              <span className="subtitle-chip">40B-Loop</span>
            </span>
          </p>
          <div className="hero-actions">
            <a
              className="btn btn-primary"
              href="https://huggingface.co/collections/IQuestLab/iquest-coder"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("cta_download")}
              <FiDownload className="btn-icon" size={16} aria-hidden="true" />
            </a>
            <Link className="btn btn-secondary" to="/report">
              {t("cta_report")}
              <FiFileText className="btn-icon" size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 核心介绍 */}
      <section
        id="features"
        data-section
        className="page-section section-features"
        aria-label={t("home_features_aria")}
      >
        <div className="content-section">
          <h2>{t("section_features")}</h2>
          <ul className="feature-grid">
            <li className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <FiGitBranch size={18} />
              </div>
              <div className="feature-body">
                <div className="feature-title">
                  {t("home_feature_codeflow_title")}
                </div>
                <div className="feature-desc">
                  {t("home_feature_codeflow_desc")}
                </div>
              </div>
            </li>
            <li className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <FiCpu size={18} />
              </div>
              <div className="feature-body">
                <div className="feature-title">
                  {t("home_feature_reason_title")}
                </div>
                <div className="feature-desc">
                  {t("home_feature_reason_desc")}
                </div>
              </div>
            </li>
            <li className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <FiShuffle size={18} />
              </div>
              <div className="feature-body">
                <div className="feature-title">
                  {t("home_feature_dual_title")}
                </div>
                <div className="feature-desc">
                  {t("home_feature_dual_desc")}
                </div>
              </div>
            </li>
            <li className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <FiRefreshCw size={18} />
              </div>
              <div className="feature-body">
                <div className="feature-title">
                  {t("home_feature_loop_title")}
                </div>
                <div className="feature-desc">
                  {t("home_feature_loop_desc")}
                </div>
              </div>
            </li>
            <li className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <FiServer size={18} />
              </div>
              <div className="feature-body">
                <div className="feature-title">
                  {t("home_feature_deploy_title")}
                </div>
                <div className="feature-desc">
                  {t("home_feature_deploy_desc")}
                </div>
              </div>
            </li>
            <li className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <FiTrendingDown size={18} />
              </div>
              <div className="feature-body">
                <div className="feature-title">
                  {t("home_feature_cost_title")}
                </div>
                <div className="feature-desc">
                  {t("home_feature_cost_desc")}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* 训练流程 */}
      <section
        id="pipeline"
        data-section
        className="page-section section-pipeline"
        aria-label={t("home_pipeline_aria")}
      >
        <div className="content-section">
          <h2>{t("section_pipeline")}</h2>
          <p>{t("home_pipeline_desc")}</p>
          <div className="media-wrap" data-reveal>
            <img
              src={assetUrl("images/pipeline.png")}
              className="pipeline-image"
              alt={t("home_pipeline_image_alt")}
            />
          </div>
        </div>
      </section>

      {/* 模型效果 */}
      <section
        id="benchmark"
        data-section
        className="page-section section-benchmark"
        aria-label={t("home_benchmark_aria")}
      >
        <div className="content-section">
          <h2>{t("section_benchmark")}</h2>
          <p>{t("home_benchmark_desc")}</p>
          <div className="media-wrap" data-reveal>
            <img
              src={assetUrl("images/benchmark.jpg")}
              alt={t("home_benchmark_image_alt")}
            />
          </div>
        </div>
      </section>

      {/* 参数与规格 */}
      <section
        id="specs"
        data-section
        className="page-section section-specs"
        aria-label={t("home_specs_aria")}
      >
        <div className="content-section">
          <h2>{t("section_specs")}</h2>
          <div className="spec-table-wrap">
            <div className="spec-table-scroll">
              <table className="spec-table">
                <thead>
                  <tr>
                    <th>{t("home_specs_th_model")}</th>
                    <th>{t("home_specs_th_params")}</th>
                    <th>{t("home_specs_th_ctx")}</th>
                    <th>{t("home_specs_th_path")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>IQuest-Coder-7B</td>
                    <td>7B</td>
                    <td>128K</td>
                    <td>
                      <div
                        className="path-flow"
                        aria-label={t("home_specs_path_dense_aria")}
                      >
                        <span className="path-step">Stage1</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Stage2</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Instruct</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Thinking</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>IQuest-Coder-14B</td>
                    <td>14B</td>
                    <td>128K</td>
                    <td>
                      <div
                        className="path-flow"
                        aria-label={t("home_specs_path_dense_aria")}
                      >
                        <span className="path-step">Stage1</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Stage2</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Instruct</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Thinking</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>IQuest-Coder-40B</td>
                    <td>40B</td>
                    <td>128K</td>
                    <td>
                      <div
                        className="path-flow"
                        aria-label={t("home_specs_path_dense_aria")}
                      >
                        <span className="path-step">Stage1</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Stage2</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Instruct</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Thinking</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>LoopCoder-40B-A80B</td>
                    <td>40B</td>
                    <td>128K</td>
                    <td>
                      <div
                        className="path-flow"
                        aria-label={t("home_specs_path_loop_aria")}
                      >
                        <span className="path-step">Loop</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Instruct</span>
                        <span className="path-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="path-step">Thinking</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* LoopCoder 性能对比 */}
      <section
        id="loop"
        data-section
        className="page-section section-loop"
        aria-label={t("home_loop_aria")}
      >
        <div className="content-section loop-section">
          <div className="section-header">
            <h2>{t("home_loop_h2")}</h2>
            <p className="section-intro">{t("home_loop_intro_1")}</p>
            <ul className="feature-grid">
              <li className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <FiHardDrive size={18} />
                </div>
                <div className="feature-body">
                  <div className="feature-title">
                    {t("home_loop_benefit1_title")}
                  </div>
                  <div className="feature-desc">
                    {t("home_loop_benefit1_desc")}
                  </div>
                </div>
              </li>
              <li className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <FiServer size={18} />
                </div>
                <div className="feature-body">
                  <div className="feature-title">
                    {t("home_loop_benefit2_title")}
                  </div>
                  <div className="feature-desc">
                    {t("home_loop_benefit2_desc")}
                  </div>
                </div>
              </li>
              <li className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <FiCheckCircle size={18} />
                </div>
                <div className="feature-body">
                  <div className="feature-title">
                    {t("home_loop_benefit3_title")}
                  </div>
                  <div className="feature-desc">
                    {t("home_loop_benefit3_desc")}
                  </div>
                </div>
              </li>
              <li className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <FiTrendingUp size={18} />
                </div>
                <div className="feature-body">
                  <div className="feature-title">
                    {t("home_loop_benefit4_title")}
                  </div>
                  <div className="feature-desc">
                    {t("home_loop_benefit4_desc")}
                  </div>
                </div>
              </li>
            </ul>
            <p className="loop-comparison-intro">{t("home_loop_intro_2")}</p>
          </div>

          <blockquote className="showcase-quote">
            <h3>{t("home_loop_task_title")}</h3>
            <p>{t("home_loop_task_desc")}</p>
          </blockquote>

          <div className="performance-comparison">
            <div className="comparison-item">
              <h3>{t("home_loop_dense_title")}</h3>
              <div className="comparison-demo" data-reveal>
                <iframe
                  src={loopDemoSrc("dense.html")}
                  title={t("home_loop_dense_iframe_title")}
                  frameBorder="0"
                  loading="lazy"
                  className="comparison-iframe"
                />
              </div>
            </div>
            <div className="comparison-item">
              <h3>{t("home_loop_loop_title")}</h3>
              <div className="comparison-demo" data-reveal>
                <iframe
                  src={loopDemoSrc("loop.html")}
                  title={t("home_loop_loop_iframe_title")}
                  frameBorder="0"
                  loading="lazy"
                  className="comparison-iframe"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* showcase */}
      <section
        id="showcases"
        data-section
        className="page-section section-showcases"
        aria-label={t("section_showcases")}
      >
        <div className="content-section">
          <h2>{t("section_showcases")}</h2>

          <div className="showcase-card">
            <blockquote className="showcase-quote">
              <h3>{t("showcase_new_title")}</h3>
            </blockquote>
            <div className="showcase-demo" data-reveal>
              <img
                src={assetUrl("images/icpc.jpg")}
                alt={t("showcase_new_image_alt")}
                className="showcase-media"
                loading="lazy"
              />
            </div>
          </div>

          <div className="showcase-card">
            <blockquote className="showcase-quote">
              <h3>{t("demo1_title")}</h3>
              <p className="prompt-intro">{t("demo1_intro")}</p>
              <ol className="prompt-list">
                <li>{t("demo1_item1")}</li>
                <li>{t("demo1_item2")}</li>
                <li>{t("demo1_item3")}</li>
                <li>{t("demo1_item4")}</li>
              </ol>
            </blockquote>
            <div className="showcase-demo" data-reveal>
              <iframe
                src={demoSrc("demo1.html")}
                title={t("demo1_iframe_title")}
                frameBorder="0"
                loading="lazy"
                className="showcase-iframe"
              />
            </div>
          </div>

          <div className="showcase-card">
            <blockquote className="showcase-quote">
              <h3>{t("demo2_title")}</h3>
              <p>{t("demo2_desc")}</p>
            </blockquote>
            <div className="showcase-demo" data-reveal>
              <iframe
                src={demoSrc("demo2.html")}
                title={t("demo2_iframe_title")}
                frameBorder="0"
                loading="lazy"
                className="showcase-iframe"
              />
            </div>
          </div>

          <div className="showcase-card">
            <blockquote className="showcase-quote">
              <h3>{t("demo3_title")}</h3>
              <p>{t("demo3_desc")}</p>
            </blockquote>
            <div className="showcase-demo" data-reveal>
              <iframe
                src={demoSrc("demo3.html")}
                title={t("demo3_iframe_title")}
                frameBorder="0"
                loading="lazy"
                className="showcase-iframe showcase-iframe--tall"
              />
            </div>
          </div>

          <div className="showcase-card">
            <blockquote className="showcase-quote">
              <h3>{t("demo5_title")}</h3>
              <p className="prompt-intro">{t("demo5_intro")}</p>
              <ul className="prompt-list">
                <li>{t("demo5_item1")}</li>
                <li>{t("demo5_item2")}</li>
                <li>{t("demo5_item3")}</li>
                <li>{t("demo5_item4")}</li>
                <li>{t("demo5_item5")}</li>
                <li>{t("demo5_item6")}</li>
              </ul>
            </blockquote>
            <div className="showcase-demo" data-reveal>
              <iframe
                src={demoSrc("demo5.html")}
                title={t("demo5_iframe_title")}
                frameBorder="0"
                loading="lazy"
                className="showcase-iframe"
              />
            </div>
          </div>

          <div className="showcase-card">
            <blockquote className="showcase-quote">
              <h3>{t("demo6_title")}</h3>
              <p className="prompt-intro">{t("demo6_intro")}</p>
              <ul className="prompt-list">
                <li>{t("demo6_item1")}</li>
                <li>{t("demo6_item2")}</li>
                <li>{t("demo6_item3")}</li>
                <li>{t("demo6_item4")}</li>
                <li>{t("demo6_item5")}</li>
              </ul>
            </blockquote>
            <div className="showcase-demo" data-reveal>
              <iframe
                src={demoSrc("demo6.html")}
                title={t("demo6_iframe_title")}
                frameBorder="0"
                loading="lazy"
                className="showcase-iframe"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
