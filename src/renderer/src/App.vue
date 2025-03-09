<script setup lang="ts">
import Versions from './components/Versions.vue'
import FileMigration from './components/FileMigration.vue'
import { ref } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'

const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
const showMigrationTool = ref(false)

const toggleMigrationTool = (): void => {
  showMigrationTool.value = !showMigrationTool.value
}
</script>

<template>
  <div v-if="!showMigrationTool" class="default-view">
    <img alt="logo" class="logo" src="./assets/electron.svg" />
    <div class="creator">Powered by electron-vite</div>
    <div class="text">
      Build an Electron app with
      <span class="vue">Vue</span>
      and
      <span class="ts">TypeScript</span>
    </div>
    <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
    <div class="actions">
      <div class="action">
        <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
      </div>
      <div class="action">
        <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
      </div>
      <div class="action">
        <a @click.prevent="toggleMigrationTool">文件迁移工具</a>
      </div>
    </div>
    <Versions />
  </div>

  <div v-else class="migration-view">
    <div class="back-button">
      <el-button :icon="ArrowLeft" @click="toggleMigrationTool">返回</el-button>
    </div>
    <FileMigration />
  </div>
</template>

<style>
.default-view,
.migration-view {
  width: 100%;
  height: 100vh;
}

.migration-view {
  padding: 20px;
}

.back-button {
  margin-bottom: 20px;
}
</style>
