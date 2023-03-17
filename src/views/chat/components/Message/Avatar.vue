<script lang="ts" setup>
import { computed } from 'vue'
import { NAvatar } from 'naive-ui'
import { useUserStore } from '@/store'
import { isString } from '@/utils/is'
import defaultAvatar from '@/assets/avatar.jpg'
import defaultGptAvatar from '@/assets/gpt.svg'

interface Props {
  image?: boolean
}
defineProps<Props>()

const userStore = useUserStore()

const avatar = computed(() => userStore.userInfo.avatar)
const gptAvatar = computed(() => userStore.userInfo.gptAvatar)
</script>

<template>
  <template v-if="image">
    <NAvatar v-if="isString(avatar) && avatar.length > 0" :src="avatar" :fallback-src="defaultAvatar" color="#fff" />
    <NAvatar v-else round :src="defaultAvatar" color="#fff" />
  </template>
  <template v-else>
    <NAvatar v-if="isString(gptAvatar) && gptAvatar !== ''" :src="gptAvatar" :fallback-src="defaultGptAvatar" color="#fff" />
    <NAvatar v-else round :src="defaultGptAvatar" color="#fff" />
  </template>
</template>
