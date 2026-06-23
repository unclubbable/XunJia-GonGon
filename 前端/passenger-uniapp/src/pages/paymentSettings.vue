<template>
  <view class="container">
    <view class="form-item">
      <view style="margin-bottom: 15px;">
        <text>默认支付方式：</text>
      </view>
      <radio-group @change="onChange">
        <radio value="alipay" checked="true">支付宝</radio>
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


<style scoped>
  .container {
    padding: 20px;
  }

  .form-item {
    margin-bottom: 20px;
  }
  
  .submit-btn {
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
</style>
