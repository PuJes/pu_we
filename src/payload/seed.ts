import config from '@payload-config'
import { getPayload } from 'payload'

type SeedRecord = Record<string, unknown>

const BUILTIN_ADMIN = {
  username: 'admin',
  email: 'admin@local.dev',
  password: 'Lyzx!',
} as const

async function upsertBuiltinAdmin(payload: Awaited<ReturnType<typeof getPayload>>) {
  const existing = await payload.find({
    collection: 'admins',
    where: {
      or: [
        { username: { equals: BUILTIN_ADMIN.username } },
        { email: { equals: BUILTIN_ADMIN.email } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  const data = {
    username: BUILTIN_ADMIN.username,
    email: BUILTIN_ADMIN.email,
    password: BUILTIN_ADMIN.password,
    role: 'admin' as const,
  }

  if (existing.totalDocs > 0) {
    await payload.update({
      collection: 'admins',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
    return
  }

  const createArgs = {
    collection: 'admins',
    data,
    overrideAccess: true,
  } as unknown as Parameters<typeof payload.create>[0]

  await payload.create(createArgs)
}

async function upsertIdea(payload: Awaited<ReturnType<typeof getPayload>>, data: SeedRecord) {
  const existing = await payload.find({
    collection: 'ideas',
    where: { slug: { equals: data.slug } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    await payload.update({
      collection: 'ideas',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
    return
  }

  const createArgs = {
    collection: 'ideas',
    data,
    overrideAccess: true,
  } as unknown as Parameters<typeof payload.create>[0]

  await payload.create(createArgs)
}

async function upsertContent(payload: Awaited<ReturnType<typeof getPayload>>, data: SeedRecord) {
  const existing = await payload.find({
    collection: 'contents',
    where: { slug: { equals: data.slug } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    await payload.update({
      collection: 'contents',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
    return
  }

  const createArgs = {
    collection: 'contents',
    data,
    overrideAccess: true,
  } as unknown as Parameters<typeof payload.create>[0]

  await payload.create(createArgs)
}

async function run() {
  const payload = await getPayload({ config })
  await upsertBuiltinAdmin(payload)

  await upsertIdea(payload, {
    title: '独立开发者订阅管理助手',
    slug: 'indie-subscription-manager',
    description: '统一管理订阅用户、邮件发送与复盘指标。',
    status: 'in-progress',
    priorityScore: 88,
    voteCount: 42,
    impactScore: 9,
    effortScore: 6,
    reusabilityScore: 9,
    targetVersion: 'v0.1',
    builderLogs: [
      {
        date: new Date().toISOString(),
        version: 'v0.1',
        content: '完成前后台模型对齐。',
      },
    ],
  })

  await upsertIdea(payload, {
    title: '研究内容知识图谱',
    slug: 'research-knowledge-graph',
    description: '把实验与分析内容连成统一可检索知识图谱。',
    status: 'discussing',
    priorityScore: 52,
    voteCount: 26,
    impactScore: 7,
    effortScore: 7,
    reusabilityScore: 8,
    targetVersion: 'v0.2',
    builderLogs: [],
  })

  const now = Date.now()
  const contents: SeedRecord[] = [
    {
      title: '用 7 天验证一个 AI 自动化产品方向',
      slug: 'validate-ai-automation-in-7-days',
      type: 'article',
      category: 'ai-experiments',
      tags: [{ tag: '公开构建洞察' }, { tag: '提示词实证' }],
      takeaways: [{ item: '先小闭环再放大' }, { item: '每轮都要有量化指标' }],
      snippet: '把验证周期从 30 天缩短到 7 天的执行框架。',
      articleBody:
        '第一天只做问题定义，第二天做最小闭环，第三天做验证复盘。关键不在模型本身，而在你是否能把目标拆成可以观察和比较的动作单元。',
      status: 'published',
      publishedAt: new Date(now).toISOString(),
    },
    {
      title: '把客服 FAQ 做成 Agent：从 0 到上线复盘',
      slug: 'faq-agent-from-zero-to-production',
      type: 'article',
      category: 'ai-experiments',
      tags: [{ tag: '自动化工作流' }, { tag: 'Agent 智能体探索' }],
      takeaways: [{ item: '先做问题路由，不要先堆模型参数' }, { item: '失败场景必须有兜底' }],
      snippet: '一个两周上线的客服 Agent，关键在问题路由和失败兜底。',
      articleBody:
        '我把 FAQ 拆成“可回答、需追问、不可回答”三层，再给每层定义不同动作。上线后首周自助率提升 24%，但幻觉率在退款场景偏高，最终通过规则网关拦截修正。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 2).toISOString(),
    },
    {
      title: '提示词评测基线：别再只看“看起来像对”',
      slug: 'prompt-evaluation-baseline',
      type: 'snippet',
      category: 'ai-experiments',
      tags: [{ tag: '提示词实证' }, { tag: '公开构建洞察' }],
      takeaways: [{ item: '评测集必须包含边界场景' }, { item: '成功率和重试率要一起看' }],
      snippet: '把主观“感觉好”变成客观的通过率和修复周期。',
      articleBody:
        '我们给每条提示词定义了任务成功率、重试次数、人工接管率三个指标，避免单次 demo 误判。评测基线建立后，提示词迭代效率明显提升。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 5).toISOString(),
    },
    {
      title: '从单 Agent 到多 Agent 协作：我踩过的坑',
      slug: 'single-agent-to-multi-agent-lessons',
      type: 'article',
      category: 'ai-experiments',
      tags: [{ tag: 'Agent 智能体探索' }, { tag: '自动化工作流' }],
      takeaways: [{ item: '先定义协作协议，再拆 Agent' }, { item: '状态机比提示词更重要' }],
      snippet: '多 Agent 协作的瓶颈通常不在模型，而在状态同步。',
      articleBody:
        '拆分成多个 Agent 之后，最大的复杂度来自上下文共享和冲突决策。我的做法是把状态机显式化，再让每个 Agent 只负责单一职责。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 8).toISOString(),
    },
    {
      title: '一人公司如何做商业分析节奏管理',
      slug: 'solo-business-analysis-rhythm',
      type: 'article',
      category: 'business-analysis',
      tags: [{ tag: '商业思考' }, { tag: '公司研究' }],
      keyArgument: '结论先行并不代表草率，而是倒逼证据结构化。',
      analysisFramework: 'TAM-SAM-SOM + 单位经济性',
      snippet: '把研报写作变成可复用流程。',
      articleBody:
        '把结论先行作为结构锚点，然后用证据回填，最后再做风险反证。这样做可以减少分析拖延，也能让输出更服务于真实业务决策。',
      status: 'published',
      publishedAt: new Date(now - 86400000).toISOString(),
    },
    {
      title: 'SaaS 定价调整后，如何观察真实留存变化',
      slug: 'saas-pricing-retention-impact',
      type: 'article',
      category: 'business-analysis',
      tags: [{ tag: '财报拆解' }, { tag: '商业思考' }],
      keyArgument: '定价策略需要配合 cohort 视角，否则会误判增长质量。',
      analysisFramework: 'Cohort 留存 + Price Elasticity + LTV/CAC',
      snippet: '看 MRR 远远不够，必须同时看 cohort 的行为变化。',
      articleBody:
        '我们在提价后追踪 30/60/90 天留存，发现新增收入提升但老用户流失上升。最终通过分层定价和迁移优惠平衡了现金流和口碑。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 3).toISOString(),
    },
    {
      title: '从美国就业与利率看 AI 基础设施窗口',
      slug: 'macro-cycle-ai-infra-window',
      type: 'article',
      category: 'business-analysis',
      tags: [{ tag: '宏观趋势' }, { tag: '公司研究' }],
      keyArgument: '宏观环境决定估值中枢，策略要随资金偏好切换。',
      analysisFramework: '宏观流动性 + 供需缺口 + 资本开支周期',
      snippet: '宏观变量会直接影响 AI 公司融资与扩产节奏。',
      articleBody:
        '在高利率环境下，资本更偏好现金流确定性，AI 基础设施公司需要更清晰的商业化路径。宏观周期会放大强者优势，也会淘汰纯概念叙事。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 6).toISOString(),
    },
    {
      title: '拆解一家支付公司的季度财报：增长背后的结构变化',
      slug: 'payment-company-quarterly-breakdown',
      type: 'article',
      category: 'business-analysis',
      tags: [{ tag: '财报拆解' }, { tag: '公司研究' }],
      keyArgument: '财报分析要看结构，不是看单点数字。',
      analysisFramework: '收入结构 + 成本弹性 + 风险敞口',
      snippet: '收入增长不是重点，结构变化才是领先指标。',
      articleBody:
        '我重点看了毛利构成、地区扩张和坏账准备率。真正值得关注的是高毛利产品线占比上升，而不是单季度营收波动。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 10).toISOString(),
    },
    {
      title: '从焦虑到执行：我的复盘模板',
      slug: 'anxiety-to-execution-retro-template',
      type: 'snippet',
      category: 'my-story',
      tags: [{ tag: '深度随笔' }, { tag: '数字日记' }],
      snippet: '没有行动时，方向就只会变成焦虑。',
      articleBody: '当我把“每天 30 分钟复盘”写进日历后，焦虑感明显下降。因为你会看到行动轨迹，而不是只盯着结果。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 4).toISOString(),
    },
    {
      title: '周日早餐仪式：把家庭时间固定在日历里',
      slug: 'sunday-breakfast-family-ritual',
      type: 'article',
      category: 'my-story',
      tags: [{ tag: '家庭记录' }],
      snippet: '越忙的时候，越需要把温柔的时间刻意安排出来。',
      articleBody:
        '每周日早晨我们都会一起做早餐，手机静音，只有厨房和聊天。这个仪式让我在高速工作节奏里保留了稳定感。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 7).toISOString(),
    },
    {
      title: '第一次公开拍 vlog：镜头里的不自然与突破',
      slug: 'first-public-vlog-breakthrough',
      type: 'video',
      category: 'my-story',
      tags: [{ tag: '视频日志' }, { tag: '深度随笔' }],
      snippet: '开始录视频之后，我才发现表达和写作是两套系统。',
      articleBody:
        '前 10 条 vlog 我都不满意，但持续记录让我建立了新的表达肌肉。现在我会用视频补充文字里难以传达的情绪和细节。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 9).toISOString(),
    },
    {
      title: '我的夜间日志模板：如何在 10 分钟内完成日清',
      slug: 'nightly-journal-template',
      type: 'snippet',
      category: 'my-story',
      tags: [{ tag: '数字日记' }, { tag: '深度随笔' }],
      snippet: '睡前 10 分钟，把当天的注意力残留清理掉。',
      articleBody:
        '模板只有三行：今天最重要的一件事、最不满意的一件事、明天第一件要做的事。越简单越容易坚持。',
      status: 'published',
      publishedAt: new Date(now - 86400000 * 12).toISOString(),
    },
  ]

  for (const content of contents) {
    await upsertContent(payload, content)
  }

  await payload.updateGlobal({
    slug: 'siteSettings',
    data: {
      subscribeCopy: '感谢每一位支持公开创作的朋友。',
      socialLinks: [
        { label: 'X', url: 'https://x.com' },
        { label: 'GitHub', url: 'https://github.com' },
      ],
      thresholds: {
        hotIdeaVoteThreshold: 20,
        priorityScoreMultiplier: 1,
      },
    },
    overrideAccess: true,
  })

  const sponsors = await payload.find({
    collection: 'sponsors',
    limit: 1,
    overrideAccess: true,
  })

  if (sponsors.totalDocs === 0) {
    await payload.create({
      collection: 'sponsors',
      data: {
        nickname: 'Geek_72AE',
        amountLevel: 'builder',
        channel: 'wechat',
        isPublic: true,
      },
      overrideAccess: true,
    })
  }

  console.info('Seed completed.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
