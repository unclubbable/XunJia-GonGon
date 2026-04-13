<template>
    <view class="map-wrapper">
		<BMap ref="mapRef"/>
    </view>
	<view class="city" @click="handleCity()">{{city.name}}</view>
	<SelectPoint @confirm="handleConfrimPoint"/>
</template>
<script setup>
    import { computed, onMounted,onUnmounted, onBeforeUnmount, provide, ref, watch } from 'vue';
	import { ApiGetCityList } from "../../api/city";
	import { useStore } from 'vuex';
	import BMap from '../../component/BMap.vue';
	import SelectPoint from './modules/SelectPoint.vue';
	//Map组件引用
	const mapRef = ref(null);
	const $store = useStore();
	
	let city = computed(()=> $store.state.city);
	//  通过 provide 向所有后代组件注入一个名为'mapSearch'的值
	provide('mapSearch',(str,cb) => mapRef.value.search(cb, str));
	
	onMounted(() => {
		// 监听city的变化（切换城市，去除驾车路线）
		watch(city, setLocation);
		// 定位到当前城市（初始化城市信息）
		getLocation();
		//实时更新位置
		updatalocaltion();
	});
	
	onUnmounted(() => {
		if (pointTimer) {
			clearTimeout(pointTimer);
			pointTimer = null;
			console.log("定位定时器已清除");
		}
	});
	// 定位定时器 ID
	let pointTimer = null;
	//实时更新位置
	function updatalocaltion(){
		uni.getLocation({
			type: 'gcj02',
			geocode: true,
			success (res) {
				console.log("更新当前位置");
				const {address,longitude,latitude, accuracy} = res;
				const location = {
					"center" : [longitude, latitude],
					"accuracy": accuracy,
				}
				mapRef.value.updateLocationMarker(location); 
				
		
				pointTimer=setTimeout(()=>{
					updatalocaltion()
				}, 6000)
			},
			fail(err) {
			    console.error('获取位置信息失败:', err);
			}
		});
	}
	
	
	/**
	 * 请求定位权限（如果未授权则弹窗引导）
	 * @returns {Promise<boolean>} 是否已获得权限
	 */
	async function requestLocationPermission() {
	    return new Promise((resolve) => {
	        uni.getSetting({
	            success: (res) => {
	                if (res.authSetting['scope.userLocation']) {
	                    // 已有权限
	                    resolve(true);
	                } else {
	                    // 无权限，尝试申请
	                    uni.authorize({
	                        scope: 'scope.userLocation',
	                        success: () => {
	                            resolve(true);
	                        },
	                        fail: () => {
	                            // 用户拒绝过
								
	                        }
	                    });
	                }
	            },
	            fail: () => {
	                resolve(false);
	            }
	        });
	    });
	}
	// 定位到当前城市（初始化城市信息）
	const getLocation = async () => {
	    // 开启弹框，让用户开启定位权限
		requestLocationPermission()
	    const {error, result}= await ApiGetCityList();
		uni.getLocation({
			type: 'gcj02',
			geocode: true,
			success (res) {
			  console.log("获取当前位置");
			  // console.log(JSON.stringify(res))
			  const {address,longitude,latitude, accuracy} = res;
			  $store.commit('setCity',{
				adcode : result.find(i => i.citycode === address.cityCode).adcode,
				cityCode: address.cityCode,
				name: address.city,
				center: `${longitude},${latitude}`,
				accuracy: `${accuracy}`,
				locationRes: true,
				poiName: address.poiName			//地区名称
			  });
			},
			fail(err) {
			    console.error('获取位置信息失败:', err);
				setLocation();  // 默认北京
			}
		});
	}
	
 /**
  * @Description: 城市变更,绘制定位
  * 重新设置地图显示区域
  * 清除已画好的路线
  * @return {*}
  */
 	function setLocation (){
		// console.log(city.value)
		if (!mapRef.value) {
		    return;
		}
		const location = {
			"center" : city.value.center.split(','),
			"accuracy": city.value.accuracy,
			"locationRes" : city.value.locationRes
		}
		mapRef.value.setLocation(location); 					//初始化坐标及切换城市
		setTimeout(()=>mapRef.value.clearDriving(), 500);  		//清除高德地图上已绘制的驾车路线
	}	
 /**
  * @Description:  确认路线
  * 绘制路线，页面状态改为价格
  * @param {*} start
  * @param {*} end
  * @return {*}
  */	
	const handleConfrimPoint = async (start, end) =>{
		const [startLng, startLat] = start.location;
		const [endLng, endLat ] = end.location;
		uni.navigateTo({
			url : `/pages/createOrder?slng=${startLng}&slat=${startLat}&elng=${endLng}&elat=${endLat}&s=${start.name}&e=${end.name}`
		})
	}
 /**
  * @Description: 重新选城市
  * @return {*}
  */	
	const handleCity = () =>{
  		uni.navigateTo({url: '/pages/city'});
	}

	const handleSystem = () =>{
		uni.switchTab({url: '/pages/account'});
	}
</script>
<style scoped lang="scss">
	.map-wrapper {
		width: 100%;
		height: calc(100vh - var(--window-bottom) - 275rpx);
	}
	.city,.system{
		position: fixed;
		background: #fff;
		padding: 7rpx 15rpx 10rpx;
		z-index: 9;
		top: calc(var(--window-top) + 30rpx);
		right: 30rpx;
		border-radius: 8rpx;
		box-shadow: 0 3rpx 5rpx 5rpx #ccc;
		font-size: $uni-font-size-sm;
		color: $uni-text-color;
		display: flex;
		align-items: center;
	}
	.city{
		left: 30rpx;
		right: auto;
		&::after{
			content: '';
			display: block;
			border: 10rpx solid #666;
			border-right-color: transparent;
			border-left-color: transparent;
			border-bottom-color: transparent;
			margin-left: 10rpx;
			margin-top: 12rpx;
			border-radius: 4rpx;
		}
	}
</style>