# Myth Editor Component

A Notion-style rich text editor built with [Tiptap](https://tiptap.dev/) and [Tailwind CSS](https://tailwindcss.com/).

## Features

- **Slash Command Menu**: Type `/` to open a menu for inserting blocks (Headings, Lists, Tables, Images, etc.).
- **Bubble Menu**: Select text to see formatting options (Bold, Italic, Ask AI).
- **Markdown Support**: Supports Markdown shortcuts (e.g., `#` for Heading 1, `-` for Bullet List).
- **Rich Content**:
  - Tables (Resizable)
  - Task Lists (Interactive)
  - Code Blocks (Syntax Highlighting with `lowlight`)
  - Images (URL insertion)
- **Data Management**:
  - Auto-save to `localStorage`.
  - Import/Export JSON and HTML.
- **AI Integration**: Placeholder for "Ask AI" feature in the Bubble Menu.

## Project Structure

- `src/components/editor/Editor.jsx`: Main editor component.
- `src/components/editor/extensions/slash-command.js`: Custom extension for the `/` command menu.
- `src/components/editor/menus/`:
  - `CommandList.jsx`: The UI for the slash command menu.
  - `EditorBubbleMenu.jsx`: The floating menu for selected text.
- `src/components/editor/styles.css`: Custom ProseMirror styles for the editor content.

## Usage

```jsx
import { Editor } from './components/editor/Editor'

function App() {
  const handleUpdate = ({ json, html }) => {
    console.log('Content updated:', json)
  }

  return (
    <Editor onUpdate={handleUpdate} />
  )
}
```

## AI Integration

To connect the "Ask AI" button to a real backend:
1. Open `src/components/editor/menus/EditorBubbleMenu.jsx`.
2. Locate the "Ask AI" button `onClick` handler.
3. Replace the `alert` with an API call to your AI service.
4. Use `editor.chain().focus().insertContent(aiResponse).run()` to insert the generated text.

## Customization

- **Styling**: Modify `src/components/editor/styles.css` or Tailwind classes in the components.
- **Commands**: Add new items to `getSuggestionItems` in `src/components/editor/extensions/slash-command.js`.
