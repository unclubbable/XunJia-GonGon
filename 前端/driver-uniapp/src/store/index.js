import { createStore } from 'vuex';
import STORAGE_KEY from '../config/storageKey';
import SERVER_CONF from '../config/serverConf'
import gdMapConf from '../config/gdMapConf';
const serverConf = uni.getStorageSync(STORAGE_KEY.serverConf);
export default createStore({
    state: {
        city : gdMapConf.city,
        token : uni.getStorageSync(STORAGE_KEY.token) || '',
        userInfo : JSON.parse(uni.getStorageSync(STORAGE_KEY.userInfo) || '{}'),
        point: {},
        serverConf : serverConf ? JSON.parse(serverConf) : SERVER_CONF
    },
    mutations: {
        setCity(state, data) {
            state.city = data;
        },
		setToken (state, token = ''){
			state.token = token;
			uni.setStorageSync(STORAGE_KEY.token, token);
		},
		setUserInfo (state, userInfo = {}){
			state.userInfo = userInfo;
			uni.setStorageSync(STORAGE_KEY.userInfo, JSON.stringify(userInfo));
		},
        setPoint(state, point){
            state.point = point;
        },
        setServerConf (state, config){
            state.serverConf = config;
			uni.setStorageSync(STORAGE_KEY.serverConf, JSON.stringify(config));
        }
    }
});