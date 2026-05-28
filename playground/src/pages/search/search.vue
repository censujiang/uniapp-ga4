<template>
  <view class="page">
    <text class="eyebrow">Automatic search page</text>
    <text class="title">Search results</text>
    <text class="copy">Keyword: {{ keyword }}</text>
    <text class="copy">Route navigation should emit page_view, then view_search_results from the query string.</text>
    <button class="action-button" @click="goBack">Back</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { onLoad } from "@dcloudio/uni-app"

const keyword = ref("")

onLoad((query) => {
  keyword.value = String(query?.keyword || "")
})

function goBack() {
  uni.navigateBack()
}
</script>

<style>
.page {
  display: flex;
  min-height: 100vh;
  padding: 48rpx 32rpx;
  flex-direction: column;
  gap: 24rpx;
  background: #f5f7fb;
  box-sizing: border-box;
}

.eyebrow {
  color: #2563eb;
  font-size: 24rpx;
  font-weight: 600;
}

.title {
  color: #111827;
  font-size: 44rpx;
  font-weight: 700;
}

.copy {
  color: #4b5563;
  font-size: 28rpx;
  line-height: 1.5;
}

.action-button {
  width: 100%;
  margin: 24rpx 0 0;
}
</style>
