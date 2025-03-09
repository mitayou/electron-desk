<template>
  <div class="file-migration-container">
    <h2>文件迁移工具</h2>

    <div class="folder-dropzones">
      <div
        class="dropzone"
        :class="{ active: isDraggingOld }"
        @dragover.prevent
        @dragenter="isDraggingOld = true"
        @dragleave="isDraggingOld = false"
        @drop="handleOldFolderDrop"
      >
        <el-icon v-if="!oldFolderPath">
          <Folder />
        </el-icon>
        <span v-if="!oldFolderPath">拖拽旧版本根目录到此处</span>
        <span v-else>{{ oldFolderPath }}</span>
        <el-button size="small" type="primary" @click="selectOldFolder">选择文件夹</el-button>
      </div>

      <div
        class="dropzone"
        :class="{ active: isDraggingNew }"
        @dragover.prevent
        @dragenter="isDraggingNew = true"
        @dragleave="isDraggingNew = false"
        @drop="handleNewFolderDrop"
      >
        <el-icon v-if="!newFolderPath">
          <Folder />
        </el-icon>
        <span v-if="!newFolderPath">拖拽新版本根目录到此处</span>
        <span v-else>{{ newFolderPath }}</span>
        <el-button size="small" type="primary" @click="selectNewFolder">选择文件夹</el-button>
      </div>
    </div>

    <div v-if="oldFolderPath && newFolderPath" class="migration-options">
      <h3>迁移选项</h3>
      <div class="tree-container">
        <el-tree
          ref="migrationTree"
          show-checkbox
          node-key="path"
          :data="migrationItems"
          :default-checked-keys="defaultCheckedItems"
          :props="{ label: 'name', children: 'children' }"
        ></el-tree>
      </div>

      <div class="actions-panel">
        <el-button type="primary" :disabled="!canMigrate" @click="startMigration"
          >开始迁移</el-button
        >
        <el-button @click="resetSelection">重置选择</el-button>
      </div>
    </div>

    <el-dialog v-model="migrationDialogVisible" title="迁移进度" width="50%">
      <el-progress :percentage="migrationProgress" :status="migrationStatus"></el-progress>
      <div class="migration-log">
        <p v-for="(log, index) in migrationLogs" :key="index">{{ log }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button :disabled="isMigrating" @click="migrationDialogVisible = false"
            >关闭</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Folder } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 文件夹路径
const oldFolderPath = ref('')
const newFolderPath = ref('')

// 拖拽状态
const isDraggingOld = ref(false)
const isDraggingNew = ref(false)

// 迁移项目
const migrationItems = ref<any[]>([])
const defaultCheckedItems = ref<string[]>([])

// 迁移进度
const migrationDialogVisible = ref(false)
const migrationProgress = ref(0)
const migrationStatus = ref('')
const migrationLogs = ref<string[]>([])
const isMigrating = ref(false)

// 迁移树引用
const migrationTree = ref(null)

// 计算属性：是否可以开始迁移
const canMigrate = computed(() => {
  return (
    oldFolderPath.value &&
    newFolderPath.value &&
    migrationTree.value &&
    (migrationTree.value as any).getCheckedKeys().length > 0
  )
})

// 处理旧文件夹拖放
const handleOldFolderDrop = (e: DragEvent) => {
  e.preventDefault()
  isDraggingOld.value = false

  if (e.dataTransfer?.items) {
    const items = e.dataTransfer.items
    if (items.length > 0 && items[0].kind === 'file') {
      const entry = items[0].webkitGetAsEntry()
      if (entry && entry.isDirectory) {
        const file = e.dataTransfer.files[0]
        oldFolderPath.value = file.path
        loadMigrationItems()
      }
    }
  }
}

// 处理新文件夹拖放
const handleNewFolderDrop = (e: DragEvent) => {
  e.preventDefault()
  isDraggingNew.value = false

  if (e.dataTransfer?.items) {
    const items = e.dataTransfer.items
    if (items.length > 0 && items[0].kind === 'file') {
      const entry = items[0].webkitGetAsEntry()
      if (entry && entry.isDirectory) {
        const file = e.dataTransfer.files[0]
        newFolderPath.value = file.path
        loadMigrationItems()
      }
    }
  }
}

// 选择旧文件夹
const selectOldFolder = async () => {
  try {
    const result = await window.electron.ipcRenderer.invoke('select-folder')
    if (result && !result.canceled) {
      oldFolderPath.value = result.filePaths[0]
      loadMigrationItems()
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
    ElMessage.error('选择文件夹失败')
  }
}

// 选择新文件夹
const selectNewFolder = async () => {
  try {
    const result = await window.electron.ipcRenderer.invoke('select-folder')
    if (result && !result.canceled) {
      newFolderPath.value = result.filePaths[0]
      loadMigrationItems()
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
    ElMessage.error('选择文件夹失败')
  }
}

// 加载迁移项目
const loadMigrationItems = async () => {
  if (!oldFolderPath.value) return

  try {
    // 从主进程获取文件结构
    const items = await window.electron.ipcRenderer.invoke(
      'get-folder-structure',
      oldFolderPath.value
    )
    migrationItems.value = items

    // 设置默认选中的项目（这里可以根据需要设置默认选中的文件或文件夹）
    // 例如，默认选中配置文件夹和一些特定文件
    const defaultPaths = ['/config', '/settings.json', '/user-data']

    defaultCheckedItems.value = []

    // 递归查找匹配的路径
    const findMatchingPaths = (items, basePath = '') => {
      for (const item of items) {
        const relativePath = item.path.replace(oldFolderPath.value, '')

        if (defaultPaths.includes(relativePath)) {
          defaultCheckedItems.value.push(item.path)
        }

        if (item.children && item.children.length > 0) {
          findMatchingPaths(item.children)
        }
      }
    }

    findMatchingPaths(items)
  } catch (error) {
    console.error('加载文件结构失败:', error)
    ElMessage.error('加载文件结构失败')
  }
}

// 开始迁移
const startMigration = async () => {
  if (!canMigrate.value) return

  migrationDialogVisible.value = true
  migrationProgress.value = 0
  migrationStatus.value = ''
  migrationLogs.value = ['开始迁移文件...']
  isMigrating.value = true

  try {
    const selectedItems = (migrationTree.value as any).getCheckedKeys()

    // 监听迁移进度
    const progressListener = (event, data) => {
      migrationProgress.value = data.progress
      if (data.log) {
        migrationLogs.value.push(data.log)
      }
    }

    // 添加进度监听器
    window.electron.ipcRenderer.on('migration-progress', progressListener)

    // 通过IPC调用主进程执行迁移
    const result = await window.electron.ipcRenderer.invoke('migrate-files', {
      oldFolderPath: oldFolderPath.value,
      newFolderPath: newFolderPath.value,
      selectedItems
    })

    console.log('迁移结果', result)

    // 移除进度监听器
    window.electron.ipcRenderer.removeListener('migration-progress', progressListener)

    migrationProgress.value = 100
    migrationStatus.value = 'success'
    migrationLogs.value.push('迁移完成！')
    ElMessage.success('文件迁移成功')
  } catch (error) {
    migrationStatus.value = 'exception'
    migrationLogs.value.push(`迁移失败: ${error}`)
    ElMessage.error(`迁移失败: ${error}`)
  } finally {
    isMigrating.value = false
  }
}

// 重置选择
const resetSelection = () => {
  if (migrationTree.value) {
    ;(migrationTree.value as any).setCheckedKeys([])
  }
}

// 组件挂载时初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
})

// 组件卸载前清理
onBeforeUnmount(() => {
  // 清理可能的事件监听器
  window.electron.ipcRenderer.removeAllListeners('migration-progress')
})
</script>

<style scoped>
.file-migration-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.folder-dropzones {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.dropzone {
  flex: 1;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.dropzone.active {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

.migration-options {
  margin-top: 30px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 300px);
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  max-height: calc(100vh - 400px);
}

.actions-panel {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.migration-log {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 20px;
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 4px;
  background-color: #f9f9f9;
}
</style>
