/*
 * @Description: 司机端接口请求统一封装
 * - 自动携带 Authorization
 * - 统一业务码 / Token 失效处理
 * - 可选防重复提交（header.repeat）
 * 与乘客端结构对齐，便于两端对照维护（项目互相独立，不共享包）
 */

import MsbUniRequest from './msbUniRequest';
import $store from '@/store';
import { _ToAsyncAwait } from '@gykeji/jsutil';
import { ShowToast } from '../utils';
import { getErrorMessage, handleApiError, isTokenError } from '../utils/errorHandler';

/** 业务成功拦截：code===1 返回 data；Token 失效跳转登录 */
const successIntercept = (response, option) => {
	clearRepeat(option);
	if (response.statusCode === 200) {
		const result = response.data;
		if (result.code === 1) {
			return result.data;
		}
		if (isTokenError(result.code)) {
			ShowToast(getErrorMessage(result.code, result.message));
			// 与乘客端统一：redirectTo + 绝对路径，避免 navigateTo 堆栈
			uni.redirectTo({ url: '/pages/auth/login/index' });
			$store.commit('setToken', '');
			return handleApiError(result);
		}
		if (result.code === 0) {
			return result;
		}
		return handleApiError(result);
	}
	return response;
};

/** HTTP 错误拦截（含网关 401） */
const errorIntercept = (error, option) => {
	clearRepeat(option);
	if (error.statusCode === 401 && error.data) {
		const result = typeof error.data === 'string' ? JSON.parse(error.data) : error.data;
		if (isTokenError(result.code)) {
			ShowToast(getErrorMessage(result.code, result.message));
			uni.redirectTo({ url: '/pages/auth/login/index' });
			$store.commit('setToken', '');
		}
		return handleApiError(result);
	}
	if (error.statusCode === 404) {
		error.errMsg = '404 请求地址未找到';
	}
	ShowToast(error.message || error.errMsg || '网络请求失败');
	return { message: error.errMsg || error.message, code: error.statusCode };
};

/** 进行中的请求指纹，用于防重复提交 */
let repeatFlag = [];

const repeatVerify = (option) => {
	const flag = {
		url: option.url,
		method: option.method,
		data: option.data
	};
	if (repeatFlag.includes(JSON.stringify(flag))) {
		return Promise.reject({ message: '请勿频繁操作' });
	}
	repeatFlag.push(JSON.stringify(flag));
	return false;
};

const clearRepeat = (option) => {
	repeatFlag = repeatFlag.filter((i) => {
		return i !== JSON.stringify({
			url: option.url,
			method: option.method,
			data: option.data
		});
	});
};

const Request = new MsbUniRequest();
Request.baseUrl = $store.state.serverConf.other;

Request.use('request', (option) => {
	const token = $store.state.token;
	if (!token && !option.header.notVerifyToken) {
		uni.redirectTo({ url: '/pages/auth/login/index' });
		return Promise.reject({ message: '要先登录才能操作哦~' });
	}
	if (!option.header.notVerifyToken) {
		option.header = { ...option.header, Authorization: token };
	}

	if (option.header.repeat) {
		const isRepeatVerify = repeatVerify(option);
		if (isRepeatVerify) {
			return isRepeatVerify;
		}
	}
	delete option.header.repeat;
	delete option.header.notVerifyToken;
	return option;
});
Request.use('success', successIntercept);
Request.use('error', errorIntercept);

/** 对外统一返回 { error, result } 结构（_ToAsyncAwait） */
const MsbRequest = {
	get: (...args) => _ToAsyncAwait(Request.get(...args)),
	post: (...args) => _ToAsyncAwait(Request.post(...args)),
	put: (...args) => _ToAsyncAwait(Request.put(...args)),
	delete: (...args) => _ToAsyncAwait(Request.delete(...args)),
};

export { MsbRequest };
