import { Table } from '@tiptap/extension-table'

export const CustomTable = Table.extend({
  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'table-scroll-wrapper' }, ['table', HTMLAttributes, ['tbody', 0]]]
  },
})
