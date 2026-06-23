# 网约车管理系统 API 接口文档
## 目录
1. [司机用户管理模块](#1-司机用户管理模块)
2. [司机工作状态模块](#2-司机工作状态模块)
3. [车辆管理模块](#3-车辆管理模块)
4. [司机车辆绑定模块](#4-司机车辆绑定模块)
5. [订单管理模块](#5-订单管理模块)
6. [财务收入模块](#6-财务收入模块)
7. [车辆终端定位模块](#7-车辆终端定位模块)
8. [城市地区字典模块](#8-城市地区字典模块)
9. [计价规则模块](#9-计价规则模块)
10. [数据库对应表](#10-数据库对应表)

---

## 1. 司机用户管理模块
**接口文件**：`../api/driverUser.js`

### 1.1 getDriverUserList（获取全部司机用户信息）
- 请求参数：
  - address：行政区编码（非必须）
  - limit：必须
  - page：必须
  - phone：电话（非必须）
  - status：状态（非必须）
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": {
    "total": 1,
    "items": [
      {
        "id": 1,
        "address": "371100",
        "driverSurname": "张",
        "driverName": "张红",
        "driverPhone": "15069840419",
        "driverGender": 1,
        "driverBirthday": "2020-01-03",
        "driverNation": "汉族",
        "totalOrders": 18,
        "driverContactAddress": "通信地址",
        "licenseId": "机动车驾驶证号",
        "getDriverLicenseDate": "2019-01-05",
        "driverLicenseOn": "2019-01-01",
        "driverLicenseOff": "2025-01-01",
        "taxiDriver": 1,
        "certificateNo": "网络预约出租汽车驾驶员资格证号",
        "networkCarIssueOrganization": "网络预约出租汽车驾驶员发证机构",
        "networkCarIssueDate": "2020-01-02",
        "getNetworkCarProofDate": "2020-01-01",
        "networkCarProofOn": "2020-01-03",
        "networkCarProofOff": "2020-01-03",
        "registerDate": "2020-02-03",
        "commercialType": 1,
        "contractCompany": "合约公司",
        "contractOn": "2022-01-05",
        "contractOff": "2022-01-06",
        "state": 0,
        "gmtCreate": "2026-03-12T13:27:49.000+00:00",
        "gmtModified": "2026-03-24T04:17:42.000+00:00"
      }
    ]
  },
  "ok": true
}
```

### 1.2 createOrUpdateDriverUser（创建或修改司机用户信息）
- 请求参数（根据id字段判断创建或修改）：
```json
{
  "address": "",
  "certificateNo": "",
  "commercialType": 0,
  "contractCompany": "",
  "contractOff": "",
  "contractOn": "",
  "driverBirthday": "",
  "driverContactAddress": "",
  "driverGender": 0,
  "driverLicenseOff": "",
  "driverLicenseOn": "",
  "driverName": "",
  "driverNation": "",
  "driverPhone": "",
  "driverSurname": "",
  "getDriverLicenseDate": "",
  "getNetworkCarProofDate": "",
  "gmtCreate": "",
  "gmtModified": "",
  "id": 0,
  "licenseId": "",
  "networkCarIssueDate": "",
  "networkCarIssueOrganization": "",
  "networkCarProofOff": "",
  "networkCarProofOn": "",
  "registerDate": "",
  "state": 0,
  "taxiDriver": 0,
  "totalOrders": 0
}
```
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

### 1.3 getDriverUserByDriverId（根据DriverId获取司机用户信息）
- 请求参数：DriverId
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": {
    "id": 1,
    "address": "371100",
    "driverSurname": "张",
    "driverName": "张红",
    "driverPhone": "15069840419",
    "driverGender": 1,
    "driverBirthday": "2020-01-03",
    "driverNation": "汉族",
    "totalOrders": 18,
    "driverContactAddress": "通信地址",
    "licenseId": "机动车驾驶证号",
    "getDriverLicenseDate": "2019-01-05",
    "driverLicenseOn": "2019-01-01",
    "driverLicenseOff": "2025-01-01",
    "taxiDriver": 1,
    "certificateNo": "网络预约出租汽车驾驶员资格证号",
    "networkCarIssueOrganization": "网络预约出租汽车驾驶员发证机构",
    "networkCarIssueDate": "2020-01-02",
    "getNetworkCarProofDate": "2020-01-01",
    "networkCarProofOn": "2020-01-03",
    "networkCarProofOff": "2020-01-03",
    "registerDate": "2020-02-03",
    "commercialType": 1,
    "contractCompany": "合约公司",
    "contractOn": "2022-01-05",
    "contractOff": "2022-01-06",
    "state": 0,
    "gmtCreate": "2026-03-12T13:27:49.000+00:00",
    "gmtModified": "2026-03-24T04:17:42.000+00:00"
  },
  "ok": true
}
```

### 1.4 getDicDistrict（获取地区字典信息）
- 请求参数：无
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": [
    {
      "addressCode": "110000",
      "addressName": "北京市",
      "parentAddressCode": "100000",
      "level": 1
    },
    {
      "addressCode": "120000",
      "addressName": "天津市",
      "parentAddressCode": "100000",
      "level": 1
    },
    {
      "addressCode": "130100",
      "addressName": "石家庄市",
      "parentAddressCode": "130000",
      "level": 2
    },
    {
      "addressCode": "130181",
      "addressName": "辛集市",
      "parentAddressCode": "130100",
      "level": 3
    },
    {
      "addressCode": "130183",
      "addressName": "晋州市",
      "parentAddressCode": "130100",
      "level": 3
    },
    {
      "addressCode": "130184",
      "addressName": "新乐市",
      "parentAddressCode": "130100",
      "level": 3
    },
    {
      "addressCode": "130200",
      "addressName": "唐山市",
      "parentAddressCode": "130000",
      "level": 2
    },
    {
      "addressCode": "130281",
      "addressName": "遵化市",
      "parentAddressCode": "130200",
      "level": 3
    },
    {
      "addressCode": "130283",
      "addressName": "迁安市",
      "parentAddressCode": "130200",
      "level": 3
    },
    {
      "addressCode": "130284",
      "addressName": "滦州市",
      "parentAddressCode": "130200",
      "level": 3
    }
  ],
  "ok": true
}
```

---

## 2. 司机工作状态模块
**接口文件**：`../api/workStatus.js`

### 2.1 getWorkStatus（获取全部司机用户工作状态）
- 请求参数：无
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": [
    {
      "id": 1,
      "driverId": 1,
      "workStatus": 0,
      "citycode": "0633",
      "adname": "日照市",
      "gmtCreate": "2023-11-21T07:32:34.000+00:00",
      "gmtModified": "2026-03-24T04:18:25.000+00:00"
    }
  ],
  "ok": true
}
```

### 2.2 changeWorkStatus（修改司机工作状态）
- 请求参数：
  - driverId：Long（Java类型）
  - workStatus：Integer
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

---

## 3. 车辆管理模块
**接口文件**：`../api/car.js`

### 3.1 getCarList（获取全部车辆信息）
- 请求参数：
  - address：行政区编码（车辆注册城市，非必须）
  - limit：必须
  - page：必须
  - vehicleNo：车牌号（非必须）
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": {
    "total": 1,
    "items": [
      {
        "id": 1,
        "address": "110000",
        "vehicleNo": "京A2541",
        "plateColor": "1",
        "seats": 5,
        "brand": "比亚迪",
        "model": "唐      ",
        "vehicleType": "1",
        "ownerName": "王五",
        "vehicleColor": "2",
        "engineId": "AB55487C",
        "vin": "LSDAGDSVSE",
        "certifyDateA": "2023-11-30",
        "fueType": "5",
        "engineDisplace": "1500",
        "transAgency": "北京市交通运输局",
        "transArea": "北京市",
        "transDateStart": "2023-11-15",
        "transDateEnd": "2037-11-20",
        "certifyDateB": "2023-11-07",
        "fixState": "1",
        "nextFixDate": "2025-11-14",
        "checkState": "1",
        "feePrintId": "55487",
        "gpsBrand": "ss",
        "gpsModel": "ss",
        "gpsInstallDate": "2023-11-06",
        "registerDate": "2023-11-22",
        "commercialType": 1,
        "fareType": "110000$1",
        "state": 0,
        "tid": "1866119768",
        "trid": "20",
        "trname": null,
        "gmtCreate": "2026-03-23T07:33:26.000+00:00",
        "gmtModified": "2026-03-23T07:33:26.000+00:00"
      }
    ]
  },
  "ok": true
}
```

### 3.2 createOrUpdateCar（创建修改车辆信息）
- 说明：无则创建，有则修改；根据id是否为null判断；vehicleNo创建时必填
- 请求参数：
```json
{
  "address": "",
  "brand": "",
  "certifyDateA": "",
  "certifyDateB": "",
  "checkState": "",
  "commercialType": 0,
  "engineDisplace": "",
  "engineId": "",
  "fareType": "",
  "feePrintId": "",
  "fixState": "",
  "fueType": "",
  "gmtCreate": "",
  "gmtModified": "",
  "gpsBrand": "",
  "gpsInstallDate": "",
  "gpsModel": "",
  "id": 2,
  "model": "",
  "nextFixDate": "",
  "ownerName": "",
  "plateColor": "",
  "registerDate": "",
  "seats": 0,
  "state": true,
  "transAgency": "",
  "transArea": "",
  "transDateEnd": "",
  "transDateStart": "",
  "vehicleColor": "",
  "vehicleNo": "",
  "vehicleType": "",
  "vin": ""
}
```
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

### 3.3 getCar（获取单个车辆详细信息）
- 请求参数：cid（id值）
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": {
    "id": 1,
    "address": "110000",
    "vehicleNo": "京A2541",
    "plateColor": "1",
    "seats": 5,
    "brand": "比亚迪",
    "model": "唐      ",
    "vehicleType": "1",
    "ownerName": "王五",
    "vehicleColor": "2",
    "engineId": "AB55487C",
    "vin": "LSDAGDSVSE",
    "certifyDateA": "2023-11-30",
    "fueType": "5",
    "engineDisplace": "1500",
    "transAgency": "北京市交通运输局",
    "transArea": "北京市",
    "transDateStart": "2023-11-15",
    "transDateEnd": "2037-11-20",
    "certifyDateB": "2023-11-07",
    "fixState": "1",
    "nextFixDate": "2025-11-14",
    "checkState": "1",
    "feePrintId": "55487",
    "gpsBrand": "ss",
    "gpsModel": "ss",
    "gpsInstallDate": "2023-11-06",
    "registerDate": "2023-11-22",
    "commercialType": 1,
    "fareType": "110000$1",
    "state": false,
    "tid": "1866119768",
    "trid": "20",
    "trname": null,
    "gmtCreate": "2026-03-23T07:33:26.000+00:00",
    "gmtModified": "2026-03-23T07:33:26.000+00:00"
  },
  "ok": true
}
```

### 3.4 deleteCar（删除车辆信息）
- 说明：绑定司机则无法删除
- 请求参数：cid（id值）
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

---

## 4. 司机车辆绑定模块
**接口文件**：`../api/binding.js`

### 4.1 getBindingList（获取全部绑定信息）
- 说明：包含绑定与解绑信息
- 请求参数：无
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": [
    {
      "id": 1,
      "driverId": 1,
      "carId": 1,
      "vehicleNo": "京A2541",
      "bindState": 1,
      "bindingTime": "2023-11-26T18:24:18",
      "unBindingTime": null
    },
    {
      "id": 5,
      "driverId": 2,
      "carId": 2,
      "vehicleNo": "鲁A83fe",
      "bindState": 1,
      "bindingTime": "2026-03-26T14:14:32",
      "unBindingTime": null
    }
  ],
  "ok": true
}
```

### 4.2 binding（绑定司机和车辆）
- 请求参数：
```json
{
  "driverId": 2,
  "carId": 2
}
```
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

### 4.3 unbinding（取消绑定司机和车辆）
- 请求参数：
```json
{
  "carId": 2,
  "driverId": 2
}
```
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": "解绑成功",
  "ok": true
}
```

---

## 5. 订单管理模块
**接口文件**：`../api/order.js`

### 5.1 getOrderList（获取全部订单信息）
- 请求参数：address、limit、page、phone
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": {
    "total": 75,
    "items": [
      {
        "id": 404,
        "passengerId": 1,
        "passengerPhone": "15069840411",
        "driverId": 1,
        "driverPhone": "15069840419",
        "carId": 1,
        "address": "371100",
        "vehicleType": "1",
        "orderTime": "2026-03-24 12:13:57",
        "departTime": "2026-03-24 12:18:01",
        "departure": "山东外国语职业技术大学",
        "depLongitude": "119.532227",
        "depLatitude": "35.470517",
        "destination": "济宁医学院(日照校区)",
        "destLongitude": "119.54137",
        "destLatitude": "35.454992",
        "encrypt": 14,
        "fareType": "110000$2",
        "fareVersion": 1,
        "receiveOrderCarLongitude": "119.533005",
        "receiveOrderCarLatitude": "35.469635",
        "receiveOrderTime": "2026-03-24 12:14:01",
        "licenseId": "机动车驾驶证号",
        "vehicleNo": "京A2541",
        "toPickUpPassengerTime": "2026-03-24 12:14:09",
        "toPickUpPassengerLongitude": "119.533001",
        "toPickUpPassengerLatitude": "35.469636",
        "toPickUpPassengerAddress": "日照市",
        "driverArrivedDepartureTime": "2026-03-24 12:14:12",
        "pickUpPassengerTime": "2026-03-24 12:14:19",
        "pickUpPassengerLongitude": "119.533001",
        "pickUpPassengerLatitude": "35.469636",
        "passengerGetoffTime": "2026-03-24 12:17:40",
        "passengerGetoffLongitude": "87.715921",
        "passengerGetoffLatitude": "43.858228",
        "cancelTime": null,
        "cancelOperator": null,
        "cancelTypeCode": null,
        "driveMile": 10,
        "driveTime": 3,
        "orderStatus": 8,
        "payOrderId": "2026032422001457290508820680",
        "price": 10.03,
        "gmtCreate": "2026-03-24 04:14:00",
        "gmtModified": "2026-03-24 04:17:58"
      }
    ]
  },
  "ok": true
}
```

### 5.2 updateOrder（根据订单id修改订单）
- 请求参数：
```json
{
  "id": 404,
  "passengerId": 1,
  "passengerPhone": "15069840411",
  "driverId": 1,
  "driverPhone": "15069840419",
  "carId": 1,
  "address": "371100",
  "vehicleType": "1",
  "orderTime": "2026-03-24 12:13:57",
  "departTime": "2026-03-24 12:18:01",
  "departure": "山东外国语职业技术",
  "depLongitude": "119.532227",
  "depLatitude": "35.470517",
  "destination": "济宁医学院(日照校区)",
  "destLongitude": "119.54137",
  "destLatitude": "35.454992",
  "encrypt": 14,
  "fareType": "110000$2",
  "fareVersion": 1,
  "receiveOrderCarLongitude": "119.533005",
  "receiveOrderCarLatitude": "35.469635",
  "receiveOrderTime": "2026-03-24 12:14:01",
  "licenseId": "机动车驾驶证号",
  "vehicleNo": "京A2541",
  "toPickUpPassengerTime": "2026-03-24 12:14:09",
  "toPickUpPassengerLongitude": "119.533001",
  "toPickUpPassengerLatitude": "35.469636",
  "toPickUpPassengerAddress": "日照市",
  "driverArrivedDepartureTime": "2026-03-24 12:14:12",
  "pickUpPassengerTime": "2026-03-24 12:14:19",
  "pickUpPassengerLongitude": "119.533001",
  "pickUpPassengerLatitude": "35.469636",
  "passengerGetoffTime": "2026-03-24 12:17:40",
  "passengerGetoffLongitude": "87.715921",
  "passengerGetoffLatitude": "43.858228",
  "cancelTime": null,
  "cancelOperator": null,
  "cancelTypeCode": null,
  "driveMile": 10,
  "driveTime": 3,
  "orderStatus": 8,
  "payOrderId": "2026032422001457290508820680",
  "price": 10.03,
  "gmtCreate": "2026-03-24 04:14:00",
  "gmtModified": "2026-03-24 04:17:58"
}
```
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

---

## 6. 财务收入模块
**接口文件**：`../api/finance.js`

### 6.1 putMoneyById（根据财务报表ID修改司机收入订单表）
- 请求参数：
```json
{
  "id": 13,
  "driverId": 1,
  "year": 2026,
  "month": 1,
  "driverIncome": 80,
  "platformCommission": 20,
  "status": 1,
  "totalOrderAmount": 100
}
```
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": 1,
  "ok": true
}
```

### 6.2 getMoneyList（获取全部司机收入订单表）
- 说明：目前仅1个司机，后续支持多司机多年月
- 请求参数：无
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": [
    {
      "id": 1,
      "driverId": 1,
      "year": 2025,
      "month": 1,
      "driverIncome": 10240,
      "platformCommission": 2560,
      "status": 1,
      "totalOrderAmount": 12800
    },
    {
      "id": 2,
      "driverId": 1,
      "year": 2025,
      "month": 2,
      "driverIncome": 10800,
      "platformCommission": 2700,
      "status": 1,
      "totalOrderAmount": 13500
    },
    {
      "id": 3,
      "driverId": 1,
      "year": 2025,
      "month": 3,
      "driverIncome": 11360,
      "platformCommission": 2840,
      "status": 1,
      "totalOrderAmount": 14200
    },
    {
      "id": 15,
      "driverId": 1,
      "year": 2026,
      "month": 3,
      "driverIncome": 15424.928,
      "platformCommission": 3856.2320000000013,
      "status": 0,
      "totalOrderAmount": 19281.159999999996
    }
  ],
  "ok": true
}
```

### 6.3 getMoneyBydriverIdRecentlyMonth（按司机ID查最近N月收入）
- 请求参数：driverId、RecentlyMonth
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": [
    {
      "id": 13,
      "driverId": 1,
      "year": 2026,
      "month": 1,
      "driverIncome": 80,
      "platformCommission": 20,
      "status": 1,
      "totalOrderAmount": 100
    },
    {
      "id": 14,
      "driverId": 1,
      "year": 2026,
      "month": 2,
      "driverIncome": 14320,
      "platformCommission": 3580,
      "status": 1,
      "totalOrderAmount": 17900
    },
    {
      "id": 15,
      "driverId": 1,
      "year": 2026,
      "month": 3,
      "driverIncome": 15424.928,
      "platformCommission": 3856.2320000000013,
      "status": 0,
      "totalOrderAmount": 19281.159999999996
    }
  ],
  "ok": true
}
```

---

## 7. 车辆终端定位模块
**接口文件**：`../api/user.js`

### 7.1 getTerminalList（获取车辆终端当前最后位置）
- 说明：上线司机当前位置+下线司机最后位置
- 请求参数：无
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": [
    {
      "tid": "1866119768",
      "vehicleNo": "京A2541",
      "locatetime": "16:28:21",
      "location": {
        "latitude": "35.469772",
        "longitude": "119.53294"
      }
    },
    {
      "tid": "1879222808",
      "vehicleNo": "鲁A83fe",
      "locatetime": "08:00:00",
      "location": null
    }
  ],
  "ok": true
}
```

### 7.2 getTerminalByVehicleNo（根据车牌号查询最后位置）
- 请求参数：keyword（车牌号）
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": {
    "tid": "1866119768",
    "vehicleNo": "京A2541",
    "locatetime": "16:28:21",
    "location": {
      "latitude": "35.469772",
      "longitude": "119.53294"
    }
  },
  "ok": true
}
```

---

## 8. 城市地区字典模块
**接口文件**：`../api/city.js`
**说明**：管理最小单位为市

### 8.1 initDicDistrict（初始化地区字典）
- 说明：调用高德API拉取信息更新本地字典；支持行政区名称、citycode、adcode
- 请求参数：keywords
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

### 8.2 deleteDicDistrict（删除地区字典）
- 说明：调用高德API拉取信息删除本地字典；支持行政区名称、citycode、adcode
- 请求参数：keywords
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": "删除成功",
  "ok": true
}
```

### 8.3 getDicDistrictlist（获取省市字典列表）
- 请求参数：无
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": [
    {
      "addressCode": "370000",
      "addressName": "山东省",
      "parentAddressCode": "0",
      "level": 1
    },
    {
      "addressCode": "370100",
      "addressName": "济南市",
      "parentAddressCode": "370000",
      "level": 2
    },
    {
      "addressCode": "370200",
      "addressName": "青岛市",
      "parentAddressCode": "370000",
      "level": 2
    },
    {
      "addressCode": "371100",
      "addressName": "日照市",
      "parentAddressCode": "370000",
      "level": 2
    }
  ],
  "ok": true
}
```

### 8.4 getDicDistrictlistprovince（获取全国省份列表）
- 说明：调用高德接口获取中国全部省级
- 请求参数：无
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": [
    {
      "citycode": [],
      "adcode": "410000",
      "name": "河南省",
      "center": "113.753094,34.767052",
      "level": "province",
      "districts": []
    },
    {
      "citycode": [],
      "adcode": "370000",
      "name": "山东省",
      "center": "117.020725,36.670201",
      "level": "province",
      "districts": []
    }
  ],
  "ok": true
}
```

---

## 9. 计价规则模块
**接口文件**：`../api/rules.js`

### 9.1 getRuleList（获取计价规则列表）
- 说明：目前仅日照市（371100）计价标准
- 请求参数：
  - cityCode：非必填
  - limit：必填
  - page：必填
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": {
    "total": 1,
    "items": [
      {
        "id": 1,
        "cityCode": "371100",
        "vehicleType": "1",
        "startFare": 10,
        "startMile": 3,
        "unitPricePerMile": 1.8,
        "unitPricePerMinute": 0.5,
        "fareVersion": 1,
        "fareType": "110000$2"
      }
    ]
  },
  "ok": true
}
```

### 9.2 addRule（添加计价规则）
- 请求参数：
```json
{
  "cityCode": "371100",
  "vehicleType": "2",
  "startFare": 10,
  "startMile": 3,
  "unitPricePerMile": 1.8,
  "unitPricePerMinute": 0.5
}
```
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

### 9.3 editRule（更新计价规则）
- 说明：根据cityCode+vehicleType修改
- 请求参数：
```json
{
  "cityCode": "371100",
  "vehicleType": "1",
  "startFare": 9,
  "startMile": 3,
  "unitPricePerMile": 1.8,
  "unitPricePerMinute": 0.5
}
```
- 返回格式：
```json
{
  "code": 1,
  "message": "success",
  "data": null,
  "ok": true
}
```

