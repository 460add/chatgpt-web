import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'
import { get, post } from '@/utils/request'

export function fetchChatAPI<T = any>(
  prompt: string,
  options?: { conversationId?: string; parentMessageId?: string },
  signal?: GenericAbortSignal,
) {
  return post<T>({
    url: '/message',
    data: { prompt, options },
    signal,
  })
}

export function fetchChatConfig<T = any>() {
  return post<T>({
    url: '/config',
  })
}

export function fetchPayHistoryConfig<T = any>() {
  return get<T>({
    url: '/pay-history',
  })
}

export function fetchChatAPIProcess<T = any>(
  params: {
    prompt: string
    options?: { conversationId?: string; parentMessageId?: string }
    signal?: GenericAbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void },
) {
  return post<T>({
    url: '/message-process',
    data: { prompt: params.prompt, options: params.options },
    signal: params.signal,
    onDownloadProgress: params.onDownloadProgress,
  })
}

// 获取会话列表
export function fetchConversationList<T = any>() {
  return get<T>({
    url: '/conversation-list',
  })
}

// 获取新会话
export function fetchNewConversation<T = any>() {
  return post<T>({
    url: '/new-conversation',
  })
}

// 更新会话
// {
//   "isEdit": "string", // 是否处于编辑状态
//   "title": "Chat", // 会话标题
//   "uuid": "1234567890" // 会话id
// }
export function fetchUpdateConversation<T = any>(
  params: {
    uuid?: number
    title?: string
    isEdit?: boolean
  },
) {
  return post<T>({
    url: '/update-conversation',
    data: params,
  })
}

// 删除会话
// {
//   "uuid": "1234567890" // 会话id
// }
export function fetchDeleteConversation<T = any>(
  params: {
    uuid: number
  },
) {
  return post<T>({
    url: '/delete-conversation',
    data: params,
  })
}

// 删除消息
// {
//   "uuid": "1234567890" // 会话id
//   "index": "1234567890" // 消息id
// }
export function fetchDeleteMessage<T = any>(
  params: {
    uuid: number
    message: string
  },
) {
  return post<T>({
    url: '/delete-message',
    data: params,
  })
}

// 清空会话消息
// {
//   "uuid": "1234567890" // 会话id
// }
export function fetchClearConversation<T = any>(
  params: {
    uuid: number
  },
) {
  return post<T>({
    url: '/clear-conversation',
    data: params,
  })
}

// 获取用户信息
export function fetchUserInfo<T = any>() {
  return get<T>({
    url: '/user-info',
  })
}
