<script lang="ts" setup>
import { ref, watch } from 'vue'
import { NButton, NPopconfirm, NRadioButton, NRadioGroup, NSpace, NSpin, useDialog, useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import { fetchOrder, fetchOrderStatus, fetchPackage, fetchPayType } from '@/api'

interface Package {
  package: number
  name: string
  quota: number
  price: number
}

const userStore = useUserStore()

const ms = useMessage()
const dialog = useDialog()

const loading = ref(true)

const payUrl = ref('')
const packages = ref([] as Package[])
const packageValue = ref(0)
const packetPrice = ref(0)
const packetQuota = ref(0)
const payTypeValue = ref('alipay')
const payTypes = ref([
  {
    label: '支付宝',
    value: 'alipay',
    show: false,
  },
  {
    label: '微信',
    value: 'wxpay',
    show: false,
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
}).catch((res) => {
  ms.error(`错误：${res.message}`)
  loading.value = false
})

fetchPayType().then((res) => {
  if (Number(res.data.wxpay) === 1) {
    payTypes.value[1].show = true
    payTypeValue.value = 'wxpay'
  }

  if (Number(res.data.alipay) === 1) {
    payTypes.value[0].show = true
    payTypeValue.value = 'alipay'
  }
}).catch((res) => {
  ms.error(`错误：${res.message}`)
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
      payUrl.value = res.data.pay_url
      window.open(res.data.pay_url, '_blank')
      const params = {
        id: res.data.id,
      }
      const timer = setInterval(() => {
        fetchOrderStatus(params).then((res) => {
          if (res.status === 'Success') {
            ms.success('充值成功')
            dialog.success({
              title: '充值成功',
              content: '您的充值已成功，请不要重复支付哦！',
            })
            userStore.freshUserInfo()
            clearInterval(timer)
            loading.value = false
          }
        })
      }, 3000)
    }).catch((res) => {
      ms.error(`错误：${res.message}`)
      loading.value = false
    })
  }
}

const handleOpenPayUrlClick = () => {
  if (payUrl.value !== '') {
    window.open(payUrl.value, '_blank')
    ms.info('已尝试您打开支付页面，若仍未成功，请检查浏览器权限设置')
  }
  else {
    ms.error('未获取到支付链接，请稍后再试')
  }
}
</script>

<template>
  <NSpin :show="loading">
    <div class="p-4 space-y-5 min-h-[200px]">
      <div class="space-y-6">
        <h2 class="text-xl font-bold">
          <span>选择套餐</span>
          <span style="float: right; color: red;"><b>{{ userStore.userInfo.description }}</b></span>
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
                  v-show="item.show"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </NSpace>
            </NRadioGroup>
          </div>
        </div>
        <NPopconfirm :negative-text="null" @positive-click="handleOpenPayUrlClick">
          <template #trigger>
            <NButton size="large" type="primary" @click="handlePay()">
              去支付
            </NButton>
          </template>
          若无法自动跳转支付页面，请点击下方按钮
        </NPopconfirm>
      </div>
    </div>
  </NSpin>
</template>
