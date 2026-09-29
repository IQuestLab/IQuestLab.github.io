import { t } from './i18n.js'

// Evaluation results displayed on the page.
// Each benchmark compares its own set of models; column order of every `scores` array follows `models`,
// null = not compared. Scores keep the sheet's one decimal.
const models = ['IQuest-Q1', 'Claude Opus 5', 'GPT-5.6 Sol', 'GLM-5.3', 'GLM-5.3-Flash', 'DeepSeek-V4-Pro', 'DeepSeek-V4.1-Flash', 'DeepSeek-V4-Flash', 'Hy4-preview', 'Minimax-M3']
const row = (name, group, by) => {
  const unknown = Object.keys(by).filter(m => !models.includes(m))
  if (unknown.length) throw new Error(`benchmarks: unknown model ${unknown.join(', ')} in ${name}`)
  // `listed` keeps the sheet's model order, which breaks ties as in the report figure.
  return { name, group, scores: models.map(m => by[m] ?? null), listed: Object.keys(by).map(m => models.indexOf(m)) }
}

export const benchmarks = {
  models,
  // Model icons in public/images/logos, as in the report figure.
  logos: {
    'IQuest-Q1': 'iquest', 'Claude Opus 5': 'claude', 'GPT-5.6 Sol': 'openai', 'GLM-5.3': 'zai', 'GLM-5.3-Flash': 'zai',
    'DeepSeek-V4-Pro': 'deepseek', 'DeepSeek-V4.1-Flash': 'deepseek', 'DeepSeek-V4-Flash': 'deepseek',
    'Hy4-preview': 'hunyuan', 'Minimax-M3': 'minimax',
  },
  highlight: 0,
  groups: [t('Coding agent', '编程智能体'), t('General agent', '通用智能体')],
  rows: [
    row('DeepSWE v1.1', 0, { 'IQuest-Q1': 64.6, 'Hy4-preview': 64.3, 'GLM-5.3': 66.9, 'DeepSeek-V4.1-Flash': 74.2, 'Claude Opus 5': 73.7 }),
    row('NL2Repo', 0, { 'IQuest-Q1': 63.0, 'Claude Opus 5': 75.3, 'Hy4-preview': 58.9, 'GLM-5.3': 58.0, 'DeepSeek-V4-Pro': 61.5 }),
    row('CyberGym', 0, { 'IQuest-Q1': 84.5, 'GLM-5.3': 84.5, 'Hy4-preview': 78.4, 'DeepSeek-V4-Pro': 83.3, 'DeepSeek-V4.1-Flash': 88.1 }),
    row('Terminal-Bench 2.1', 0, { 'Hy4-preview': 85.4, 'GLM-5.3-Flash': 84.3, 'IQuest-Q1': 83.2, 'DeepSeek-V4-Flash': 82.7, 'Claude Opus 5': 89.1 }),
    row('JobBench', 1, { 'IQuest-Q1': 55.7, 'GLM-5.3-Flash': 49.7, 'DeepSeek-V4-Flash': 50.0, 'Claude Opus 5': 65.7, 'GLM-5.3': 61.4 }),
    row('Agents’ Last Exam', 1, { 'IQuest-Q1': 29.6, 'GLM-5.3-Flash': 26.3, 'DeepSeek-V4-Flash': 25.2, 'Claude Opus 5': 32.2, 'DeepSeek-V4.1-Flash': 31.8 }),
    row('Humanity’s Last Exam', 1, { 'Hy4-preview': 43.4, 'GLM-5.3-Flash': 39.9, 'IQuest-Q1': 39.2, 'DeepSeek-V4-Flash': 38.6, 'Minimax-M3': 39.0 }),
    row('IQuest-CLIBench', 0, { 'IQuest-Q1': 53.7, 'DeepSeek-V4-Flash': 51.5, 'Claude Opus 5': 58.2, 'GLM-5.3-Flash': 49.5, 'GPT-5.6 Sol': 58.5 }),
  ],
  // Footnote under the v2 evaluation figure, one entry per paragraph.
  // `backticks` render as code and \n as a line break.
  sourceNote: [
    t('IQuest-Q1 performance across benchmarks. DeepSeek-V4-Flash/Pro refer to the official 0731/0813 releases, respectively. Humanity’s Last Exam is reported without tools. IQuest-CLIBench is our in-house benchmark for CLI user experience.',
      'IQuest-Q1 在各基准上的表现。DeepSeek-V4-Flash 与 DeepSeek-V4-Pro 分别指官方 0731 与 0813 版本。Humanity’s Last Exam 为不使用工具的成绩。IQuest-CLIBench 是我们用于评估 CLI 用户体验的内部基准。'),
    t('For reproducibility, we recommend using a temperature of 1.0, top-p of 0.95, and top-k of 20, with Claude Code `2.1.140` or Codex `0.142` as the respective harness.',
      '为便于复现，我们建议使用 temperature 1.0、top-p 0.95、top-k 20，并分别以 Claude Code `2.1.140` 或 Codex `0.142` 作为脚手架。'),
    t('For each model, we report the publicly reported score; otherwise, we evaluate the model using the corresponding benchmark setup:\n(1) Harness: For agentic coding tasks, we use mini-SWE-agent for DeepSWE v1.1, and Claude Code for other tasks. For Agents’ Last Exam, we evaluate our model using Claude Code `2.1.258`. Because our models currently do not have multimodal capability, we replace multimodal content inputs in the agent conversation with placeholders during tokenization. (2) Runtime: We set six-hour limits for CyberGym, eight hours for Terminal-Bench 2.1.',
      '对于每个模型，我们采用其公开报告的分数；若无公开分数，则按相应基准的设置进行评测：\n（1）脚手架：智能体编程任务中，DeepSWE v1.1 使用 mini-SWE-agent，其余任务使用 Claude Code。Agents’ Last Exam 上，我们使用 Claude Code `2.1.258` 评测我们的模型；由于我们的模型目前不具备多模态能力，我们在分词时将智能体对话中的多模态输入内容替换为占位符。（2）运行时长：CyberGym 限时 6 小时，Terminal-Bench 2.1 限时 8 小时。'),
  ],

}

export const reportedScores = scores => scores.filter(v => v != null)
export const scoreOf = (name, model = 'IQuest-Q1') => {
  const row = benchmarks.rows.find(r => r.name === name)
  return row ? row.scores[benchmarks.models.indexOf(model)] : null
}
