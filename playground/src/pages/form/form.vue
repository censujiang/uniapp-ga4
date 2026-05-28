<template>
  <view class="page">
    <text class="eyebrow">Automatic form page</text>
    <text class="title">Form tracking</text>
    <text class="copy">Focus or type to emit form_start. Submit to emit form_submit. No page code calls ga4.formStart or ga4.formSubmit.</text>
    <form
      id="auto-debug-form"
      class="form"
      name="Auto debug form"
      action="/debug-submit"
      @submit="onSubmit"
    >
      <input
        class="input"
        name="email"
        type="text"
        placeholder="email@example.com"
        v-model="email"
      />
      <button class="action-button primary" form-type="submit" data-ga4-form-submit="true">Submit form</button>
    </form>
    <text class="copy">Last submit: {{ submitText }}</text>
    <button class="action-button" @click="goBack">Back</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue"

const email = ref("")
const submitText = ref("none")

function onSubmit() {
  submitText.value = email.value || "empty"
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

.form {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.input {
  height: 88rpx;
  padding: 0 24rpx;
  border: 1rpx solid #cbd5e1;
  border-radius: 8rpx;
  background: #ffffff;
  color: #111827;
  font-size: 28rpx;
  box-sizing: border-box;
}

.action-button {
  width: 100%;
  margin: 0;
}

.primary {
  color: #ffffff;
  background: #2563eb;
}
</style>
