<template>
  <view class="payment-page">
    <view class="page-header">
      <text class="page-title">支付设置</text>
      <text class="page-subtitle">选择默认支付方式</text>
    </view>

    <view class="form-card">
      <view class="form-label">默认支付方式</view>
      <radio-group class="pay-group" @change="onChange">
        <label class="pay-option">
          <view class="pay-option__left">
            <view class="pay-icon">支</view>
            <text class="pay-name">支付宝</text>
          </view>
          <radio value="alipay" checked="true" color="#318eff" />
        </label>
      </radio-group>
    </view>

    <button class="submit-btn" @click="handleSubmit">提交</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const paymentMethod = ref('alipay');

const onChange = (event) => {
  paymentMethod.value = event.detail.value;
};

// 提交表单
const handleSubmit = () => {
  const data = {
    paymentMethod: paymentMethod.value
  };
  // 提交数据逻辑
  console.log(data);
};
</script>

<style lang="scss" scoped>
.payment-page {
  min-height: 100vh;
  background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
  padding: 32rpx 32rpx 60rpx;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 32rpx;
  text-align: center;

  .page-title {
    font-size: 44rpx;
    font-weight: 700;
    color: #1f2f3d;
    display: block;
    margin-bottom: 12rpx;
  }

  .page-subtitle {
    font-size: 24rpx;
    color: #318eff;
    background: #e8f3ff;
    padding: 8rpx 24rpx;
    border-radius: 999rpx;
    display: inline-block;
  }
}

.form-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
  border: 1px solid rgba(232, 236, 240, 0.95);
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 24rpx;
}

.pay-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pay-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  background: #f8f9fc;
  border-radius: 20rpx;
  border: 1px solid #eef0f4;
}

.pay-option__left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.pay-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #1677ff, #69c0ff);
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-name {
  font-size: 30rpx;
  color: #1f2f3d;
  font-weight: 500;
}

.submit-btn {
  background: linear-gradient(135deg, #318eff, #1a6fe8);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 999rpx;
  height: 96rpx;
  line-height: 96rpx;
  border: none;
  box-shadow: 0 12rpx 28rpx rgba(49, 142, 255, 0.28);

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.98);
    opacity: 0.92;
  }
}
</style>
