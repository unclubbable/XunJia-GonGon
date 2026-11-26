"""协查只读 tools"""

from __future__ import annotations

import json
from typing import Any

from langchain_core.tools import tool

from app.clients.java_http import java_get
from app.config import get_settings


def _dump(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, default=str)


def _order_base() -> str:
    return get_settings().java_order_base_url


def _price_base() -> str:
    return get_settings().java_price_base_url


def _driver_base() -> str:
    return get_settings().java_driver_base_url


def _ticket_base() -> str:
    return get_settings().java_ticket_base_url


@tool
def get_order(order_id: int) -> str:
    """查订单详情与费用，多收费/绕路争议时用"""
    return _dump(java_get(_order_base(), "/order/detail", params={"orderId": order_id}))


@tool
def get_price_rule(city_code: str, vehicle_type: str) -> str:
    """按城市+车型查最新计价规则"""
    city = (city_code or "").strip()
    vehicle = (vehicle_type or "").strip()
    if not city or not vehicle:
        return _dump({"ok": False, "error": "param", "message": "city_code 与 vehicle_type 必填"})
    fare_type = f"{city}${vehicle}"
    return _dump(java_get(_price_base(), f"/price-rule/get-newest-version/{fare_type}"))


@tool
def get_payment(order_id: int) -> str:
    """从订单详情取支付相关字段"""
    detail = java_get(_order_base(), "/order/detail", params={"orderId": order_id})
    if not detail.get("ok"):
        return _dump(detail)
    order = detail.get("data") or {}
    if not isinstance(order, dict):
        return _dump({"ok": False, "error": "bad_order", "data": order})
    payment = {
        "order_id": order_id,
        "price": order.get("price"),
        "pay_order_id": order.get("payOrderId") or order.get("pay_order_id"),
        "order_status": order.get("orderStatus") or order.get("order_status"),
        "refund_status": order.get("refundStatus") or order.get("refund_status"),
        "gmt_payment": order.get("gmtPayment") or order.get("gmt_payment"),
        "source": "derived_from_order_detail",
        "note": "平台无独立 get_payment 接口，字段取自订单",
    }
    return _dump({"ok": True, "data": payment})


@tool
def get_refund(order_id: int | None = None, refund_id: int | None = None, page: int = 1, limit: int = 10) -> str:
    """查退款单，优先 refund_id，否则按 order_id"""
    if refund_id is not None:
        return _dump(
            java_get(_ticket_base(), "/ticket/refund/detail", params={"refundId": refund_id})
        )
    if order_id is None:
        return _dump({"ok": False, "error": "param", "message": "order_id 或 refund_id 至少传一个"})
    return _dump(
        java_get(
            _ticket_base(),
            "/ticket/refund/list",
            params={
                "page": max(1, page),
                "limit": max(1, min(limit, 50)),
                "orderId": order_id,
            },
        )
    )


@tool
def get_driver_wallet(driver_id: int, recent_months: int = 3) -> str:
    """查司机近 N 个月钱包月账"""
    months = max(1, min(int(recent_months or 3), 12))
    return _dump(
        java_get(
            _driver_base(),
            f"/driver-user/driver-user-money/{driver_id}/{months}",
        )
    )


@tool
def get_driver_orders(driver_phone: str, page: int = 1, limit: int = 20) -> str:
    """按司机手机号分页查订单"""
    phone = (driver_phone or "").strip()
    if not phone:
        return _dump({"ok": False, "error": "param", "message": "driver_phone 必填"})
    return _dump(
        java_get(
            _order_base(),
            "/order/get-order-list",
            params={"page": max(1, page), "limit": max(1, min(limit, 50)), "phone": phone},
            as_admin=True,
        )
    )


@tool
def get_trip_track(order_id: int) -> str:
    """查订单轨迹点，绕路投诉用"""
    return _dump(
        java_get(
            _order_base(),
            "/order/track",
            params={"orderId": order_id},
            as_admin=True,
        )
    )


@tool
def get_vehicle(driver_id: int) -> str:
    """查司机当前绑车及车辆详情"""
    binding = java_get(
        _driver_base(),
        f"/driver-user/driver_car_binging_relationship/by-driver/{driver_id}",
    )
    if not binding.get("ok"):
        return _dump(binding)
    data = binding.get("data") or {}
    car_id = None
    if isinstance(data, dict):
        car_id = data.get("carId") or data.get("car_id")
    car = None
    if car_id is not None:
        car = java_get(_driver_base(), f"/driver-user/get-car/{car_id}")
    return _dump({"ok": True, "binding": data, "car": car})


@tool
def list_bindable_cars(driver_id: int, page: int = 1, limit: int = 50) -> str:
    """按城市车型筛可绑车辆"""
    driver = java_get(_driver_base(), f"/driver-user/get-driver-info/{driver_id}")
    if not driver.get("ok"):
        return _dump({"ok": False, "step": "get_driver_info", "result": driver})
    info = driver.get("data") or {}
    city = ""
    if isinstance(info, dict):
        city = str(info.get("address") or info.get("driverAddress") or "").strip()
    if not city:
        return _dump({"ok": False, "error": "no_city", "message": "司机无运营城市 address", "driver": info})

    vehicle_types_resp = java_get(_price_base(), f"/price-rule/vehicle-types-by-city/{city}")
    allowed_types: set[str] = set()
    if vehicle_types_resp.get("ok") and isinstance(vehicle_types_resp.get("data"), list):
        allowed_types = {str(x) for x in vehicle_types_resp["data"]}

    cars_resp = java_get(
        _driver_base(),
        "/driver-user/car/list",
        params={"page": max(1, page), "limit": max(1, min(limit, 100)), "address": city},
    )
    bindings_resp = java_get(_driver_base(), "/driver-user/driver_car_binging_relationship/list")
    bound_ids: set[int] = set()
    if bindings_resp.get("ok"):
        rows = bindings_resp.get("data") or []
        if isinstance(rows, list):
            for row in rows:
                if not isinstance(row, dict):
                    continue
                # bindState: 1 绑定中（若字段缺失也保守占用）
                state = row.get("bindState", row.get("bind_state", 1))
                cid = row.get("carId") or row.get("car_id")
                if cid is not None and int(state) == 1:
                    bound_ids.add(int(cid))

    cars_data = cars_resp.get("data")
    car_rows: list[Any] = []
    if isinstance(cars_data, dict):
        car_rows = cars_data.get("records") or cars_data.get("list") or cars_data.get("items") or []
    elif isinstance(cars_data, list):
        car_rows = cars_data

    candidates = []
    for car in car_rows:
        if not isinstance(car, dict):
            continue
        cid = car.get("id") or car.get("cid") or car.get("carId")
        if cid is None or int(cid) in bound_ids:
            continue
        vtype = str(car.get("vehicleType") or car.get("vehicle_type") or "")
        if allowed_types and vtype and vtype not in allowed_types:
            continue
        candidates.append(car)

    return _dump(
        {
            "ok": True,
            "driver_id": driver_id,
            "city": city,
            "allowed_vehicle_types": sorted(allowed_types),
            "bindable_count": len(candidates),
            "bindable_cars": candidates[:30],
            "note": "服务端无按 driverId 的 bindable-cars 免登录接口；此为 Agent 侧近似实现",
        }
    )


@tool
def check_city_price_support(city_code: str, vehicle_type: str) -> str:
    """目标城市是否有该车型计价，改城市工单用"""
    city = (city_code or "").strip()
    vehicle = (vehicle_type or "").strip()
    if not city or not vehicle:
        return _dump({"ok": False, "error": "param", "message": "city_code 与 vehicle_type 必填"})
    return _dump(java_get(_price_base(), f"/price-rule/if-exists/{city}/{vehicle}"))


@tool
def retrieve_policy(query: str, audience: str = "") -> str:
    """检索平台协议片段，audience=passenger|driver"""
    from app.rag.retrieve import retrieve

    q = (query or "").strip()
    if not q:
        return _dump({"ok": False, "error": "param", "message": "query 必填"})
    aud = (audience or "").strip().lower() or None
    if aud not in {"passenger", "driver"}:
        aud = None
    try:
        hits = retrieve(q, top_k=4, audience=aud)
    except Exception as exc:  # noqa: BLE001
        return _dump({"ok": False, "error": "retrieve_failed", "message": str(exc)[:300]})
    return _dump(
        {
            "ok": True,
            "count": len(hits),
            "citations": hits,
            "refused": len(hits) == 0,
            "note": "无命中则勿编造条款，应提示人工核对协议",
        }
    )


# agent.bind_tools / ToolNode 使用的工具列表（顺序不影响路由）
ASSIST_TOOLS = [
    get_order,
    get_price_rule,
    get_driver_wallet,
    get_driver_orders,
    get_trip_track,
    get_vehicle,
    list_bindable_cars,
    check_city_price_support,
    get_payment,
    get_refund,
    retrieve_policy,
]
