<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NCard, NModal, NTabPane, NTabs } from 'naive-ui'
import Buy from './Buy.vue'
import History from './History.vue'
import { SvgIcon } from '@/components/common'

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

interface Props {
  visible: boolean
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const active = ref('Buy')

const reload = ref(false)

const show = computed({
  get() {
    return props.visible
  },
  set(visible: boolean) {
    emit('update:visible', visible)
  },
})

function handleReload() {
  reload.value = true
  setTimeout(() => {
    reload.value = false
  }, 0)
}
</script>

<template>
  <NModal v-model:show="show" :auto-focus="false">
    <NCard role="dialog" aria-modal="true" :bordered="false" style="width: 100%; max-width: 720px">
      <NTabs v-model:value="active" type="line" animated>
        <NTabPane name="Buy" tab="Buy">
          <template #tab>
            <SvgIcon class="text-lg" icon="ri:shopping-cart-2-line" />
            <span class="ml-2">{{ $t('buy.buy') }}</span>
          </template>
          <div class="min-h-[100px]">
            <Buy v-if="!reload" @update="handleReload" />
          </div>
        </NTabPane>
        <NTabPane name="History" tab="History">
          <template #tab>
            <SvgIcon class="text-lg" icon="ri:history-line" />
            <span class="ml-2">{{ $t('buy.history') }}</span>
          </template>
          <History />
        </NTabPane>
      </NTabs>
    </NCard>
  </NModal>
</template>
