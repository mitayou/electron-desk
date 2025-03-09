import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'

// 初始化IPC处理程序
export function setupIpcHandlers() {
  // 处理ping消息
  ipcMain.on('ping', () => {
    console.log('ping received')
  })

  // 选择文件夹
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result
  })

  // 获取文件夹结构
  ipcMain.handle('get-folder-structure', async (_, folderPath) => {
    try {
      return getFolderStructure(folderPath)
    } catch (error) {
      console.error('获取文件夹结构失败:', error)
      throw error
    }
  })

  // 迁移文件
  ipcMain.handle(
    'migrate-files',
    async (event, { oldFolderPath, newFolderPath, selectedItems }) => {
      try {
        const total = selectedItems.length
        let completed = 0

        for (const item of selectedItems) {
          const relativePath = path.relative(oldFolderPath, item)
          const targetPath = path.join(newFolderPath, relativePath)

          // 确保目标目录存在
          const targetDir = path.dirname(targetPath)
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
          }

          // 检查是文件还是目录
          const stat = fs.statSync(item)
          if (stat.isDirectory()) {
            // 如果是目录，递归复制
            copyFolderRecursive(item, targetPath)
            event.sender.send('migration-progress', {
              progress: Math.floor((++completed / total) * 100),
              log: `已迁移目录: ${relativePath}`
            })
          } else {
            // 如果是文件，直接复制
            fs.copyFileSync(item, targetPath)
            event.sender.send('migration-progress', {
              progress: Math.floor((++completed / total) * 100),
              log: `已迁移文件: ${relativePath}`
            })
          }
        }

        return { success: true, message: '迁移完成' }
      } catch (error) {
        console.error('迁移文件失败:', error)
        throw error
      }
    }
  )
}

// 获取文件夹结构
function getFolderStructure(folderPath) {
  const result: Array<any> = []

  try {
    const files = fs.readdirSync(folderPath)

    for (const file of files) {
      const fullPath = path.join(folderPath, file)
      const stats = fs.statSync(fullPath)

      const item = {
        name: file,
        path: fullPath,
        isDirectory: stats.isDirectory(),
        children: [] as Array<any>
      }

      if (stats.isDirectory()) {
        item.children = getFolderStructure(fullPath)
      }

      result.push(item)
    }
  } catch (error) {
    console.error(`读取目录 ${folderPath} 失败:`, error)
  }

  return result
}

// 递归复制文件夹
function copyFolderRecursive(source, target) {
  // 确保目标目录存在
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  // 读取源目录中的所有文件/文件夹
  const files = fs.readdirSync(source)

  for (const file of files) {
    const sourcePath = path.join(source, file)
    const targetPath = path.join(target, file)

    const stat = fs.statSync(sourcePath)

    if (stat.isDirectory()) {
      // 递归复制子目录
      copyFolderRecursive(sourcePath, targetPath)
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}
