import { ShowToast } from './index';

/** Token 相关错误码 */
export const TOKEN_ERROR_CODES = [1199, 1198];

/** 参数校验错误码 */
export const VALIDATION_ERROR_CODES = [1700, 1701];

/** 订单相关错误码范围 */
export const ORDER_ERROR_RANGE = { min: 1600, max: 1699 };

/**
 * 根据 code 获取展示文案（可覆盖后端 message）
 */
export function getErrorMessage(code, defaultMessage) {
  const map = {
    1199: '登录已过期，请重新登录',
    1198: '账号身份异常，请重新登录',
    1700: defaultMessage || '请检查输入信息',
    1701: defaultMessage || '参数错误',
    1600: '您有进行中的订单',
    1602: '当前城市暂不提供叫车服务',
    1603: '订单无法取消',
    1604: '订单不存在',
    1608: '附近暂无可用司机',
    1609: '订单状态已变更，请刷新后重试',
    1800: '系统繁忙，请稍后重试',
    1900: '工单不存在',
    1902: '工单状态不允许此操作',
    1903: '无权操作该工单',
    1904: '已有处理中的同类工单',
    1905: '该类型工单必须关联订单',
    1906: '订单与当前用户不匹配',
    1907: '申请内容不完整',
    1908: '工单已被更新，请刷新',
  };
  return map[code] || defaultMessage || '操作失败';
}

/**
 * 统一处理 API 业务错误
 */
export function handleApiError(result, options = {}) {
  const { silent = false } = options;
  const code = result?.code;
  const message = getErrorMessage(code, result?.message);
  if (!silent) {
    ShowToast(message);
  }
  return Promise.reject({ ...result, message });
}

/**
 * 判断是否为 token 错误
 */
export function isTokenError(code) {
  return TOKEN_ERROR_CODES.includes(code);
}
