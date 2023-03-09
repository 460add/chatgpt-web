<script setup lang='ts'>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NInput, useDialog, useMessage } from 'naive-ui'
import html2canvas from 'html2canvas'
import { Message } from './components'
import { useScroll } from './hooks/useScroll'
import { useChat } from './hooks/useChat'
import { useCopyCode } from './hooks/useCopyCode'
import { HoverButton, SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useChatStore, useUserStore } from '@/store'
import { fetchChatAPIProcess, fetchConversationList } from '@/api'
import { t } from '@/locales'

let controller = new AbortController()

const route = useRoute()
const dialog = useDialog()
const message = useMessage()

const chatStore = useChatStore()
const userStore = useUserStore()

useCopyCode()
const { isMobile } = useBasicLayout()
const { addChat, deleteChat, updateChat, updateChatSome, getChatByUuidAndIndex } = useChat()
const { scrollRef, scrollToBottom } = useScroll()

const { uuid } = route.params as { uuid: string }

const dataSources = computed(() => chatStore.getChatByUuid(+uuid))
const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !item.error)))

const prompt = ref<string>('')
const loading = ref<boolean>(false)
const usingContext = ref<boolean>(true)
const actionVisible = ref<boolean>(true)

function handleSubmit() {
  onConversation()
}

async function onConversation() {
  const message = prompt.value // 消息

  if (loading.value)
    return

  if (!message || message.trim() === '')
    return

  // 判断会话ID是否为空
  if (!uuid || uuid === '' || uuid === '0') {
    dialog.info({
      title: '提示',
      content: '请先创建会话',
    })
    return
  }

  controller = new AbortController()

  // 取上一条ChatGPT回复的消息作为问题的请求参数
  let questionOptions: Chat.ConversationRequest = {
    conversationId: 0,
    parentMessageId: 0,
  }
  const questionLastContext = conversationList.value[conversationList.value.length - 1]?.responseOptions

  if (questionLastContext)
    questionOptions = { ...questionLastContext }

  // 添加问题到本地存储
  addChat(
    +uuid,
    {
      id: 0,
      dateTime: new Date().toLocaleString(),
      text: message,
      inversion: true,
      error: false,
      requestOptions: { prompt: message, options: { ...questionOptions } },
      responseOptions: {
        role: 'user',
        id: 0,
        text: message,
        parentMessageId: questionOptions.parentMessageId,
        conversationId: questionOptions.conversationId,
      },
    },
  )
  await scrollToBottom()

  loading.value = true
  prompt.value = '' // 清空输入框

  let options: Chat.ConversationRequest = {
    conversationId: +uuid,
    parentMessageId: 0,
  }
  const lastContext = conversationList.value[conversationList.value.length - 1]?.requestOptions.options

  if (lastContext && usingContext.value)
    options = { ...lastContext }

  // 添加ChatGPT回复的消息到本地存储
  addChat(
    +uuid,
    {
      id: 0,
      dateTime: new Date().toLocaleString(),
      text: '',
      loading: true,
      inversion: false,
      error: false,
      requestOptions: { prompt: message, options },
      responseOptions: null,
    },
  )

  await scrollToBottom()

  try {
    await fetchChatAPIProcess<Chat.ConversationResponse>({
      prompt: message,
      options,
      signal: controller.signal,
      onDownloadProgress: ({ event }) => {
        const xhr = event.target
        const { responseText } = xhr
        // Always process the final line
        const lastIndex = responseText.lastIndexOf('\n')
        let chunk = responseText
        if (lastIndex !== -1)
          chunk = responseText.substring(lastIndex)
        try {
          const data = JSON.parse(chunk) as Chat.ConversationResponse

          // 需要将ChatGPT回复的消息中的父消息ID和更新到请求参数中
          options.parentMessageId = data.parentMessageId

          updateChat(
            +uuid,
            dataSources.value.length - 1,
            {
              id: data.id,
              dateTime: new Date().toLocaleString(),
              text: data.text ?? '',
              inversion: false,
              error: false,
              loading: false,
              requestOptions: { prompt: message, options: { ...options } },
              responseOptions: data,
            },
          )
          const questionIndex = dataSources.value.length - 2
          const question = dataSources.value[questionIndex]
          question.id = data.parentMessageId as number
          if (question.responseOptions)
            question.responseOptions.id = data.parentMessageId as number

          updateChat(
            +uuid,
            questionIndex,
            question,
          )
          scrollToBottom()
        }
        catch (error) {
          updateChatSome(
            +uuid,
            dataSources.value.length - 1,
            {
              text: 'JSON响应错误，请与管理员联系',
              error: false,
              loading: false,
            },
          )
        }
      },
    })
  }
  catch (error: any) {
    const errorMessage = error?.message ?? t('common.wrong')

    if (error.message === 'canceled') {
      // 取消的话，就清除本地存储的消息
      prompt.value = message
      deleteChat(+uuid, dataSources.value.length - 1)

      await scrollToBottom()
      return
    }

    const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

    if (currentChat?.text && currentChat.text !== '') {
      updateChatSome(
        +uuid,
        dataSources.value.length - 1,
        {
          text: `${currentChat.text}\n[${errorMessage}]`,
          error: false,
          loading: false,
        },
      )
      return
    }

    updateChat(
      +uuid,
      dataSources.value.length - 1,
      {
        id: 0,
        dateTime: new Date().toLocaleString(),
        text: errorMessage,
        inversion: false,
        error: true,
        loading: false,
        requestOptions: { prompt: message, options: { ...options } },
        responseOptions: null,
      },
    )
    await scrollToBottom()
  }
  finally {
    userStore.freshUserInfo()
    loading.value = false
  }
}

async function onRegenerate(index: number) {
  if (loading.value)
    return

  controller = new AbortController()

  const { id, requestOptions, responseOptions } = dataSources.value[index]

  const message = requestOptions?.prompt ?? ''

  // 获取当前消息的id作为regenerate参数
  if (requestOptions.options)
    requestOptions.options.regenerate = id
  else
    throw new Error('会话出现错误，请刷新页面重试。')

  loading.value = true

  updateChat(
    +uuid,
    index,
    {
      id,
      dateTime: new Date().toLocaleString(),
      text: '',
      inversion: false,
      error: false,
      loading: true,
      requestOptions,
      responseOptions,
    },
  )

  try {
    await fetchChatAPIProcess<Chat.ConversationResponse>({
      prompt: message,
      options: requestOptions.options,
      signal: controller.signal,
      onDownloadProgress: ({ event }) => {
        const xhr = event.target
        const { responseText } = xhr
        // Always process the final line
        const lastIndex = responseText.lastIndexOf('\n')
        let chunk = responseText
        if (lastIndex !== -1)
          chunk = responseText.substring(lastIndex)
        try {
          const data = JSON.parse(chunk) as Chat.ConversationResponse
          updateChat(
            +uuid,
            index,
            {
              id: data.id,
              dateTime: new Date().toLocaleString(),
              text: data.text ?? '',
              inversion: false,
              error: false,
              loading: false,
              requestOptions: { prompt: message, options: requestOptions.options },
              responseOptions: data,
            },
          )
        }
        catch (error) {
          //
        }
      },
    })
  }
  catch (error: any) {
    if (error.message === 'canceled') {
      updateChatSome(
        +uuid,
        index,
        {
          loading: false,
        },
      )
      return
    }

    const errorMessage = error?.message ?? t('common.wrong')

    updateChat(
      +uuid,
      index,
      {
        id: 0,
        dateTime: new Date().toLocaleString(),
        text: `${errorMessage}\n${t('chat.failed')}`,
        inversion: false,
        error: true,
        loading: false,
        requestOptions: { prompt: message, options: requestOptions.options },
        responseOptions: null,
      },
    )
  }
  finally {
    loading.value = false
  }
}

function handleExport() {
  if (loading.value)
    return

  const d = dialog.warning({
    title: t('chat.exportImage'),
    content: t('chat.exportImageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      try {
        d.loading = true
        const ele = document.getElementById('image-wrapper')
        const canvas = await html2canvas(ele as HTMLDivElement, {
          useCORS: true,
        })
        const imgUrl = canvas.toDataURL('image/png')
        const tempLink = document.createElement('a')
        tempLink.style.display = 'none'
        tempLink.href = imgUrl
        tempLink.setAttribute('download', 'chat-shot.png')
        if (typeof tempLink.download === 'undefined')
          tempLink.setAttribute('target', '_blank')

        document.body.appendChild(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
        window.URL.revokeObjectURL(imgUrl)
        d.loading = false
        message.success(t('chat.exportSuccess'))
        await Promise.resolve()
      }
      catch (error: any) {
        message.error(t('chat.exportFailed'))
      }
      finally {
        d.loading = false
      }
    },
  })
}

function handleDelete(index: number) {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.deleteMessageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      await chatStore.deleteChatByUuid(+uuid, index).then(() => {
        dialog.success({
          title: '成功',
          content: '删除成功',
        })
      }).catch((err) => {
        dialog.error({
          title: '错误',
          content: err.message,
        })
      })
    },
  })
}

function handleClear() {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.clearChat'),
    content: t('chat.clearChatConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      await chatStore.clearChatByUuid(+uuid).then(() => {
        dialog.success({
          title: '成功',
          content: '清空成功',
        })
      }).catch((err) => {
        dialog.error({
          title: '错误',
          content: err.message,
        })
      })
    },
  })
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
  else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
}

function handleStop() {
  if (loading.value) {
    controller.abort()
    message.loading('会话加载中，请稍后...')
    fetchConversationList().then((res) => {
      const state = res.data
      chatStore.setState(state)
    }).catch((err) => {
      dialog.error({
        title: '错误',
        content: err.message,
      })
    })
    loading.value = false
  }
}

function onInputFocus() {
  if (isMobile.value)
    actionVisible.value = false
}

function onInputBlur() {
  if (isMobile.value)
    actionVisible.value = true
}

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === ''
})

const wrapClass = computed(() => {
  if (isMobile.value)
    return ['pt-14']
  return []
})

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'overflow-hidden']
  return classes
})

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  if (loading.value)
    controller.abort()
})
</script>

<template>
  <div class="flex flex-col w-full h-full" :class="wrapClass">
    <main class="flex-1 overflow-hidden">
      <div
        id="scrollRef"
        ref="scrollRef"
        class="h-full overflow-hidden overflow-y-auto"
      >
        <div
          id="image-wrapper"
          class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
          :class="[isMobile ? 'p-2' : 'p-4']"
        >
          <template v-if="!dataSources.length">
            <div class="flex items-center justify-center mt-4 text-center text-neutral-300">
              <SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl" />
              <span>Aha~</span>
            </div>
          </template>
          <template v-else>
            <div>
              <Message
                v-for="(item, index) of dataSources"
                :key="index"
                :date-time="item.dateTime"
                :text="item.text"
                :inversion="item.inversion"
                :error="item.error"
                :loading="item.loading"
                @regenerate="onRegenerate(index)"
                @delete="handleDelete(index)"
              />
              <div class="sticky bottom-0 left-0 flex justify-center">
                <NButton v-if="loading" type="warning" @click="handleStop">
                  <template #icon>
                    <SvgIcon icon="ri:stop-circle-line" />
                  </template>
                  Stop Responding
                </NButton>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto">
        <div class="flex items-center justify-between space-x-2">
          <div v-if="actionVisible" class="flex items-center space-x-2">
            <HoverButton @click="handleClear">
              <span class="text-xl text-[#4f555e] dark:text-white">
                <SvgIcon icon="ri:delete-bin-line" />
              </span>
            </HoverButton>
            <HoverButton @click="handleExport">
              <span class="text-xl text-[#4f555e] dark:text-white">
                <SvgIcon icon="ri:download-2-line" />
              </span>
            </HoverButton>
          </div>
          <NInput
            v-model:value="prompt"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 2 }"
            :placeholder="placeholder"
            @focus="onInputFocus"
            @blur="onInputBlur"
            @keypress="handleEnter"
          />
          <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
            <template #icon>
              <span class="dark:text-black">
                <SvgIcon icon="ri:send-plane-fill" />
              </span>
            </template>
          </NButton>
        </div>
      </div>
    </footer>
  </div>
</template>
