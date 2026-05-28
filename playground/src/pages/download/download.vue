<template>
  <view class="page">
    <text class="eyebrow">Automatic download page</text>
    <text class="title">Download tracking</text>
    <text class="copy">The link click is captured by the H5 click listener. The uni.downloadFile button is captured by the uni interceptor.</text>
    <a
      id="auto-pdf-link"
      class="link"
      href="/static/auto-guide.pdf"
      target="_blank"
      rel="noreferrer"
    >
      Open PDF link
    </a>
    <button class="action-button" @click="downloadByUni">uni.downloadFile PDF</button>
    <button class="action-button" @click="goBack">Back</button>
  </view>
</template>

<script setup lang="ts">
function downloadByUni() {
  uni.downloadFile({
    url: "/static/auto-guide.pdf",
  })
}

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

.link {
  color: #2563eb;
  font-size: 30rpx;
  font-weight: 600;
}

.action-button {
  width: 100%;
  margin: 0;
}
</style>
