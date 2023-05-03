<script setup lang='ts'>
import { computed, defineAsyncComponent, ref } from 'vue'
import { HoverButton, SvgIcon, UserAvatar } from '@/components/common'
import { useUserStore } from '@/store'

const Buy = defineAsyncComponent(() => import('@/components/common/Buy/index.vue'))

const show = ref(false)

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
</script>

<template>
  <footer class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">
    <div class="flex-1 flex-shrink-0 overflow-hidden">
      <UserAvatar />
    </div>

    <template v-if="userInfo.pay">
      <HoverButton :tooltip="$t('buy.buy')" @click="show = true">
        <span class="text-xl text-[#4f555e] dark:text-white">
          <SvgIcon icon="ri:exchange-cny-fill" />
        </span>
      </HoverButton>
    </template>

    <Buy v-if="show" v-model:visible="show" />
  </footer>
</template>
