import { h, type VNode } from 'vue'

interface RulesContent {
  type: 'paragraph' | 'list' | 'subsection' | 'heading' | 'table'
  text?: string
  items?: string[]
  ordered?: boolean
  title?: string
  content?: RulesContent[]
  level?: number
  headers?: string[]
  rows?: string[][]
}

interface RulesSection {
  id: string
  title: string
  content: RulesContent[]
}

interface RulesData {
  title: string
  subtitle?: string
  sections: RulesSection[]
}

export function useConvertJSONToHTML() {
  /**
   * Converts a rules content item to VNode
   */
  const convertContentToVNode = (content: RulesContent): VNode | VNode[] => {
    switch (content.type) {
      case 'paragraph':
        return h('p', { class: 'mb-3 text-gray-800 leading-relaxed' }, content.text)

      case 'heading':
        const headingLevel = content.level || 3
        const headingClasses = {
          3: 'text-xl font-bold mt-6 mb-3 text-gray-900',
          4: 'text-lg font-semibold mt-4 mb-2 text-gray-800',
          5: 'text-base font-semibold mt-3 mb-2 text-gray-700'
        }
        return h(`h${headingLevel}`, { class: headingClasses[headingLevel as 3 | 4 | 5] }, content.text)

      case 'list':
        const listTag = content.ordered ? 'ol' : 'ul'
        const listClass = content.ordered 
          ? 'list-decimal list-inside mb-4 space-y-1 ml-4'
          : 'list-disc list-inside mb-4 space-y-1 ml-4'
        
        return h(
          listTag,
          { class: listClass },
          content.items?.map(item => 
            h('li', { class: 'text-gray-800 leading-relaxed' }, item)
          )
        )

      case 'table':
        return h('div', { class: 'overflow-x-auto mb-4' }, [
          h('table', { class: 'min-w-full border-collapse border border-hasen-green' }, [
            // Table header
            h('thead', { class: 'bg-hasen-green' }, [
              h('tr', 
                content.headers?.map(header => 
                  h('th', { 
                    class: 'border border-hasen-green px-4 py-2 text-left font-semibold text-white'
                  }, header)
                )
              )
            ]),
            // Table body
            h('tbody',
              content.rows?.map(row => 
                h('tr', { class: 'hover:bg-hasen-green hover:text-white' },
                  row.map(cell => 
                    h('td', { 
                      class: 'border border-hasen-green px-4 py-2 text-black'
                    }, cell)
                  )
                )
              )
            )
          ])
        ])

      case 'subsection':
        return h('div', { class: 'mb-6' }, [
          h('h4', { class: 'text-lg font-semibold mb-3 text-gray-900' }, content.title),
          ...(content.content?.flatMap(c => convertContentToVNode(c)) || [])
        ])

      default:
        return h('div', 'Unknown content type')
    }
  }

  /**
   * Converts a rules section to VNode
   */
  const convertSectionToVNode = (section: RulesSection): VNode => {
    return h('section', { 
      id: section.id,
      class: 'mb-8 scroll-mt-4'
    }, [
      h('h2', { class: 'text-2xl font-bold mb-4 text-gray-900 border-b-2 border-hasen-green pb-2' }, section.title),
      h('div', { class: 'space-y-2' }, 
        section.content.flatMap(content => convertContentToVNode(content))
      )
    ])
  }

  /**
   * Converts entire rules JSON to VNodes
   */
  const convertRulesToVNodes = (rulesData: RulesData): VNode[] => {
    const vnodes: VNode[] = []

    // Title and subtitle
    vnodes.push(
      h('div', { class: 'mb-8' }, [
        h('h1', { class: 'text-4xl font-bold mb-2 text-gray-900' }, rulesData.title),
        rulesData.subtitle && h('p', { class: 'text-lg text-gray-600 italic' }, rulesData.subtitle)
      ])
    )

    // Sections
    rulesData.sections.forEach(section => {
      vnodes.push(convertSectionToVNode(section))
    })

    return vnodes
  }

  /**
   * Generates a table of contents from rules data
   */
  const generateTableOfContents = (rulesData: RulesData): VNode => {
    return h('nav', { class: 'mb-8 p-4 bg-hasen-green rounded-lg border border-hasen-green' }, [
      h('h2', { class: 'text-xl font-bold mb-3 text-white' }, 'Table of Contents'),
      h('ul', { class: 'space-y-2' },
        rulesData.sections.map(section => 
          h('li', [
            h('a', {
              href: `#${section.id}`,
              class: 'text-white hover:text-hasen-light hover:underline'
            }, section.title)
          ])
        )
      )
    ])
  }

  return {
    convertRulesToVNodes,
    generateTableOfContents,
    convertContentToVNode,
    convertSectionToVNode
  }
}
