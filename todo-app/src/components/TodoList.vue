<template>
  <div class="todo-container">
    <el-card class="todo-card">
      <template #header>
        <div class="card-header">
          <h2>Todo List</h2>
        </div>
      </template>

      <!-- 添加任务表单 -->
      <div class="add-todo-form">
        <el-input
          v-model="newTodo"
          placeholder="请输入待办事项..."
          @keyup.enter="addTodo"
          :disabled="!apiConnected || loading"
          class="todo-input"
        >
          <template #append>
            <el-button
              type="primary"
              @click="addTodo"
              :loading="loading"
              :disabled="!apiConnected"
            >
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </template>
        </el-input>

        <!-- API 连接状态提示 -->
        <div v-if="!apiConnected" class="connection-status">
          <el-alert
            title="后端服务未连接，请确保后端服务器正在运行 (http://localhost:3000)"
            type="warning"
            show-icon
          />
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="todo-list">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <el-empty v-else-if="todos.length === 0" description="暂无待办事项" />

        <el-table
          v-else
          :data="todos"
          style="width: 100%"
          height="400"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="text" label="任务内容">
            <template #default="scope">
              <span :class="{ 'completed': scope.row.completed }">
                {{ scope.row.text }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                @click="deleteTodo(scope.row.id)"
                :disabled="!apiConnected || loading"
                :loading="loading"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 底部操作栏 -->
      <div class="todo-footer" v-if="todos.length > 0">
        <div class="footer-left">
          <el-button
            type="danger"
            size="small"
            @click="deleteSelected"
            :disabled="!multipleSelection.length || !apiConnected || loading"
            :loading="loading"
          >
            删除选中
          </el-button>
          <span class="todo-count">
            共 {{ todos.length }} 项，已完成 {{ completedCount }} 项
          </span>
        </div>
        <div class="footer-right">
          <el-button
            type="success"
            size="small"
            @click="completeSelected"
            :disabled="!multipleSelection.length || !apiConnected || loading"
            :loading="loading"
          >
            完成选中
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
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
const multipleSelection = ref<Todo[]>([])
const loading = ref(false)
const apiConnected = ref(false)

// 计算已完成任务数量
const completedCount = computed(() => {
  return todos.value.filter(todo => todo.completed).length
})

// 检查 API 连接
const checkConnection = async () => {
  try {
    apiConnected.value = await checkApiHealth()
    if (!apiConnected.value) {
      ElMessage.warning('后端服务未连接，请确保后端服务器正在运行')
    }
  } catch (error) {
    apiConnected.value = false
    console.error('API连接检查失败:', error)
  }
}

// 加载所有待办事项
const loadTodos = async () => {
  if (!apiConnected.value) return

  try {
    loading.value = true
    const data = await todoApi.getAllTodos()
    todos.value = data
  } catch (error) {
    console.error('加载待办事项失败:', error)
    ElMessage.error('加载待办事项失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

// 添加新任务
const addTodo = async () => {
  if (!newTodo.value.trim() || !apiConnected.value) {
    if (!apiConnected.value) {
      ElMessage.error('后端服务未连接')
    }
    return
  }

  try {
    loading.value = true
    const newTodoItem = await todoApi.createTodo({
      text: newTodo.value.trim(),
      completed: false
    })
    todos.value.unshift(newTodoItem) // 添加到列表开头
    newTodo.value = ''
    ElMessage.success('待办事项添加成功')
  } catch (error) {
    console.error('添加待办事项失败:', error)
    ElMessage.error('添加待办事项失败')
  } finally {
    loading.value = false
  }
}

// 删除单个任务
const deleteTodo = async (todoId: number) => {
  if (!apiConnected.value) {
    ElMessage.error('后端服务未连接')
    return
  }

  try {
    loading.value = true
    await todoApi.deleteTodo(todoId)
    // 使用 ID 过滤来删除，避免索引问题
    todos.value = todos.value.filter(todo => todo.id !== todoId)
    ElMessage.success('待办事项删除成功')
  } catch (error) {
    console.error('删除待办事项失败:', error)
    ElMessage.error('删除待办事项失败')
  } finally {
    loading.value = false
  }
}

// 处理表格选择变化
const handleSelectionChange = (val: Todo[]) => {
  multipleSelection.value = val
}

// 删除选中任务
const deleteSelected = async () => {
  if (!apiConnected.value || multipleSelection.value.length === 0) {
    if (!apiConnected.value) {
      ElMessage.error('后端服务未连接')
    }
    return
  }

  try {
    loading.value = true
    const deletePromises = multipleSelection.value.map(todo =>
      todoApi.deleteTodo(todo.id)
    )
    await Promise.all(deletePromises)

    // 从本地列表中移除
    const selectedIds = multipleSelection.value.map(todo => todo.id)
    todos.value = todos.value.filter(todo => !selectedIds.includes(todo.id))
    multipleSelection.value = []

    ElMessage.success(`成功删除 ${deletePromises.length} 个待办事项`)
  } catch (error) {
    console.error('批量删除待办事项失败:', error)
    ElMessage.error('批量删除待办事项失败')
  } finally {
    loading.value = false
  }
}

// 完成选中任务
const completeSelected = async () => {
  if (!apiConnected.value || multipleSelection.value.length === 0) {
    if (!apiConnected.value) {
      ElMessage.error('后端服务未连接')
    }
    return
  }

  try {
    loading.value = true
    const updatePromises = multipleSelection.value.map(todo =>
      todoApi.updateTodo(todo.id, { completed: true })
    )
    await Promise.all(updatePromises)

    // 更新本地列表
    multipleSelection.value.forEach(selectedTodo => {
      const todo = todos.value.find(t => t.id === selectedTodo.id)
      if (todo) {
        todo.completed = true
      }
    })
    multipleSelection.value = []

    ElMessage.success(`成功完成 ${updatePromises.length} 个待办事项`)
  } catch (error) {
    console.error('批量完成待办事项失败:', error)
    ElMessage.error('批量完成待办事项失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date: string | Date) => {
  const dateObj = new Date(date)
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 组件挂载时初始化
onMounted(async () => {
  await checkConnection()
  if (apiConnected.value) {
    await loadTodos()
  }
})
</script>

<style lang="less" scoped>
.todo-container {
  max-width: 900px;
  min-width: 600px;
  width: 100%;

  .todo-card {
    width: 100%;
    min-width: 560px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: none;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    :deep(.el-card__header) {
      background: rgba(255, 255, 255, 0.15);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 24px 32px;
    }

    :deep(.el-card__body) {
      background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
      padding: 32px;
    }

    .card-header {
      text-align: center;

      h2 {
        margin: 0;
        color: white;
        font-size: 2.2rem;
        font-weight: 600;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        letter-spacing: 1px;
      }
    }

    .add-todo-form {
      margin-bottom: 32px;

      :deep(.el-input) {
        .el-input__wrapper {
          border-radius: 12px 0 0 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 2px solid #e8f4fd;
          transition: all 0.3s ease;

          &:hover, &.is-focus {
            border-color: #409EFF;
            box-shadow: 0 4px 20px rgba(64, 158, 255, 0.15);
          }

          .el-input__inner {
            height: 48px;
            font-size: 16px;

            &::placeholder {
              color: #909399;
              font-size: 15px;
            }
          }
        }
      }

      :deep(.el-input-group__append) {
        .el-button {
          height: 48px;
          border-radius: 0 12px 12px 0;
          font-size: 16px;
          font-weight: 600;
          background: linear-gradient(135deg, #409EFF 0%, #36a3f7 100%);
          border: none;
          transition: all 0.3s ease;

          &:hover {
            background: linear-gradient(135deg, #36a3f7 0%, #409EFF 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
          }

          .el-icon {
            margin-right: 6px;
          }
        }
      }
    }

    .todo-list {
      margin-bottom: 32px;

      :deep(.el-empty) {
        padding: 60px 0;

        .el-empty__image {
          width: 120px;
          height: 120px;
        }

        .el-empty__description {
          margin-top: 20px;

          p {
            font-size: 18px;
            color: #909399;
            font-weight: 500;
          }
        }
      }

      .completed {
        text-decoration: line-through;
        color: #909399;
        opacity: 0.7;
      }

      :deep(.el-table) {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

        .el-table__header {
          th {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #303133;
            font-weight: 600;
            font-size: 15px;
            padding: 16px 0;
            border-bottom: 2px solid #ebeef5;
          }
        }

        .el-table__body {
          td {
            padding: 16px 0;
            font-size: 15px;

            &.el-table-column--selection {
              .el-checkbox__inner {
                border-radius: 4px;
                width: 18px;
                height: 18px;

                &:after {
                  height: 8px;
                  width: 4px;
                  left: 5px;
                }
              }
            }
          }

          .el-table__row {
            transition: all 0.3s ease;

            &:hover {
              background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }

            &:nth-child(even) {
              background-color: #fafbfc;
            }
          }
        }
      }
    }

    .todo-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 2px solid #ebeef5;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      margin: 0 -32px -32px -32px;
      padding: 24px 32px;

      .footer-left {
        display: flex;
        align-items: center;
        gap: 20px;

        .el-button {
          border-radius: 8px;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(245, 108, 108, 0.3);
          }
        }

        .todo-count {
          font-size: 16px;
          color: #606266;
          font-weight: 500;
          background: white;
          padding: 8px 16px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }

      .footer-right {
        .el-button {
          border-radius: 8px;
          font-weight: 600;
          padding: 10px 20px;
          background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
          border: none;
          transition: all 0.3s ease;

          &:hover {
            background: linear-gradient(135deg, #5daf34 0%, #67c23a 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(103, 194, 58, 0.3);
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .todo-container {
    margin: 20px auto;
    padding: 15px;
    min-width: auto;

    .todo-card {
      min-width: auto;

      .card-header {
        h2 {
          font-size: 1.8rem;
        }
      }

      :deep(.el-card__body) {
        padding: 20px;
      }

      .todo-footer {
        flex-direction: column;
        gap: 15px;
        margin: 0 -20px -20px -20px;
        padding: 20px;

        .footer-left {
          flex-direction: column;
          gap: 10px;
          align-items: stretch;

          .todo-count {
            text-align: center;
          }
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .todo-container {
    margin: 10px auto;
    padding: 10px;

    .todo-card {
      :deep(.el-card__body) {
        padding: 16px;
      }

      .card-header {
        h2 {
          font-size: 1.5rem;
        }
      }

      .todo-footer {
        margin: 0 -16px -16px -16px;
        padding: 16px;
      }
    }
  }
}

// 加载状态样式
.loading-container {
  padding: 40px 0;
  text-align: center;
}

.connection-status {
  margin-top: 16px;
}

// 动画效果
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.todo-card {
  animation: fadeIn 0.6s ease-out;
}
</style>