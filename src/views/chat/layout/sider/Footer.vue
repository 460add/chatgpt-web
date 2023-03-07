<script setup lang='ts'>
import { defineAsyncComponent, ref } from 'vue'
import { HoverButton, SvgIcon, UserAvatar } from '@/components/common'

const Buy = defineAsyncComponent(() => import('@/components/common/Buy/index.vue'))

const show = ref(false)
</script>

<template>
  <footer class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">
    <UserAvatar />

    <HoverButton :tooltip="$t('buy.buy')" @click="show = true">
      <span class="text-xl text-[#4f555e] dark:text-white">
        <SvgIcon icon="ri:exchange-cny-fill" />
      </span>
    </HoverButton>

    <Buy v-if="show" v-model:visible="show" />
    <!-- <Setting v-if="show" v-model:visible="show" /> -->
  </footer>
</template>
