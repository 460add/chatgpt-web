<script lang="ts" setup>
import { ref, watch } from 'vue'
import { NButton, NRadioButton, NRadioGroup, NSpace, NSpin, useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import { fetchOrder, fetchOrderStatus, fetchPackage } from '@/api'

interface Package {
  package: number
  name: string
  quota: number
  price: number
}

const userStore = useUserStore()

const ms = useMessage()

const loading = ref(true)

const packages = ref([] as Package[])
const packageValue = ref(0)
const packetPrice = ref(0)
const packetQuota = ref(0)
const payTypeValue = ref('alipay')
const payTypes = ref([
  {
    label: '支付宝',
    value: 'alipay',
  },
  {
    label: '微信',
    value: 'wxpay',
  },
])

watch(
  packageValue,
  (val) => {
    const packageItem = packages.value.find(item => item.package === Number(val))
    if (packageItem) {
      packetPrice.value = packageItem.price
      packetQuota.value = packageItem.quota
    }
  },
  { immediate: true },
)

fetchPackage().then((res) => {
  packages.value = res.data as Package[]
  packetPrice.value = packages.value[0].price
  packetQuota.value = packages.value[0].quota
  loading.value = false
}).catch(() => {
  ms.error('获取套餐信息失败')
  loading.value = false
})

const handlePay = () => {
  loading.value = true
  const packageItem = packages.value.find(item => item.package === Number(packageValue.value))
  if (packageItem) {
    const params = {
      package: packageItem.package,
      pay_type: payTypeValue.value,
    }
    fetchOrder(params).then((res) => {
      window.open(res.data.pay_url, '_blank')
      const params = {
        id: res.data.id,
      }
      const timer = setInterval(() => {
        fetchOrderStatus(params).then((res) => {
          if (res.status === 'Success') {
            ms.success('充值成功')
            userStore.freshUserInfo()
            clearInterval(timer)
            loading.value = false
          }
        })
      }, 3000)
    }).catch(() => {
      ms.error('获取支付信息失败')
      loading.value = false
    })
  }
}
</script>

<template>
  <NSpin :show="loading">
    <div class="p-4 space-y-5 min-h-[200px]">
      <div class="space-y-6">
        <h2 class="text-xl font-bold">
          <span>选择套餐</span>
          <span style="float: right">{{ userStore.userInfo.description }}</span>
        </h2>
        <div class="flex items-center space-x-4">
          <NRadioGroup v-model:value="packageValue" name="packages" size="large">
            <NSpace>
              <NRadioButton
                v-for="item in packages"
                :key="item.package"
                :value="item.package"
                :label="item.name"
              />
            </NSpace>
          </NRadioGroup>
        </div>
        <div class="flex items-center space-x-4">
          <span class="flex-shrink-0 w-[100px]">套餐额度</span>
          <div class="w-[200px]">
            {{ packetQuota }}
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <span class="flex-shrink-0 w-[100px]">套餐价格</span>
          <div class="w-[200px]">
            {{ packetPrice }}
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <span class="flex-shrink-0 w-[100px]">支付方式</span>
          <div class="w-[200px]">
            <NRadioGroup v-model:value="payTypeValue" name="payTypes" size="large">
              <NSpace>
                <NRadioButton
                  v-for="item in payTypes"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </NSpace>
            </NRadioGroup>
          </div>
        </div>
        <NButton size="large" type="primary" @click="handlePay()">
          去支付
        </NButton>
      </div>
    </div>
  </NSpin>
</template>
