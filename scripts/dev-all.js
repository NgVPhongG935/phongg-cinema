const { spawn, spawnSync } = require('node:child_process')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const processes = []
let shuttingDown = false

function start(name, scriptName) {
  const child = spawn('cmd.exe', ['/d', '/c', scriptName], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  })

  processes.push({ name, child })

  child.on('error', (error) => {
    console.error(`[${name}] Khong the khoi dong: ${error.message}`)
    shutdown(1)
  })

  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${name}] Da dung voi ma loi ${code}.`)
      shutdown(code || 1)
    }
  })
}

function killProcessTree(child) {
  if (!child.pid || child.exitCode !== null) return

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }

  child.kill('SIGTERM')
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true

  console.log('\nDang dung frontend va backend...')
  for (const { child } of processes) killProcessTree(child)
  process.exit(exitCode)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

console.log('Khoi dong QLBVXP: backend :8080 + frontend :5173')
console.log('Nhan Ctrl+C de dung ca hai.\n')

start('BACKEND', 'start-backend.cmd')
start('FRONTEND', 'start-frontend.cmd')
