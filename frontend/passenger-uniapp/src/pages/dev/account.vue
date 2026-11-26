<template>
    <view class="dev-page">
        <view class="page-header">
            <text class="page-title">服务端地址</text>
            <text class="page-subtitle">仅供开发调试</text>
        </view>

        <view class="form-card">
            <view class="title">在此设置你的后端服务地址</view>
            <view class="item">
                <text class="label">支付接口（统一网关）</text>
                <input class="input" v-model="serverConf.pay" />
            </view>
            <view class="item">
                <text class="label">WebSocket 服务</text>
                <input class="input" v-model="serverConf.ws" />
            </view>
            <view class="item">
                <text class="label">其他服务</text>
                <input class="input" v-model="serverConf.other" />
            </view>
            <button class="btn" @click="handleSave">保存</button>
            <view class="desc">保存成功后如不生效，请重启APP</view>
            <view class="desc">本页仅供开发调试（pages/dev/account）</view>
        </view>
    </view>
</template>
<script setup>
/**
 * 开发调试页：运行时修改后端地址
 * 正式业务入口请勿依赖本页；从「我的」菜单进入仅用于联调。
 */
import { computed} from "vue";
import { useStore } from "vuex";
import { ShowToast } from "../../utils";
const $store = useStore();
let serverConf = computed({
    get: ()=> $store.state.serverConf,
    set(val){
    }
});
const handleSave = () =>{
    $store.commit('setServerConf', serverConf.value);
    ShowToast('保存成功');
}

</script>
<style lang="scss" scoped>
.dev-page {
    min-height: 100vh;
    background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
    padding: 32rpx 32rpx 60rpx;
    box-sizing: border-box;
}

.page-header {
    margin-bottom: 28rpx;
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
        color: #fa8c16;
        background: #fff7e6;
        padding: 8rpx 24rpx;
        border-radius: 999rpx;
        display: inline-block;
    }
}

.form-card {
    background: #fff;
    border-radius: 28rpx;
    padding: 36rpx 32rpx;
    box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
    border: 1px solid rgba(232, 236, 240, 0.95);
}

.title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1f2f3d;
    margin-bottom: 28rpx;
}

.item {
    margin-bottom: 28rpx;
}

.label {
    font-size: 26rpx;
    color: #86909c;
    display: block;
    margin-bottom: 12rpx;
}

.input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #eef0f4;
    background: #f8f9fc;
    border-radius: 16rpx;
    height: 80rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1f2f3d;
}

.btn {
    margin-top: 12rpx;
    background: linear-gradient(135deg, #318eff, #1a6fe8);
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    border-radius: 999rpx;
    height: 96rpx;
    line-height: 96rpx;
    box-shadow: 0 12rpx 28rpx rgba(49, 142, 255, 0.28);

    &::after {
        display: none;
    }

    &:active {
        opacity: 0.92;
        transform: scale(0.98);
    }
}

.desc {
    font-size: 24rpx;
    color: #ff4d4f;
    margin-top: 20rpx;
    line-height: 1.5;
}
</style>
