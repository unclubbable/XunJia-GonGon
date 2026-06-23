<template>
    <view class="wrapper">
        <BSseMessage @receiveOrder="handleReceiveOrder"/>
        <BMap ref="mapRef"/>
    </view>
</template>

<script setup>
	import BSseMessage from '../component/BSseMessage.vue';
	import BMap from '../component/BMap.vue';
	import { computed, onMounted,onUnmounted, onBeforeUnmount, provide, ref, watch } from 'vue';
	import { ApiGetCityList } from "../api/city.js";
	import { useStore } from 'vuex';
	const mapRef = ref(null);
	const $store = useStore();
	let point = computed(() => $store.state.point);		//实时更新位置（从index页面中更新，在这里响应）
	let city = computed(()=> $store.state.city);		//刚开始加载默认值
	let orderId = null;
	
	onMounted(() => {
		getLocation();				// 获取用户实际地理位置（修改city的值,调用setLocation调整视野）
		updatalocaltion();			//实时更新位置
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
		// uni.getLocation({
		// 	type: 'gcj02',
		// 	geocode: true,
		// 	success (res) {
		// 		console.log("map地图更新当前位置");
		// 		const {address,longitude,latitude, accuracy} = res;
		// 		const location = {
		// 			"center" : [longitude, latitude],
		// 			"accuracy": accuracy,
		// 		}
		// 		mapRef.value.updateLocationMarker(location); 
				
		
		// 		pointTimer=setTimeout(()=>{
		// 			updatalocaltion()
		// 		}, 6000)
		// 	},
		// 	fail(err) {
		// 	    console.error('获取位置信息失败:', err);
		// 	}
		// });
		if(point != null){
			console.log("map地图从主页响应变量point更新当前位置");
			const location = {
				"center" : [point.value.lng, point.value.lat],
				"accuracy": point.value.accuracy,
			}
			mapRef.value.updateLocationMarker(location); 
			
			pointTimer=setTimeout(()=>{
				updatalocaltion()
			}, 6000)
		}
	}
	
	// websocket跳转到订单详情页，传递订单ID参数
	function handleReceiveOrder(arg){
		orderId = arg.orderId;
		uni.redirectTo({url:`/pages/orderDetail?orderId=${orderId}`});
	}
	
	/**
	 * @Description: 默认定位到当前城市
	 */
	async function getLocation() {
		
	    const {error, result}= await ApiGetCityList();
		uni.getLocation({
			type: 'gcj02',
			geocode: true,
			success (res) {
			  console.log(JSON.stringify(res))
			  const {address,longitude,latitude, accuracy} = res;
			  $store.commit('setCity',{
				adcode : result.find(i => i.citycode === address.cityCode).adcode,
				cityCode: address.cityCode,
				name: address.city,
				center: `${longitude},${latitude}`,
				accuracy: `${accuracy}`,
				locationRes: true
			  });
			  const location = {
			  	"center" : {longitude,latitude},
			  	"accuracy": accuracy,
			  	"locationRes" : true
			  }
			  setLocation(location);
			},
			fail(err) {
			    console.error('获取位置信息失败:', err);
				setLocation();  // 默认北京
			}
		});
		
	}

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
		// 调用地图组件的setLocation方法，更新地图定位
		mapRef.value.setLocation(location);
		// 延迟500ms调用clearDriving，清除地图上的驾车路线
		setTimeout(()=>mapRef.value.clearDriving(), 500);
	}	

</script>

<style lang="scss" scoped>
	.wrapper {
	    width: 100%;
	    height: 100vh;
	}
</style>
