const base = {
  key: import.meta.env.VITE_AMAP_WEB_KEY || 'YOUR_AMAP_WEB_KEY',
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_JS_CODE || 'YOUR_AMAP_SECURITY_JS_CODE'
}

const modules = import.meta.glob('./amap.local.js', { eager: true })
const localMod = modules['./amap.local.js']
const local = localMod && localMod.default ? localMod.default : {}

export default Object.assign({}, base, local)
