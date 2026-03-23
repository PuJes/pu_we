/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'

/**
 * 将 Payload CMS Lexical RichText JSON 渲染为 React 元素。
 * 支持的节点类型：paragraph, heading, list, listitem, quote, code, link, text
 * 支持的文本格式：bold, italic, underline, strikethrough, code
 */

type LexicalNode = {
    type: string
    tag?: string
    children?: LexicalNode[]
    text?: string
    format?: number | string
    listType?: string
    url?: string
    fields?: { linkType?: string; url?: string; newTab?: boolean }
    [key: string]: any
}

type LexicalRoot = {
    root?: {
        children?: LexicalNode[]
    }
}

// Lexical format bitmask flags
const IS_BOLD = 1
const IS_ITALIC = 2
const IS_STRIKETHROUGH = 4
const IS_UNDERLINE = 8
const IS_CODE = 16

function renderText(node: LexicalNode, index: number): React.ReactNode {
    if (!node.text) return null

    let content: React.ReactNode = node.text
    const format = typeof node.format === 'number' ? node.format : 0

    if (format & IS_CODE) {
        content = <code key={index}>{content}</code>
    }
    if (format & IS_BOLD) {
        content = <strong key={index}>{content}</strong>
    }
    if (format & IS_ITALIC) {
        content = <em key={index}>{content}</em>
    }
    if (format & IS_UNDERLINE) {
        content = <u key={index}>{content}</u>
    }
    if (format & IS_STRIKETHROUGH) {
        content = <s key={index}>{content}</s>
    }

    return content
}

function renderNode(node: LexicalNode, index: number): React.ReactNode {
    const children = node.children?.map((child, i) => renderNode(child, i))

    switch (node.type) {
        case 'paragraph':
            return <p key={index}>{children}</p>

        case 'heading': {
            const tag = (node.tag || 'h2') as string
            return React.createElement(tag, { key: index }, children)
        }

        case 'list': {
            const Tag = node.listType === 'number' ? 'ol' : 'ul'
            return <Tag key={index}>{children}</Tag>
        }

        case 'listitem':
            return <li key={index}>{children}</li>

        case 'quote':
            return <blockquote key={index}>{children}</blockquote>

        case 'code':
            return (
                <pre key={index}>
                    <code>{children}</code>
                </pre>
            )

        case 'link':
        case 'autolink': {
            const url = node.fields?.url || node.url || '#'
            const newTab = node.fields?.newTab !== false
            return (
                <a
                    key={index}
                    href={url}
                    {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                    {children}
                </a>
            )
        }

        case 'text':
            return renderText(node, index)

        case 'linebreak':
            return <br key={index} />

        default:
            // 兜底：如果有 children 则递归，否则忽略
            if (children && children.length > 0) {
                return <React.Fragment key={index}>{children}</React.Fragment>
            }
            return null
    }
}

export function RichTextRenderer({ content }: { content: LexicalRoot | null | undefined }) {
    if (!content?.root?.children) return null

    return (
        <div className="rich-text-body">
            {content.root.children.map((node, index) => renderNode(node, index))}
        </div>
    )
}
