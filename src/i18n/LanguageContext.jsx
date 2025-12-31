import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "iquest.lang";

const DICT = {
  zh: {
    nav_home_aria: "IQuest 首页",
    nav_logo_alt: "IQuest 标志",
    nav_contact: "联系我们",
    nav_report: "技术报告",
    nav_download: "模型下载",
    page_report: "技术报告",
    page_download: "模型下载",
    page_contact: "联系我们",
    not_found_title: "页面不存在",
    not_found_body: "你访问的页面不存在。",
    back_home: "返回首页",
    simple_placeholder: "内容建设中。",
    section_features: "核心特点",
    section_pipeline: "训练流程",
    section_benchmark: "基准表现",
    section_specs: "模型规格",
    section_loop: "Loop 性能",
    section_showcases: "使用示例",
    cta_download: "模型下载",
    cta_report: "技术报告",
    footer_rights: "© {year} IQuest Coder Group. 保留所有权利。",
    lang_button: "中 / EN",
    lang_to_zh: "切换到中文",
    lang_to_en: "切换到英文",

    contact_email_label: "邮箱",

    home_section_nav_aria: "页面分区导航",
    home_hero_image_alt: "首页主视觉图",
    home_hero_lead: "新一代面向软件工程、竞赛编程的代码大模型系列：",
    home_hero_models_aria: "模型规格：7B、14B、40B、40B-Loop",

    home_features_aria: "核心特点",
    home_feature_codeflow_title: "Code-Flow 训练",
    home_feature_codeflow_desc:
      "基于 Code-Flow 的多阶段训练策略，跟踪代码逻辑演化过程",
    home_feature_reason_title: "增强推理能力",
    home_feature_reason_desc:
      "加入 32k 推理与智能体轨迹，增强过程推理与长上下文稳定性",
    home_feature_dual_title: "双路径训练",
    home_feature_dual_desc:
      "两条后训练路径：Thinking（强化推理）与 Instruct（通用协助）",
    home_feature_loop_title: "Loop 架构",
    home_feature_loop_desc:
      "引入Loop结构，相比同算力开销模型，显著降低显存和KV Cache占用，大幅提升模型吞吐",
    home_feature_deploy_title: "高效部署",
    home_feature_deploy_desc:
      "Base/Loop版支持单卡H20推理，Int4版单卡3090/4090消费级显卡即可部署",
    home_feature_cost_title: "成本优化",
    home_feature_cost_desc:
      "仅引入5%额外训练成本，借由Loop架构大幅释放模型性能，达到数百B MoE大模型性能，重塑帕累托边界",

    home_pipeline_aria: "训练流程",
    home_pipeline_desc:
      "训练包含 Pre-Train、Annealing、Mid-Train，以及 Post-Train，形成完整的能力进阶结构。通过引入代码库变更流、长上下文数据与思维强化信号，模型在真实任务中获得更稳定的行为与更低的错误传播率。",
    home_pipeline_image_alt: "训练流程图",

    home_benchmark_aria: "基准表现",
    home_benchmark_desc:
      "在多个关键编码任务基准中取得领先表现，包括 SWE-Bench Verified、LiveCodeBench v6、Terminal Bench 等。",
    home_benchmark_image_alt: "基准柱状图",

    home_specs_aria: "模型规格",
    home_specs_th_model: "模型配置",
    home_specs_th_params: "参数规模",
    home_specs_th_ctx: "最大上下文",
    home_specs_th_path: "路径",
    home_specs_path_dense_aria: "Stage1 到 Stage2 到 Instruct 到 Thinking",
    home_specs_path_loop_aria: "Loop 到 Instruct 到 Thinking",

    home_loop_aria: "LoopCoder 性能对比",
    home_loop_h2: "LoopCoder 性能提升",
    home_loop_intro_1:
      "LoopCoder 通过 Loop 结构设计，在保持相同显存占用的情况下，显著提高模型的性能上限。",
    home_loop_intro_2:
      "以下对比展示了相同任务下，LoopCoder 相比 Dense Model 的性能优势。",
    home_loop_benefit1_title: "显存占用降低",
    home_loop_benefit1_desc: "Loop 结构通过参数共享机制，显著减少显存需求",
    home_loop_benefit2_title: "部署效率提升",
    home_loop_benefit2_desc: "更低的资源消耗使得模型在相同硬件上运行更流畅",
    home_loop_benefit3_title: "性能保持",
    home_loop_benefit3_desc: "在降低显存占用的同时，模型能力近似一致",
    home_loop_benefit4_title: "扩展性强",
    home_loop_benefit4_desc: "引入Loop架构大幅提升模型参数可扩展性",
    home_loop_task_title: "虫洞飞行",
    home_loop_task_desc:
      "用页面滚动来控制在虫洞里飞行的方向和速度，下滑加速前进、停止就悬停或慢慢漂、上滑能后退，速度越快画面就带点径向模糊、颜色往暖色偏，营造超高速飞行的感觉。",
    home_loop_dense_title: "Dense 模型",
    home_loop_loop_title: "Loop 模型",
    home_loop_dense_iframe_title: "Dense 模型 Demo",
    home_loop_loop_iframe_title: "LoopCoder Demo",

    demo1_title: "粒子文字汇聚与炸裂特效",
    demo1_intro: "实现一个粒子文字动画，满足以下要求：",
    demo1_item1:
      "文字采样：在 Canvas 上将指定文字（如 IQuest）转化为由数百个微小粒子组成的点阵。",
    demo1_item2: "位置状态：每个粒子拥有当前坐标与目标坐标（组成文字）。",
    demo1_item3:
      "交互物理：鼠标靠近时施加斥力四散逃离；鼠标移开后施加弹力，平滑回到目标位置。",
    demo1_item4:
      "视觉与缓动：粒子颜色随机或渐变，整体动作带缓动（Easing）效果。",
    demo1_iframe_title: "粒子文字汇聚与炸裂特效 Demo",

    demo2_title: "像素风 Falling Sand 元素沙盒",
    demo2_desc:
      "给出一个实时刷新的像素沙盘玩具，左边有按钮切换沙子、水、石头、酸液，我在画布上涂抹就能生成，对应不同颜色，还能大规模更新很多像素点也不会明显卡顿，各种元素要有比较真实的下落和流动效果。",
    demo2_iframe_title: "像素风 Falling Sand 元素沙盒",

    demo3_title: "太阳系模拟",
    demo3_desc: "写一个网页，展示一个尽可能真实的太阳系模拟。",
    demo3_iframe_title: "太阳系模拟",

    demo4_title: "复古淘金游戏",
    demo4_iframe_title: "复古淘金游戏",

    demo5_title: "霓虹太空射击游戏",
    demo5_intro:
      "一个完整的单文件 HTML5 Canvas 太空射击游戏，主打复古霓虹风格与扎实的战斗反馈。",
    demo5_item1: "画面风格：黑色背景 + 高饱和霓虹几何元素，整体观感更“街机”。",
    demo5_item2:
      "操控方式：WASD 移动；支持两种瞄准/炮塔控制（鼠标跟随，或按 R 旋转炮塔）。",
    demo5_item3: "射击机制：飞船自动开火，并配套完整的视觉特效表现。",
    demo5_item4:
      "战斗反馈：击毁敌人触发粒子爆炸；受击带屏幕震动（Screen Shake）。",
    demo5_item5:
      "敌人系统：普通士兵 / 迅捷突袭者 / 重装坦克三类敌人，并包含 Boss 战。",
    demo5_item6: "成长与掉落：击败敌人掉落 P 道具，用于提升火力等级。",
    demo5_iframe_title: "Neon Space Shooter",

    demo6_title: "Boids算法 - 仿生鸟群/鱼群模拟",
    demo6_intro:
      "基于 Boids 算法的仿生群集（鸟群/鱼群）模拟：150+ 自主智能体实时演化，支持参数面板调参与交互扰动。",
    demo6_item1:
      "核心规则：分离（避免碰撞）、对齐（速度匹配）、凝聚（群体向心）。",
    demo6_item2:
      "实时调参面板：可调分离/对齐/凝聚权重（0–3），视野半径（20–150px）与最大速度。",
    demo6_item3: "交互行为：鼠标作为“捕食者”靠近时，邻近个体会迅速四散躲避。",
    demo6_item4:
      "渲染效果：霓虹色三角形智能体，随运动方向旋转；暗色背景叠加发光拖尾轨迹。",
    demo6_item5: "辅助功能：内置 FPS 计数器；按 Space 暂停/继续。",
    demo6_iframe_title: "Boids Algorithm - Flocking Simulation",

    showcase_new_title: "ICPC 北部欧亚大陆区域赛总决赛（镜像赛）",
    showcase_new_desc: "描述待定。",
    showcase_new_image_alt: "使用示例图片（待定）",
  },
  en: {
    nav_home_aria: "IQuest Home",
    nav_logo_alt: "IQuest logo",
    nav_contact: "Contact",
    nav_report: "Report",
    nav_download: "Download",
    page_report: "Report",
    page_download: "Download",
    page_contact: "Contact",
    not_found_title: "Page not found",
    not_found_body: "The page you requested does not exist.",
    back_home: "Back to Home",
    simple_placeholder: "Content coming soon.",
    section_features: "Features",
    section_pipeline: "Training Pipeline",
    section_benchmark: "Benchmarks",
    section_specs: "Model Specifications",
    section_loop: "Loop Performance",
    section_showcases: "Showcases",
    cta_download: "Download",
    cta_report: "Report",
    footer_rights: "© {year} IQuest Coder Group. All rights reserved.",
    lang_button: "中 / EN",
    lang_to_zh: "Switch to Chinese",
    lang_to_en: "Switch to English",

    contact_email_label: "Email",

    home_section_nav_aria: "Page sections",
    home_hero_image_alt: "Hero image",
    home_hero_lead:
      "A new generation of code LLMs for software engineering and competitive programming:",
    home_hero_models_aria: "Model sizes: 7B, 14B, 40B, 40B-Loop",

    home_features_aria: "Features",
    home_feature_codeflow_title: "Code-Flow Training",
    home_feature_codeflow_desc:
      "Multi-stage training based on Code-Flow to track code evolution over time.",
    home_feature_reason_title: "Stronger Reasoning",
    home_feature_reason_desc:
      "Adds 32k reasoning traces and agent trajectories for stable long-context reasoning.",
    home_feature_dual_title: "Dual Post-Training Paths",
    home_feature_dual_desc:
      "Two post-training tracks: Thinking (reasoning-focused) and Instruct (general assistance).",
    home_feature_loop_title: "Loop Architecture",
    home_feature_loop_desc:
      "With the Loop architecture, compared to models with similar compute cost, VRAM and KV cache usage are significantly reduced while throughput is greatly improved.",
    home_feature_deploy_title: "Efficient Deployment",
    home_feature_deploy_desc:
      "Base/Loop versions run on a single H20; the int4 version can be deployed on a single consumer GPU such as 3090/4090.",
    home_feature_cost_title: "Cost Optimization",
    home_feature_cost_desc:
      "With only ~5% additional training cost, the Loop architecture unlocks much higher performance—reaching the level of hundreds-of-billions-parameter MoE models and reshaping the Pareto frontier.",

    home_pipeline_aria: "Training Pipeline",
    home_pipeline_desc:
      "Training includes Pre-Train, Annealing, Mid-Train, and Post-Train for a complete capability progression. By introducing repo change flows, long-context data, and reasoning reinforcement signals, the model behaves more reliably on real tasks with lower error propagation.",
    home_pipeline_image_alt: "Training pipeline",

    home_benchmark_aria: "Benchmarks",
    home_benchmark_desc:
      "Leading results on key coding benchmarks including SWE-Bench Verified, LiveCodeBench v6, and Terminal Bench.",
    home_benchmark_image_alt: "Benchmark chart",

    home_specs_aria: "Model Specifications",
    home_specs_th_model: "Model",
    home_specs_th_params: "Params",
    home_specs_th_ctx: "Max Context",
    home_specs_th_path: "Path",
    home_specs_path_dense_aria: "Stage1 to Stage2 to Instruct to Thinking",
    home_specs_path_loop_aria: "Loop to Instruct to Thinking",

    home_loop_aria: "LoopCoder performance comparison",
    home_loop_h2: "LoopCoder Performance Enhancement",
    home_loop_intro_1:
      "With the Loop architecture, LoopCoder significantly raises the performance ceiling while keeping the same VRAM footprint.",
    home_loop_intro_2:
      "The comparison below shows LoopCoder’s advantage over dense models on the same task.",
    home_loop_benefit1_title: "Lower VRAM Usage",
    home_loop_benefit1_desc:
      "Parameter sharing in the Loop structure substantially reduces memory requirements.",
    home_loop_benefit2_title: "Higher Deployment Efficiency",
    home_loop_benefit2_desc:
      "Lower resource consumption makes inference smoother on the same hardware.",
    home_loop_benefit3_title: "Performance Maintained",
    home_loop_benefit3_desc:
      "Capability remains approximately consistent while reducing memory footprint.",
    home_loop_benefit4_title: "Highly Scalable",
    home_loop_benefit4_desc:
      "Introducing the Loop architecture greatly improves the scalability of model parameters.",
    home_loop_task_title: "Wormhole Flight",
    home_loop_task_desc:
      "Use page scroll to control direction and speed in a wormhole: scroll down to accelerate forward, stop to hover/drift, scroll up to reverse. Faster speed adds radial blur and shifts colors warmer to convey hyperspeed.",
    home_loop_dense_title: "Dense Model",
    home_loop_loop_title: "Loop Model",
    home_loop_dense_iframe_title: "Dense model demo",
    home_loop_loop_iframe_title: "LoopCoder demo",

    demo1_title: "Particle Text Converge & Burst",
    demo1_intro:
      "Build a particle-text animation with the following requirements:",
    demo1_item1:
      "Text sampling: convert given text (e.g., IQuest) on Canvas into a dot matrix made of hundreds of tiny particles.",
    demo1_item2:
      "State: each particle has a current position and a target position (forming the text).",
    demo1_item3:
      "Interactive physics: repel and scatter when the mouse is near; spring back smoothly when it moves away.",
    demo1_item4:
      "Visuals & easing: random/gradient colors with easing for overall motion.",
    demo1_iframe_title: "Particle text demo",

    demo2_title: "Pixel Falling Sand Sandbox",
    demo2_desc:
      "A realtime pixel sandbox: buttons switch sand/water/stone/acid; paint on the canvas to spawn elements with distinct colors; massive updates stay smooth; elements fall and flow realistically.",
    demo2_iframe_title: "Falling sand sandbox",

    demo3_title: "Solar System Simulation",
    demo3_desc:
      "Write a web page to show a realistic simulation of the solar system.",
    demo3_iframe_title: "Solar system simulation",

    demo4_title: "Retro Gold Miner",
    demo4_iframe_title: "Retro gold miner",

    demo5_title: "Neon Space Shooter",
    demo5_intro:
      "A complete single-file HTML5 Canvas space shooter with retro neon aesthetics and strong combat feedback.",
    demo5_item1:
      "Visual style: black background with high-saturation neon geometric shapes for an arcade feel.",
    demo5_item2:
      "Controls: WASD movement; two aiming/turret modes (mouse-follow, or press R to rotate the turret).",
    demo5_item3: "Shooting: auto-shooting spacecraft with full visual effects.",
    demo5_item4:
      "Feedback: particle explosions on kills; screen shake on damage.",
    demo5_item5:
      "Enemies: normal soldiers / fast raiders / heavy tanks, plus boss battles.",
    demo5_item6: "Progression: P drops upgrade firepower.",
    demo5_iframe_title: "Neon Space Shooter",

    demo6_title: "Boids Algorithm - Flocking Simulation",
    demo6_intro:
      "A biomimetic bird/fish flock simulation based on the Boids algorithm with 150+ autonomous agents and realtime tuning.",
    demo6_item1:
      "Core rules: Separation (collision avoidance), Alignment (velocity matching), and Cohesion (group centering).",
    demo6_item2:
      "Realtime panel: tune separation/alignment/cohesion weights (0–3), vision radius (20–150px), and max speed.",
    demo6_item3:
      "Interaction: the mouse acts as a predator, causing nearby agents to scatter.",
    demo6_item4:
      "Rendering: neon triangles rotating by movement direction with glowing trails on a dark background.",
    demo6_item5: "Utilities: FPS counter and pause/resume (Space).",
    demo6_iframe_title: "Boids flocking simulation",

    showcase_new_title:
      "2025-2026 ICPC, NERC, Northern Eurasia Finals Online Mirror",
    showcase_new_desc: "Description TBD.",
    showcase_new_image_alt: "Showcase image (TBD)",
  },
};

const LanguageContext = createContext({
  lang: "zh",
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === "undefined") return "zh";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "zh" ? saved : "zh";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "zh" : "en"));
  }, []);

  const t = useCallback(
    (key) => {
      const table = DICT[lang] ?? DICT.zh;
      return table[key] ?? DICT.zh[key] ?? key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, toggleLang, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  return ctx;
}
