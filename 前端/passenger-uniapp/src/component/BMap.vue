<template>
    <view :eventBus="eventBus" :change:eventBus="renderScript.receiveEvent" id="map-container">
    </view>
</template>
 
<script>
  export default {
	data(){
		return {
			eventBus : {},
            searchFn: null
		}
	},
	computed:{
		city (){return this.$store.state.city},
	},
	methods:{
		setLocation (...args) {
			this.eventBus = { name : 'setLocation', args }
		},
		driving (...args) {
			this.eventBus = { name : 'driving', args }
		},
		markerDepDestPosition(...args){
			this.eventBus = { name : 'markerDepDestPosition', args }
		},
		driverUpdatePosition(...args){
			this.eventBus = { name : 'driverUpdatePosition', args }
		},
		clearDriving (...args) {
			this.eventBus = { name : 'clearDriving', args }
		},
		search (cb, ...args) {
            this.searchFn = cb;
			this.eventBus = { name : 'search', args, city:this.city }
		},
		searchResult (res) {
            this.searchFn(res);
		},
		updateLocationMarker(location) {
		    this.eventBus = { name: 'updateLocationMarker', args: [location] };
		}
		
	}
  };
</script>

<script module="renderScript" lang="renderjs">
	import AMapLoader from '@amap/amap-jsapi-loader';
	import gdMapConf from '../config/gdMapConf';

    window._AMapSecurityConfig = {
      securityJsCode: gdMapConf.securityJsCode,
    }
	window.speed = 1;
	
	let AMap = null
	let map = null
	let driving = null;
	let driverMarker = null;
	let currentLocationMarker = null;  // 当前定位点标记
	let currentLocationCircle = null;  // 当前定位精度圈
	

    export default {
      data() {
        return {
        }
      },
      mounted(){
        AMapLoader.load({
				"key": gdMapConf.key,  // 申请好的Web端开发者Key，首次调用 load 时必填
				"version": "2.0",   // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
				// 需要使用的的插件列表，如比例尺'AMap.Scale'等
				"plugins": ['AMap.Driving','AMap.PlaceSearch','AMap.AutoComplete', 'AMap.Geolocation','AMap.MoveAnimation'],           
				"AMapUI": {             // 是否加载 AMapUI，缺省不加载
					"version": '1.1',   // AMapUI 版本
					"plugins":['overlay/SimpleMarker'],       // 需要加载的 AMapUI ui插件
				},
				"Loca":{                // 是否加载 Loca， 缺省不加载
					"version": '2.0'  // Loca 版本
				}
			}).then((Amap)=>{
				AMap = Amap;
				map = new AMap.Map('map-container',{
					resizeEnable: true,
					zoom: 13 //地图显示的缩放级别
				});
			}).catch((e)=>{
				console.error(e);  //加载错误提示
			}); 
      },
      methods: {
        // 接收逻辑层发送的数据
        receiveEvent(newParams, oldValue, ownerVm, vm) {
            let {name, args} = newParams || {};
            switch (name) {
                case 'setLocation':
                    this.setInitLocation(args[0]);
                    break;
                case 'search':
                    this.mapSearch(newParams.city, ...args);
                    break;
                case 'driving':
                    this.mapDriving(...args);
                    break;
				case 'markerDepDestPosition':
					this.mapMarkerDepDestPosition(...args);
					break;
				case 'driverUpdatePosition':
					this.mapDriverUpdatePosition(...args);
					break;
                case 'clearDriving':
                    this.mapClearDriving(...args);
                    break;
				case 'updateLocationMarker':   
				    this.updateLocationMarker(...args);
			        break;
            }
        },
		
		/**
		 * @param {Object} defaultLng
		 * @param {Object} defaultLat
		 * @@description 高德获取位置服务
		 */
		getLocation(defaultLng,defaultLat){
			// TODO 这里获取当前定位
			if (AMap === undefined || AMap === null || map === undefined || map === null ) {
			    setTimeout(()=> {
			    	this.getLocation(defaultLng,defaultLat);
			    }, 500);
			    return false
			}else{
				AMap.plugin(["AMap.Geolocation"], function () {
					var geolocation = new AMap.Geolocation({
						enableHighAccuracy: true, //是否使用高精度定位，默认:true
						timeout: 10000, //超过10秒后停止定位，默认：无穷大
						maximumAge: 0, //定位结果缓存0毫秒，默认：0
						convert: true, //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
						showButton: true, //显示定位按钮，默认：true
						buttonPosition: 'RT', //定位按钮停靠位置，默认：'LB'，左下角
						buttonOffset: new AMap.Pixel(10, 20), //定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
						showMarker: true, //定位成功后在定位到的位置显示点标记，默认：true
						showCircle: true, //定位成功后用圆圈表示定位精度范围，默认：true
						panToLocation: true, //定位成功后将定位到的位置作为地图中心点，默认：true
						zoomToAccuracy: true, //定位成功后调整地图视野范围使定位位置及精度范围完全显示，默认：true
						useNative: true, //是否使用安卓定位sdk用来进行定位，默认：false
						extensions: 'all' //是否使用扩展插件，默认：'base'
					});
					map.addControl(geolocation);
					geolocation.getCurrentPosition(function (status, result) {
						if (status == 'complete') {
							onComplete(result);
						} else {
							onError(result);
						}
					});
					function onComplete(data) {
						// data是具体的定位信息
						console.log(JSON.stringify(data));
						const lnglat = [data.position.getLng(), data.position.getLat()];
						map.setCenter(lnglat);
					}
					function onError(data) {
						// 定位出错
						console.log('定位失败');
						map.setCenter([defaultLng,defaultLat]);
					}
				});
			}
		},

		/**
		 * @param {Object}
		 * @@description 设置uni.getLocation获取的位置服务
		 */
		setInitLocation(location){
			//判读地图初始化是否完毕
			if(map === null || map === undefined){
				setTimeout(()=> {
					this.setInitLocation(location);
				}, 500);
				return false
			}
			// 移除之前已有的点和圆
			if (currentLocationMarker) {
		        map.remove(currentLocationMarker);
		        currentLocationMarker = null;
		    }
			if (currentLocationCircle) {
		        map.remove(currentLocationCircle);
		        currentLocationCircle = null;
		    }
			// 获取真实位置成功,初始化点
			if(location.locationRes){   
				// 创建点标记
				const marker = new AMap.Marker({
					position: location.center,  // 经度在前，纬度在后
					// 这里可以添加其他样式，如图标等
					icon: new AMap.Icon({
						image: "https://a.amap.com/jsapi/static/image/plugin/point.png",  // 设置图标的图片数据
						size: new AMap.Size(20, 20), 
						imageSize: new AMap.Size(20, 20)
					}),
					offset: new AMap.Pixel(-10, -10)
				});
				
				// 创建圆圈
				const circle = new AMap.Circle({
					center: location.center,
					radius: location.accuracy,
					strokeColor: "#0055ff",
					strokeWeight: 1,
					strokeOpacity: 0.5,
					fillColor: '#1791fc',
					fillOpacity: 0.2
				});
				
				// 添加点标记和圆圈到地图
				marker.setMap(map);
				circle.setMap(map);
				
				// 保存到全局变量
				currentLocationMarker = marker;
		        currentLocationCircle = circle;
				
				// 调整地图视野
				map.setFitView([marker, circle]);	
			}else{
				map.setZoom(13);
				map.setCenter(location.center);
			}
		},
		//实时更新
		updateLocationMarker(location) {
		    if (!map) {
		        setTimeout(() => {
		            this.updateLocationMarker(location);
		        }, 500);
		        return;
		    }
		
		    // 移除现有的点和圆
		    if (currentLocationMarker) {
		        map.remove(currentLocationMarker);
		        currentLocationMarker = null;
		    }
		    if (currentLocationCircle) {
		        map.remove(currentLocationCircle);
		        currentLocationCircle = null;
		    }
		
		    // 如果传入了有效的经纬度，则创建新的点和圆
		    if (location && location.center && location.center.length === 2) {
		        // 创建新点标记
		        const marker = new AMap.Marker({
		            position: location.center,
		            icon: new AMap.Icon({
		                image: "https://a.amap.com/jsapi/static/image/plugin/point.png",
		                size: new AMap.Size(20, 20),
		                imageSize: new AMap.Size(20, 20)
		            }),
		            offset: new AMap.Pixel(-10, -10)
		        });
		        marker.setMap(map);
		        currentLocationMarker = marker;
		
		        // 如果提供了半径，则创建圆圈；否则不创建
		        if (location.accuracy && typeof location.accuracy === 'number') {
		            const circle = new AMap.Circle({
		                center: location.center,
		                radius: location.accuracy,
		                strokeColor: "#0055ff",
		                strokeWeight: 1,
		                strokeOpacity: 0.5,
		                fillColor: '#1791fc',
		                fillOpacity: 0.2
		            });
		            circle.setMap(map);
		            currentLocationCircle = circle;
		        }
		    }
		},
		
		mapSearch(city, str, cb){
		// this.$ownerInstance.callMethod('searchResult', 'xxxxxxsssxx')
			AMap.plugin(["AMap.PlaceSearch"], ()=> {
			//构造地点查询类
				var placeSearch = new AMap.PlaceSearch({
					pageSize: 5, // 单页显示结果条数
					pageIndex: 1, // 页码
					city: city.cityCode || city.citycode, // 兴趣点城市
					citylimit: true,  //是否强制限制在设置的城市内搜索
					// map: map, // 展现结果的地图实例
					// autoFitView: true // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
				});

				//关键字查询
				placeSearch.search(str, (status, result)=>{
					if(result.info === 'OK'){
						// cb && cb(result.poiList);
						this.$ownerInstance.callMethod('searchResult', result.poiList)
					}
				});
			});
			
		},
		
		/**
		 * @@description 清除路线
		 */
		mapClearDriving(){
			if(driving){
				driving.clear()
			}
		},
		
		/**
		 * @param {Object} startLngLat
		 * @param {Object} endLngLat
		 * @@description 绘制驾车路线以及司机位置
		 */
		mapDriving(startLngLat, endLngLat, driverLon=null, driverLat=null){
			if(!AMap || !map){
				setTimeout(()=> {
					this.mapDriving(startLngLat, endLngLat,driverLon, driverLat);
				}, 500);
				return false;
			}
			if(driving){
				driving.clear();
			}else{
				driving = new AMap.Driving({map});
			}
			driving.search(new AMap.LngLat(...startLngLat), new AMap.LngLat(...endLngLat));
			
			if(driverLon==null || driverLat==null){
				return ;
			}
			if(driverMarker){
				map.remove(driverMarker);
			}
		
			// 创建司机点标记
			driverMarker = new AMap.Marker({
				map: map,
				position: [driverLon,driverLat],  // 经度在前，纬度在后
				// 这里可以添加其他样式，如图标等
				icon: new AMap.Icon({
					image: "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png",  // 设置图标的图片数据
					size: new AMap.Size(15,30),
					imageSize: new AMap.Size(15, 30)
				}),
				offset: new AMap.Pixel(-7.5, -15),
				autoRotation: true,
			});
		},
		
		/**
		 * 司机位置更改
		 * @param {Object} newDriverLon
		 * @param {Object} newDriverLat
		 */
		mapDriverUpdatePosition(newDriverLon, newDriverLat){
			if(driverMarker){
				driverMarker.moveTo([newDriverLon, newDriverLat], {
					duration: 5000,
					delay: 0,
					autoRotation: true,
				});
			}else{
				// 创建司机点标记
				driverMarker = new AMap.Marker({
					map: map,
					position: [newDriverLon, newDriverLat],  // 经度在前，纬度在后
					// 这里可以添加其他样式，如图标等
					icon: new AMap.Icon({
						image: "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png",  // 设置图标的图片数据
						size: new AMap.Size(15,30),
						imageSize: new AMap.Size(15, 30)
					}),
					offset: new AMap.Pixel(-7.5, -15),
					autoRotation: true,
				});
			}
			map.setZoom(18);
			map.setCenter([newDriverLon, newDriverLat]);
		},
		
		mapMarkerDepDestPosition(dep,dest){
			if(!AMap || !map){
				setTimeout(()=> {
					this.mapMarkerDepDestPosition(dep,dest);
				}, 500);
				return false;
			}
			// 创建起点标记
			const depMarker = new AMap.Marker({
				map: map,
				position: dep,  // 经度在前，纬度在后
				// 这里可以添加其他样式，如图标等
				icon: new AMap.Icon({
					image: "https://a.amap.com/jsapi/static/image/plugin/marker/start.png",  // 设置图标的图片数据
					size: new AMap.Size(25,30),
					imageSize: new AMap.Size(25, 30)
				}),
				offset: new AMap.Pixel(-12.5, -15)
			});
			// 创建终点标记
			const destMarker = new AMap.Marker({
				map: map,
				position: dest,  // 经度在前，纬度在后
				// 这里可以添加其他样式，如图标等
				icon: new AMap.Icon({
					image: "https://a.amap.com/jsapi/static/image/plugin/marker/end.png",  // 设置图标的图片数据
					size: new AMap.Size(25,30),
					imageSize: new AMap.Size(25, 30)
				}),
				offset: new AMap.Pixel(-12.5, -15)
			});	
			
			map.setFitView([depMarker, destMarker]);	
		}
    }
};
</script>
 
<style scoped="false">
>>> .amap-geolocation{
	top: 15px !important; 
	right: 15px !important;
}

#map-container {
  width: 100%;
  height: 100%;
}

>>> .amap-logo,
>>> .amap-copyright {
  display: none !important;
}

>>> .amap-info-contentContainer {
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 0.2em;
  padding: 1em;
}
>>> .amap-info-contentContainer .info {
  display: flex;
  flex-direction: column;
}
>>> .info__btn {
  margin-top: 4px;
}

#panel {
  position: absolute;
  background-color: white;
  max-height: 90%;
  overflow-y: auto;
  top: 10px;
  right: 10px;
  width: 280px;
}

</style>
 