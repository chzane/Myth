import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800
  })

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
})
