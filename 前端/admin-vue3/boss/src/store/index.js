import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
export default new Vuex.Store({
  state: {
    token: ''
  },
  mutations: {
    setToken (state, token) {
      state.token = token
    },
    resetToken (state) {
      state.token = ''
    }
  },
  actions: {
    
  }
})


/**
1.state共享属性
2. 		$store.共享属性 
3.mutations同步方法
4. 		this.$store.commit(“同步方法”，参数...)
5.action异步方法
6. 		this.$store.dispatch(“异步方法”，参数...)
 */