import { createStore } from 'vuex';
import STORAGE_KEY from '../config/storageKey';
import SERVER_CONF from '../config/serverConf'
import gdMapConf from '../config/gdMapConf';

/**
 * 规范化服务端配置：将历史字段 sse 映射为 ws，避免升级后读不到推送地址
 */
function normalizeServerConf(conf) {
	if (!conf || typeof conf !== 'object') {
		return { ...SERVER_CONF };
	}
	const next = { ...conf };
	if (!next.ws && next.sse) {
		next.ws = next.sse;
	}
	return next;
}

const cached = uni.getStorageSync(STORAGE_KEY.serverConf);
const serverConf = cached
	? normalizeServerConf(JSON.parse(cached))
	: { ...SERVER_CONF };

export default createStore({
    state: {
        city : gdMapConf.city,
        token : uni.getStorageSync(STORAGE_KEY.token) || '',
        userInfo : JSON.parse(uni.getStorageSync(STORAGE_KEY.userInfo) || '{}'),
        serverConf,
    },
    mutations: {
        setCity(state, data) {
            state.city = data;
			// uni.setStorageSync(STORAGE_KEY.city, JSON.stringify(data));
        },
		setToken (state, token = ''){
			state.token = token;
			uni.setStorageSync(STORAGE_KEY.token, token);
		},
		setUserInfo (state, userInfo = {}){
			state.userInfo = userInfo;
			uni.setStorageSync(STORAGE_KEY.userInfo, JSON.stringify(userInfo));
		},
        setServerConf (state, config){
            state.serverConf = normalizeServerConf(config);
			uni.setStorageSync(STORAGE_KEY.serverConf, JSON.stringify(state.serverConf));
        }
    }
});
