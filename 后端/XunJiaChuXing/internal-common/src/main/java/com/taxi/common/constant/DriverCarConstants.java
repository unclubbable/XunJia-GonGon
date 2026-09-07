package com.taxi.common.constant;


public class DriverCarConstants {
    //司机车辆状态:绑定
    public static int DRIVER_CAR_BIND=1;
    //司机车辆状态:解绑
    public static int DRIVER_CAR_UNBIND=2;

    //司机状态 0有效  1无效
    public static int DRIVER_STATE_VALID=0;
    public static int DRIVER_STATE_INVALID=1;

    //账号是否存在
    public static int DRIVER_EXISTS=0;
    public static int DRIVER_NOT_EXISTS=1;

    //司机工作状态:收车
    public static int DRIVER_WORK_STATUS_STOP=0;
    //司机工作状态:出车
    public static int DRIVER_WORK_STATUS_START=1;
    //司机工作状态:暂停
    public static int DRIVER_WORK_STATUS_SUSPEND=2;
}
