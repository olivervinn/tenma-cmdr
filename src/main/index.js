// eslint-disable-next-line
import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

const pkg = require('../../package.json')

const { productName } = pkg.build
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true
  // eslint-disable-next-line
  require('electron-debug')()
}

async function installDevTools() {
  try {
    // eslint-disable-next-line
    require('devtron').install()
    // eslint-disable-next-line
    require('vue-devtools').install()
  } catch (err) {
    // eslint-disable-next-line
    console.error(err)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 465,
    height: 720,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      webSecurity: true
    },
    show: false
  })

  mainWindow.loadURL(isDev ? 'http://localhost:9080' : `file://${__dirname}/index.html`)

  if (isDev) {
    global.__static = require('path')
      .join(__dirname, '/static')
      .replace(/\\/g, '\\\\')
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.setTitle(productName)
    mainWindow.show()
    mainWindow.focus()

    if (isDev || process.argv.indexOf('--debug') !== -1) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('ready', () => {
  app.setName(productName)

  createWindow()

  if (isDev) {
    installDevTools()
  } else {
    autoUpdater.checkForUpdates()
  }
})

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.once('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.once('before-quit', () => {
  window.removeAllListeners('close')
})
