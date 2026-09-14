import { h, type VNode } from 'vue'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import PlayingCard from '@/common/components/PlayingCard.vue'
import type { CardPoints, Character, NormalRank, PlayingCard as PlayingCardModel, Suit } from '@domain/interfaces'

const suitRow: Record<Suit, number> = {
  flowers: 0,
  berries: 1,
  leaves: 2,
  acorns: 3
}

const flowersCharCol: Partial<Record<Character, number>> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  Q: 6,
  K: 7,
  A: 8
}

const normalCharCol: Partial<Record<Character, number>> = {
  '5': 0,
  '6': 1,
  '7': 2,
  '8': 3,
  '9': 4,
  '10': 5,
  S: 6,
  U: 7,
  O: 8
}

const cardTokenRegex = /\[\[card:([a-z]+)-([A-Z0-9]+)(?:\\?\|([^\]]+))?\]\]/g

function buildDisplayCard(suit: Suit, char: Character): PlayingCardModel | null {
  const charCol = suit === 'flowers' ? flowersCharCol : normalCharCol
  const col = charCol[char]

  if (col === undefined) {
    return null
  }

  return {
    id: `rules-${suit}-${char}`,
    suit,
    char,
    rank: { base: 0 as NormalRank, onSuit: null },
    owner: null,
    state: 'in_deck',
    points: 0 as CardPoints,
    spritePos: {
      row: suitRow[suit],
      col
    }
  }
}

export function renderInlineText(text?: string, cardSize: 'tiny' | 'inline' = 'tiny'): Array<string | VNode> {
  if (!text) return []

  const nodes: Array<string | VNode> = []
  let lastIndex = 0

  for (const match of text.matchAll(cardTokenRegex)) {
    const [fullMatch, rawSuit, rawChar, label] = match
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex))
    }

    const suit = rawSuit as Suit
    const char = rawChar as Character
    const card = buildDisplayCard(suit, char)

    if (!card) {
      nodes.push(fullMatch)
      lastIndex = matchIndex + fullMatch.length
      continue
    }

    nodes.push(
      h('span', { class: 'inline-flex items-center align-middle mx-1 gap-1' }, [
        h(PlayingCard, { card, size: cardSize }),
        label ? h('span', { class: 'text-[0.95em]' }, label) : null
      ])
    )

    lastIndex = matchIndex + fullMatch.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

const md = new MarkdownIt({ html: false, linkify: true })

const headingClasses: Record<number, string> = {
  1: 'text-4xl font-bold mb-2 text-gray-900',
  2: 'text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-hasen-green pb-2 scroll-mt-4',
  3: 'text-xl font-bold mt-6 mb-3 text-gray-900',
  4: 'text-lg font-semibold mt-4 mb-2 text-gray-800',
  5: 'text-base font-semibold mt-3 mb-2 text-gray-700',
  6: 'text-base font-semibold mt-3 mb-2 text-gray-700'
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\[\[card:[a-z]+-[A-Z0-9]+\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[card:[a-z]+-[A-Z0-9]+\]\]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findCloseIndex(tokens: Token[], openIndex: number): number {
  let depth = 0
  for (let i = openIndex; i < tokens.length; i++) {
    const t = tokens[i]!
    if (t.nesting === 1) depth++
    if (t.nesting === -1) {
      depth--
      if (depth === 0) return i
    }
  }
  return tokens.length - 1
}

function renderInlineChildren(children: Token[] | null): Array<string | VNode> {
  if (!children) return []

  const out: Array<string | VNode> = []
  let i = 0

  while (i < children.length) {
    const t = children[i]!

    switch (t.type) {
      case 'text':
        out.push(...renderInlineText(t.content))
        break
      case 'softbreak':
        out.push(' ')
        break
      case 'hardbreak':
        out.push(h('br'))
        break
      case 'code_inline':
        out.push(
          h('code', { class: 'bg-gray-100 rounded px-1 py-0.5 text-[0.9em] font-mono text-gray-800' }, t.content)
        )
        break
      case 'strong_open': {
        const close = findCloseIndex(children, i)
        out.push(
          h('strong', { class: 'font-semibold text-gray-900' }, renderInlineChildren(children.slice(i + 1, close)))
        )
        i = close
        break
      }
      case 'em_open': {
        const close = findCloseIndex(children, i)
        out.push(h('em', renderInlineChildren(children.slice(i + 1, close))))
        i = close
        break
      }
      case 'image': {
        const src = t.attrGet('src') ?? ''
        out.push(
          h('img', {
            src,
            alt: t.content,
            class:
              'rounded-xl shadow-lg border-2 border-hasen-green/40 my-3 mx-auto block max-w-full'
          })
        )
        break
      }
      case 'link_open': {
        const close = findCloseIndex(children, i)
        const href = t.attrGet('href') ?? '#'
        out.push(
          h(
            'a',
            { href, class: 'text-hasen-green underline hover:opacity-80', target: '_blank', rel: 'noopener' },
            renderInlineChildren(children.slice(i + 1, close))
          )
        )
        i = close
        break
      }
      default:
        if (t.content) out.push(t.content)
    }

    i++
  }

  return out
}

function renderContainer(openToken: Token, inner: Token[], inListItem: boolean): VNode {
  switch (openToken.type) {
    case 'heading_open': {
      const level = Number(openToken.tag.slice(1))
      const inline = inner.find(t => t.type === 'inline')
      const text = inline?.content ?? ''
      const attrs: Record<string, string> = {
        class: headingClasses[level] ?? headingClasses[6]!
      }
      if (level === 2) attrs.id = slugify(text)
      return h(openToken.tag, attrs, renderInlineChildren(inline?.children ?? null))
    }

    case 'paragraph_open': {
      const inline = inner.find(t => t.type === 'inline')
      const children = renderInlineChildren(inline?.children ?? null)
      if (inListItem) {
        return h('span', children)
      }
      return h('p', { class: 'mb-3 text-gray-800 leading-relaxed' }, children)
    }

    case 'bullet_list_open':
      return h('ul', { class: 'list-disc list-inside mb-4 space-y-1 ml-4' }, renderBlocks(inner, false))

    case 'ordered_list_open':
      return h('ol', { class: 'list-decimal list-inside mb-4 space-y-1 ml-4' }, renderBlocks(inner, false))

    case 'list_item_open':
      return h('li', { class: 'text-gray-800 leading-relaxed' }, renderBlocks(inner, true))

    case 'blockquote_open':
      return h(
        'div',
        {
          class:
            'border-l-4 border-hasen-green bg-hasen-green/10 rounded-r-lg px-4 py-3 mb-4 text-gray-700 [&_p:last-child]:mb-0'
        },
        renderBlocks(inner, false)
      )

    case 'table_open':
      return h('div', { class: 'overflow-x-auto mb-4' }, [
        h('table', { class: 'min-w-full border-collapse border border-hasen-green' }, renderBlocks(inner, false))
      ])

    case 'thead_open':
      return h('thead', { class: 'bg-hasen-green' }, renderBlocks(inner, false))

    case 'tbody_open':
      return h('tbody', renderBlocks(inner, false))

    case 'tr_open':
      return h('tr', { class: 'hover:bg-hasen-green hover:text-white' }, renderBlocks(inner, false))

    case 'th_open':
    case 'td_open': {
      const inline = inner.find(t => t.type === 'inline')
      const children = renderInlineChildren(inline?.children ?? null)
      if (openToken.type === 'th_open') {
        return h(
          'th',
          { class: 'border border-hasen-green px-4 py-2 text-left font-semibold text-white' },
          children
        )
      }
      return h('td', { class: 'border border-hasen-green px-4 py-2 text-black' }, children)
    }

    default:
      return h('div', renderBlocks(inner, inListItem))
  }
}

function renderLeaf(token: Token): VNode | null {
  switch (token.type) {
    case 'hr':
      return h('hr', { class: 'my-6 border-t-2 border-hasen-green/40' })
    case 'fence':
    case 'code_block':
      return h(
        'pre',
        { class: 'bg-gray-100 rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-800' },
        [h('code', token.content)]
      )
    default:
      return null
  }
}

function renderBlocks(tokens: Token[], inListItem: boolean): VNode[] {
  const nodes: VNode[] = []
  let i = 0

  while (i < tokens.length) {
    const t = tokens[i]!

    if (t.nesting === 1) {
      const close = findCloseIndex(tokens, i)
      const inner = tokens.slice(i + 1, close)
      nodes.push(renderContainer(t, inner, inListItem))
      i = close + 1
    } else if (t.nesting === 0) {
      const leaf = renderLeaf(t)
      if (leaf) nodes.push(leaf)
      i++
    } else {
      i++
    }
  }

  return nodes
}

export function useMarkdownRules() {
  const renderRules = (markdown: string): VNode[] => {
    const tokens = md.parse(markdown, {})
    return renderBlocks(tokens, false)
  }

  const generateTableOfContents = (markdown: string, title = 'Table of Contents'): VNode => {
    const tokens = md.parse(markdown, {})
    const headings: { text: string; slug: string }[] = []

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]!
      if (t.type === 'heading_open' && t.tag === 'h2') {
        const inline = tokens[i + 1]
        if (inline?.type === 'inline') {
          headings.push({ text: inline.content, slug: slugify(inline.content) })
        }
      }
    }

    return h('nav', { class: 'mb-8 p-4 bg-hasen-green rounded-lg border border-hasen-green' }, [
      h('h2', { class: 'text-xl font-bold mb-3 text-white' }, title),
      h(
        'ul',
        { class: 'space-y-2' },
        headings.map(heading =>
          h('li', [
            h(
              'a',
              { href: `#${heading.slug}`, class: 'text-white hover:text-hasen-light hover:underline' },
              heading.text
            )
          ])
        )
      )
    ])
  }

  return {
    renderRules,
    generateTableOfContents
  }
}
