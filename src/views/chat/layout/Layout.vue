<script setup lang='ts'>
import { computed } from 'vue'
import { NLayout, NLayoutContent, useDialog, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import Sider from './sider/index.vue'
import Header from './header/index.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useChatStore, useUserStore } from '@/store'
import { fetchConversationList } from '@/api'
import { defaultState } from '@/store/modules/chat/helper'
import { defaultSetting } from '@/store/modules/user/helper'

const router = useRouter()
const appStore = useAppStore()
const chatStore = useChatStore()
const userStore = useUserStore()

router.replace({ name: 'Chat', params: { uuid: chatStore.active } })

const { isMobile } = useBasicLayout()

const message = useMessage()
const dialog = useDialog()

const collapsed = computed(() => appStore.siderCollapsed)

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return ['border', 'rounded-md', 'shadow-md', 'dark:border-neutral-800']
})

const getContainerClass = computed(() => {
  return [
    'h-full',
    { 'pl-[260px]': !isMobile.value && !collapsed.value },
  ]
})

// 获取会话并刷新state
message.loading('会话加载中，请稍后...')
fetchConversationList().then((res) => {
  message.success('会话加载成功')
  const state = res.data
  chatStore.setState(state)
}).catch((err) => {
  chatStore.setState(defaultState())
  userStore.updateUserInfo(defaultSetting().userInfo)
  dialog.error({
    title: '错误',
    content: err.message,
  })
})
</script>

<template>
  <div class="h-full dark:bg-[#24272e] transition-all" :class="[isMobile ? 'p-0' : 'p-4']">
    <div class="h-full overflow-hidden" :class="getMobileClass">
      <NLayout class="z-40 transition" :class="getContainerClass" has-sider>
        <Sider />
        <Header v-if="isMobile" />
        <NLayoutContent class="h-full">
          <RouterView v-slot="{ Component, route }">
            <component :is="Component" :key="route.fullPath" />
          </RouterView>
        </NLayoutContent>
      </NLayout>
    </div>
  </div>
</template>
