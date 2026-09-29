import { t } from './i18n.js'
import { poster, video } from './media.js'

// Model R&D recordings. Titles and numbers are shared; each page version writes its own prose
// around them.
export const rdRecordings = [
  {
    id: 'case-1', video: video('rd/case-1'), poster: poster('rd/case-1'), duration: '3:00', size: [1920, 1080], scaffold: 'Claude Code',
    tag: t('Case 1 · Claude Code', '案例 1 · Claude Code'),
    title: t('An extra space that broke multi-turn training', '一个空格，让多轮训练只剩最后一轮'),
    short: t('Extra space', '多出的空格'),
  },
  {
    id: 'case-2', video: video('rd/case-2'), poster: poster('rd/case-2'), duration: '3:00', size: [1920, 1080], scaffold: 'Claude Code',
    tag: t('Case 2 · Claude Code', '案例 2 · Claude Code'),
    title: t('When an environment fault looks like model failure', '模型发现任务执行环境问题，并且修复'),
    short: t('Environment fault', '环境故障'),
  },
  {
    id: 'case-3', video: video('rd/case-3'), poster: poster('rd/case-3'), duration: '3:00', size: [1920, 1080], scaffold: 'Claude Code',
    tag: t('Case 3 · Claude Code', '案例 3 · Claude Code'),
    title: t('A research workbench, then a fix from inside it', '先搭研发工作台，再在台上修复失败任务'),
    short: t('Research workbench', '研发工作台'),
  },
]

// Numbers quoted in the case write-ups.
export const caseFacts = {
  // Case 1: reward mean before / after the fix / later in training.
  extraSpace: { before: '0.704', after: '0.769', later: '0.799' },
  // Lark scenarios.
  apiIncident: {
    dateEn: 'October 22', dateZh: '10 月 22 日', level: 1, records: '37,214', customers: 6,
    tasks: 7, receipts: 11, slides: 6,
  },
}

// Lark (Feishu) scenarios. Only the API incident has a recording (the sped-up cut of the 10·22 run).
export const larkScenarios = [
  {
    id: 'api-incident',
    tab: t('10·22 API incident', '10·22 接口越权'),
    title: t('10·22 API incident: determining who needs to be notified', '10·22 接口越权：查清影响范围，及时同步进展'),
    recordings: [
      { id: 'fast', minutes: 2, label: t('Sped up · 2 min', '加速版 · 2 分钟'), video: video('office/api-incident-fast'), poster: poster('office/api-incident'), size: [2560, 818] },
    ],
  },
]
