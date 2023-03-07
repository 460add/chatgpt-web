import { defineStore } from 'pinia'
import { getLocalState, setLocalState } from './helper'
import { router } from '@/router'
import {
  fetchClearConversation,
  fetchDeleteConversation,
  fetchDeleteMessage,
  fetchNewConversation,
  fetchUpdateConversation,
} from '@/api'

export const useChatStore = defineStore('chat-store', {
  state: (): Chat.ChatState => getLocalState(),

  getters: {
    getChatHistoryByCurrentActive(state: Chat.ChatState) {
      const index = state.history.findIndex(item => item.uuid === state.active)
      if (index !== -1)
        return state.history[index]
      return null
    },

    getChatByUuid(state: Chat.ChatState) {
      return (uuid?: number) => {
        if (uuid)
          return state.chat.find(item => item.uuid === uuid)?.data ?? []
        return state.chat.find(item => item.uuid === state.active)?.data ?? []
      }
    },
  },

  actions: {
    async addHistory(history: Chat.History, chatData: Chat.Chat[] = []) {
      // 发送新会话请求
      // history.uuid 应该是服务端返回的
      await fetchNewConversation().then((res) => {
        if (res.status !== 'Success')
          return Promise.reject(res)
        history.uuid = res.data.uuid
        this.history.unshift(history)
        this.chat.unshift({ uuid: history.uuid, data: chatData })
        this.active = history.uuid
        this.reloadRoute(history.uuid)
      }).catch((err) => {
        return Promise.reject(err)
      })
    },

    async updateHistory(chat: Chat.History, edit: Partial<Chat.History>) {
      if (!chat.isEdit && !edit.isEdit) {
        const index = this.history.findIndex(item => item.uuid === chat.uuid)
        if (index !== -1) {
          this.history[index] = { ...this.history[index], ...edit }
          this.recordState()
        }
        return
      }
      // 发送更新会话请求
      await fetchUpdateConversation(chat).then((res) => {
        if (res.status !== 'Success')
          return Promise.reject(res)
        const index = this.history.findIndex(item => item.uuid === chat.uuid)
        if (index !== -1) {
          this.history[index] = { ...this.history[index], ...edit }
          this.recordState()
        }
      }).catch((err) => {
        return Promise.reject(err)
      })
    },

    async deleteHistory(uuid: number) {
      // 发送删除会话请求
      await fetchDeleteConversation({ uuid }).then((res) => {
        if (res.status !== 'Success')
          return Promise.reject(res)
        const index = this.history.findIndex(item => item.uuid === uuid)
        this.history.splice(index, 1)
        this.chat.splice(index, 1)

        if (this.history.length === 0) {
          this.active = null
          this.reloadRoute()
          return
        }

        if (index > 0 && index <= this.history.length) {
          const uuid = this.history[index - 1].uuid
          this.active = uuid
          this.reloadRoute(uuid)
          return
        }

        if (index === 0) {
          if (this.history.length > 0) {
            const uuid = this.history[0].uuid
            this.active = uuid
            this.reloadRoute(uuid)
          }
        }

        if (index > this.history.length) {
          const uuid = this.history[this.history.length - 1].uuid
          this.active = uuid
          this.reloadRoute(uuid)
        }
      }).catch((err) => {
        return Promise.reject(err)
      })
    },

    async setActive(uuid: number) {
      this.active = uuid
      return await this.reloadRoute(uuid)
    },

    getChatByUuidAndIndex(uuid: number, index: number) {
      if (!uuid || uuid === 0) {
        if (this.chat.length)
          return this.chat[0].data[index]
        return null
      }
      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1)
        return this.chat[chatIndex].data[index]
      return null
    },

    addChatByUuid(uuid: number, chat: Chat.Chat) {
      if (!uuid || uuid === 0) {
        if (this.history.length === 0) {
          const uuid = Date.now()
          this.history.push({ uuid, title: chat.text, isEdit: false })
          this.chat.push({ uuid, data: [chat] })
          this.active = uuid
          this.recordState()
        }
        else {
          this.chat[0].data.push(chat)
          if (this.history[0].title === 'New Chat')
            this.history[0].title = chat.text
          this.recordState()
        }
      }

      const index = this.chat.findIndex(item => item.uuid === uuid)
      if (index !== -1) {
        this.chat[index].data.push(chat)
        if (this.history[index].title === 'New Chat')
          this.history[index].title = chat.text
        this.recordState()
      }
    },

    // 由于跟下面异步的 deleteChatByUuid 冲突了，所以改了个名字
    deleteLocalChatByUuid(uuid: number, index: number) {
      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1) {
        this.chat[chatIndex].data.splice(index, 1)
        this.recordState()
      }
    },

    updateChatByUuid(uuid: number, index: number, chat: Chat.Chat) {
      if (!uuid || uuid === 0) {
        if (this.chat.length) {
          this.chat[0].data[index] = chat
          this.recordState()
        }
        return
      }

      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1) {
        this.chat[chatIndex].data[index] = chat
        this.recordState()
      }
    },

    updateChatSomeByUuid(uuid: number, index: number, chat: Partial<Chat.Chat>) {
      if (!uuid || uuid === 0) {
        if (this.chat.length) {
          this.chat[0].data[index] = { ...this.chat[0].data[index], ...chat }
          this.recordState()
        }
        return
      }

      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1) {
        this.chat[chatIndex].data[index] = { ...this.chat[chatIndex].data[index], ...chat }
        this.recordState()
      }
    },

    async deleteChatByUuid(uuid: number, index: number) {
      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1) {
        // 发送删除消息请求
        const message = this.chat[chatIndex].data[index].id as number
        return new Promise((resolve, reject) => {
          fetchDeleteMessage({ uuid, message }).then((res) => {
            if (res.status !== 'Success') {
              reject(res)
            }
            else {
              this.chat[chatIndex].data.splice(index, 1)
              this.recordState()
              resolve(res)
            }
          }).catch((err) => {
            reject(err)
          })
        })
      }
    },

    async clearChatByUuid(uuid: number) {
      // 发送清空消息请求
      return new Promise((resolve, reject) => {
        fetchClearConversation({ uuid }).then((res) => {
          if (res.status !== 'Success')
            reject(res)
          if (!uuid || uuid === 0) {
            if (this.chat.length) {
              this.chat[0].data = []
              this.recordState()
            }
            return
          }

          const index = this.chat.findIndex(item => item.uuid === uuid)
          if (index !== -1) {
            this.chat[index].data = []
            this.recordState()
          }
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
      })
    },

    // 更新状态
    setState(state: Chat.ChatState) {
      this.$patch(state)
      this.recordState()
    },

    async reloadRoute(uuid?: number) {
      this.recordState()
      await router.push({ name: 'Chat', params: { uuid } })
    },

    recordState() {
      setLocalState(this.$state)
    },
  },
})
