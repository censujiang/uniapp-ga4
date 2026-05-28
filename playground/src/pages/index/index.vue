<template>
  <view class="page">
    <view class="header">
      <text class="eyebrow">ga4-uniapp playground</text>
      <text class="title">Auto Collect Debug</text>
      <text class="subtitle">{{ measurementId }}</text>
    </view>

    <view class="summary">
      <view class="summary-item">
        <text class="label">Client ID</text>
        <text class="value">{{ context.clientId }}</text>
      </view>
      <view class="summary-item">
        <text class="label">Session</text>
        <text class="value">{{ context.sessionId }} / {{ context.sessionNumber }}</text>
      </view>
      <view class="summary-item">
        <text class="label">Last action</text>
        <text class="value">{{ lastAction }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">Automatic routes</text>
      <button class="action-button primary" @click="goSearch">navigateTo search?q</button>
      <button class="action-button" @click="goDetail">navigateTo detail</button>
      <button class="action-button" @click="goDownload">navigateTo download</button>
      <button class="action-button" @click="goForm">navigateTo form</button>
    </view>

    <view class="section">
      <text class="section-title">Manual API</text>
      <button class="action-button" @click="sendCustomEvent">playground_event</button>
      <button class="action-button" @click="sendSearchEvent">manual view_search_results</button>
      <button class="action-button" @click="sendDownloadEvent">manual file_download</button>
      <button class="action-button" @click="resetSession">reset session</button>
    </view>

    <view class="scroll-zone">
      <text class="zone-title">Auto scroll test</text>
      <text class="zone-copy">
        H5 scroll listener is registered by ga4.init(). Scroll near the bottom to emit one scroll event.
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue"
import type { GA4ContextSnapshot } from "ga4-uniapp"
import { ga4, ga4MeasurementId } from "../../ga4"

const measurementId = ga4MeasurementId
const context = reactive<GA4ContextSnapshot>(ga4.getContext())
const lastAction = ref("ready")

function refreshContext() {
  Object.assign(context, ga4.getContext())
}

async function runAction(name: string, action: () => Promise<void>) {
  lastAction.value = `sending ${name}`
  await action()
  refreshContext()
  lastAction.value = `sent ${name}`
}

function goSearch() {
  lastAction.value = "navigateTo search"
  uni.navigateTo({
    url: "/pages/search/search?keyword=auto-search",
    complete: refreshContext,
  })
}

function goDetail() {
  lastAction.value = "navigateTo detail"
  uni.navigateTo({
    url: "/pages/detail/detail?id=demo-episode",
    complete: refreshContext,
  })
}

function goDownload() {
  lastAction.value = "navigateTo download"
  uni.navigateTo({
    url: "/pages/download/download",
    complete: refreshContext,
  })
}

function goForm() {
  lastAction.value = "navigateTo form"
  uni.navigateTo({
    url: "/pages/form/form",
    complete: refreshContext,
  })
}

function sendCustomEvent() {
  void runAction("playground_event", () => ga4.event("playground_event", {
    event_category: "debug",
    button_name: "custom_event",
    value: Date.now(),
  }))
}

function sendSearchEvent() {
  void runAction("view_search_results", () => ga4.viewSearchResults("uniapp ga4 debug", {
    search_origin: "playground_button",
  }))
}

function sendDownloadEvent() {
  void runAction("file_download", () => ga4.trackFileDownload({
    url: "https://example.com/assets/ga4-uniapp-report.pdf",
    linkText: "Download report",
    linkId: "playground-report",
  }))
}

function resetSession() {
  ga4.resetSession()
  refreshContext()
  lastAction.value = "session reset"
}
</script>

<style>
.page {
  min-height: 180vh;
  padding: 48rpx 32rpx 80rpx;
  background: #f5f7fb;
  box-sizing: border-box;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.eyebrow {
  color: #2563eb;
  font-size: 24rpx;
  font-weight: 600;
}

.title {
  color: #111827;
  font-size: 48rpx;
  font-weight: 700;
}

.subtitle {
  color: #4b5563;
  font-size: 28rpx;
}

.summary,
.section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.section-title {
  color: #111827;
  font-size: 30rpx;
  font-weight: 700;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 24rpx;
  border: 1rpx solid #dbe3ef;
  border-radius: 8rpx;
  background: #ffffff;
}

.label {
  color: #6b7280;
  font-size: 22rpx;
  font-weight: 600;
  text-transform: uppercase;
}

.value {
  color: #111827;
  font-size: 26rpx;
  line-height: 1.45;
  word-break: break-all;
}

.action-button {
  width: 100%;
  margin: 0;
}

.primary {
  color: #ffffff;
  background: #2563eb;
}

.scroll-zone {
  display: flex;
  min-height: 70vh;
  padding: 32rpx;
  flex-direction: column;
  justify-content: flex-end;
  gap: 16rpx;
  border: 1rpx dashed #9ca3af;
  border-radius: 8rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.zone-title {
  color: #111827;
  font-size: 32rpx;
  font-weight: 700;
}

.zone-copy {
  color: #4b5563;
  font-size: 26rpx;
  line-height: 1.5;
}
</style>
