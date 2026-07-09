import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function renderMarkdown(text: string): string {
  const html = marked.parse(text, { async: false }) as string
  return html
}
