<script setup lang='ts'>
import { computed } from 'vue'
import { NInput, NPopconfirm, NScrollbar, useDialog, useLoadingBar } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'

const { isMobile } = useBasicLayout()

const appStore = useAppStore()
const chatStore = useChatStore()

const dialog = useDialog()
const loadingBar = useLoadingBar()

const dataSources = computed(() => chatStore.history)

async function handleSelect(chat: Chat.History) {
  if (isActive(chat.uuid))
    return

  if (chatStore.active)
    await chatStore.updateHistory(chat, { isEdit: false })
  await chatStore.setActive(chat.uuid)

  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleEdit(chat: Chat.History, isEdit: boolean, event?: MouseEvent) {
  event?.stopPropagation()
  loadingBar.start()
  chatStore.updateHistory(chat, { isEdit }).then(() => {
    loadingBar.finish()
  }).catch((err) => {
    loadingBar.finish()
    dialog.error({
      title: '错误',
      content: err.message,
    })
  })
}

function handleDelete(index: number, event?: MouseEvent | TouchEvent) {
  event?.stopPropagation()
  loadingBar.start()
  chatStore.deleteHistory(index).then(() => {
    loadingBar.finish()
  }).catch((err) => {
    loadingBar.finish()
    dialog.error({
      title: '错误',
      content: err.message,
    })
  })
}

function handleEnter(chat: Chat.History, isEdit: boolean, event: KeyboardEvent) {
  event?.stopPropagation()
  if (event.key === 'Enter') {
    chatStore.updateHistory(chat, { isEdit }).then(() => {
      loadingBar.finish()
    }).catch((err) => {
      loadingBar.finish()
      dialog.error({
        title: '错误',
        content: err.message,
      })
    })
  }
}

function isActive(uuid: number) {
  return chatStore.active === uuid
}
</script>

<template>
  <NScrollbar class="px-4">
    <div class="flex flex-col gap-2 text-sm">
      <template v-if="!dataSources.length">
        <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
          <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
          <span>{{ $t('common.noData') }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="(item, index) of dataSources" :key="index">
          <a
            class="relative flex items-center gap-3 px-3 py-3 break-all border rounded-md cursor-pointer hover:bg-neutral-100 group dark:border-neutral-800 dark:hover:bg-[#24272e]"
            :class="isActive(item.uuid) && ['border-[#4b9e5f]', 'bg-neutral-100', 'text-[#4b9e5f]', 'dark:bg-[#24272e]', 'dark:border-[#4b9e5f]', 'pr-14']"
            @click="handleSelect(item)"
          >
            <span>
              <SvgIcon icon="ri:message-3-line" />
            </span>
            <div class="relative flex-1 overflow-hidden break-all text-ellipsis whitespace-nowrap">
              <NInput
                v-if="item.isEdit"
                v-model:value="item.title"
                size="tiny"
                @keypress="handleEnter(item, false, $event)"
              />
              <span v-else>{{ item.title }}</span>
            </div>
            <div v-if="isActive(item.uuid)" class="absolute z-10 flex visible right-1">
              <template v-if="item.isEdit">
                <button class="p-1" @click="handleEdit(item, false, $event)">
                  <SvgIcon icon="ri:save-line" />
                </button>
              </template>
              <template v-else>
                <button class="p-1">
                  <SvgIcon icon="ri:edit-line" @click="handleEdit(item, true, $event)" />
                </button>
                <NPopconfirm placement="bottom" @positive-click="handleDelete(item.uuid, $event)">
                  <template #trigger>
                    <button class="p-1">
                      <SvgIcon icon="ri:delete-bin-line" />
                    </button>
                  </template>
                  {{ $t('chat.deleteHistoryConfirm') }}
                </NPopconfirm>
              </template>
            </div>
          </a>
        </div>
      </template>
    </div>
  </NScrollbar>
</template>
