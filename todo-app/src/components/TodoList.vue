<template>
  <div class="todo-app">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-icon">
            <el-icon :size="28"><Check /></el-icon>
          </div>
          <div>
            <h1>Task Manager</h1>
            <p class="header-date">{{ todayDate }}</p>
          </div>
        </div>
        <div class="header-right">
          <el-tag :type="apiConnected ? 'success' : 'danger'" size="small" effect="dark" round>
            <el-icon style="margin-right: 4px;"><Monitor /></el-icon>
            {{ apiConnected ? 'Connected' : 'Disconnected' }}
          </el-tag>
        </div>
      </div>
    </header>

    <!-- Main Card -->
    <div class="main-card">
      <!-- Add Todo Form -->
      <div class="add-todo-section">
        <el-input
          v-model="newTodo"
          placeholder="What needs to be done?"
          @keyup.enter="addTodo"
          :disabled="!apiConnected || loading"
          size="large"
          class="todo-input"
          clearable
        >
          <template #prefix>
            <el-icon class="input-icon"><Plus /></el-icon>
          </template>
          <template #append>
            <el-button
              type="primary"
              @click="addTodo"
              :loading="loading"
              :disabled="!apiConnected || !newTodo.trim()"
              class="add-btn"
            >
              Add Task
            </el-button>
          </template>
        </el-input>
      </div>

        <!-- API 连接状态提示 -->
        <div v-if="!apiConnected" class="connection-status">
          <el-alert
            title="后端服务未连接，请确保后端服务器正在运行 (http://localhost:60001)"
            type="warning"
            show-icon
          />
        </div>
        <el-progress
          :percentage="progressPercent"
          :stroke-width="8"
          :show-text="false"
          color="linear-gradient(90deg, #667eea, #764ba2)"
          class="todo-progress"
        />
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs" v-if="todos.length > 0">
        <el-radio-group v-model="filterType" size="small">
          <el-radio-button value="all">All</el-radio-button>
          <el-radio-button value="active">Active</el-radio-button>
          <el-radio-button value="completed">Completed</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Todo List -->
      <div class="todo-list-section">
        <div v-if="loading && todos.length === 0" class="loading-container">
          <el-skeleton :rows="4" animated />
        </div>

        <el-empty
          v-else-if="filteredTodos.length === 0"
          :description="todos.length === 0 ? 'No tasks yet. Add one above!' : 'No tasks match this filter.'"
          :image-size="160"
          class="empty-state"
        />

        <TransitionGroup
          v-else
          name="todo-item"
          tag="div"
          class="todo-items"
        >
          <div
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="todo-item"
            :class="{ 'is-completed': todo.completed }"
          >
            <el-checkbox
              :model-value="todo.completed"
              @change="toggleTodo(todo)"
              class="todo-checkbox"
            />

            <div class="todo-content" @dblclick="startEdit(todo)">
              <template v-if="editingId === todo.id">
                <el-input
                  v-model="editText"
                  size="small"
                  @keyup.enter="saveEdit(todo)"
                  @blur="saveEdit(todo)"
                  @keyup.escape="cancelEdit"
                  ref="editInputRef"
                  class="edit-input"
                />
              </template>
              <template v-else>
                <span class="todo-text" :class="{ 'is-completed': todo.completed }">
                  {{ todo.text }}
                </span>
                <span class="todo-date">{{ formatDate(todo.createdAt) }}</span>
              </template>
            </div>

            <div class="todo-actions">
              <el-tooltip
                :content="todo.completed ? 'Mark as active' : 'Mark as completed'"
                placement="top"
              >
                <el-button
                  :type="todo.completed ? 'warning' : 'success'"
                  :icon="Select"
                  circle
                  size="small"
                  @click="toggleTodo(todo)"
                  class="action-btn"
                />
              </el-tooltip>
              <el-tooltip content="Delete" placement="top">
                <el-popconfirm
                  title="Are you sure you want to delete this task?"
                  confirm-button-text="Delete"
                  cancel-button-text="Cancel"
                  @confirm="deleteTodo(todo.id)"
                >
                  <template #reference>
                    <el-button
                      type="danger"
                      :icon="Delete"
                      circle
                      size="small"
                      class="action-btn"
                    />
                  </template>
                </el-popconfirm>
              </el-tooltip>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Footer -->
      <div class="app-footer" v-if="todos.length > 0">
        <div class="footer-left">
          <span class="stats">
            <span class="stat-item">
              <el-icon><List /></el-icon>
              {{ todos.length }} total
            </span>
            <span class="stat-divider">|</span>
            <span class="stat-item active-stat">
              <el-icon><CircleCheck /></el-icon>
              {{ activeCount }} active
            </span>
            <span class="stat-divider">|</span>
            <span class="stat-item completed-stat">
              <el-icon><SuccessFilled /></el-icon>
              {{ completedCount }} done
            </span>
          </span>
        </div>
        <div class="footer-right">
          <el-checkbox
            v-model="selectAll"
            :indeterminate="isIndeterminate"
            @change="handleSelectAll"
            class="select-all-checkbox"
          >
            Select All
          </el-checkbox>
          <el-button
            v-if="completedCount > 0"
            type="danger"
            size="small"
            plain
            @click="clearCompleted"
            :loading="loading"
          >
            <el-icon><Delete /></el-icon>
            Clear completed
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Check, Plus, Delete, Select, Monitor, List, CircleCheck, SuccessFilled } from '@element-plus/icons-vue'
import { todoApi, checkApiHealth } from '../services/api'
import { ElMessage } from 'element-plus'

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string | Date
}

const todos = ref<Todo[]>([])
const newTodo = ref('')
const loading = ref(false)
const apiConnected = ref(false)
const filterType = ref<'all' | 'active' | 'completed'>('all')
const editingId = ref<number | null>(null)
const editText = ref('')
const selectAll = ref(false)


// Computed
const completedCount = computed(() => todos.value.filter(t => t.completed).length)
const activeCount = computed(() => todos.value.filter(t => !t.completed).length)
const progressPercent = computed(() =>
  todos.value.length === 0 ? 0 : Math.round((completedCount.value / todos.value.length) * 100)
)
const isIndeterminate = computed(() => {
  const checked = todos.value.filter(t => t.completed).length
  return checked > 0 && checked < todos.value.length
})

const filteredTodos = computed(() => {
  switch (filterType.value) {
    case 'active': return todos.value.filter(t => !t.completed)
    case 'completed': return todos.value.filter(t => t.completed)
    default: return todos.value
  }
})

const todayDate = computed(() => {
  const now = new Date()
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }
  return now.toLocaleDateString('en-US', opts)
})

// API check
const checkConnection = async () => {
  try {
    apiConnected.value = await checkApiHealth()
  } catch {
    apiConnected.value = false
  }
}

// Load todos
const loadTodos = async () => {
  if (!apiConnected.value) return
  try {
    loading.value = true
    todos.value = await todoApi.getAllTodos()
  } catch {
    ElMessage.error('Failed to load tasks')
  } finally {
    loading.value = false
  }
}

// Add todo
const addTodo = async () => {
  if (!newTodo.value.trim() || !apiConnected.value) return
  try {
    loading.value = true
    const item = await todoApi.createTodo({ text: newTodo.value.trim(), completed: false })
    todos.value.unshift(item)
    newTodo.value = ''
    ElMessage.success('Task added!')
  } catch {
    ElMessage.error('Failed to add task')
  } finally {
    loading.value = false
  }
}

// Toggle todo
const toggleTodo = async (todo: Todo) => {
  try {
    loading.value = true
    const updated = await todoApi.updateTodo(todo.id, { completed: !todo.completed })
    const index = todos.value.findIndex(t => t.id === todo.id)
    if (index !== -1) todos.value[index] = updated
  } catch {
    ElMessage.error('Failed to update task')
  } finally {
    loading.value = false
  }
}

// Delete todo
const deleteTodo = async (id: number) => {
  try {
    loading.value = true
    await todoApi.deleteTodo(id)
    todos.value = todos.value.filter(t => t.id !== id)
    ElMessage.success('Task deleted')
  } catch {
    ElMessage.error('Failed to delete task')
  } finally {
    loading.value = false
  }
}

// Clear completed
const clearCompleted = async () => {
  const completed = todos.value.filter(t => t.completed)
  if (completed.length === 0) return
  try {
    loading.value = true
    await Promise.all(completed.map(t => todoApi.deleteTodo(t.id)))
    todos.value = todos.value.filter(t => !t.completed)
    ElMessage.success('Completed tasks cleared')
  } catch {
    ElMessage.error('Failed to clear tasks')
  } finally {
    loading.value = false
  }
}

// Inline edit
const startEdit = (todo: Todo) => {
  editingId.value = todo.id
  editText.value = todo.text
  nextTick(() => {
    const input = document.querySelector('.edit-input input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

const saveEdit = async (todo: Todo) => {
  if (editingId.value === null) return
  const text = editText.value.trim()
  if (!text || text === todo.text) {
    editingId.value = null
    return
  }
  try {
    const updated = await todoApi.updateTodo(todo.id, { text })
    const index = todos.value.findIndex(t => t.id === todo.id)
    if (index !== -1) todos.value[index] = updated
    ElMessage.success('Task updated')
  } catch {
    ElMessage.error('Failed to update task')
  } finally {
    editingId.value = null
  }
}

const cancelEdit = () => {
  editingId.value = null
}

// Select all
const handleSelectAll = (val: boolean) => {
  if (val) {
    Promise.all(
      todos.value.filter(t => !t.completed).map(t =>
        todoApi.updateTodo(t.id, { completed: true })
      )
    ).then(() => {
      todos.value.forEach(t => { t.completed = true })
      ElMessage.success('All tasks completed!')
    })
  }
}

// Format date
const formatDate = (date: string | Date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(async () => {
  await checkConnection()
  if (apiConnected.value) await loadTodos()
})
</script>

<style scoped lang="less">
.todo-app {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}

// Header
.app-header {
  margin-bottom: 28px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .logo-icon {
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 16px;
      color: white;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
    }

    h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: -0.5px;
    }

    .header-date {
      margin: 2px 0 0;
      font-size: 13px;
      color: #8e8ea0;
      font-weight: 500;
    }
  }
}

// Main Card
.main-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 28px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.7);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow:
      0 8px 40px rgba(0, 0, 0, 0.08),
      0 1px 2px rgba(0, 0, 0, 0.04);
  }
}

// Add Todo
.add-todo-section {
  margin-bottom: 20px;

  :deep(.el-input-group__prepend) {
    background: transparent;
    border: none;
  }

  :deep(.el-input__wrapper) {
    border-radius: 14px 0 0 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 2px solid #e8ecf4;
    transition: all 0.3s ease;
    background: white;
    padding-left: 16px;

    &:hover {
      border-color: #667eea;
    }

    &.is-focus {
      border-color: #667eea;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.12);
    }

    .el-input__inner {
      height: 50px;
      font-size: 16px;
    }
  }

  :deep(.el-input-group__append) {
    background: transparent;
    border: none;

    .add-btn {
      height: 50px;
      border-radius: 0 14px 14px 0;
      padding: 0 28px;
      font-size: 15px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      transition: all 0.3s ease;
      letter-spacing: 0.3px;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }
  }

  .input-icon {
    color: #a0aec0;
    font-size: 18px;
  }
}

// Connection Alert
.connection-alert {
  margin-bottom: 16px;
  border-radius: 12px;
}

// Progress
.progress-section {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9ff, #f0f2ff);
  border-radius: 14px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .progress-title {
      font-size: 14px;
      font-weight: 600;
      color: #4a4a6a;
    }

    .progress-text {
      font-size: 13px;
      color: #8e8ea0;
      font-weight: 500;
    }
  }

  .todo-progress {
    :deep(.el-progress-bar__outer) {
      background-color: #e8ecf4;
      border-radius: 10px;
    }

    :deep(.el-progress-bar__inner) {
      border-radius: 10px;
      transition: width 0.6s ease;
    }
  }
}

// Filter Tabs
.filter-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;

  :deep(.el-radio-group) {
    background: #f0f2f6;
    border-radius: 10px;
    padding: 3px;
    border: none;

    .el-radio-button {
      .el-radio-button__inner {
        border: none;
        border-radius: 8px;
        padding: 6px 20px;
        font-size: 13px;
        font-weight: 500;
        color: #8e8ea0;
        background: transparent;
        box-shadow: none;
        transition: all 0.25s ease;
      }

      &.is-active .el-radio-button__inner {
        background: white;
        color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
      }
    }
  }
}

// Todo Items
.todo-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: white;
  border-radius: 14px;
  border: 1px solid #f0f2f6;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #e0e4f0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    transform: translateY(-1px);

    .todo-actions {
      opacity: 1;
    }
  }

  &.is-completed {
    background: #fafbff;
    border-color: #e8ecf4;

    .todo-text {
      text-decoration: line-through;
      color: #b0b8c8;
    }
  }

  .todo-checkbox {
    :deep(.el-checkbox__input) {
      .el-checkbox__inner {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        border-color: #d0d5e0;
        transition: all 0.25s ease;

        &::after {
          box-sizing: content-box;
          content: '';
          border: 2px solid #fff;
          border-left: 0;
          border-top: 0;
          height: 10px;
          width: 5px;
          left: 6px;
          top: 1px;
          position: absolute;
          transform: rotate(45deg) scaleY(0);
          transition: transform 0.15s ease-in 0.05s;
          transform-origin: center;
        }
      }

      &.is-checked .el-checkbox__inner {
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-color: transparent;

        &::after {
          transform: rotate(45deg) scaleY(1);
        }
      }
    }
  }

  .todo-content {
    flex: 1;
    min-width: 0;
    cursor: default;

    .todo-text {
      display: block;
      font-size: 15px;
      font-weight: 500;
      color: #2d2d44;
      line-height: 1.5;
      word-break: break-word;

      &.is-completed {
        color: #b0b8c8;
      }
    }

    .todo-date {
      display: block;
      font-size: 12px;
      color: #a0aec0;
      margin-top: 2px;
    }
  }

  .edit-input {
    :deep(.el-input__wrapper) {
      border-radius: 8px;
      box-shadow: 0 0 0 2px #667eea;
      background: white;

      .el-input__inner {
        font-size: 15px;
      }
    }
  }

  .todo-actions {
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.25s ease;
    flex-shrink: 0;

    .action-btn {
      width: 32px;
      height: 32px;
      padding: 0;
      transition: all 0.25s ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

// Todo list animations
.todo-item-enter-active {
  transition: all 0.4s ease;
}

.todo-item-leave-active {
  transition: all 0.3s ease;
}

.todo-item-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.todo-item-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.todo-item-move {
  transition: transform 0.3s ease;
}

// Empty state
.empty-state {
  padding: 40px 0;

  :deep(.el-empty__description p) {
    font-size: 16px;
    color: #a0aec0;
  }
}

// Loading
.loading-container {
  padding: 40px 0;
}

// Footer
.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f2f6;
  flex-wrap: wrap;
  gap: 12px;

  .stats {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #8e8ea0;
    font-weight: 500;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .el-icon {
        font-size: 14px;
      }
    }

    .stat-divider {
      color: #e0e4f0;
    }

    .active-stat {
      color: #667eea;
    }

    .completed-stat {
      color: #67c23a;
    }
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .select-all-checkbox {
      :deep(.el-checkbox__label) {
        font-size: 13px;
        color: #8e8ea0;
      }
    }
  }
}

// Responsive
@media (max-width: 640px) {
  .todo-app {
    padding: 12px;
  }

  .app-header {
    .header-left {
      h1 { font-size: 22px; }
      .logo-icon { width: 44px; height: 44px; }
    }
  }

  .main-card {
    padding: 20px;
    border-radius: 20px;
  }

  .todo-item {
    padding: 12px 14px;
    flex-wrap: wrap;

    .todo-actions {
      opacity: 1;
      margin-left: auto;
    }
  }

  .app-footer {
    flex-direction: column;
    align-items: stretch;

    .stats {
      justify-content: center;
      flex-wrap: wrap;
    }

    .footer-right {
      justify-content: center;
    }
  }
}
</style>
