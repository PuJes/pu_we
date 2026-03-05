import type { ContentDoc } from '@/lib/data/queries'

export const AI_TOPICS = ['全部', '公开构建洞察', '自动化工作流', '提示词实证', 'Agent 智能体探索'] as const
export const ANALYSIS_TOPICS = ['全部', '宏观趋势', '公司研究', '财报拆解', '商业思考'] as const
export const STORY_TOPICS = ['全部', '深度随笔', '家庭记录', '视频日志', '数字日记'] as const

function normalizeTag(value: string) {
  return value.trim().toLowerCase()
}

export function getContentTags(content: ContentDoc) {
  return (content.tags || [])
    .map((item) => item?.tag)
    .filter((item): item is string => Boolean(item))
}

export function matchTopic(content: ContentDoc, topic: string) {
  if (!topic || topic === '全部') {
    return true
  }

  const normalizedTopic = normalizeTag(topic)
  const tags = getContentTags(content).map((tag) => normalizeTag(tag))

  return tags.includes(normalizedTopic)
}

export function makeTopicHref(pathname: string, topic: string) {
  if (topic === '全部') {
    return pathname
  }

  return `${pathname}?topic=${encodeURIComponent(topic)}`
}
