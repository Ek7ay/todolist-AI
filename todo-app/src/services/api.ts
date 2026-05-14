// API 基础配置
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:60001/api'    // 开发环境使用localhost
  : 'http://localhost:60001/api';   // 生产环境使用localhost

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string | Date;
}

export interface CreateTodoRequest {
  text: string;
  completed?: boolean;
}

export interface UpdateTodoRequest {
  text?: string;
  completed?: boolean;
}

// API 错误处理
class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// 通用请求函数
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    // 处理 204 No Content 响应（如 DELETE 请求）
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`网络请求失败: ${error}`);
  }
}

// Todo API 函数
export const todoApi = {
  // 获取所有待办事项
  async getAllTodos(): Promise<TodoItem[]> {
    return request<TodoItem[]>('/todos');
  },

  // 获取单个待办事项
  async getTodoById(id: number): Promise<TodoItem> {
    return request<TodoItem>(`/todos/${id}`);
  },

  // 创建新的待办事项
  async createTodo(data: CreateTodoRequest): Promise<TodoItem> {
    return request<TodoItem>('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新待办事项
  async updateTodo(id: number, data: UpdateTodoRequest): Promise<TodoItem> {
    return request<TodoItem>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除待办事项
  async deleteTodo(id: number): Promise<void> {
    return request<void>(`/todos/${id}`, {
      method: 'DELETE',
    });
  },

  // 删除所有已完成的待办事项
  async deleteCompletedTodos(): Promise<{ message: string }> {
    return request<{ message: string }>('/todos', {
      method: 'DELETE',
    });
  },
};

// 健康检查
export async function checkApiHealth(): Promise<boolean> {
  try {
    const healthUrl = 'http://localhost:60001/health';
    const response = await fetch(healthUrl);
    return response.ok;
  } catch {
    return false;
  }
}