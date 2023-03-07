<script setup lang='ts'>
import { ref } from 'vue'
import { NDataTable, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { fetchPayHistory } from '@/api'

interface PayHistory {
  id: string
  package: number
  name: string
  price: string
  quota: string
  pay_type: string
  paid: number
  created: number
}

const loading = ref(true)

const ms = useMessage()

const columns: DataTableColumns<PayHistory> = [
  {
    title: '订单号',
    key: 'id',
  },
  {
    title: '套餐名',
    key: 'name',
  },
  {
    title: '价格',
    key: 'price',
  },
  {
    title: '额度',
    key: 'quota',
  },
  {
    title: '支付方式',
    key: 'pay_type',
    render: ({ pay_type }) => {
      return pay_type === 'alipay' ? '支付宝' : '微信'
    },
  },
  {
    title: '是否支付',
    key: 'paid',
    render: ({ paid }) => {
      return paid === 1 ? '是' : '否'
    },

  },
  {
    title: '创建时间',
    key: 'created',
    render: ({ created }) => {
      return new Date(created * 1000).toLocaleString()
    },
  },
]

const data = ref([] as PayHistory[])

fetchPayHistory().then((res) => {
  data.value = res.data as PayHistory[]
  loading.value = false
}).catch(() => {
  ms.error('获取支付记录失败')
  loading.value = false
})
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="data"
    :loading="loading"
    :row-key="row => row.id"
  />
</template>
