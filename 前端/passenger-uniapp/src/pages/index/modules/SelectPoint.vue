<template>
    <view class="select-box" >
        <view class="start" @click="startPointVisible = true">
            <text v-if="!startPoint.id">您在哪上车？</text>
            <template v-else>
                <text>您将从</text>
                <view class="start-point-text">{{startPoint.name}}</view>
                <text>上车</text>
            </template>
        </view>
        <view class="end" @click="endPointVisible = true">  
            <text>您要去哪儿？</text>
        </view>
    </view>
    <PointList v-model:visible="startPointVisible" @change="handleChangeStart"/>
    <PointList v-model:visible="endPointVisible" @change="handleChangeEnd"/>
</template>
<script setup>
import {ref, watch, computed,inject} from 'vue';
import { useStore } from 'vuex';
import PointList from './PointList.vue'
const $emits = defineEmits(['confirm']);
const $store = useStore();
    let startPointVisible = ref(false);
    let startPoint = ref({});
    let endPointVisible = ref(false);
    let endPoint = ref({});
    let city =  computed(()=> $store.state.city);
	
	
	//从父组件中获取通过 provide 提供的值--map组件中的search函数
	const mapSearch = inject('mapSearch');
	//当城市发生变化时清空开始地址及结束地址
	watch(city, ()=>{
		startPoint.value = {};
	    endPoint.value = {};
		// 如果有定位城市位置，则自动设置默认上车地点
		if (city.value.poiName){
			setTimeout(() => {
			  if (!mapSearch) return;
			  mapSearch(city.value.poiName, (result) => {
				if (result.pois && result.pois.length > 0) {
				  startPoint.value = result.pois[0]; // 设置默认上车地点
				  console.log("设置默认上车地点");
				  // console.log(startPoint.value);
				}
			  });
			}, 500); // 延时 500 毫秒，保证地图就绪
		}
	});
    const handleChangeStart = (item) =>{
		console.log("更改上车地点");
        startPoint.value = item;
        endPoint.value = {};
		console.log(startPoint.value);
    }
    const handleChangeEnd = (item) =>{
        endPoint.value = item;
        if(startPoint.value.id){
            $emits('confirm', startPoint.value, endPoint.value);
        }
    }
</script>
<style scoped lang="scss">
.select-box{
	width: 100%;
	height: 280rpx;
	box-sizing: border-box;
    position: fixed;
	bottom: var(--window-bottom);  /*适配 h5 和 app*/
    background: $uni-bg-color;
    border-radius: $uni-border-radius-lg $uni-border-radius-lg 0 0;
    z-index: 9;
    padding: $uni-spacing-row-max;
	padding-bottom: 50rpx;
    box-shadow: 0 -4rpx 5rpx rgba(0, 0, 0, 0.1); /* 仅在上部显示阴影 */
}
.start{
    height: 80rpx;
    font-size: $uni-font-size-base;
    display: flex;
    align-items: center;
    padding: 0 $uni-spacing-lg;
    margin-bottom: $uni-spacing-max;
    &::before{
        display: block;
        content: '';
        width: 10rpx;
        height: 10rpx;
        border-radius: 50%;
        background: #19c235;
        margin-right: $uni-spacing-row-base;

    }
}
.start-point-text{
    color: $uni-color-primary;
    font-weight: bold;
    margin: 0 $uni-spacing-sm;
    max-width: 400rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.end{
    background: #eee;
    border-radius: $uni-border-radius-base;
    height: 90rpx;
    line-height: 90rpx;
    padding: 0 $uni-spacing-lg;
    display: flex;
    align-items: center;
    font-size: $uni-font-size-lg;
    &::before{
        display: block;
        content: '';
        width: 10rpx;
        height: 10rpx;
        border-radius: 50%;
        background: #f0ad4e;
        margin-right: $uni-spacing-row-base;
    }
}
</style>