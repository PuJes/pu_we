import Link from 'next/link'
import { getAdminInboxSnapshot, getIdeas, getWeeklyOpsSnapshot, type IdeaDoc } from '@/lib/data/queries'
import { requireAdminFrontendSession } from '@/lib/auth/admin'
import { getPayloadClient } from '@/lib/payload'
import { formatBuilderLogVersion } from '../lib'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

function pickString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function pickNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function formatStamp(value?: string) {
  if (!value) {
    return '待补时间'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '待补时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}

function formatIdeaStatus(status: string) {
  const labels: Record<string, string> = {
    pending: '待筛选',
    discussing: '讨论中',
    approved: '已立项',
    'in-progress': '开发中',
    launched: '已上线',
    reviewed: '已复盘',
  }

  return labels[status] || status
}

function getPriorityLabel(idea: IdeaDoc) {
  if (idea.status === 'discussing' || idea.priorityScore >= 75) {
    return '立即处理'
  }

  if (idea.priorityScore >= 45 || idea.voteCount >= 10) {
    return '本周评估'
  }

  return '放入观察'
}

function getStatusTone(status: string) {
  switch (status) {
    case 'in-progress':
    case 'launched':
      return styles.toneDark
    case 'discussing':
    case 'approved':
      return styles.toneMid
    default:
      return styles.toneLight
  }
}

function getFocusIdea(ideas: IdeaDoc[]) {
  const preferred = ideas.find((idea) => idea.status === 'discussing') || ideas[0]

  if (preferred) {
    return preferred
  }

  return {
    id: 'wireframe-fallback',
    title: '公开实验室后台重构',
    slug: 'wireframe-fallback',
    description: '把待办、分诊、审核放进一条连续处理链路，而不是拆在多个表里来回切换。',
    status: 'discussing',
    voteCount: 18,
    priorityScore: 68,
    builderLogs: [
      { date: new Date().toISOString(), version: 'wireframe', content: '定义三类高频后台动作与关键上下文。' },
    ],
    statusHistory: [
      {
        fromStatus: 'pending',
        toStatus: 'discussing',
        changedAt: new Date().toISOString(),
        changedBy: 'system',
        reason: '示例数据',
      },
    ],
  } satisfies IdeaDoc
}

async function getReviewQueuePreview() {
  try {
    const payload = await getPayloadClient()

    const [commentsResult, featuresResult] = await Promise.all([
      payload.find({
        collection: 'comments',
        where: {
          status: {
            equals: 'pending',
          },
        },
        sort: '-createdAt',
        limit: 5,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'features',
        where: {
          status: {
            equals: 'open',
          },
        },
        sort: '-voteCount',
        limit: 5,
        depth: 1,
        overrideAccess: true,
      }),
    ])

    const pendingComments = (commentsResult.docs as unknown as Array<Record<string, unknown>>).map((doc) => ({
      id: String(doc.id ?? ''),
      authorLabel: pickString(doc.guestName) || '已验证用户',
      targetLabel: pickString(doc.targetType, 'idea').toUpperCase(),
      content: pickString(doc.content, '等待补充内容'),
      createdAt: pickString(doc.createdAt),
      upvotes: pickNumber(doc.upvotes),
    }))

    const openFeatures = (featuresResult.docs as unknown as Array<Record<string, unknown>>).map((doc) => {
      const idea = doc.idea
      const ideaTitle =
        idea && typeof idea === 'object' && 'title' in idea ? pickString((idea as { title?: unknown }).title, '关联 Idea') : '关联 Idea'

      return {
        id: String(doc.id ?? ''),
        ideaTitle,
        content: pickString(doc.content, '等待补充功能描述'),
        voteCount: pickNumber(doc.voteCount),
        status: pickString(doc.status, 'open'),
        updatedAt: pickString(doc.updatedAt),
        builderReply: pickString(doc.builderReply),
      }
    })

    return {
      pendingComments,
      openFeatures,
    }
  } catch {
    return {
      pendingComments: [
        {
          id: 'comment-fallback',
          authorLabel: '共创者 A',
          targetLabel: 'IDEA',
          content: '如果能在详情页直接看到 builder 回复摘要，会更愿意继续留言。',
          createdAt: new Date().toISOString(),
          upvotes: 4,
        },
      ],
      openFeatures: [
        {
          id: 'feature-fallback',
          ideaTitle: 'Indie Subscription Manager',
          content: '想要“谁最容易流失”的排序视图，方便先跟进高风险订阅。',
          voteCount: 12,
          status: 'open',
          updatedAt: new Date().toISOString(),
          builderReply: '',
        },
      ],
    }
  }
}

export default async function AdminDashboardWireframesPage() {
  await requireAdminFrontendSession('/admin-dashboard/wireframes')

  const [ideas, inbox, weekly, queue] = await Promise.all([
    getIdeas({ sort: 'hot' }),
    getAdminInboxSnapshot(),
    getWeeklyOpsSnapshot(),
    getReviewQueuePreview(),
  ])

  const triageIdeas = ideas.slice(0, 6)
  const focusIdea = getFocusIdea(triageIdeas)
  const builderLogs =
    focusIdea.builderLogs && focusIdea.builderLogs.length > 0
      ? focusIdea.builderLogs.slice(-3).reverse()
      : [{ date: new Date().toISOString(), version: 'now', content: '当前还没有 builder log，建议在这里沉淀最新判断与阻塞点。' }]
  const statusHistory =
    focusIdea.statusHistory && focusIdea.statusHistory.length > 0
      ? focusIdea.statusHistory.slice(-3).reverse()
      : [
          {
            fromStatus: 'pending',
            toStatus: 'discussing',
            changedAt: new Date().toISOString(),
            changedBy: 'system',
            reason: '当前还没有完整流转记录，线框里建议默认给出状态原因占位。',
          },
        ]
  const pipeline = [
    { label: '待筛选', count: ideas.filter((item) => item.status === 'pending').length || inbox.pendingIdeas, note: '先看阈值与重复度' },
    { label: '讨论中', count: ideas.filter((item) => item.status === 'discussing').length, note: '补上下文与风险' },
    { label: '开发中', count: ideas.filter((item) => item.status === 'in-progress').length || inbox.staleInProgressIdeas, note: '检查卡点与更新时间' },
    { label: '已交付', count: ideas.filter((item) => ['launched', 'reviewed'].includes(item.status)).length || weekly.funnel.reviewed, note: '回链内容与致谢' },
  ]
  const reviewCards = [
    {
      label: '待审评论',
      value: inbox.pendingComments,
      note: '优先过滤噪音，再决定是否公开。',
    },
    {
      label: '开放功能',
      value: inbox.openFeatures,
      note: '合并重复建议，避免一条条人工扫。',
    },
    {
      label: '超时开发',
      value: inbox.staleInProgressIdeas,
      note: '超过 7 天没有 builder 更新需要追问。',
    },
  ]

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Admin Interaction Wireframes</span>
          <h1>后台管理交互线稿</h1>
          <p>
            这一版不先追求视觉完成度，先把后台每天最频繁的三种动作做成一屏完成的工作台：
            统一巡检、Idea 分诊、评论与功能审核。
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/admin-dashboard">返回当前仪表盘</Link>
          <Link href="/admin">进入 Payload 原生后台</Link>
        </div>
      </section>

      <section className={styles.principles}>
        <article>
          <small>原则 01</small>
          <strong>对象在左，上下文在中，动作在右</strong>
          <p>减少跨 collection 跳转，决策时不再来回开多个页签。</p>
        </article>
        <article>
          <small>原则 02</small>
          <strong>先看风险，再看总量</strong>
          <p>把超时、待审、达阈值这些真正影响流转的信号提到最上层。</p>
        </article>
        <article>
          <small>原则 03</small>
          <strong>每个动作都告诉你会影响谁</strong>
          <p>状态推进、审核通过、功能采纳都应该伴随通知与回链提示。</p>
        </article>
      </section>

      <nav className={styles.jumpNav}>
        <a href="#command-center">01 指挥台</a>
        <a href="#triage-studio">02 Idea 分诊台</a>
        <a href="#review-queue">03 审核队列</a>
      </nav>

      <section id="command-center" className={styles.stage}>
        <div className={styles.stageHeader}>
          <div>
            <span className={styles.stageIndex}>01</span>
            <h2>Command Center</h2>
          </div>
          <p>用于每天 10 分钟巡检。先发现哪里堵，再决定跳进哪条工作流。</p>
        </div>

        <div className={styles.screen}>
          <div className={styles.browserChrome}>
            <span />
            <span />
            <span />
            <p>/admin-dashboard/command-center</p>
          </div>

          <div className={styles.shellGrid}>
            <aside className={styles.leftRail}>
              <div className={styles.railBlock}>
                <small>Workspace</small>
                <strong>Jess.Pu Ops</strong>
              </div>
              <a className={styles.activeItem} href="#command-center">
                今日指挥台
              </a>
              <a href="#triage-studio">Idea 分诊</a>
              <a href="#review-queue">审核队列</a>
              <a href="#review-queue">通知与回链</a>
              <div className={styles.railFoot}>
                <span>站点设置</span>
                <span>快捷键 ?</span>
              </div>
            </aside>

            <div className={styles.mainPanel}>
              <div className={styles.banner}>
                <div>
                  <small>今天最该处理什么</small>
                  <strong>{inbox.pendingIdeas + inbox.pendingComments + inbox.openFeatures} 个对象待推进</strong>
                  <p>先处理达到阈值但还没明确结论的 Idea，再看评论与功能审核。</p>
                </div>
                <div className={styles.bannerActions}>
                  <button type="button">只看超时</button>
                  <button type="button">导出日报</button>
                </div>
              </div>

              <div className={styles.commandGrid}>
                <article className={styles.paperCard}>
                  <div className={styles.cardHead}>
                    <h3>统一待办池</h3>
                    <span>自动聚类</span>
                  </div>
                  <div className={styles.metricStack}>
                    {reviewCards.map((item) => (
                      <div key={item.label} className={styles.metricRow}>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.note}</p>
                        </div>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={styles.paperCard}>
                  <div className={styles.cardHead}>
                    <h3>状态漏斗</h3>
                    <span>过去 7 天</span>
                  </div>
                  <div className={styles.pipeline}>
                    {pipeline.map((item) => (
                      <div key={item.label} className={styles.pipelineStep}>
                        <small>{item.label}</small>
                        <strong>{item.count}</strong>
                        <p>{item.note}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={styles.paperCard}>
                  <div className={styles.cardHead}>
                    <h3>本周动作信号</h3>
                    <span>实时更新</span>
                  </div>
                  <div className={styles.signalList}>
                    <div>
                      <small>投票新增</small>
                      <strong>{weekly.funnel.votes}</strong>
                    </div>
                    <div>
                      <small>评论新增</small>
                      <strong>{weekly.funnel.comments}</strong>
                    </div>
                    <div>
                      <small>功能建议新增</small>
                      <strong>{weekly.funnel.features}</strong>
                    </div>
                    <div>
                      <small>进入 reviewed</small>
                      <strong>{weekly.funnel.reviewed}</strong>
                    </div>
                  </div>
                </article>

                <article className={`${styles.paperCard} ${styles.fullWidth}`}>
                  <div className={styles.cardHead}>
                    <h3>建议的点击路径</h3>
                    <span>从巡检到执行</span>
                  </div>
                  <div className={styles.flowStrip}>
                    <div>发现超时 / 达阈值</div>
                    <div>进入对应工作台</div>
                    <div>补齐上下文并决策</div>
                    <div>自动触发通知或回链</div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="triage-studio" className={styles.stage}>
        <div className={styles.stageHeader}>
          <div>
            <span className={styles.stageIndex}>02</span>
            <h2>Idea Triage Studio</h2>
          </div>
          <p>把“队列、上下文、动作”放到一屏。适合筛选、立项、推进状态流转。</p>
        </div>

        <div className={styles.screen}>
          <div className={styles.browserChrome}>
            <span />
            <span />
            <span />
            <p>/admin-dashboard/idea-triage</p>
          </div>

          <div className={styles.triageGrid}>
            <aside className={styles.queuePanel}>
              <div className={styles.cardHead}>
                <h3>待分诊队列</h3>
                <span>{triageIdeas.length} 条</span>
              </div>
              <div className={styles.filterRow}>
                <span>只看达阈值</span>
                <span>按优先级</span>
                <span>按状态</span>
              </div>
              <div className={styles.queueList}>
                {triageIdeas.map((idea) => (
                  <article key={idea.id} className={styles.queueItem}>
                    <div className={styles.queueTitleRow}>
                      <strong>{idea.title}</strong>
                      <span className={`${styles.statusPill} ${getStatusTone(idea.status)}`}>
                        {formatIdeaStatus(idea.status)}
                      </span>
                    </div>
                    <p>{idea.description}</p>
                    <div className={styles.queueMeta}>
                      <span>{idea.voteCount} 票</span>
                      <span>优先级 {idea.priorityScore}</span>
                      <span>{getPriorityLabel(idea)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </aside>

            <section className={styles.workspacePanel}>
              <div className={styles.workspaceHead}>
                <div>
                  <small>当前聚焦对象</small>
                  <h3>{focusIdea.title}</h3>
                </div>
                <div className={styles.workspaceSignals}>
                  <span>{focusIdea.voteCount} 票</span>
                  <span>优先级 {focusIdea.priorityScore}</span>
                  <span>{formatIdeaStatus(focusIdea.status)}</span>
                </div>
              </div>

              <div className={styles.workspaceBlocks}>
                <article className={styles.paperCard}>
                  <div className={styles.cardHead}>
                    <h3>问题定义</h3>
                    <span>必看</span>
                  </div>
                  <p className={styles.bodyText}>{focusIdea.description}</p>
                  <div className={styles.inlineNotes}>
                    <span>是否重复需求</span>
                    <span>是否需要更多样本</span>
                    <span>是否可拆成 Feature</span>
                  </div>
                </article>

                <article className={styles.paperCard}>
                  <div className={styles.cardHead}>
                    <h3>最近 Builder Log</h3>
                    <span>上下文</span>
                  </div>
                  <div className={styles.timelineList}>
                    {builderLogs.map((log) => (
                      <div key={`${log.date}-${log.content}`} className={styles.timelineItem}>
                        <small>{formatStamp(log.date)}</small>
                        <strong>{formatBuilderLogVersion(log.version)}</strong>
                        <p>{log.content}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={styles.paperCard}>
                  <div className={styles.cardHead}>
                    <h3>状态流转历史</h3>
                    <span>透明度</span>
                  </div>
                  <div className={styles.timelineList}>
                    {statusHistory.map((item) => (
                      <div key={`${item.changedAt}-${item.toStatus}`} className={styles.timelineItem}>
                        <small>{formatStamp(item.changedAt)}</small>
                        <strong>
                          {formatIdeaStatus(item.fromStatus)} → {formatIdeaStatus(item.toStatus)}
                        </strong>
                        <p>{item.reason || '未填写原因'}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <aside className={styles.actionPanel}>
              <article className={styles.paperCard}>
                <div className={styles.cardHead}>
                  <h3>快速决策</h3>
                  <span>右侧动作栏</span>
                </div>
                <div className={styles.actionStack}>
                  <button type="button">推进到讨论中</button>
                  <button type="button">立项并指定版本</button>
                  <button type="button">标记为开发中</button>
                  <button type="button">转成上线复盘</button>
                </div>
              </article>

              <article className={styles.paperCard}>
                <div className={styles.cardHead}>
                  <h3>动作前确认</h3>
                  <span>避免误操作</span>
                </div>
                <div className={styles.checkList}>
                  <span>通知哪些提交者</span>
                  <span>是否补写 status reason</span>
                  <span>是否需要同步 builder log</span>
                  <span>是否生成回链占位</span>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>

      <section id="review-queue" className={styles.stage}>
        <div className={styles.stageHeader}>
          <div>
            <span className={styles.stageIndex}>03</span>
            <h2>Review Queue</h2>
          </div>
          <p>评论审核与功能建议合并到一个队列里，看清语境后再通过、拒绝或采纳。</p>
        </div>

        <div className={styles.screen}>
          <div className={styles.browserChrome}>
            <span />
            <span />
            <span />
            <p>/admin-dashboard/review-queue</p>
          </div>

          <div className={styles.reviewGrid}>
            <aside className={styles.reviewSidebar}>
              <div className={styles.cardHead}>
                <h3>审核入口</h3>
                <span>{queue.pendingComments.length + queue.openFeatures.length} 条</span>
              </div>
              <div className={styles.filterRow}>
                <span>全部</span>
                <span>仅评论</span>
                <span>仅功能</span>
              </div>
              <div className={styles.reviewList}>
                {queue.pendingComments.map((comment) => (
                  <article key={comment.id} className={styles.reviewItem}>
                    <small>评论 · {comment.targetLabel}</small>
                    <strong>{comment.authorLabel}</strong>
                    <p>{comment.content}</p>
                    <div className={styles.reviewMeta}>
                      <span>{formatStamp(comment.createdAt)}</span>
                      <span>{comment.upvotes} 顶</span>
                    </div>
                  </article>
                ))}
                {queue.openFeatures.map((feature) => (
                  <article key={feature.id} className={styles.reviewItem}>
                    <small>功能建议 · {feature.ideaTitle}</small>
                    <strong>{feature.voteCount} 票支持</strong>
                    <p>{feature.content}</p>
                    <div className={styles.reviewMeta}>
                      <span>{formatStamp(feature.updatedAt)}</span>
                      <span>{feature.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            </aside>

            <section className={styles.reviewDetail}>
              <article className={styles.paperCard}>
                <div className={styles.cardHead}>
                  <h3>上下文预览</h3>
                  <span>避免盲审</span>
                </div>
                <div className={styles.previewBlocks}>
                  <div>
                    <small>示例评论</small>
                    <strong>{queue.pendingComments[0]?.authorLabel || '暂无待审评论'}</strong>
                    <p>{queue.pendingComments[0]?.content || '目前没有评论待审。'}</p>
                  </div>
                  <div>
                    <small>示例功能建议</small>
                    <strong>{queue.openFeatures[0]?.ideaTitle || '暂无开放功能'}</strong>
                    <p>{queue.openFeatures[0]?.content || '目前没有开放功能建议。'}</p>
                  </div>
                </div>
              </article>

              <article className={styles.paperCard}>
                <div className={styles.cardHead}>
                  <h3>建议的审核动作</h3>
                  <span>模板化</span>
                </div>
                <div className={styles.decisionGrid}>
                  <div>
                    <small>评论</small>
                    <strong>通过并公开</strong>
                    <p>同步展示到对应页面，并保留一键驳回原因模板。</p>
                  </div>
                  <div>
                    <small>功能</small>
                    <strong>采纳 / 合并 / 延后</strong>
                    <p>支持 builder 回复模板，避免只改状态不解释。</p>
                  </div>
                </div>
              </article>
            </section>

            <aside className={styles.reviewActions}>
              <article className={styles.paperCard}>
                <div className={styles.cardHead}>
                  <h3>动作宏</h3>
                  <span>一屏完成</span>
                </div>
                <div className={styles.actionStack}>
                  <button type="button">批准并通知</button>
                  <button type="button">拒绝并填写原因</button>
                  <button type="button">采纳为 Feature</button>
                  <button type="button">合并到现有建议</button>
                </div>
              </article>

              <article className={styles.paperCard}>
                <div className={styles.cardHead}>
                  <h3>批量视图</h3>
                  <span>减少重复劳动</span>
                </div>
                <div className={styles.checkList}>
                  <span>相似评论自动聚合</span>
                  <span>重复功能建议一键合并</span>
                  <span>回复模板带变量</span>
                  <span>处理后刷新剩余队列</span>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
