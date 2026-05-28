<template>
  <view class="page">
    <text class="eyebrow">Automatic detail page</text>
    <text class="title">Episode detail</text>
    <text class="copy">ID: {{ episodeId }}</text>
    <text class="copy">This page verifies plain uni.navigateTo page_view tracking.</text>
    <button class="action-button" @click="goBack">Back</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { onLoad } from "@dcloudio/uni-app"

const episodeId = ref("")

onLoad((query) => {
  episodeId.value = String(query?.id || "")
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
