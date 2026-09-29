// All v2 prose, as { en, zh } pairs. Numbers are interpolated from src/shared only (the build
// fails if a shared value is typed here by hand).
import {
  caseFacts as F, citationMeta, enWord, larkScenarios, links,
  model as M, rdRecordings, t, zhWord,
} from '../shared'

// Section order: the CLI agentic model first (what it is, how it was built, how it does, what it
// does in practice), then human-on-the-loop RSI as the outlook.
export const SECTION_ORDER = ['overview', 'training', 'results', 'frontend', 'office', 'rd-cases', 'quickstart', 'limitations', 'contact']

export const tocLabels = {
  overview: t('Overview', '概览'),
  training: t('Agentic training', '智能体训练'),
  results: t('Evaluation', '评测结果'),
  'rd-cases': t('Model development', '模型研发'),
  office: t('Office work', '办公任务'),
  frontend: t('Frontend', '前端'),
  quickstart: t('How to use', '快速开始'),
  limitations: t('Limitations', '局限性'),
  contact: t('Contact us', '联系我们'),
}

// Chinese rendering of the report title for the zh page; citations keep the English title.
const reportTitleZh = '提升智能体 CLI 系统的基础能力'

export const ui = {
  contents: t('Contents', '目录'),
  hideContents: t('Hide contents', '收起目录'),
  showContents: t('Show contents', '展开目录'),
  languageGroup: t('Language', '语言'),
  comingSoon: t('Link available at release', '发布后开放'),
  copy: t('Copy', '复制'),
  copied: t('Copied', '已复制'),
  copyLink: t('Copy link', '复制链接'),
  linkCopied: t('Link copied', '链接已复制'),
  details: t('Details', '展开详情'),
  todo: 'TODO',
  previousLayout: t('Previous layout (v1)', '旧版页面（v1）'),
  footer: t(`© ${citationMeta.year} IQuest Research. All rights reserved.`, `© ${citationMeta.year} IQuest Research 保留所有权利。`),
  // Language-aware joiners for text assembled in components.
  gap: t(' ', ''),
  stop: t('. ', '。'),
  docTitle: t(`${citationMeta.title} · ${citationMeta.org}`, `IQuest-Q1：${reportTitleZh} · ${citationMeta.org}`),
  reportLink: t('Technical report', '技术报告'),
  resources: t('Resources', '资源链接'),
}

export const header = {
  kicker: t(`${citationMeta.org} · Technical report · ${citationMeta.year}`, `${citationMeta.org} · 技术报告 · ${citationMeta.year}`),
  // The page headline is the report title (citationMeta), after the model name.
  tagline: t(citationMeta.title.replace(/^IQuest-Q1: /, ''), reportTitleZh),
  separator: t(': ', '：'),
  dek: t(
    `IQuest-Q1 is an open-source agentic foundation model for CLI systems. A sparse Mixture-of-Experts model with ${M.totalParams} total parameters and ${M.activeParams} activated, it combines general and coding agent capabilities with efficient compute for medium- and long-horizon tasks. During development, it also takes part in its own improvement under human supervision.`,
    `IQuest-Q1 是一款面向 CLI 系统的开源智能体基座模型。它采用稀疏混合专家（MoE）架构，总参数量达 ${M.totalParams}，激活 ${M.activeParams}。在保证计算效率的前提下，它同时具备通用与编程智能体能力，能够胜任中长程任务。此外，在研发过程中，它也在人类的监督下参与了对自身的迭代与改进。`,
  ),
  report: t('Report ↗', '技术报告 ↗'),
  watchDemos: t('Demos ↓', '演示 ↓'),
}

export const overview = {
  title: t('Overview', '概览'),
  intro: t(
    `IQuest-Q1 is an open sparse MoE model with ${M.totalParams} total parameters, of which ${M.activeParams} are activated per token. Built for CLI agents, it combines general-purpose, coding-agent, and CLI interaction capabilities, working through coding and general agentic tasks in the command line, from reading the codebase and running tools to checking results and recovering from errors. To develop these capabilities over medium- and long-horizon tasks, we train the model in synthetic environments using multi-harness reinforcement learning and multi-teacher on-policy distillation (MOPD).`,
    `IQuest-Q1 是一款开源稀疏 MoE 模型，总参数 ${M.totalParams}，激活 ${M.activeParams}。它专为 CLI 智能体打造，兼具通用能力、编程智能体能力与 CLI 交互能力，能在命令行中完成编程与通用智能体任务，从阅读代码库、调用工具，到检查结果、从错误中恢复。为了在中长程任务中培养这些能力，我们在合成环境中，使用多脚手架强化学习与多教师在线策略蒸馏（MOPD）训练模型。`,
  ),
}

export const training = {
  title: t('Training to build agentic systems', '面向智能体系统的训练'),
  intro: t(
    'An agentic system has to carry a task through: gather information, call tools, read feedback, and recover from errors over many steps. Pre-training and mid-training lay the groundwork, shifting the data toward code and STEM and adding agentic trajectories with a longer context; three further stages build the agentic behavior itself.',
    '一个智能体系统必须能够端到端地完成任务：不仅要收集信息、调用工具，还要理解反馈，并在多步执行出错时自我纠正。为了打好基础，预训练与中期训练的数据逐渐向代码和 STEM 领域倾斜，同时引入智能体轨迹、扩展上下文窗口。在此基础上，我们再通过三个阶段进一步塑造其行为模式。',
  ),
  notes: [
    [
      t('Synthetic environments', '合成环境'),
      t(
        'We synthesize tasks together with their environments: general-agent tasks on real APIs, MCP servers, and workspace files, and coding tasks in executable environments built from repositories.',
        '我们将任务与环境一并合成：通用智能体任务基于真实的 API、MCP 服务与工作区文件，编程任务运行则基于代码仓库搭建的可执行环境中。',
      ),
      'Synthetic environments',
    ],
    [
      t('Reinforcement learning', '强化学习'),
      t(
        'One policy trains across multiple harnesses, keeping each harness’s own tools and context management, so working inside a real agentic system is learned along with solving the task. Failures are attributed before optimization: only the policy’s own errors become learning signals.',
        '同一策略在多种脚手架中训练，并保留各脚手架原生的工具与上下文管理，让模型在学会解题的同时，也学会在真实的智能体系统中工作。优化前先对失败归因，只有策略自身的错误才作为学习信号。',
      ),
      'Reinforcement learning (RL)',
    ],
    [
      t('MOPD and model merging', 'MOPD 与模型融合'),
      t(
        'RL yields four experts: agentic user experience, multi-harness work, long-horizon tasks, and general agentic work. Multi-teacher on-policy distillation (MOPD) consolidates them into one student, initialized from the SFT checkpoint, which learns on its own trajectories while the matching expert scores each token. Stabilized model merging across stages and expert branches then folds the checkpoints into IQuest-Q1.',
        '通过强化学习得到四个专家模型，覆盖这四个方面：智能体用户体验、多脚手架协作、长程任务与通用智能体任务。通过多教师在线策略蒸馏（MOPD）把它们整合进同一个学生模型。学生模型在自己生成的轨迹上进行学习，并由匹配的专家模型对它的每一个 token 进行打分。通过融合贯穿各阶段的专家与分支模型，最终合并为 IQuest-Q1。',
      ),
      'Multi-teacher on-policy distillation (MOPD) and stabilized model merging',
    ],
  ],
}

export const results = {
  title: t('Evaluation', '评测结果'),
  figureTitle: t('IQuest-Q1 across coding and general-agent benchmarks', 'IQuest-Q1 在编程与通用智能体基准上的表现：'),

}

const recording = id => rdRecordings.find(r => r.id === id)

export const rdCases = {
  title: t('CLI for model development', 'CLI 帮助模型研发'),
  items: [
    {
      id: 'case-1',
      title: t('Fix Multi-turn Training', '修复多轮训练'),
      lead: t('Working in Claude Code, IQuest-Q1 traced an unusual reward curve to an extra space in decoded text that left only the final turn in the training loss.', 'IQuest-Q1 在 Claude Code 中排查奖励异常，发现是解码时多出的空格导致训练只计算了最后一轮对话的损失。'),
      notes: [
        [t('Cause', '原因'), t('Extra spaces inserted during decoding broke prefix matching. Earlier turns remained in context but dropped out of the training loss.', '额外插入的空格破坏了文本的前缀匹配，使得前几轮对话虽然还在上下文中，却被排除在了训练损失计算之外。')],
        [t('Fix', '修复'), t('Disable injected separator spaces while preserving generated whitespace, and keep streamed and stored text consistent.', '关闭额外分隔空格，保留模型生成的空白字符，并确保流式文本与存储轨迹一致。')],
        [t('Result', '结果'), t('Multi-turn training was restored and the mean reward recovered.', '多轮训练恢复，奖励均值随之回升。')],
      ],
      stats: [
        { value: [F.extraSpace.before], label: t('Reward mean, before', '修复前均值') },
        { value: [F.extraSpace.after], label: t('After the fix', '修复后均值') },
        { value: [F.extraSpace.later], label: t('Later in training', '训练后段') },
      ],
    },
    {
      id: 'case-2',
      title: t('Repair Execution Environment', '修复任务执行环境'),
      lead: t('After an environment update, previously solvable tasks began receiving low rewards. IQuest-Q1 investigated the execution and grading pipeline in Claude Code.', '环境更新后，原本能完成的任务开始大量失败。IQuest-Q1 在 Claude Code 中排查任务执行与评分流程。'),
      notes: [
        [t('Cause', '原因'), t('Dependency, test-startup, and service-access faults caused some tasks to fail before the model’s patch ran. The grader counted these as model failures.', '依赖、测试启动与服务访问故障，使部分任务在补丁执行前就失败，并被计入模型的负奖励。')],
        [t('Fix', '修复'), t('Repair the environment, add health checks, and exclude confirmed infrastructure faults from policy updates. Genuine model failures still receive negative reward.', '修复环境并增加健康检查，将确认的基础设施故障排除出策略更新；模型自身的失败仍保留负奖励。')],
        [t('Validation', '验证'), t('Re-run the same tasks and patches to check scoring recovery. Restored scoring is judged separately from improved model capability.', '用同一批任务与补丁复验评分恢复情况；评分恢复与模型能力提升分别判断。')],
      ],
    },
    {
      id: 'case-3',
      title: t('Build Research Workbench', '搭建研发工作台'),
      lead: t('A researcher asked IQuest-Q1 to build a workbench for inspecting research sessions—failed commands, logs, diffs, tests, and reports tied to the right code version—and then to repair a failed export from within that page.', '研究人员想使用 IQuest-Q1 搭建一个研发工作台，用来查看研发会话中的失败命令、日志、代码改动、测试和报告，并与对应代码版本绑定；随后在工作台上发起修复一个失败的导出任务。'),
      notes: [
        [t('Cause', '原因'), t(<>The review-bundle export failed because some source files carried a modification time of 0 (1970), and Python’s <code>zipfile</code> rejects timestamps before 1980.</>, <>部分源文件的修改时间为 0（1970 年），而 Python 的 <code>zipfile</code> 不接受 1980 年之前的时间戳，导致评审包导出失败。</>)],
        [t('Fix', '修复'), t(<>A minimal change—<code>strict_timestamps=False</code> on the archive—plus a regression test with mixed modern and pre-1980 timestamps. Project data was left untouched.</>, <>只做最小改动——为归档设置 <code>strict_timestamps=False</code>，并补充一条混合新旧时间戳的回归测试；项目数据保持不变。</>)],
        [t('Verification', '验证'), t('Workbench and project tests pass. An integrity report confirms every file in the archive is present and byte-identical to its source.', '工作台与项目测试全部通过；完整性报告确认归档中的所有文件齐全，且与源文件逐字节一致。')],
      ],
    },
  ].map(item => {
    const source = recording(item.id)
    return {
      ...source,
      ...item,
      tabLabel: t(source.tag.en.split(' · ')[0], source.tag.zh.split(' · ')[0]),
    }
  }),
}

const A = F.apiIncident
export const office = {
  title: t('Office work', '办公任务'),
  intro: t(
    <>Through <code>lark-cli</code>, IQuest-Q1 carries office work in Feishu from start to finish: it cross-checks chats and documents, makes evidence-based judgments, and delivers the follow-up—documents, decks, tasks, meetings, and notices.</>,
    <>IQuest-Q1 可以通过 <code>lark-cli</code> 在飞书中完整处理办公任务：核对聊天记录与文档，做出基于事实的判断，并完成文档、幻灯片、会议与通报等相关工作的后续交付。</>,
  ),
  cutsLabel: t('Recording', '录屏版本'),
  recorded: {
    id: 'api-incident',
    lead: t(
      <>In a simulated Feishu workspace, Lanchuan Securities reports on {A.dateEn} that the API returned another customer’s data. As the data-platform lead, the model reconstructs the incident from three group chats, policies, and Drive drafts whose accounts conflict, while the business team wants to handle Lanchuan alone.</>,
      <>在模拟的飞书环境中，澜川证券于 {A.dateZh}反馈接口返回了其他客户的数据。模型扮演数据平台负责人，从三个飞书群、制度文档和云盘草稿中还原事件；各方说法不一，业务方还希望只处理澜川一家。</>,
    ),
    notes: [
      [t('Judgment', '判断'), t(`It graded the incident Level ${A.level} (${A.records} cross-customer reads) and ruled that all ${enWord(A.customers)} affected customers must be notified, not Lanchuan alone.`, `它依据制度将事件定为 ${A.level} 级（${A.records} 次跨客户读取），并判定须通知全部${zhWord(A.customers)}家受影响客户，而不只是澜川一家。`)],
      [t('Delivery', '交付'), t(`It updated the exposure list, booked the review, produced the report and a ${enWord(A.slides)}-page management deck, assigned ${enWord(A.tasks)} remediation tasks with owners, and logged progress through ${A.receipts} receipts and a progress board.`, `随后更新影响清单、安排复盘会，完成报告和${zhWord(A.slides)}页管理层幻灯片，创建${zhWord(A.tasks)}项具名负责的整改任务，并以 ${A.receipts} 条进度回执和进度看板记录执行过程。`)],
      [t('Recovery', '排障'), t('When task assignment failed on an invalid assignee ID, it read the command help, mapped names to app_id from message senders, then assigned the tasks and read them back to verify.', '分派任务时遇到负责人 ID 无效，它查阅命令帮助，从群消息发送者建立姓名与 app_id 的对应关系，随后完成分派并回读确认。')],
    ],
  },
}

export const frontend = {
  title: t('Frontend', '前端'),
  intro: t(
    'IQuest-Q1 turns written briefs into interactive web pages: games, personal tools, design and layout, and scientific visualization.',
    'IQuest-Q1 把文字需求写成可交互的网页，涵盖游戏、个人工具、设计与布局和科学可视化。',
  ),
  categoriesLabel: t('Demo categories', '演示分类'),
  examplesLabel: t('Choose a demo', '选择演示'),
  interactive: t('Interactive demo', '交互演示'),
  recording: t('Recording', '录屏'),
  showAs: t('Show as', '展示方式'),
  load: t('Load interactive demo', '加载可交互演示'),
  openShort: t('Open in new tab ↗', '新标签页打开 ↗'),
  loadHere: t('Load here', '在此加载'),
  playRecording: t('Play recording', '播放录屏'),
}

export const quickstart = {
  title: t('How to use', '快速开始'),
  intro: t(
    'IQuest-Q1 is released as an open-source model. Download the weights, serve them with an OpenAI-compatible engine, and call the model directly or run it in Claude Code or Codex.',
    '可以通过开源平台下载模型 IQuest-Q1。下载后用兼容 OpenAI 接口的推理引擎部署，即可直接调用，或在 Claude Code、Codex 中使用。',
  ),
  getTitle: t('Get the model', '获取模型'),
  serveTitle: t('Serve and call the model', '部署与调用'),
  agentsTitle: t('Run it in Claude Code or Codex', '在 Claude Code 或 Codex 中使用'),
  agents: t(
    'Both connect through a gateway that supports tool calling: the Anthropic Messages API for Claude Code, the OpenAI Responses API for Codex. Set your gateway address and key in the commands below.',
    '两者都需要通过支持工具调用的网关接入：Claude Code 使用 Anthropic Messages 接口，Codex 使用 OpenAI Responses 接口。在下方命令中填入网关地址与密钥即可。',
  ),
}

// Limitations, as in the model card.
export const limitations = {
  title: t('Limitations', '局限性'),
  items: [
    [t('Text-only input', '仅支持文本输入'), t('This checkpoint has no native image, audio, or video input capability.', '当前模型不具备原生的图像、音频或视频输入能力。')],
    [t('Output reliability', '输出可靠性'), t('Generated explanations and code can be incorrect. Review code changes and verify them with task-appropriate tests.', '生成的解释与代码可能有误。请严格审阅代码的改动，并使用对应的测试加以验证。')],
    [t('Tool integration', '工具集成'), t('Tool calls use the IQuest-specific format in the chat template. Structured tool execution and reasoning extraction require compatible serving parsers and an agent harness.', '工具调用推荐采用 IQuest 模版中专用的格式。')],
    [t('Challenges in Real-World CLI Tasks', '真实 CLI 任务中的挑战'), t('Real-world CLI tasks often require iterative debugging and verification. IQuest-Q1 may overlook constraints, repeat failed attempts, or leave issues unresolved, necessitating human oversight.', '真实的 CLI 任务往往比较复杂。IQuest-Q1 可能忽略约束、重复失败的尝试，或留下未解决的问题，因此在使用后仍需人工检查。')],
    [t('Ongoing development', '持续开发中'), t('IQuest-Q1 remains at an early stage, with substantial limitations in its capabilities and reliability. Much work remains, and we still have a long way to go.', 'IQuest-Q1 仍处于早期阶段，能力与可靠性都存在一定的局限。还有大量工作要做，我们仍有很长的路要走。')],
  ],
}

export const contact = {
  title: t('Contact us', '联系我们'),
  body: t(
    <>For technical questions, feedback, or collaboration inquiries, please email us at <a className="v2-link" href={`mailto:${links.email}`}>{links.email}</a>.</>,
    <>如有技术问题、反馈或合作意向，欢迎发送邮件至 <a className="v2-link" href={`mailto:${links.email}`}>{links.email}</a>。</>,
  ),
}
