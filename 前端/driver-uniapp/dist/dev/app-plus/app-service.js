if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue, shared) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_LAUNCH = "onLaunch";
  const ON_LOAD = "onLoad";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return shared.isString(component) ? easycom : component;
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createHook(ON_SHOW);
  const onLaunch = /* @__PURE__ */ createHook(ON_LAUNCH);
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  var _GetVarType = (o) => {
    let typeStr = (Object.prototype.toString.call(o).match(/\[object (.*?)\]/) || [])[1];
    if (typeStr === "Object") {
      const constName = o.constructor.name;
      constName !== "Object" && (typeStr = `${typeStr}:${constName}`);
    } else if (typeStr === "Number") {
      if (!isFinite(o)) {
        if (isNaN(o)) {
          typeStr = "NaN";
        } else {
          typeStr = "Infinity";
        }
      }
    }
    return typeStr;
  };
  var isPhone = (val) => /^1[3-9]\d{9}$/.test(val);
  const _FormatDate = (date, fmt = "yyyy/mm/dd") => {
    const dateType = _GetVarType(date);
    if (dateType === "string") {
      date = date.replace(/\D+/ig, "/");
      let arr = date.split("/");
      if (arr.length > 3) {
        let time = ` ${arr[3]}:${arr[4]}:${arr[5]}`;
        arr.length = 3;
        date = arr.join("/") + time;
      }
    }
    try {
      date = date ? dateType === "date" ? date : new Date(date) : new Date();
    } catch (e) {
      throw new Error("\u4E0D\u80FD\u8BC6\u522B\u7684\u65F6\u95F4\u683C\u5F0F");
    }
    const o = {
      "m+": date.getMonth() + 1,
      "d+": date.getDate(),
      "h+": date.getHours(),
      "i+": date.getMinutes(),
      "s+": date.getSeconds(),
      "q+": Math.floor((date.getMonth() + 3) / 3),
      "l+": date.getMilliseconds()
    };
    if (/(y+)/i.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, date.getFullYear().toString().substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
      if (new RegExp(`(${k})`, "i").test(fmt)) {
        const str = o[k].toString();
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : `0${str}`.substr(str.length - 1));
      }
    }
    return fmt;
  };
  const _ToAsyncAwait = (promise, fromatResult = true) => {
    if (!fromatResult) {
      return promise;
    } else {
      return promise.then((res) => ({ error: null, result: res })).catch((err) => ({ error: err, result: null }));
    }
  };
  var STATUS;
  (function(STATUS2) {
    STATUS2["AWAIT"] = "await";
    STATUS2["PROGRESS"] = "progress;";
    STATUS2["STOP"] = "stop";
    STATUS2["FINISH"] = "finish";
  })(STATUS || (STATUS = {}));
  class MsbUniRequest {
    constructor(option) {
      this.baseUrl = "";
      this.header = {
        repeat: true
      };
      this.hook = {
        request: null,
        success: null,
        error: null
      };
    }
    method(option) {
      option.header = { ...this.header, ...option.header };
      option.url = this.baseUrl ? this.baseUrl + option.url : option.url;
      if (this.hook.request) {
        option = this.hook.request(option);
      }
      if (!option) {
        throw new Error("\u6CA1\u6709\u8BF7\u6C42\u914D\u7F6E\uFF0C\u6216\u662Frequest\u62E6\u622A\u672A\u505Areturn");
      }
      if (option.constructor === Promise) {
        return option;
      }
      return new Promise((resolve, reject) => {
        uni.request({
          ...option,
          success: (res) => {
            const response = res || res[1];
            if (response.statusCode >= 200 && response.statusCode < 400) {
              if (!this.hook.success) {
                resolve(response);
              } else {
                let newRes = this.hook.success(response, option);
                if (newRes && newRes.constructor === Promise) {
                  newRes.then((res2) => {
                    resolve(res2);
                  }, (error) => {
                    reject(error);
                  });
                } else {
                  resolve(newRes);
                }
              }
              return false;
            }
            reject(this.hook.error ? this.hook.error(response, option) : response);
          },
          fail: (error) => {
            reject(this.hook.error ? this.hook.error(error, option) : error);
          }
        });
      });
    }
    use(hookName, cb) {
      this.hook[hookName] = cb;
    }
    get(url2, data, header) {
      return this.method({ method: "GET", url: url2, data, header });
    }
    post(url2, data, header) {
      return this.method({ method: "POST", url: url2, data, header });
    }
    put(url2, data, header) {
      return this.method({ method: "PUT", url: url2, data, header });
    }
    delete(url2, data, header) {
      return this.method({ method: "DELETE", url: url2, data, header });
    }
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  let supported;
  let perf;
  function isPerformanceSupported() {
    var _a;
    if (supported !== void 0) {
      return supported;
    }
    if (typeof window !== "undefined" && window.performance) {
      supported = true;
      perf = window.performance;
    } else if (typeof global !== "undefined" && ((_a = global.perf_hooks) === null || _a === void 0 ? void 0 : _a.performance)) {
      supported = true;
      perf = global.perf_hooks.performance;
    } else {
      supported = false;
    }
    return supported;
  }
  function now() {
    return isPerformanceSupported() ? perf.now() : Date.now();
  }
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = Object.assign({}, defaultSettings);
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        },
        now() {
          return now();
        }
      };
      if (hook) {
        hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
          if (pluginId === this.plugin.id) {
            this.fallbacks.setSettings(value);
          }
        });
      }
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const descriptor = pluginDescriptor;
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && descriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(descriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor: descriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * vuex v4.1.0
   * (c) 2022 Evan You
   * @license MIT
   */
  var storeKey = "store";
  function useStore(key) {
    if (key === void 0)
      key = null;
    return vue.inject(key !== null ? key : storeKey);
  }
  function forEachValue(obj, fn) {
    Object.keys(obj).forEach(function(key) {
      return fn(obj[key], key);
    });
  }
  function isObject$1(obj) {
    return obj !== null && typeof obj === "object";
  }
  function isPromise(val) {
    return val && typeof val.then === "function";
  }
  function assert(condition, msg) {
    if (!condition) {
      throw new Error("[vuex] " + msg);
    }
  }
  function partial(fn, arg) {
    return function() {
      return fn(arg);
    };
  }
  function genericSubscribe(fn, subs, options) {
    if (subs.indexOf(fn) < 0) {
      options && options.prepend ? subs.unshift(fn) : subs.push(fn);
    }
    return function() {
      var i = subs.indexOf(fn);
      if (i > -1) {
        subs.splice(i, 1);
      }
    };
  }
  function resetStore(store2, hot) {
    store2._actions = /* @__PURE__ */ Object.create(null);
    store2._mutations = /* @__PURE__ */ Object.create(null);
    store2._wrappedGetters = /* @__PURE__ */ Object.create(null);
    store2._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    var state = store2.state;
    installModule(store2, state, [], store2._modules.root, true);
    resetStoreState(store2, state, hot);
  }
  function resetStoreState(store2, state, hot) {
    var oldState = store2._state;
    var oldScope = store2._scope;
    store2.getters = {};
    store2._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    var wrappedGetters = store2._wrappedGetters;
    var computedObj = {};
    var computedCache = {};
    var scope = vue.effectScope(true);
    scope.run(function() {
      forEachValue(wrappedGetters, function(fn, key) {
        computedObj[key] = partial(fn, store2);
        computedCache[key] = vue.computed(function() {
          return computedObj[key]();
        });
        Object.defineProperty(store2.getters, key, {
          get: function() {
            return computedCache[key].value;
          },
          enumerable: true
        });
      });
    });
    store2._state = vue.reactive({
      data: state
    });
    store2._scope = scope;
    if (store2.strict) {
      enableStrictMode(store2);
    }
    if (oldState) {
      if (hot) {
        store2._withCommit(function() {
          oldState.data = null;
        });
      }
    }
    if (oldScope) {
      oldScope.stop();
    }
  }
  function installModule(store2, rootState, path, module, hot) {
    var isRoot = !path.length;
    var namespace = store2._modules.getNamespace(path);
    if (module.namespaced) {
      if (store2._modulesNamespaceMap[namespace] && true) {
        console.error("[vuex] duplicate namespace " + namespace + " for the namespaced module " + path.join("/"));
      }
      store2._modulesNamespaceMap[namespace] = module;
    }
    if (!isRoot && !hot) {
      var parentState = getNestedState(rootState, path.slice(0, -1));
      var moduleName = path[path.length - 1];
      store2._withCommit(function() {
        {
          if (moduleName in parentState) {
            console.warn(
              '[vuex] state field "' + moduleName + '" was overridden by a module with the same name at "' + path.join(".") + '"'
            );
          }
        }
        parentState[moduleName] = module.state;
      });
    }
    var local = module.context = makeLocalContext(store2, namespace, path);
    module.forEachMutation(function(mutation, key) {
      var namespacedType = namespace + key;
      registerMutation(store2, namespacedType, mutation, local);
    });
    module.forEachAction(function(action, key) {
      var type = action.root ? key : namespace + key;
      var handler = action.handler || action;
      registerAction(store2, type, handler, local);
    });
    module.forEachGetter(function(getter, key) {
      var namespacedType = namespace + key;
      registerGetter(store2, namespacedType, getter, local);
    });
    module.forEachChild(function(child, key) {
      installModule(store2, rootState, path.concat(key), child, hot);
    });
  }
  function makeLocalContext(store2, namespace, path) {
    var noNamespace = namespace === "";
    var local = {
      dispatch: noNamespace ? store2.dispatch : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._actions[type]) {
            console.error("[vuex] unknown local action type: " + args.type + ", global type: " + type);
            return;
          }
        }
        return store2.dispatch(type, payload);
      },
      commit: noNamespace ? store2.commit : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._mutations[type]) {
            console.error("[vuex] unknown local mutation type: " + args.type + ", global type: " + type);
            return;
          }
        }
        store2.commit(type, payload, options);
      }
    };
    Object.defineProperties(local, {
      getters: {
        get: noNamespace ? function() {
          return store2.getters;
        } : function() {
          return makeLocalGetters(store2, namespace);
        }
      },
      state: {
        get: function() {
          return getNestedState(store2.state, path);
        }
      }
    });
    return local;
  }
  function makeLocalGetters(store2, namespace) {
    if (!store2._makeLocalGettersCache[namespace]) {
      var gettersProxy = {};
      var splitPos = namespace.length;
      Object.keys(store2.getters).forEach(function(type) {
        if (type.slice(0, splitPos) !== namespace) {
          return;
        }
        var localType = type.slice(splitPos);
        Object.defineProperty(gettersProxy, localType, {
          get: function() {
            return store2.getters[type];
          },
          enumerable: true
        });
      });
      store2._makeLocalGettersCache[namespace] = gettersProxy;
    }
    return store2._makeLocalGettersCache[namespace];
  }
  function registerMutation(store2, type, handler, local) {
    var entry = store2._mutations[type] || (store2._mutations[type] = []);
    entry.push(function wrappedMutationHandler(payload) {
      handler.call(store2, local.state, payload);
    });
  }
  function registerAction(store2, type, handler, local) {
    var entry = store2._actions[type] || (store2._actions[type] = []);
    entry.push(function wrappedActionHandler(payload) {
      var res = handler.call(store2, {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store2.getters,
        rootState: store2.state
      }, payload);
      if (!isPromise(res)) {
        res = Promise.resolve(res);
      }
      if (store2._devtoolHook) {
        return res.catch(function(err) {
          store2._devtoolHook.emit("vuex:error", err);
          throw err;
        });
      } else {
        return res;
      }
    });
  }
  function registerGetter(store2, type, rawGetter, local) {
    if (store2._wrappedGetters[type]) {
      {
        console.error("[vuex] duplicate getter key: " + type);
      }
      return;
    }
    store2._wrappedGetters[type] = function wrappedGetter(store3) {
      return rawGetter(
        local.state,
        local.getters,
        store3.state,
        store3.getters
      );
    };
  }
  function enableStrictMode(store2) {
    vue.watch(function() {
      return store2._state.data;
    }, function() {
      {
        assert(store2._committing, "do not mutate vuex store state outside mutation handlers.");
      }
    }, { deep: true, flush: "sync" });
  }
  function getNestedState(state, path) {
    return path.reduce(function(state2, key) {
      return state2[key];
    }, state);
  }
  function unifyObjectStyle(type, payload, options) {
    if (isObject$1(type) && type.type) {
      options = payload;
      payload = type;
      type = type.type;
    }
    {
      assert(typeof type === "string", "expects string as the type, but found " + typeof type + ".");
    }
    return { type, payload, options };
  }
  var LABEL_VUEX_BINDINGS = "vuex bindings";
  var MUTATIONS_LAYER_ID = "vuex:mutations";
  var ACTIONS_LAYER_ID = "vuex:actions";
  var INSPECTOR_ID = "vuex";
  var actionId = 0;
  function addDevtools(app, store2) {
    setupDevtoolsPlugin(
      {
        id: "org.vuejs.vuex",
        app,
        label: "Vuex",
        homepage: "https://next.vuex.vuejs.org/",
        logo: "https://vuejs.org/images/icons/favicon-96x96.png",
        packageName: "vuex",
        componentStateTypes: [LABEL_VUEX_BINDINGS]
      },
      function(api) {
        api.addTimelineLayer({
          id: MUTATIONS_LAYER_ID,
          label: "Vuex Mutations",
          color: COLOR_LIME_500
        });
        api.addTimelineLayer({
          id: ACTIONS_LAYER_ID,
          label: "Vuex Actions",
          color: COLOR_LIME_500
        });
        api.addInspector({
          id: INSPECTOR_ID,
          label: "Vuex",
          icon: "storage",
          treeFilterPlaceholder: "Filter stores..."
        });
        api.on.getInspectorTree(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            if (payload.filter) {
              var nodes = [];
              flattenStoreForInspectorTree(nodes, store2._modules.root, payload.filter, "");
              payload.rootNodes = nodes;
            } else {
              payload.rootNodes = [
                formatStoreForInspectorTree(store2._modules.root, "")
              ];
            }
          }
        });
        api.on.getInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            makeLocalGetters(store2, modulePath);
            payload.state = formatStoreForInspectorState(
              getStoreModule(store2._modules, modulePath),
              modulePath === "root" ? store2.getters : store2._makeLocalGettersCache,
              modulePath
            );
          }
        });
        api.on.editInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            var path = payload.path;
            if (modulePath !== "root") {
              path = modulePath.split("/").filter(Boolean).concat(path);
            }
            store2._withCommit(function() {
              payload.set(store2._state.data, path, payload.state.value);
            });
          }
        });
        store2.subscribe(function(mutation, state) {
          var data = {};
          if (mutation.payload) {
            data.payload = mutation.payload;
          }
          data.state = state;
          api.notifyComponentUpdate();
          api.sendInspectorTree(INSPECTOR_ID);
          api.sendInspectorState(INSPECTOR_ID);
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: Date.now(),
              title: mutation.type,
              data
            }
          });
        });
        store2.subscribeAction({
          before: function(action, state) {
            var data = {};
            if (action.payload) {
              data.payload = action.payload;
            }
            action._id = actionId++;
            action._time = Date.now();
            data.state = state;
            api.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: action._time,
                title: action.type,
                groupId: action._id,
                subtitle: "start",
                data
              }
            });
          },
          after: function(action, state) {
            var data = {};
            var duration = Date.now() - action._time;
            data.duration = {
              _custom: {
                type: "duration",
                display: duration + "ms",
                tooltip: "Action duration",
                value: duration
              }
            };
            if (action.payload) {
              data.payload = action.payload;
            }
            data.state = state;
            api.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: Date.now(),
                title: action.type,
                groupId: action._id,
                subtitle: "end",
                data
              }
            });
          }
        });
      }
    );
  }
  var COLOR_LIME_500 = 8702998;
  var COLOR_DARK = 6710886;
  var COLOR_WHITE = 16777215;
  var TAG_NAMESPACED = {
    label: "namespaced",
    textColor: COLOR_WHITE,
    backgroundColor: COLOR_DARK
  };
  function extractNameFromPath(path) {
    return path && path !== "root" ? path.split("/").slice(-2, -1)[0] : "Root";
  }
  function formatStoreForInspectorTree(module, path) {
    return {
      id: path || "root",
      label: extractNameFromPath(path),
      tags: module.namespaced ? [TAG_NAMESPACED] : [],
      children: Object.keys(module._children).map(
        function(moduleName) {
          return formatStoreForInspectorTree(
            module._children[moduleName],
            path + moduleName + "/"
          );
        }
      )
    };
  }
  function flattenStoreForInspectorTree(result, module, filter, path) {
    if (path.includes(filter)) {
      result.push({
        id: path || "root",
        label: path.endsWith("/") ? path.slice(0, path.length - 1) : path || "Root",
        tags: module.namespaced ? [TAG_NAMESPACED] : []
      });
    }
    Object.keys(module._children).forEach(function(moduleName) {
      flattenStoreForInspectorTree(result, module._children[moduleName], filter, path + moduleName + "/");
    });
  }
  function formatStoreForInspectorState(module, getters, path) {
    getters = path === "root" ? getters : getters[path];
    var gettersKeys = Object.keys(getters);
    var storeState = {
      state: Object.keys(module.state).map(function(key) {
        return {
          key,
          editable: true,
          value: module.state[key]
        };
      })
    };
    if (gettersKeys.length) {
      var tree = transformPathsToObjectTree(getters);
      storeState.getters = Object.keys(tree).map(function(key) {
        return {
          key: key.endsWith("/") ? extractNameFromPath(key) : key,
          editable: false,
          value: canThrow(function() {
            return tree[key];
          })
        };
      });
    }
    return storeState;
  }
  function transformPathsToObjectTree(getters) {
    var result = {};
    Object.keys(getters).forEach(function(key) {
      var path = key.split("/");
      if (path.length > 1) {
        var target = result;
        var leafKey = path.pop();
        path.forEach(function(p) {
          if (!target[p]) {
            target[p] = {
              _custom: {
                value: {},
                display: p,
                tooltip: "Module",
                abstract: true
              }
            };
          }
          target = target[p]._custom.value;
        });
        target[leafKey] = canThrow(function() {
          return getters[key];
        });
      } else {
        result[key] = canThrow(function() {
          return getters[key];
        });
      }
    });
    return result;
  }
  function getStoreModule(moduleMap, path) {
    var names = path.split("/").filter(function(n) {
      return n;
    });
    return names.reduce(
      function(module, moduleName, i) {
        var child = module[moduleName];
        if (!child) {
          throw new Error('Missing module "' + moduleName + '" for path "' + path + '".');
        }
        return i === names.length - 1 ? child : child._children;
      },
      path === "root" ? moduleMap : moduleMap.root._children
    );
  }
  function canThrow(cb) {
    try {
      return cb();
    } catch (e) {
      return e;
    }
  }
  var Module = function Module2(rawModule, runtime) {
    this.runtime = runtime;
    this._children = /* @__PURE__ */ Object.create(null);
    this._rawModule = rawModule;
    var rawState = rawModule.state;
    this.state = (typeof rawState === "function" ? rawState() : rawState) || {};
  };
  var prototypeAccessors$1 = { namespaced: { configurable: true } };
  prototypeAccessors$1.namespaced.get = function() {
    return !!this._rawModule.namespaced;
  };
  Module.prototype.addChild = function addChild(key, module) {
    this._children[key] = module;
  };
  Module.prototype.removeChild = function removeChild(key) {
    delete this._children[key];
  };
  Module.prototype.getChild = function getChild(key) {
    return this._children[key];
  };
  Module.prototype.hasChild = function hasChild(key) {
    return key in this._children;
  };
  Module.prototype.update = function update2(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  };
  Module.prototype.forEachChild = function forEachChild(fn) {
    forEachValue(this._children, fn);
  };
  Module.prototype.forEachGetter = function forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  };
  Module.prototype.forEachAction = function forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  };
  Module.prototype.forEachMutation = function forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  };
  Object.defineProperties(Module.prototype, prototypeAccessors$1);
  var ModuleCollection = function ModuleCollection2(rawRootModule) {
    this.register([], rawRootModule, false);
  };
  ModuleCollection.prototype.get = function get(path) {
    return path.reduce(function(module, key) {
      return module.getChild(key);
    }, this.root);
  };
  ModuleCollection.prototype.getNamespace = function getNamespace(path) {
    var module = this.root;
    return path.reduce(function(namespace, key) {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  };
  ModuleCollection.prototype.update = function update$1(rawRootModule) {
    update([], this.root, rawRootModule);
  };
  ModuleCollection.prototype.register = function register(path, rawModule, runtime) {
    var this$1$1 = this;
    if (runtime === void 0)
      runtime = true;
    {
      assertRawModule(path, rawModule);
    }
    var newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      var parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }
    if (rawModule.modules) {
      forEachValue(rawModule.modules, function(rawChildModule, key) {
        this$1$1.register(path.concat(key), rawChildModule, runtime);
      });
    }
  };
  ModuleCollection.prototype.unregister = function unregister(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    var child = parent.getChild(key);
    if (!child) {
      {
        console.warn(
          "[vuex] trying to unregister module '" + key + "', which is not registered"
        );
      }
      return;
    }
    if (!child.runtime) {
      return;
    }
    parent.removeChild(key);
  };
  ModuleCollection.prototype.isRegistered = function isRegistered(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    if (parent) {
      return parent.hasChild(key);
    }
    return false;
  };
  function update(path, targetModule, newModule) {
    {
      assertRawModule(path, newModule);
    }
    targetModule.update(newModule);
    if (newModule.modules) {
      for (var key in newModule.modules) {
        if (!targetModule.getChild(key)) {
          {
            console.warn(
              "[vuex] trying to add a new module '" + key + "' on hot reloading, manual reload is needed"
            );
          }
          return;
        }
        update(
          path.concat(key),
          targetModule.getChild(key),
          newModule.modules[key]
        );
      }
    }
  }
  var functionAssert = {
    assert: function(value) {
      return typeof value === "function";
    },
    expected: "function"
  };
  var objectAssert = {
    assert: function(value) {
      return typeof value === "function" || typeof value === "object" && typeof value.handler === "function";
    },
    expected: 'function or object with "handler" function'
  };
  var assertTypes = {
    getters: functionAssert,
    mutations: functionAssert,
    actions: objectAssert
  };
  function assertRawModule(path, rawModule) {
    Object.keys(assertTypes).forEach(function(key) {
      if (!rawModule[key]) {
        return;
      }
      var assertOptions = assertTypes[key];
      forEachValue(rawModule[key], function(value, type) {
        assert(
          assertOptions.assert(value),
          makeAssertionMessage(path, key, type, value, assertOptions.expected)
        );
      });
    });
  }
  function makeAssertionMessage(path, key, type, value, expected) {
    var buf = key + " should be " + expected + ' but "' + key + "." + type + '"';
    if (path.length > 0) {
      buf += ' in module "' + path.join(".") + '"';
    }
    buf += " is " + JSON.stringify(value) + ".";
    return buf;
  }
  function createStore(options) {
    return new Store(options);
  }
  var Store = function Store2(options) {
    var this$1$1 = this;
    if (options === void 0)
      options = {};
    {
      assert(typeof Promise !== "undefined", "vuex requires a Promise polyfill in this browser.");
      assert(this instanceof Store2, "store must be called with the new operator.");
    }
    var plugins = options.plugins;
    if (plugins === void 0)
      plugins = [];
    var strict = options.strict;
    if (strict === void 0)
      strict = false;
    var devtools = options.devtools;
    this._committing = false;
    this._actions = /* @__PURE__ */ Object.create(null);
    this._actionSubscribers = [];
    this._mutations = /* @__PURE__ */ Object.create(null);
    this._wrappedGetters = /* @__PURE__ */ Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    this._subscribers = [];
    this._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    this._scope = null;
    this._devtools = devtools;
    var store2 = this;
    var ref = this;
    var dispatch = ref.dispatch;
    var commit = ref.commit;
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store2, type, payload);
    };
    this.commit = function boundCommit(type, payload, options2) {
      return commit.call(store2, type, payload, options2);
    };
    this.strict = strict;
    var state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreState(this, state);
    plugins.forEach(function(plugin) {
      return plugin(this$1$1);
    });
  };
  var prototypeAccessors = { state: { configurable: true } };
  Store.prototype.install = function install(app, injectKey) {
    app.provide(injectKey || storeKey, this);
    app.config.globalProperties.$store = this;
    var useDevtools = this._devtools !== void 0 ? this._devtools : true;
    if (useDevtools) {
      addDevtools(app, this);
    }
  };
  prototypeAccessors.state.get = function() {
    return this._state.data;
  };
  prototypeAccessors.state.set = function(v) {
    {
      assert(false, "use store.replaceState() to explicit replace store state.");
    }
  };
  Store.prototype.commit = function commit(_type, _payload, _options) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload, _options);
    var type = ref.type;
    var payload = ref.payload;
    var options = ref.options;
    var mutation = { type, payload };
    var entry = this._mutations[type];
    if (!entry) {
      {
        console.error("[vuex] unknown mutation type: " + type);
      }
      return;
    }
    this._withCommit(function() {
      entry.forEach(function commitIterator(handler) {
        handler(payload);
      });
    });
    this._subscribers.slice().forEach(function(sub) {
      return sub(mutation, this$1$1.state);
    });
    if (options && options.silent) {
      console.warn(
        "[vuex] mutation type: " + type + ". Silent option has been removed. Use the filter functionality in the vue-devtools"
      );
    }
  };
  Store.prototype.dispatch = function dispatch(_type, _payload) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload);
    var type = ref.type;
    var payload = ref.payload;
    var action = { type, payload };
    var entry = this._actions[type];
    if (!entry) {
      {
        console.error("[vuex] unknown action type: " + type);
      }
      return;
    }
    try {
      this._actionSubscribers.slice().filter(function(sub) {
        return sub.before;
      }).forEach(function(sub) {
        return sub.before(action, this$1$1.state);
      });
    } catch (e) {
      {
        console.warn("[vuex] error in before action subscribers: ");
        console.error(e);
      }
    }
    var result = entry.length > 1 ? Promise.all(entry.map(function(handler) {
      return handler(payload);
    })) : entry[0](payload);
    return new Promise(function(resolve, reject) {
      result.then(function(res) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.after;
          }).forEach(function(sub) {
            return sub.after(action, this$1$1.state);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in after action subscribers: ");
            console.error(e);
          }
        }
        resolve(res);
      }, function(error) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.error;
          }).forEach(function(sub) {
            return sub.error(action, this$1$1.state, error);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in error action subscribers: ");
            console.error(e);
          }
        }
        reject(error);
      });
    });
  };
  Store.prototype.subscribe = function subscribe(fn, options) {
    return genericSubscribe(fn, this._subscribers, options);
  };
  Store.prototype.subscribeAction = function subscribeAction(fn, options) {
    var subs = typeof fn === "function" ? { before: fn } : fn;
    return genericSubscribe(subs, this._actionSubscribers, options);
  };
  Store.prototype.watch = function watch$1(getter, cb, options) {
    var this$1$1 = this;
    {
      assert(typeof getter === "function", "store.watch only accepts a function.");
    }
    return vue.watch(function() {
      return getter(this$1$1.state, this$1$1.getters);
    }, cb, Object.assign({}, options));
  };
  Store.prototype.replaceState = function replaceState(state) {
    var this$1$1 = this;
    this._withCommit(function() {
      this$1$1._state.data = state;
    });
  };
  Store.prototype.registerModule = function registerModule(path, rawModule, options) {
    if (options === void 0)
      options = {};
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
      assert(path.length > 0, "cannot register the root module by using registerModule.");
    }
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path), options.preserveState);
    resetStoreState(this, this.state);
  };
  Store.prototype.unregisterModule = function unregisterModule(path) {
    var this$1$1 = this;
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    this._modules.unregister(path);
    this._withCommit(function() {
      var parentState = getNestedState(this$1$1.state, path.slice(0, -1));
      delete parentState[path[path.length - 1]];
    });
    resetStore(this);
  };
  Store.prototype.hasModule = function hasModule(path) {
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    return this._modules.isRegistered(path);
  };
  Store.prototype.hotUpdate = function hotUpdate(newOptions) {
    this._modules.update(newOptions);
    resetStore(this, true);
  };
  Store.prototype._withCommit = function _withCommit(fn) {
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  };
  Object.defineProperties(Store.prototype, prototypeAccessors);
  const STORAGE_KEY = {
    token: "tk",
    userInfo: "u_i",
    serverConf: "s_c",
    city: "city"
  };
  const url = "8.140.211.132";
  var SERVER_CONF = {
    sse: "ws://" + url + ":9000",
    other: "http://" + url + ":7072"
  };
  var MAP_CON = {
    key: "0edaa4cd99fa0698f5ed111ae9716582",
    securityJsCode: "4d731e5955206b5a4f13202e4b650cf5",
    cityKey: "ded7981f53010974f37a5f6546441b6a",
    cityApiUrl: "https://restapi.amap.com/v3/config/district",
    city: {
      adcode: "110000",
      center: "116.407387,39.904179",
      citycode: "010",
      name: "\u5317\u4EAC\u5E02"
    }
  };
  const serverConf = uni.getStorageSync(STORAGE_KEY.serverConf);
  var store = createStore({
    state: {
      city: MAP_CON.city,
      token: uni.getStorageSync(STORAGE_KEY.token) || "",
      userInfo: JSON.parse(uni.getStorageSync(STORAGE_KEY.userInfo) || "{}"),
      point: {},
      serverConf: serverConf ? JSON.parse(serverConf) : SERVER_CONF
    },
    mutations: {
      setCity(state, data) {
        state.city = data;
      },
      setToken(state, token = "") {
        state.token = token;
        uni.setStorageSync(STORAGE_KEY.token, token);
      },
      setUserInfo(state, userInfo2 = {}) {
        state.userInfo = userInfo2;
        uni.setStorageSync(STORAGE_KEY.userInfo, JSON.stringify(userInfo2));
      },
      setPoint(state, point) {
        state.point = point;
      },
      setServerConf(state, config) {
        state.serverConf = config;
        uni.setStorageSync(STORAGE_KEY.serverConf, JSON.stringify(config));
      }
    }
  });
  const HandleApiError = (error, name) => {
    let result = false;
    if (error) {
      const tip = name ? `${name}\u9519\u8BEF\uFF1A` : "";
      ShowToast(error.message ? `${tip}${error.message}` : `\u8BF7\u6C42\u5931\u8D25: ${error}`);
      result = true;
    }
    return result;
  };
  const ShowToast = (str) => {
    uni.showToast({ title: str, duration: 3e3, icon: "none" });
  };
  const successIntercept = (response, option) => {
    clearRepeat(option);
    if (response.statusCode === 200) {
      const result = response.data;
      if (result.code === 1) {
        return result.data;
      }
      if (result.code === 0) {
        return result;
      }
      if (result.code == 1199) {
        ShowToast(result.message);
        uni.navigateTo({ url: "../pages/login" });
        store.commit("setToken", "");
      }
      return Promise.reject(result);
    }
    return response;
  };
  const errorIntercept = (error, option) => {
    clearRepeat(option);
    if (error.statusCode === 404) {
      error.errMsg = "404 \u8BF7\u6C42\u5730\u5740\u672A\u627E\u5230";
    }
    return { message: error.errMsg, code: error.statusCode };
  };
  let repeatFlag = [];
  const repeatVerify = (option) => {
    let flag = {
      url: option.url,
      method: option.method,
      data: option.data
    };
    if (repeatFlag.includes(JSON.stringify(flag))) {
      return Promise.reject({ message: "\u8BF7\u52FF\u9891\u7E41\u64CD\u4F5C" });
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
  Request.baseUrl = store.state.serverConf.other;
  Request.use("request", (option) => {
    const token = store.state.token;
    if (!token && !option.header.notVerifyToken) {
      uni.redirectTo({
        url: "/pages/login"
      });
      return Promise.reject({ message: "\u8981\u5148\u767B\u5F55\u624D\u80FD\u64CD\u4F5C\u54E6~" });
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
  Request.use("success", successIntercept);
  Request.use("error", errorIntercept);
  const MsbRequest = {
    get: (...args) => _ToAsyncAwait(Request.get(...args)),
    post: (...args) => _ToAsyncAwait(Request.post(...args)),
    put: (...args) => _ToAsyncAwait(Request.put(...args)),
    delete: (...args) => _ToAsyncAwait(Request.delete(...args))
  };
  function ApiGetVerifyCode({ driverPhone }) {
    return MsbRequest.post("/verification-code", { driverPhone }, { notVerifyToken: true });
  }
  function ApiPostVerifyCodeCheck({ driverPhone, verificationCode }) {
    return MsbRequest.post(
      "/verification-code-check",
      { driverPhone, verificationCode },
      { notVerifyToken: true }
    );
  }
  const ApiGetUserCarInfo = () => MsbRequest.get("/driver-car-binding-relationship");
  const ApiGetUserInfo = (driver_id) => MsbRequest.get("/get-driver-info/" + driver_id);
  const ApiPostUpdatePoint = (data = { carId, points }) => MsbRequest.post("/point/upload", data);
  const ApiGetWorkStatus = (params = { driverId }) => MsbRequest.get("/work-status", params);
  const ApiPostUpdateWorkStatus = (data = { driverId, workStatus }) => MsbRequest.post("/driver-user-work-status", data);
  const ApiPostUpdateWorkCity = (data = { driverId, citycode, adname, adcode }) => MsbRequest.post("/driver-user-work-city", data);
  const ApiGetUserMoney = (driverId2, RecentlyMonth) => MsbRequest.get("/driver-user-money/" + driverId2 + "/" + RecentlyMonth);
  const ApiGetCarInfo = (cid) => MsbRequest.get("/get-car/" + cid);
  var _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$q = {
    __name: "login",
    setup(__props) {
      const $store = useStore();
      const token = vue.computed(() => $store.state.token);
      let codeText = vue.ref("\u83B7\u53D6\u9A8C\u8BC1\u7801");
      let codeTimerNum = vue.ref(0);
      let codeTimer = null;
      let isDisableCode = vue.computed(() => codeTimerNum.value !== 0);
      let phone = vue.ref("");
      let code = vue.ref("");
      vue.onMounted(() => {
        if (token.value) {
          uni.redirectTo({ url: "/pages/index" });
        }
      });
      async function handleGetVerifyCode() {
        if (isDisableCode.value || !verifyPhone(phone.value)) {
          return false;
        }
        codeTimerNum.value = 10;
        calcTimer();
        const { error, result } = await ApiGetVerifyCode({ driverPhone: phone.value });
        if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
          ShowToast("\u9A8C\u8BC1\u7801\u53D1\u9001\u6210\u529F");
        } else {
          ShowToast("\u9A8C\u8BC1\u7801\u53D1\u9001\u5931\u8D25,\u8BF7\u68C0\u67E5\u8D26\u53F7\u662F\u5426\u6CE8\u518C,\u82E5\u6CA1\u6CE8\u518C\u8BF7\u8054\u7CFB\u540E\u53F0\u4EBA\u5458\u6CE8\u518C\u65B0\u7528\u6237");
        }
      }
      async function handleLogin() {
        if (!verifyPhone(phone.value)) {
          return false;
        }
        if (!code.value) {
          ShowToast("\u8BF7\u8F93\u5165\u6B63\u786E\u9A8C\u8BC1\u7801");
          return false;
        }
        const res = await ApiPostVerifyCodeCheck({
          driverPhone: phone.value,
          verificationCode: code.value
        });
        formatAppLog("log", "at pages/login.vue:67", "\u7ED3\u679C=", res);
        if (!HandleApiError(res.error) && !res.result.hasOwnProperty("code")) {
          $store.commit("setToken", res.result.accessToken);
          ShowToast("\u767B\u5F55\u6210\u529F");
          uni.redirectTo({ url: "/pages/index" });
        } else {
          ShowToast("\u767B\u5F55\u5931\u8D25");
        }
      }
      function calcTimer() {
        codeTimerNum.value--;
        if (codeTimerNum.value === 0) {
          clearTimeout(codeTimer);
          codeText.value = "\u83B7\u53D6\u9A8C\u8BC1\u7801";
          return false;
        }
        codeText.value = `${codeTimerNum.value}s\u540E\u91CD\u65B0\u83B7\u53D6`;
        setTimeout(() => {
          calcTimer();
        }, 1e3);
      }
      function verifyPhone(phone2) {
        let result = phone2 && isPhone(phone2);
        if (!result) {
          ShowToast("\u8BF7\u586B\u5199\u6B63\u786E\u624B\u673A\u53F7\uFF01");
          result = false;
        }
        return result;
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
          vue.createElementVNode("view", { class: "logo" }, "\u8FC5\u5BB6\u51FA\u884C\uFF0C\u4E00\u8DEF\u7545\u884C"),
          vue.createElementVNode("view", { class: "login" }, [
            vue.withDirectives(vue.createElementVNode("input", {
              placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7",
              type: "number",
              maxlength: "11",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => vue.isRef(phone) ? phone.value = $event : phone = $event),
              class: "login--input"
            }, null, 512), [
              [vue.vModelText, vue.unref(phone)]
            ]),
            vue.createElementVNode("view", { class: "login--code" }, [
              vue.withDirectives(vue.createElementVNode("input", {
                placeholder: "\u9A8C\u8BC1\u7801",
                type: "number",
                maxlength: "6",
                class: "login--input",
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => vue.isRef(code) ? code.value = $event : code = $event)
              }, null, 512), [
                [vue.vModelText, vue.unref(code)]
              ]),
              vue.createElementVNode("text", {
                onClick: handleGetVerifyCode,
                class: vue.normalizeClass(["login--send-btn", { "login--send-btn__disabled": vue.unref(isDisableCode) }])
              }, vue.toDisplayString(vue.unref(codeText)), 3)
            ])
          ]),
          vue.createElementVNode("button", {
            class: "login--btn",
            onClick: handleLogin
          }, "\u767B\u5F55")
        ]);
      };
    }
  };
  var PagesLogin = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["__scopeId", "data-v-c40149d6"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/login.vue"]]);
  const fontData = [
    {
      "font_class": "arrow-down",
      "unicode": "\uE6BE"
    },
    {
      "font_class": "arrow-left",
      "unicode": "\uE6BC"
    },
    {
      "font_class": "arrow-right",
      "unicode": "\uE6BB"
    },
    {
      "font_class": "arrow-up",
      "unicode": "\uE6BD"
    },
    {
      "font_class": "auth",
      "unicode": "\uE6AB"
    },
    {
      "font_class": "auth-filled",
      "unicode": "\uE6CC"
    },
    {
      "font_class": "back",
      "unicode": "\uE6B9"
    },
    {
      "font_class": "bars",
      "unicode": "\uE627"
    },
    {
      "font_class": "calendar",
      "unicode": "\uE6A0"
    },
    {
      "font_class": "calendar-filled",
      "unicode": "\uE6C0"
    },
    {
      "font_class": "camera",
      "unicode": "\uE65A"
    },
    {
      "font_class": "camera-filled",
      "unicode": "\uE658"
    },
    {
      "font_class": "cart",
      "unicode": "\uE631"
    },
    {
      "font_class": "cart-filled",
      "unicode": "\uE6D0"
    },
    {
      "font_class": "chat",
      "unicode": "\uE65D"
    },
    {
      "font_class": "chat-filled",
      "unicode": "\uE659"
    },
    {
      "font_class": "chatboxes",
      "unicode": "\uE696"
    },
    {
      "font_class": "chatboxes-filled",
      "unicode": "\uE692"
    },
    {
      "font_class": "chatbubble",
      "unicode": "\uE697"
    },
    {
      "font_class": "chatbubble-filled",
      "unicode": "\uE694"
    },
    {
      "font_class": "checkbox",
      "unicode": "\uE62B"
    },
    {
      "font_class": "checkbox-filled",
      "unicode": "\uE62C"
    },
    {
      "font_class": "checkmarkempty",
      "unicode": "\uE65C"
    },
    {
      "font_class": "circle",
      "unicode": "\uE65B"
    },
    {
      "font_class": "circle-filled",
      "unicode": "\uE65E"
    },
    {
      "font_class": "clear",
      "unicode": "\uE66D"
    },
    {
      "font_class": "close",
      "unicode": "\uE673"
    },
    {
      "font_class": "closeempty",
      "unicode": "\uE66C"
    },
    {
      "font_class": "cloud-download",
      "unicode": "\uE647"
    },
    {
      "font_class": "cloud-download-filled",
      "unicode": "\uE646"
    },
    {
      "font_class": "cloud-upload",
      "unicode": "\uE645"
    },
    {
      "font_class": "cloud-upload-filled",
      "unicode": "\uE648"
    },
    {
      "font_class": "color",
      "unicode": "\uE6CF"
    },
    {
      "font_class": "color-filled",
      "unicode": "\uE6C9"
    },
    {
      "font_class": "compose",
      "unicode": "\uE67F"
    },
    {
      "font_class": "contact",
      "unicode": "\uE693"
    },
    {
      "font_class": "contact-filled",
      "unicode": "\uE695"
    },
    {
      "font_class": "down",
      "unicode": "\uE6B8"
    },
    {
      "font_class": "bottom",
      "unicode": "\uE6B8"
    },
    {
      "font_class": "download",
      "unicode": "\uE68D"
    },
    {
      "font_class": "download-filled",
      "unicode": "\uE681"
    },
    {
      "font_class": "email",
      "unicode": "\uE69E"
    },
    {
      "font_class": "email-filled",
      "unicode": "\uE69A"
    },
    {
      "font_class": "eye",
      "unicode": "\uE651"
    },
    {
      "font_class": "eye-filled",
      "unicode": "\uE66A"
    },
    {
      "font_class": "eye-slash",
      "unicode": "\uE6B3"
    },
    {
      "font_class": "eye-slash-filled",
      "unicode": "\uE6B4"
    },
    {
      "font_class": "fire",
      "unicode": "\uE6A1"
    },
    {
      "font_class": "fire-filled",
      "unicode": "\uE6C5"
    },
    {
      "font_class": "flag",
      "unicode": "\uE65F"
    },
    {
      "font_class": "flag-filled",
      "unicode": "\uE660"
    },
    {
      "font_class": "folder-add",
      "unicode": "\uE6A9"
    },
    {
      "font_class": "folder-add-filled",
      "unicode": "\uE6C8"
    },
    {
      "font_class": "font",
      "unicode": "\uE6A3"
    },
    {
      "font_class": "forward",
      "unicode": "\uE6BA"
    },
    {
      "font_class": "gear",
      "unicode": "\uE664"
    },
    {
      "font_class": "gear-filled",
      "unicode": "\uE661"
    },
    {
      "font_class": "gift",
      "unicode": "\uE6A4"
    },
    {
      "font_class": "gift-filled",
      "unicode": "\uE6C4"
    },
    {
      "font_class": "hand-down",
      "unicode": "\uE63D"
    },
    {
      "font_class": "hand-down-filled",
      "unicode": "\uE63C"
    },
    {
      "font_class": "hand-up",
      "unicode": "\uE63F"
    },
    {
      "font_class": "hand-up-filled",
      "unicode": "\uE63E"
    },
    {
      "font_class": "headphones",
      "unicode": "\uE630"
    },
    {
      "font_class": "heart",
      "unicode": "\uE639"
    },
    {
      "font_class": "heart-filled",
      "unicode": "\uE641"
    },
    {
      "font_class": "help",
      "unicode": "\uE679"
    },
    {
      "font_class": "help-filled",
      "unicode": "\uE674"
    },
    {
      "font_class": "home",
      "unicode": "\uE662"
    },
    {
      "font_class": "home-filled",
      "unicode": "\uE663"
    },
    {
      "font_class": "image",
      "unicode": "\uE670"
    },
    {
      "font_class": "image-filled",
      "unicode": "\uE678"
    },
    {
      "font_class": "images",
      "unicode": "\uE650"
    },
    {
      "font_class": "images-filled",
      "unicode": "\uE64B"
    },
    {
      "font_class": "info",
      "unicode": "\uE669"
    },
    {
      "font_class": "info-filled",
      "unicode": "\uE649"
    },
    {
      "font_class": "left",
      "unicode": "\uE6B7"
    },
    {
      "font_class": "link",
      "unicode": "\uE6A5"
    },
    {
      "font_class": "list",
      "unicode": "\uE644"
    },
    {
      "font_class": "location",
      "unicode": "\uE6AE"
    },
    {
      "font_class": "location-filled",
      "unicode": "\uE6AF"
    },
    {
      "font_class": "locked",
      "unicode": "\uE66B"
    },
    {
      "font_class": "locked-filled",
      "unicode": "\uE668"
    },
    {
      "font_class": "loop",
      "unicode": "\uE633"
    },
    {
      "font_class": "mail-open",
      "unicode": "\uE643"
    },
    {
      "font_class": "mail-open-filled",
      "unicode": "\uE63A"
    },
    {
      "font_class": "map",
      "unicode": "\uE667"
    },
    {
      "font_class": "map-filled",
      "unicode": "\uE666"
    },
    {
      "font_class": "map-pin",
      "unicode": "\uE6AD"
    },
    {
      "font_class": "map-pin-ellipse",
      "unicode": "\uE6AC"
    },
    {
      "font_class": "medal",
      "unicode": "\uE6A2"
    },
    {
      "font_class": "medal-filled",
      "unicode": "\uE6C3"
    },
    {
      "font_class": "mic",
      "unicode": "\uE671"
    },
    {
      "font_class": "mic-filled",
      "unicode": "\uE677"
    },
    {
      "font_class": "micoff",
      "unicode": "\uE67E"
    },
    {
      "font_class": "micoff-filled",
      "unicode": "\uE6B0"
    },
    {
      "font_class": "minus",
      "unicode": "\uE66F"
    },
    {
      "font_class": "minus-filled",
      "unicode": "\uE67D"
    },
    {
      "font_class": "more",
      "unicode": "\uE64D"
    },
    {
      "font_class": "more-filled",
      "unicode": "\uE64E"
    },
    {
      "font_class": "navigate",
      "unicode": "\uE66E"
    },
    {
      "font_class": "navigate-filled",
      "unicode": "\uE67A"
    },
    {
      "font_class": "notification",
      "unicode": "\uE6A6"
    },
    {
      "font_class": "notification-filled",
      "unicode": "\uE6C1"
    },
    {
      "font_class": "paperclip",
      "unicode": "\uE652"
    },
    {
      "font_class": "paperplane",
      "unicode": "\uE672"
    },
    {
      "font_class": "paperplane-filled",
      "unicode": "\uE675"
    },
    {
      "font_class": "person",
      "unicode": "\uE699"
    },
    {
      "font_class": "person-filled",
      "unicode": "\uE69D"
    },
    {
      "font_class": "personadd",
      "unicode": "\uE69F"
    },
    {
      "font_class": "personadd-filled",
      "unicode": "\uE698"
    },
    {
      "font_class": "personadd-filled-copy",
      "unicode": "\uE6D1"
    },
    {
      "font_class": "phone",
      "unicode": "\uE69C"
    },
    {
      "font_class": "phone-filled",
      "unicode": "\uE69B"
    },
    {
      "font_class": "plus",
      "unicode": "\uE676"
    },
    {
      "font_class": "plus-filled",
      "unicode": "\uE6C7"
    },
    {
      "font_class": "plusempty",
      "unicode": "\uE67B"
    },
    {
      "font_class": "pulldown",
      "unicode": "\uE632"
    },
    {
      "font_class": "pyq",
      "unicode": "\uE682"
    },
    {
      "font_class": "qq",
      "unicode": "\uE680"
    },
    {
      "font_class": "redo",
      "unicode": "\uE64A"
    },
    {
      "font_class": "redo-filled",
      "unicode": "\uE655"
    },
    {
      "font_class": "refresh",
      "unicode": "\uE657"
    },
    {
      "font_class": "refresh-filled",
      "unicode": "\uE656"
    },
    {
      "font_class": "refreshempty",
      "unicode": "\uE6BF"
    },
    {
      "font_class": "reload",
      "unicode": "\uE6B2"
    },
    {
      "font_class": "right",
      "unicode": "\uE6B5"
    },
    {
      "font_class": "scan",
      "unicode": "\uE62A"
    },
    {
      "font_class": "search",
      "unicode": "\uE654"
    },
    {
      "font_class": "settings",
      "unicode": "\uE653"
    },
    {
      "font_class": "settings-filled",
      "unicode": "\uE6CE"
    },
    {
      "font_class": "shop",
      "unicode": "\uE62F"
    },
    {
      "font_class": "shop-filled",
      "unicode": "\uE6CD"
    },
    {
      "font_class": "smallcircle",
      "unicode": "\uE67C"
    },
    {
      "font_class": "smallcircle-filled",
      "unicode": "\uE665"
    },
    {
      "font_class": "sound",
      "unicode": "\uE684"
    },
    {
      "font_class": "sound-filled",
      "unicode": "\uE686"
    },
    {
      "font_class": "spinner-cycle",
      "unicode": "\uE68A"
    },
    {
      "font_class": "staff",
      "unicode": "\uE6A7"
    },
    {
      "font_class": "staff-filled",
      "unicode": "\uE6CB"
    },
    {
      "font_class": "star",
      "unicode": "\uE688"
    },
    {
      "font_class": "star-filled",
      "unicode": "\uE68F"
    },
    {
      "font_class": "starhalf",
      "unicode": "\uE683"
    },
    {
      "font_class": "trash",
      "unicode": "\uE687"
    },
    {
      "font_class": "trash-filled",
      "unicode": "\uE685"
    },
    {
      "font_class": "tune",
      "unicode": "\uE6AA"
    },
    {
      "font_class": "tune-filled",
      "unicode": "\uE6CA"
    },
    {
      "font_class": "undo",
      "unicode": "\uE64F"
    },
    {
      "font_class": "undo-filled",
      "unicode": "\uE64C"
    },
    {
      "font_class": "up",
      "unicode": "\uE6B6"
    },
    {
      "font_class": "top",
      "unicode": "\uE6B6"
    },
    {
      "font_class": "upload",
      "unicode": "\uE690"
    },
    {
      "font_class": "upload-filled",
      "unicode": "\uE68E"
    },
    {
      "font_class": "videocam",
      "unicode": "\uE68C"
    },
    {
      "font_class": "videocam-filled",
      "unicode": "\uE689"
    },
    {
      "font_class": "vip",
      "unicode": "\uE6A8"
    },
    {
      "font_class": "vip-filled",
      "unicode": "\uE6C6"
    },
    {
      "font_class": "wallet",
      "unicode": "\uE6B1"
    },
    {
      "font_class": "wallet-filled",
      "unicode": "\uE6C2"
    },
    {
      "font_class": "weibo",
      "unicode": "\uE68B"
    },
    {
      "font_class": "weixin",
      "unicode": "\uE691"
    }
  ];
  const getVal = (val) => {
    const reg = /^[0-9]*$/g;
    return typeof val === "number" || reg.test(val) ? val + "px" : val;
  };
  const _sfc_main$p = {
    name: "UniIcons",
    emits: ["click"],
    props: {
      type: {
        type: String,
        default: ""
      },
      color: {
        type: String,
        default: "#333333"
      },
      size: {
        type: [Number, String],
        default: 16
      },
      customPrefix: {
        type: String,
        default: ""
      },
      fontFamily: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        icons: fontData
      };
    },
    computed: {
      unicode() {
        let code = this.icons.find((v) => v.font_class === this.type);
        if (code) {
          return code.unicode;
        }
        return "";
      },
      iconSize() {
        return getVal(this.size);
      },
      styleObj() {
        if (this.fontFamily !== "") {
          return `color: ${this.color}; font-size: ${this.iconSize}; font-family: ${this.fontFamily};`;
        }
        return `color: ${this.color}; font-size: ${this.iconSize};`;
      }
    },
    methods: {
      _onClick(e) {
        this.$emit("click", e);
      }
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("text", {
      style: vue.normalizeStyle($options.styleObj),
      class: vue.normalizeClass(["uni-icons", ["uniui-" + $props.type, $props.customPrefix, $props.customPrefix ? $props.type : ""]]),
      onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
    }, [
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
    ], 6);
  }
  var __easycom_1$2 = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["render", _sfc_render$c], ["__scopeId", "data-v-857088fc"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue"]]);
  const _sfc_main$o = {
    __name: "BSseMessage",
    emits: ["receiveOrder"],
    setup(__props, { emit: $emits }) {
      const $store = useStore();
      const userInfo2 = vue.computed(() => $store.state.userInfo);
      let heartTimer = null;
      const isConnected = vue.ref(false);
      vue.watch(() => {
        var _a;
        return (_a = userInfo2.value) == null ? void 0 : _a.driverId;
      }, (driverId2) => {
        if (!driverId2)
          return;
        uni.closeSocket();
        clearInterval(heartTimer);
        const url2 = `${$store.state.serverConf.sse}/connect/${driverId2}/2`;
        formatAppLog("log", "at component/BSseMessage.vue:24", "\u{1F517} \u8FDE\u63A5\u5730\u5740\uFF1A", url2);
        uni.connectSocket({ url: url2 });
        uni.onSocketOpen(() => {
          formatAppLog("log", "at component/BSseMessage.vue:31", "\u2705 WebSocket \u8FDE\u63A5\u6210\u529F");
          isConnected.value = true;
          startHeartBeat();
        });
        uni.onSocketMessage((res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.type === "pong") {
              return;
            }
            formatAppLog("log", "at component/BSseMessage.vue:44", "\u{1F4E9} \u6536\u5230\u8BA2\u5355\uFF1A", data);
            $emits("receiveOrder", data);
          } catch (e) {
          }
        });
        uni.onSocketClose(() => {
          isConnected.value = false;
          setTimeout(() => {
            userInfo2.value.driverId && (() => {
            })();
          }, 3e3);
        });
      }, { immediate: true });
      function startHeartBeat() {
        heartTimer = setInterval(() => {
          if (isConnected.value) {
            uni.sendSocketMessage({
              data: JSON.stringify({ type: "heartBeat" })
            });
          }
        }, 1e4);
      }
      vue.onUnmounted(() => {
        uni.closeSocket();
        clearInterval(heartTimer);
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { style: { "display": "none" } });
      };
    }
  };
  var BSseMessage = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/component/BSseMessage.vue"]]);
  const ApiGetCurrentOrderDetail = ({ orderId: orderId2 }) => MsbRequest.get("/order/current-order-detail", { orderId: orderId2 });
  const ApiPostOrderCancel = ({ orderId: orderId2 }) => MsbRequest.post("/order/cancel", { orderId: orderId2 }, {
    "content-type": "application/x-www-form-urlencoded"
  });
  const ApiGetAllOrderInfo = () => MsbRequest.get("/order/get-all-orders", null, { repeat: false });
  const ApiPostToPickUpPassenger = (data = { orderId, toPickUpPassengerTime, toPickUpPassengerLongitude, toPickUpPassengerLatitude, toPickUpPassengerAddress }) => MsbRequest.post("/order/to-pick-up-passenger", data);
  const ApiPostToDeparture = (data = { orderId }) => MsbRequest.post("/order/arrived-departure", data);
  const ApiPostPickUpPassenger = (data = { orderId, pickUpPassengerLongitude, pickUpPassengerLatitude }) => MsbRequest.post("/order/pick-up-passenger", data);
  const ApiPostPassengerOff = (data = { orderId, passengerGetoffLongitude, passengerGetoffLatitude }) => MsbRequest.post("/order/passenger-getoff", data);
  const ApiPostOrderPayInfo = (data = { orderId, price, passengerId }) => MsbRequest.post("/order/push-pay-info", data, {
    "content-type": "application/x-www-form-urlencoded"
  });
  const ApiGetCurrentOrder = () => MsbRequest.get("/order/current");
  const _sfc_main$n = {
    __name: "index",
    setup(__props) {
      const $store = useStore();
      const userInfo2 = vue.computed(() => $store.state.userInfo);
      let workStatus2 = vue.ref(null);
      let orderId2 = null;
      let iscar = vue.ref(1);
      vue.onMounted(() => {
        getUserCarInfo();
        startTimer();
      });
      vue.onUnmounted(() => {
        if (timer) {
          clearInterval(timer);
          formatAppLog("log", "at pages/index.vue:96", "\u65F6\u95F4\u8BA1\u65F6\u5668\u5DF2\u6E05\u9664");
        }
        if (pointTimer) {
          clearTimeout(pointTimer);
          pointTimer = null;
          formatAppLog("log", "at pages/index.vue:101", "\u5B9A\u4F4D\u5B9A\u65F6\u5668\u5DF2\u6E05\u9664");
        }
      });
      function handleReceiveOrder(arg) {
        formatAppLog("log", "at pages/index.vue:107", "\u6536\u5230\u8BA2\u5355\uFF1A" + arg.orderId);
        orderId2 = arg.orderId;
        uni.redirectTo({ url: `/pages/orderDetail?orderId=${orderId2}` });
      }
      async function getUserCarInfo() {
        const { error, result } = await ApiGetUserCarInfo();
        if (result) {
          $store.commit("setUserInfo", result);
          getWorkStatus();
          getUserProgressOrder();
          updatePoint();
        } else {
          ShowToast("\u53F8\u673A\u6CA1\u6709\u7ED1\u5B9A\u7684\u8F66\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u545815069840419");
          iscar.value = 0;
        }
      }
      let pointTimer = null;
      async function requestLocationPermission() {
        return new Promise((resolve) => {
          uni.getSetting({
            success: (res) => {
              if (res.authSetting["scope.userLocation"]) {
                resolve(true);
              } else {
                uni.authorize({
                  scope: "scope.userLocation",
                  success: () => {
                    resolve(true);
                  },
                  fail: () => {
                  }
                });
              }
            },
            fail: () => {
              resolve(false);
            }
          });
        });
      }
      function updatePoint() {
        requestLocationPermission();
        uni.getLocation({
          type: "gcj02",
          geocode: true,
          success: async (result) => {
            const { error } = await ApiPostUpdatePoint({
              carId: userInfo2.value.carId,
              points: [{
                location: `${result.longitude},${result.latitude}`,
                locatetime: new Date().getTime()
              }]
            });
            if (!error) {
              formatAppLog("log", "at pages/index.vue:180", result);
              $store.commit("setPoint", {
                lng: result.longitude,
                lat: result.latitude,
                name: result.address.city,
                code: result.address.cityCode,
                accuracy: result.accuracy
              });
            }
            pointTimer = setTimeout(() => {
              updatePoint();
            }, 5e3);
          },
          fail(err) {
            uni.showToast({
              title: "\u6CA1\u6709\u5B9A\u4F4D\u6743\u9650",
              duration: 1e4
            });
          }
        });
      }
      async function getWorkStatus() {
        const { error, result } = await ApiGetWorkStatus({
          driverId: userInfo2.value.driverId
        });
        workStatus2.value = result.workStatus;
      }
      async function getUserProgressOrder() {
        const { error, result } = await ApiGetCurrentOrder();
        if (!HandleApiError(error) && result != null && !result.hasOwnProperty("code")) {
          orderId2 = result.id;
          uni.redirectTo({ url: `/pages/orderDetail?orderId=${orderId2}` });
        }
      }
      async function handleWorkStatus(status) {
        const { error, result } = await ApiPostUpdateWorkStatus({
          driverId: userInfo2.value.driverId,
          workStatus: status,
          citycode: $store.state.point.code
        });
        formatAppLog("log", "at pages/index.vue:227", $store.state.point);
        formatAppLog("log", "at pages/index.vue:228", error);
        formatAppLog("log", "at pages/index.vue:229", result);
        formatAppLog("log", "at pages/index.vue:230", status);
        if (result != null && result.code == 0 && status == 1) {
          uni.showToast({ title: "\u65E0\u6CD5\u51FA\u8F66(\u8BF7\u68C0\u67E5\u662F\u5426\u5728\u8FD0\u8425\u57CE\u5E02\u5185)", icon: "none" });
        } else {
          if (!HandleApiError(error)) {
            workStatus2.value = status;
          }
        }
      }
      function goToPage(page) {
        uni.navigateTo({
          url: page
        });
      }
      const currentTime = vue.ref(new Date());
      let timer = null;
      const formattedTime = vue.computed(() => {
        const now2 = currentTime.value;
        const hour = now2.getHours().toString().padStart(2, "0");
        const minute = now2.getMinutes().toString().padStart(2, "0");
        const second = now2.getSeconds().toString().padStart(2, "0");
        const year = now2.getFullYear();
        const month = (now2.getMonth() + 1).toString().padStart(2, "0");
        const day = now2.getDate().toString().padStart(2, "0");
        const weekdays = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
        const weekday = weekdays[now2.getDay()];
        return {
          hour,
          minute,
          second,
          date: `${year}.${month}.${day}`,
          weekday
        };
      });
      const updateTime = () => {
        currentTime.value = new Date();
      };
      const startTimer = () => {
        timer = setInterval(updateTime, 1e3);
      };
      return (_ctx, _cache) => {
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
        return vue.openBlock(), vue.createElementBlock("view", { class: "driver-home" }, [
          vue.createCommentVNode(" \u8BA2\u5355\u6D88\u606F\u7EC4\u4EF6 "),
          vue.createElementVNode("view", { class: "message-wrapper" }, [
            vue.createVNode(BSseMessage, { onReceiveOrder: handleReceiveOrder })
          ]),
          vue.createCommentVNode(" \u52A8\u6001\u65F6\u95F4\u5361\u7247\uFF08\u66FF\u6362\u539F\u7EDF\u8BA1\u5361\u7247\uFF09 "),
          vue.createElementVNode("view", { class: "time-card" }, [
            vue.createElementVNode("view", { class: "clock-wrapper" }, [
              vue.createElementVNode("view", { class: "time-digits" }, [
                vue.createElementVNode("text", { class: "digit" }, vue.toDisplayString(vue.unref(formattedTime).hour), 1),
                vue.createElementVNode("text", { class: "colon" }, ":"),
                vue.createElementVNode("text", { class: "digit" }, vue.toDisplayString(vue.unref(formattedTime).minute), 1),
                vue.createElementVNode("text", { class: "colon" }, ":"),
                vue.createElementVNode("text", { class: "digit second" }, vue.toDisplayString(vue.unref(formattedTime).second), 1)
              ]),
              vue.createElementVNode("view", { class: "date-info" }, [
                vue.createElementVNode("text", { class: "date" }, vue.toDisplayString(vue.unref(formattedTime).date), 1),
                vue.createElementVNode("text", { class: "weekday" }, vue.toDisplayString(vue.unref(formattedTime).weekday), 1)
              ])
            ]),
            vue.createElementVNode("view", { class: "time-decoration" }, [
              vue.createElementVNode("view", { class: "circle" }),
              vue.createElementVNode("view", { class: "circle" }),
              vue.createElementVNode("view", { class: "circle" })
            ])
          ]),
          vue.createCommentVNode(" \u529F\u80FD\u5165\u53E3\u7F51\u683C\uFF08\u4FDD\u6301\u4E0D\u53D8\uFF09 "),
          vue.createElementVNode("view", { class: "grid-menu" }, [
            vue.createElementVNode("view", {
              class: "grid-item",
              onClick: _cache[0] || (_cache[0] = ($event) => goToPage("/pages/map"))
            }, [
              vue.createElementVNode("view", { class: "icon-bg" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "location",
                  size: "32",
                  color: "#3c7e8c"
                })
              ]),
              vue.createElementVNode("text", null, "\u5730\u56FE")
            ]),
            vue.createElementVNode("view", {
              class: "grid-item",
              onClick: _cache[1] || (_cache[1] = ($event) => goToPage("/pages/monsy"))
            }, [
              vue.createElementVNode("view", { class: "icon-bg" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "wallet",
                  size: "32",
                  color: "#3c7e8c"
                })
              ]),
              vue.createElementVNode("text", null, "\u94B1\u5305")
            ]),
            vue.createElementVNode("view", {
              class: "grid-item",
              onClick: _cache[2] || (_cache[2] = ($event) => goToPage("/pages/orderInfo"))
            }, [
              vue.createElementVNode("view", { class: "icon-bg" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "calendar",
                  size: "32",
                  color: "#3c7e8c"
                })
              ]),
              vue.createElementVNode("text", null, "\u8BA2\u5355")
            ]),
            vue.createElementVNode("view", {
              class: "grid-item",
              onClick: _cache[3] || (_cache[3] = ($event) => goToPage("/pages/my"))
            }, [
              vue.createElementVNode("view", { class: "icon-bg" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "person",
                  size: "32",
                  color: "#3c7e8c"
                })
              ]),
              vue.createElementVNode("text", null, "\u4E2A\u4EBA\u4E2D\u5FC3")
            ])
          ]),
          vue.createCommentVNode(" \u51FA\u8F66/\u6536\u8F66\u64CD\u4F5C\u533A\uFF08\u4FDD\u6301\u4E0D\u53D8\uFF09 "),
          vue.withDirectives(vue.createElementVNode("view", { class: "operation" }, [
            vue.unref(workStatus2) === 1 ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
              vue.createElementVNode("view", { class: "desc" }, "\u542C\u5355\u4E2D..."),
              vue.createElementVNode("button", {
                class: "btn btn__warning",
                onClick: _cache[4] || (_cache[4] = ($event) => handleWorkStatus(0))
              }, "\u6536\u8F66")
            ], 64)) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
              vue.createElementVNode("view", { class: "desc" }, "\u52E4\u52B3\u7684\u5C0F\u871C\u8702\uFF0C\u8981\u5F00\u59CB\u5DE5\u4F5C\u4E86\u5417\uFF1F"),
              vue.createElementVNode("button", {
                class: "btn btn__primary",
                onClick: _cache[5] || (_cache[5] = ($event) => handleWorkStatus(1))
              }, "\u51FA\u8F66")
            ], 64))
          ], 512), [
            [vue.vShow, vue.unref(iscar)]
          ])
        ]);
      };
    }
  };
  var PagesIndex = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["__scopeId", "data-v-57509004"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/index.vue"]]);
  const _sfc_main$m = {
    __name: "city",
    setup(__props) {
      const $store = useStore();
      let cityList = vue.ref([]);
      let searchStr = vue.ref("");
      let filterList = vue.computed(() => {
        return cityList.value.filter((i) => i.name.includes(searchStr.value));
      });
      vue.onMounted(() => {
        getCityList();
      });
      const getCityList = () => {
        uni.request({
          method: "GET",
          url: `${MAP_CON.cityApiUrl}?subdistrict=2&key=${MAP_CON.cityKey}`,
          success(res) {
            cityList.value = formatCity2(res.data.districts[0].districts).sort((a, b) => {
              return a.name.localeCompare(b.name, "zh-CN");
            });
          }
        });
      };
      const formatCity2 = (data) => {
        let arr = [];
        data.forEach((i) => {
          if (i.citycode.length) {
            arr.push(i);
          }
          if (i.districts.length) {
            arr = arr.concat(formatCity2(i.districts));
          }
        });
        return arr;
      };
      const handleCity = (item) => {
        $store.commit("setCity", item);
        uni.navigateBack();
      };
      const handleCancel = () => {
        uni.navigateBack();
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "wrapper" }, [
          vue.createElementVNode("view", { class: "search-box" }, [
            vue.withDirectives(vue.createElementVNode("input", {
              class: "search-input",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => vue.isRef(searchStr) ? searchStr.value = $event : searchStr = $event),
              placeholder: "\u8BF7\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22"
            }, null, 512), [
              [vue.vModelText, vue.unref(searchStr)]
            ]),
            vue.createElementVNode("text", { onClick: handleCancel }, "\u53D6\u6D88")
          ]),
          (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(filterList), (item) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "city-item",
              key: item.adcode,
              onClick: ($event) => handleCity(item)
            }, [
              vue.createElementVNode("text", null, vue.toDisplayString(item.name), 1)
            ], 8, ["onClick"]);
          }), 128))
        ]);
      };
    }
  };
  var PagesCity = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["__scopeId", "data-v-1ef7066f"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/city.vue"]]);
  const ORDER_STATUS = {
    orderStart: 1,
    driverReceive: 2,
    driverToPickUp: 3,
    driverArriveStartPoint: 4,
    tripStart: 5,
    tripFinish: 6,
    awaitPay: 7,
    orderFinish: 8,
    orderCancel: 9
  };
  var block0 = (Comp) => {
    (Comp.$renderjs || (Comp.$renderjs = [])).push("renderScript");
    (Comp.$renderjsModules || (Comp.$renderjsModules = {}))["renderScript"] = "31c7d03c";
  };
  const _sfc_main$l = {
    data() {
      return {
        eventBus: {},
        searchFn: null
      };
    },
    computed: {
      city() {
        return this.$store.state.city;
      }
    },
    methods: {
      setLocation(...args) {
        this.eventBus = { name: "setLocation", args };
      },
      driving(...args) {
        this.eventBus = { name: "driving", args };
      },
      markerDepDestPosition(...args) {
        this.eventBus = { name: "markerDepDestPosition", args };
      },
      driverUpdatePosition(...args) {
        this.eventBus = { name: "driverUpdatePosition", args };
      },
      clearDriving(...args) {
        this.eventBus = { name: "clearDriving", args };
      },
      search(cb, ...args) {
        this.searchFn = cb;
        this.eventBus = { name: "search", args, city: this.city };
      },
      searchResult(res) {
        this.searchFn(res);
      },
      updateLocationMarker(location) {
        this.eventBus = { name: "updateLocationMarker", args: [location] };
      }
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      eventBus: $data.eventBus,
      "change:eventBus": _ctx.renderScript.receiveEvent,
      id: "map-container"
    }, null, 8, ["eventBus", "change:eventBus"]);
  }
  if (typeof block0 === "function")
    block0(_sfc_main$l);
  var BMap = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$b], ["__scopeId", "data-v-f804d4b6"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/component/BMap.vue"]]);
  const _sfc_main$k = {
    __name: "orderDetail",
    setup(__props) {
      let $routerQuery = {};
      const $store = useStore();
      const currentPoint = vue.computed(() => $store.state.point);
      let orderDetail = vue.ref({});
      let mapRef = vue.ref(null);
      let remainingTime = vue.ref("");
      onLoad((option) => {
        $routerQuery = option;
      });
      vue.onMounted(() => {
        getCurrentOrderDetail();
      });
      function handleOrdermessage(arg) {
        if (arg.code != null && arg.code == 801) {
          ShowToast("\u53D6\u6D88\u8BA2\u5355\u6210\u529F");
          uni.redirectTo({ url: "/pages/index" });
        }
      }
      const getCurrentOrderDetail = async () => {
        const { orderId: orderId2 } = $routerQuery;
        const { error, result } = await ApiGetCurrentOrderDetail({ orderId: orderId2 });
        if (!result.hasOwnProperty("code") && result != null) {
          orderDetail.value = result;
          const orderTime = new Date(orderDetail.value.receiveOrderTime);
          orderTime.setMinutes(orderTime.getMinutes() + 2);
          const formattedTime = `${String(orderTime.getHours()).padStart(2, "0")}:${String(orderTime.getMinutes()).padStart(2, "0")}:${String(orderTime.getSeconds()).padStart(2, "0")}`;
          remainingTime.value = formattedTime;
          let driverPositionLon = null;
          let driverPositionLat = null;
          switch (result.orderStatus) {
            case ORDER_STATUS.driverReceive:
            case ORDER_STATUS.driverToPickUp:
              driverPositionLon = result.receiveOrderCarLongitude;
              driverPositionLat = result.receiveOrderCarLatitude;
              break;
            case ORDER_STATUS.driverArriveStartPoint:
              driverPositionLon = result.depLongitude;
              driverPositionLat = result.depLatitude;
              break;
            case ORDER_STATUS.tripStart:
              driverPositionLon = result.depLongitude;
              driverPositionLat = result.depLatitude;
              uni.getLocation({
                type: "gcj02",
                geocode: true,
                success(res) {
                  const { longitude, latitude } = res;
                  driverPositionLon = longitude;
                  driverPositionLat = latitude;
                },
                fail(err) {
                  formatAppLog("error", "at pages/orderDetail.vue:272", "\u83B7\u53D6\u4F4D\u7F6E\u4FE1\u606F\u5931\u8D25:", err);
                }
              });
              break;
            case ORDER_STATUS.tripFinish:
              driverPositionLon = result.destLongitude;
              driverPositionLat = result.destLatitude;
              break;
            default:
              driverPositionLon = result.destLongitude;
              driverPositionLat = result.destLatitude;
              break;
          }
          vue.nextTick(() => {
            if (result.orderStatus >= ORDER_STATUS.driverReceive && result.orderStatus <= ORDER_STATUS.tripFinish) {
              mapDrivingAndMakerDriverPosition(
                [result.depLongitude, result.depLatitude],
                [result.destLongitude, result.destLatitude],
                driverPositionLon,
                driverPositionLat
              );
            } else if (result.orderStatus >= ORDER_STATUS.awaitPay) {
              mapMarkerDepAndDestPosition([result.depLongitude, result.depLatitude], [result.destLongitude, result.destLatitude]);
            }
          });
        } else {
          uni.switchTab({ url: "/pages/index/index" });
        }
      };
      const mapMarkerDepAndDestPosition = (dep, dest) => {
        if (!mapRef.value || !mapRef.value.markerDepDestPosition) {
          setTimeout(() => {
            mapMarkerDepAndDestPosition(dep, dest);
          }, 500);
          return false;
        }
        mapRef.value.markerDepDestPosition(dep, dest);
      };
      const mapDrivingAndMakerDriverPosition = (dep, dest, driverLon, driverLat) => {
        if (!mapRef.value || !mapRef.value.driving) {
          setTimeout(() => {
            mapDrivingAndMakerDriverPosition(dep, dest, driverLon, driverLat);
          }, 500);
          return false;
        }
        mapRef.value.driving(dep, dest, driverLon, driverLat);
      };
      const handleCancel = async () => {
        const { error, result } = await ApiPostOrderCancel({ orderId: orderDetail.value.id });
        if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
          ShowToast("\u53D6\u6D88\u8BA2\u5355\u6210\u529F");
          uni.redirectTo({ url: "/pages/index" });
        } else {
          ShowToast(result.message);
        }
      };
      const handleGrabOrder = async (item) => {
        const { error, result } = await ApiPostToPickUpPassenger({
          orderId: orderDetail.value.id,
          toPickUpPassengerTime: _FormatDate(new Date(), "yyyy-mm-dd hh:ii:ss"),
          toPickUpPassengerLongitude: currentPoint.value.lng,
          toPickUpPassengerLatitude: currentPoint.value.lat,
          toPickUpPassengerAddress: currentPoint.value.name
        });
        if (!HandleApiError(error)) {
          orderDetail.value.orderStatus = ORDER_STATUS.driverToPickUp;
        }
      };
      const handleToDeparture = async () => {
        const { error, result } = await ApiPostToDeparture({
          orderId: orderDetail.value.id
        });
        if (!HandleApiError(error)) {
          orderDetail.value.orderStatus = ORDER_STATUS.driverArriveStartPoint;
          mapRef.value.driverUpdatePosition(orderDetail.value.depLongitude, orderDetail.value.depLatitude);
        }
      };
      const handlePickUpPassenger = async () => {
        const { error, result } = await ApiPostPickUpPassenger({
          orderId: orderDetail.value.id,
          pickUpPassengerLongitude: currentPoint.value.lng,
          pickUpPassengerLatitude: currentPoint.value.lat
        });
        if (!HandleApiError(error)) {
          orderDetail.value.orderStatus = ORDER_STATUS.tripStart;
          updatePoint();
        }
      };
      const handleTripFinish = async () => {
        const res = await ApiPostPassengerOff({
          orderId: orderDetail.value.id,
          passengerGetoffLongitude: currentPoint.value.lng,
          passengerGetoffLatitude: currentPoint.value.lat
        });
        let { error } = res;
        if (HandleApiError(error)) {
          return false;
        }
        mapRef.value.driverUpdatePosition(orderDetail.value.destLongitude, orderDetail.value.destLatitude);
        const { error: detailError, result } = await ApiGetCurrentOrderDetail({
          orderId: orderDetail.value.id
        });
        if (HandleApiError(detailError)) {
          return false;
        }
        orderDetail.value = result;
      };
      const handlePay = async () => {
        const { error: er } = await ApiPostOrderPayInfo({
          orderId: orderDetail.value.id,
          price: orderDetail.value.price,
          passengerId: orderDetail.value.passengerId
        });
        if (!HandleApiError(er)) {
          ShowToast("\u6536\u6B3E\u53D1\u8D77\u6210\u529F\uFF0C\u8BF7\u7B49\u5F85\u4E58\u5BA2\u4ED8\u6B3E");
          uni.redirectTo({ url: "/pages/index" });
        }
      };
      const updatePoint = () => {
        uni.getLocation({
          type: "gcj02",
          geocode: true,
          success: async (result) => {
            const { error } = await ApiPostUpdatePoint({
              carId: userInfo.value.carId,
              points: [{
                location: `${result.longitude},${result.latitude}`,
                locatetime: new Date().getTime()
              }]
            });
            if (!error) {
              $store.commit("setPoint", { lng: result.longitude, lat: result.latitude, name: result.city });
              mapRef.value.driverUpdatePosition(result.longitude, result.latitude);
            }
            setTimeout(() => {
              updatePoint();
            }, 5e3);
          }
        });
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("view", { class: "wrapper" }, [
            vue.createVNode(BSseMessage, { onReceiveOrder: handleOrdermessage }),
            vue.createVNode(BMap, {
              ref_key: "mapRef",
              ref: mapRef
            }, null, 512)
          ]),
          vue.createElementVNode("view", { class: "operation" }, [
            vue.createCommentVNode(" \u884C\u7A0B\u4E2D "),
            vue.unref(orderDetail).orderStatus >= vue.unref(ORDER_STATUS).driverReceive && vue.unref(orderDetail).orderStatus <= vue.unref(ORDER_STATUS).tripFinish ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
              vue.createCommentVNode(' <BSseMessage @receiveMsg="handleReceiveMsg"/> '),
              vue.createElementVNode("view", null, [
                vue.createElementVNode("view", { class: "tips" }, [
                  vue.createElementVNode("view", { class: "order_tips" }, [
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverReceive ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, "\u5DF2\u63A5\u5355")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverToPickUp ? (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, "\u53BB\u63A5\u4E58\u5BA2")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverArriveStartPoint ? (vue.openBlock(), vue.createElementBlock("text", { key: 2 }, "\u5230\u8FBE\u8D77\u70B9")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).tripStart ? (vue.openBlock(), vue.createElementBlock("text", { key: 3 }, "\u670D\u52A1\u4E2D")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).tripFinish ? (vue.openBlock(), vue.createElementBlock("text", { key: 4 }, "\u884C\u7A0B\u5DF2\u5B8C\u6210\uFF0C\u8BF7\u53D1\u8D77\u6536\u6B3E")) : vue.createCommentVNode("v-if", true)
                  ]),
                  vue.createElementVNode("view", { class: "cancel_tips" }, [
                    vue.unref(remainingTime) && vue.unref(orderDetail).orderStatus < vue.unref(ORDER_STATUS).tripStart ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, [
                      vue.createTextVNode(" \u82E5\u60A8\u4E0D\u63A5\u6B64\u5355\uFF0C\u53EF\u5728"),
                      vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString(vue.unref(remainingTime)), 1),
                      vue.createTextVNode("\u4E4B\u524D\u514D\u8D39\u53D6\u6D88 ")
                    ])) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus >= vue.unref(ORDER_STATUS).tripStart ? (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, " \u8BA2\u5355\u5DF2\u65E0\u6CD5\u53D6\u6D88\uFF0C\u5982\u9700\u505C\u6B62\u8BF7\u76F4\u63A5\u70B9\u51FB\u5230\u8FBE ")) : vue.createCommentVNode("v-if", true)
                  ])
                ]),
                vue.createCommentVNode(" \u4E58\u5BA2\u4FE1\u606F "),
                vue.createElementVNode("view", { class: "passenger-info" }, [
                  vue.createElementVNode("view", { class: "info-left" }, [
                    vue.unref(orderDetail).passengerSurname ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 0,
                      style: { "margin-right": "10px" }
                    }, vue.toDisplayString(vue.unref(orderDetail).passengerSurname) + "\u5148\u751F", 1)) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).passengerPhone ? (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, vue.toDisplayString(vue.unref(orderDetail).passengerPhone), 1)) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).tripFinish ? (vue.openBlock(), vue.createElementBlock("view", { key: 2 }, [
                      vue.createElementVNode("view", { class: "driver-info" }, [
                        vue.createElementVNode("view", { class: "driveMile" }, [
                          vue.createElementVNode("text", null, "\u8DEF\u7A0B\uFF1A"),
                          vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString((vue.unref(orderDetail).driveMile / 1e3).toFixed(2)), 1),
                          vue.createElementVNode("text", null, " \u5343\u7C73")
                        ]),
                        vue.createElementVNode("view", { class: "driveTime" }, [
                          vue.createElementVNode("text", null, "\u9A7E\u8F66\u65F6\u95F4\uFF1A"),
                          vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString(vue.unref(orderDetail).driveTime), 1),
                          vue.createElementVNode("text", null, " \u5206\u949F")
                        ])
                      ])
                    ])) : (vue.openBlock(), vue.createElementBlock("view", {
                      key: 3,
                      class: "route"
                    }, [
                      vue.createElementVNode("view", { class: "start" }, [
                        vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).departure), 1)
                      ]),
                      vue.createElementVNode("view", { class: "end" }, [
                        vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).destination), 1)
                      ])
                    ]))
                  ]),
                  vue.createElementVNode("view", { class: "info-right" }, [
                    vue.createElementVNode("image", {
                      class: "avatar",
                      src: "/static/default-avatar.png",
                      mode: "aspectFill"
                    })
                  ])
                ]),
                vue.createElementVNode("view", { class: "btn-content" }, [
                  vue.createElementVNode("view", { style: { "width": "45%" } }, [
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverReceive ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 0,
                      class: "btn",
                      onClick: handleGrabOrder
                    }, "\u53BB\u63A5\u4E58\u5BA2")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverToPickUp ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 1,
                      class: "btn",
                      onClick: handleToDeparture
                    }, "\u5230\u8FBE\u8D77\u70B9")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverArriveStartPoint ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 2,
                      class: "btn",
                      onClick: handlePickUpPassenger
                    }, "\u63A5\u5230\u4E58\u5BA2")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).tripStart ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 3,
                      class: "btn",
                      onClick: handleTripFinish
                    }, "\u5230\u8FBE\u76EE\u7684\u5730")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).tripFinish ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 4,
                      class: "btn",
                      onClick: handlePay
                    }, "\uFFE5" + vue.toDisplayString(vue.unref(orderDetail).price) + " \u53D1\u8D77\u6536\u6B3E", 1)) : vue.createCommentVNode("v-if", true)
                  ]),
                  vue.createElementVNode("view", { style: { "width": "45%" } }, [
                    vue.createCommentVNode(" \u53D6\u6D88\u8BA2\u5355\u6309\u94AE "),
                    vue.createElementVNode("button", {
                      onClick: handleCancel,
                      class: "btn btn_cancel"
                    }, "\u53D6\u6D88\u8BA2\u5355")
                  ])
                ])
              ])
            ], 64)) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" \u5DF2\u5B8C\u6210 "),
            vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).orderFinish ? (vue.openBlock(), vue.createElementBlock("view", { key: 1 }, [
              vue.createElementVNode("view", { class: "desc" }, [
                vue.createElementVNode("text", null, "\u60A8\u7684\u884C\u7A0B\u5DF2\u987A\u5229\u7ED3\u675F")
              ]),
              vue.createElementVNode("view", { class: "passenger-info" }, [
                vue.createElementVNode("view", { class: "info-left" }, [
                  vue.unref(orderDetail).passengerSurname ? (vue.openBlock(), vue.createElementBlock("text", {
                    key: 0,
                    style: { "margin-right": "10px" }
                  }, vue.toDisplayString(vue.unref(orderDetail).passengerSurname) + "\u5148\u751F", 1)) : vue.createCommentVNode("v-if", true),
                  vue.unref(orderDetail).passengerPhone ? (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, vue.toDisplayString(vue.unref(orderDetail).passengerPhone), 1)) : vue.createCommentVNode("v-if", true),
                  vue.createElementVNode("view", {
                    class: "route",
                    style: { "margin-top": "10px" }
                  }, [
                    vue.createElementVNode("view", { class: "start" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).departure), 1)
                    ]),
                    vue.createElementVNode("view", { class: "end" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).destination), 1)
                    ])
                  ])
                ]),
                vue.createElementVNode("view", { class: "info-right" }, [
                  vue.createElementVNode("image", {
                    class: "avatar",
                    src: "/static/default-avatar.png",
                    mode: "aspectFill"
                  })
                ])
              ]),
              vue.createElementVNode("view", { class: "route-info" }, [
                vue.createElementVNode("view", { class: "route-info-left" }, [
                  vue.createElementVNode("view", { class: "driveMile" }, [
                    vue.createElementVNode("text", null, "\u8DEF\u7A0B\uFF1A"),
                    vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString((vue.unref(orderDetail).driveMile / 1e3).toFixed(2)), 1),
                    vue.createElementVNode("text", null, " \u5343\u7C73")
                  ]),
                  vue.createElementVNode("view", { class: "driveTime" }, [
                    vue.createElementVNode("text", null, "\u9A7E\u8F66\u65F6\u95F4\uFF1A"),
                    vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString(vue.unref(orderDetail).driveTime), 1),
                    vue.createElementVNode("text", null, " \u5206\u949F")
                  ])
                ]),
                vue.createElementVNode("view", { class: "price" }, [
                  vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString(vue.unref(orderDetail).price), 1),
                  vue.createElementVNode("text", null, " \u5143")
                ])
              ])
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" \u5F85\u652F\u4ED8 "),
            vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).awaitPay ? (vue.openBlock(), vue.createElementBlock("view", { key: 2 }, [
              vue.createElementVNode("view", { class: "desc" }, [
                vue.createElementVNode("text", null, "\u60A8\u7684\u884C\u7A0B\u5DF2\u987A\u5229\u7ED3\u675F,\u8BF7\u7B49\u5F85\u4E58\u5BA2\u4ED8\u6B3E")
              ]),
              vue.createElementVNode("view", { class: "passenger-info" }, [
                vue.createElementVNode("view", { class: "info-left" }, [
                  vue.unref(orderDetail).passengerSurname ? (vue.openBlock(), vue.createElementBlock("text", {
                    key: 0,
                    style: { "margin-right": "10px" }
                  }, vue.toDisplayString(vue.unref(orderDetail).passengerSurname) + "\u5148\u751F", 1)) : vue.createCommentVNode("v-if", true),
                  vue.unref(orderDetail).passengerPhone ? (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, vue.toDisplayString(vue.unref(orderDetail).passengerPhone), 1)) : vue.createCommentVNode("v-if", true),
                  vue.createElementVNode("view", {
                    class: "route",
                    style: { "margin-top": "10px" }
                  }, [
                    vue.createElementVNode("view", { class: "start" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).departure), 1)
                    ]),
                    vue.createElementVNode("view", { class: "end" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).destination), 1)
                    ])
                  ])
                ]),
                vue.createElementVNode("view", { class: "info-right" }, [
                  vue.createElementVNode("image", {
                    class: "avatar",
                    src: "/static/default-avatar.png",
                    mode: "aspectFill"
                  })
                ])
              ]),
              vue.createElementVNode("view", { class: "route-info" }, [
                vue.createElementVNode("view", { class: "route-info-left" }, [
                  vue.createElementVNode("view", { class: "driveMile" }, [
                    vue.createElementVNode("text", null, "\u8DEF\u7A0B\uFF1A"),
                    vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString((vue.unref(orderDetail).driveMile / 1e3).toFixed(2)), 1),
                    vue.createElementVNode("text", null, " \u5343\u7C73")
                  ]),
                  vue.createElementVNode("view", { class: "driveTime" }, [
                    vue.createElementVNode("text", null, "\u9A7E\u8F66\u65F6\u95F4\uFF1A"),
                    vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString(vue.unref(orderDetail).driveTime), 1),
                    vue.createElementVNode("text", null, " \u5206\u949F")
                  ])
                ]),
                vue.createElementVNode("view", { class: "price" }, [
                  vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString(vue.unref(orderDetail).price), 1),
                  vue.createElementVNode("text", null, " \u5143")
                ])
              ])
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" \u5DF2\u53D6\u6D88 "),
            vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).orderCancel ? (vue.openBlock(), vue.createElementBlock("view", { key: 3 }, [
              vue.createElementVNode("view", {
                class: "desc",
                style: { "height": "60rpx", "line-height": "60rpx" }
              }, [
                vue.createElementVNode("text", null, "\u60A8\u7684\u8BA2\u5355\u5DF2\u53D6\u6D88")
              ]),
              vue.createElementVNode("view", { class: "passenger-info" }, [
                vue.createElementVNode("view", { class: "info-left" }, [
                  vue.unref(orderDetail).passengerSurname ? (vue.openBlock(), vue.createElementBlock("text", {
                    key: 0,
                    style: { "margin-right": "10px" }
                  }, vue.toDisplayString(vue.unref(orderDetail).passengerSurname) + "\u5148\u751F", 1)) : vue.createCommentVNode("v-if", true),
                  vue.unref(orderDetail).passengerPhone ? (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, vue.toDisplayString(vue.unref(orderDetail).passengerPhone), 1)) : vue.createCommentVNode("v-if", true),
                  vue.createElementVNode("view", {
                    class: "route",
                    style: { "margin-top": "10px" }
                  }, [
                    vue.createElementVNode("view", { class: "start" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).departure), 1)
                    ]),
                    vue.createElementVNode("view", { class: "end" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).destination), 1)
                    ])
                  ])
                ]),
                vue.createElementVNode("view", { class: "info-right" }, [
                  vue.createElementVNode("image", {
                    class: "avatar",
                    src: "/static/default-avatar.png",
                    mode: "aspectFill"
                  })
                ])
              ]),
              vue.createElementVNode("view", { class: "price-info" }, [
                vue.createElementVNode("view", { class: "cancal_price" }, [
                  vue.createElementVNode("text", null, "\u8FDD\u7EA6\u91D1\uFF1A"),
                  vue.createElementVNode("text", { style: { "color": "red" } }, "0"),
                  vue.createElementVNode("text", null, " \u5143")
                ])
              ]),
              vue.createElementVNode("button", {
                class: "btn btn_cancel",
                style: { "margin-top": "10rpx" },
                disabled: ""
              }, "\u53BB\u652F\u4ED8")
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ], 64);
      };
    }
  };
  var PagesOrderDetail = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["__scopeId", "data-v-5ebf2a2a"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/orderDetail.vue"]]);
  const _sfc_main$j = {
    name: "UniBadge",
    emits: ["click"],
    props: {
      type: {
        type: String,
        default: "error"
      },
      inverted: {
        type: Boolean,
        default: false
      },
      isDot: {
        type: Boolean,
        default: false
      },
      maxNum: {
        type: Number,
        default: 99
      },
      absolute: {
        type: String,
        default: ""
      },
      offset: {
        type: Array,
        default() {
          return [0, 0];
        }
      },
      text: {
        type: [String, Number],
        default: ""
      },
      size: {
        type: String,
        default: "small"
      },
      customStyle: {
        type: Object,
        default() {
          return {};
        }
      }
    },
    data() {
      return {};
    },
    computed: {
      width() {
        return String(this.text).length * 8 + 12;
      },
      classNames() {
        const {
          inverted,
          type,
          size,
          absolute
        } = this;
        return [
          inverted ? "uni-badge--" + type + "-inverted" : "",
          "uni-badge--" + type,
          "uni-badge--" + size,
          absolute ? "uni-badge--absolute" : ""
        ].join(" ");
      },
      positionStyle() {
        if (!this.absolute)
          return {};
        let w = this.width / 2, h = 10;
        if (this.isDot) {
          w = 5;
          h = 5;
        }
        const x = `${-w + this.offset[0]}px`;
        const y = `${-h + this.offset[1]}px`;
        const whiteList = {
          rightTop: {
            right: x,
            top: y
          },
          rightBottom: {
            right: x,
            bottom: y
          },
          leftBottom: {
            left: x,
            bottom: y
          },
          leftTop: {
            left: x,
            top: y
          }
        };
        const match = whiteList[this.absolute];
        return match ? match : whiteList["rightTop"];
      },
      dotStyle() {
        if (!this.isDot)
          return {};
        return {
          width: "10px",
          minWidth: "0",
          height: "10px",
          padding: "0",
          borderRadius: "10px"
        };
      },
      displayValue() {
        const {
          isDot,
          text,
          maxNum
        } = this;
        return isDot ? "" : Number(text) > maxNum ? `${maxNum}+` : text;
      }
    },
    methods: {
      onClick() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-badge--x" }, [
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
      $props.text ? (vue.openBlock(), vue.createElementBlock("text", {
        key: 0,
        class: vue.normalizeClass([$options.classNames, "uni-badge"]),
        style: vue.normalizeStyle([$options.positionStyle, $props.customStyle, $options.dotStyle]),
        onClick: _cache[0] || (_cache[0] = ($event) => $options.onClick())
      }, vue.toDisplayString($options.displayValue), 7)) : vue.createCommentVNode("v-if", true)
    ]);
  }
  var __easycom_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$a], ["__scopeId", "data-v-50168758"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-badge/uni-badge.vue"]]);
  const _sfc_main$i = {
    name: "UniListItem",
    emits: ["click", "switchChange"],
    props: {
      direction: {
        type: String,
        default: "row"
      },
      title: {
        type: String,
        default: ""
      },
      note: {
        type: String,
        default: ""
      },
      ellipsis: {
        type: [Number, String],
        default: 0
      },
      disabled: {
        type: [Boolean, String],
        default: false
      },
      clickable: {
        type: Boolean,
        default: false
      },
      showArrow: {
        type: [Boolean, String],
        default: false
      },
      link: {
        type: [Boolean, String],
        default: false
      },
      to: {
        type: String,
        default: ""
      },
      showBadge: {
        type: [Boolean, String],
        default: false
      },
      showSwitch: {
        type: [Boolean, String],
        default: false
      },
      switchChecked: {
        type: [Boolean, String],
        default: false
      },
      badgeText: {
        type: String,
        default: ""
      },
      badgeType: {
        type: String,
        default: "success"
      },
      badgeStyle: {
        type: Object,
        default() {
          return {};
        }
      },
      rightText: {
        type: String,
        default: ""
      },
      thumb: {
        type: String,
        default: ""
      },
      thumbSize: {
        type: String,
        default: "base"
      },
      showExtraIcon: {
        type: [Boolean, String],
        default: false
      },
      extraIcon: {
        type: Object,
        default() {
          return {
            type: "",
            color: "#000000",
            size: 20,
            customPrefix: ""
          };
        }
      },
      border: {
        type: Boolean,
        default: true
      },
      customStyle: {
        type: Object,
        default() {
          return {
            padding: "",
            backgroundColor: "#FFFFFF"
          };
        }
      },
      keepScrollPosition: {
        type: Boolean,
        default: false
      }
    },
    watch: {
      "customStyle.padding": {
        handler(padding) {
          if (typeof padding == "number") {
            padding += "";
          }
          let paddingArr = padding.split(" ");
          if (paddingArr.length === 1) {
            const allPadding = paddingArr[0];
            this.padding = {
              "top": allPadding,
              "right": allPadding,
              "bottom": allPadding,
              "left": allPadding
            };
          } else if (paddingArr.length === 2) {
            const [verticalPadding, horizontalPadding] = paddingArr;
            this.padding = {
              "top": verticalPadding,
              "right": horizontalPadding,
              "bottom": verticalPadding,
              "left": horizontalPadding
            };
          } else if (paddingArr.length === 3) {
            const [topPadding, horizontalPadding, bottomPadding] = paddingArr;
            this.padding = {
              "top": topPadding,
              "right": horizontalPadding,
              "bottom": bottomPadding,
              "left": horizontalPadding
            };
          } else if (paddingArr.length === 4) {
            const [topPadding, rightPadding, bottomPadding, leftPadding] = paddingArr;
            this.padding = {
              "top": topPadding,
              "right": rightPadding,
              "bottom": bottomPadding,
              "left": leftPadding
            };
          }
        },
        immediate: true
      }
    },
    data() {
      return {
        isFirstChild: false,
        padding: {
          top: "",
          right: "",
          bottom: "",
          left: ""
        }
      };
    },
    mounted() {
      this.list = this.getForm();
      if (this.list) {
        if (!this.list.firstChildAppend) {
          this.list.firstChildAppend = true;
          this.isFirstChild = true;
        }
      }
    },
    methods: {
      getForm(name = "uniList") {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      },
      onClick() {
        if (this.to !== "") {
          this.openPage();
          return;
        }
        if (this.clickable || this.link) {
          this.$emit("click", {
            data: {}
          });
        }
      },
      onSwitchChange(e) {
        this.$emit("switchChange", e.detail);
      },
      openPage() {
        if (["navigateTo", "redirectTo", "reLaunch", "switchTab"].indexOf(this.link) !== -1) {
          this.pageApi(this.link);
        } else {
          this.pageApi("navigateTo");
        }
      },
      pageApi(api) {
        let callback = {
          url: this.to,
          success: (res) => {
            this.$emit("click", {
              data: res
            });
          },
          fail: (err) => {
            this.$emit("click", {
              data: err
            });
          }
        };
        switch (api) {
          case "navigateTo":
            uni.navigateTo(callback);
            break;
          case "redirectTo":
            uni.redirectTo(callback);
            break;
          case "reLaunch":
            uni.reLaunch(callback);
            break;
          case "switchTab":
            uni.switchTab(callback);
            break;
          default:
            uni.navigateTo(callback);
        }
      }
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
    const _component_uni_badge = resolveEasycom(vue.resolveDynamicComponent("uni-badge"), __easycom_1$1);
    return vue.openBlock(), vue.createElementBlock("view", {
      class: vue.normalizeClass([{ "uni-list-item--disabled": $props.disabled }, "uni-list-item"]),
      style: vue.normalizeStyle({ "background-color": $props.customStyle.backgroundColor }),
      "hover-class": !$props.clickable && !$props.link || $props.disabled || $props.showSwitch ? "" : "uni-list-item--hover",
      onClick: _cache[1] || (_cache[1] = (...args) => $options.onClick && $options.onClick(...args))
    }, [
      !$data.isFirstChild ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: vue.normalizeClass(["border--left", { "uni-list--border": $props.border }])
      }, null, 2)) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("view", {
        class: vue.normalizeClass(["uni-list-item__container", { "container--right": $props.showArrow || $props.link, "flex--direction": $props.direction === "column" }]),
        style: vue.normalizeStyle({ paddingTop: $data.padding.top, paddingLeft: $data.padding.left, paddingRight: $data.padding.right, paddingBottom: $data.padding.bottom })
      }, [
        vue.renderSlot(_ctx.$slots, "header", {}, () => [
          vue.createElementVNode("view", { class: "uni-list-item__header" }, [
            $props.thumb ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "uni-list-item__icon"
            }, [
              vue.createElementVNode("image", {
                src: $props.thumb,
                class: vue.normalizeClass(["uni-list-item__icon-img", ["uni-list--" + $props.thumbSize]])
              }, null, 10, ["src"])
            ])) : $props.showExtraIcon ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "uni-list-item__icon"
            }, [
              vue.createVNode(_component_uni_icons, {
                customPrefix: $props.extraIcon.customPrefix,
                color: $props.extraIcon.color,
                size: $props.extraIcon.size,
                type: $props.extraIcon.type
              }, null, 8, ["customPrefix", "color", "size", "type"])
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ], true),
        vue.renderSlot(_ctx.$slots, "body", {}, () => [
          vue.createElementVNode("view", {
            class: vue.normalizeClass(["uni-list-item__content", { "uni-list-item__content--center": $props.thumb || $props.showExtraIcon || $props.showBadge || $props.showSwitch }])
          }, [
            $props.title ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              class: vue.normalizeClass(["uni-list-item__content-title", [$props.ellipsis !== 0 && $props.ellipsis <= 2 ? "uni-ellipsis-" + $props.ellipsis : ""]])
            }, vue.toDisplayString($props.title), 3)) : vue.createCommentVNode("v-if", true),
            $props.note ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              class: "uni-list-item__content-note"
            }, vue.toDisplayString($props.note), 1)) : vue.createCommentVNode("v-if", true)
          ], 2)
        ], true),
        vue.renderSlot(_ctx.$slots, "footer", {}, () => [
          $props.rightText || $props.showBadge || $props.showSwitch ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: vue.normalizeClass(["uni-list-item__extra", { "flex--justify": $props.direction === "column" }])
          }, [
            $props.rightText ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              class: "uni-list-item__extra-text"
            }, vue.toDisplayString($props.rightText), 1)) : vue.createCommentVNode("v-if", true),
            $props.showBadge ? (vue.openBlock(), vue.createBlock(_component_uni_badge, {
              key: 1,
              type: $props.badgeType,
              text: $props.badgeText,
              "custom-style": $props.badgeStyle
            }, null, 8, ["type", "text", "custom-style"])) : vue.createCommentVNode("v-if", true),
            $props.showSwitch ? (vue.openBlock(), vue.createElementBlock("switch", {
              key: 2,
              disabled: $props.disabled,
              checked: $props.switchChecked,
              onChange: _cache[0] || (_cache[0] = (...args) => $options.onSwitchChange && $options.onSwitchChange(...args))
            }, null, 40, ["disabled", "checked"])) : vue.createCommentVNode("v-if", true)
          ], 2)) : vue.createCommentVNode("v-if", true)
        ], true)
      ], 6),
      $props.showArrow || $props.link ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
        key: 1,
        size: 16,
        class: "uni-icon-wrapper",
        color: "#bbb",
        type: "arrowright"
      })) : vue.createCommentVNode("v-if", true)
    ], 14, ["hover-class"]);
  }
  var __easycom_4$1 = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$9], ["__scopeId", "data-v-b2f877dc"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-list-item/uni-list-item.vue"]]);
  const _sfc_main$h = {
    name: "uniList",
    "mp-weixin": {
      options: {
        multipleSlots: false
      }
    },
    props: {
      stackFromEnd: {
        type: Boolean,
        default: false
      },
      enableBackToTop: {
        type: [Boolean, String],
        default: false
      },
      scrollY: {
        type: [Boolean, String],
        default: false
      },
      border: {
        type: Boolean,
        default: true
      },
      renderReverse: {
        type: Boolean,
        default: false
      }
    },
    created() {
      this.firstChildAppend = false;
    },
    methods: {
      loadMore(e) {
        this.$emit("scrolltolower");
      },
      scroll(e) {
        this.$emit("scroll", e);
      }
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-list uni-border-top-bottom" }, [
      $props.border ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "uni-list--border-top"
      })) : vue.createCommentVNode("v-if", true),
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
      $props.border ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "uni-list--border-bottom"
      })) : vue.createCommentVNode("v-if", true)
    ]);
  }
  var __easycom_5$1 = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$8], ["__scopeId", "data-v-6ac7d866"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-list/uni-list.vue"]]);
  const _sfc_main$g = {
    __name: "my",
    setup(__props) {
      const userInfo2 = vue.ref({
        driverPhone: ""
      });
      const $store = useStore();
      const menuItems = vue.ref([
        { name: "\u4E2A\u4EBA\u4FE1\u606F\u7BA1\u7406", page: "/pages/myInfo" },
        { name: "\u8BBE\u7F6E\u8FD0\u8425\u57CE\u5E02", page: "/pages/setOperatingCity" },
        { name: "\u7ED1\u5B9A\u8F66\u8F86", page: "/pages/paymentSettings" },
        { name: "\u5411\u5F00\u53D1\u8005\u63D0\u610F\u89C1", page: "/pages/opinion" },
        { name: "\u670D\u52A1\u534F\u8BAE\u4E0E\u5E73\u53F0\u89C4\u5219", page: "/pages/termsAndRules" }
      ]);
      vue.onMounted(() => {
        var _a;
        const driverId2 = (_a = $store.state.userInfo) == null ? void 0 : _a.driverId;
        if (driverId2) {
          getUserInfo(driverId2);
        }
      });
      const getUserInfo = async (driverId2) => {
        try {
          const { error, result } = await ApiGetUserInfo(driverId2);
          if (result) {
            userInfo2.value = result;
          }
        } catch (e) {
          formatAppLog("error", "at pages/my.vue:86", "\u83B7\u53D6\u7528\u6237\u4FE1\u606F\u5931\u8D25", e);
        }
      };
      const handleReceiveOrder = (arg) => {
        if (arg && arg.orderId) {
          uni.redirectTo({ url: `/pages/orderDetail?orderId=${arg.orderId}` });
        }
      };
      const handleLogout = () => {
        $store.commit("setToken", "");
        $store.commit("setCity", MAP_CON.city);
        uni.reLaunch({
          url: "/pages/login"
        });
      };
      const goToPage = (page) => {
        getApp().globalData.userInfo = userInfo2.value;
        uni.navigateTo({ url: page });
      };
      return (_ctx, _cache) => {
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
        const _component_uni_list_item = resolveEasycom(vue.resolveDynamicComponent("uni-list-item"), __easycom_4$1);
        const _component_uni_list = resolveEasycom(vue.resolveDynamicComponent("uni-list"), __easycom_5$1);
        return vue.openBlock(), vue.createElementBlock("view", { class: "personal-center" }, [
          vue.createCommentVNode(" \u9876\u90E8\u4E2A\u4EBA\u4FE1\u606F\u5361\u7247 "),
          vue.createElementVNode("view", { class: "user-card" }, [
            vue.createElementVNode("view", { class: "user-info" }, [
              vue.createElementVNode("image", {
                class: "avatar",
                src: "/static/default-avatar.png",
                mode: "aspectFill"
              }),
              vue.createElementVNode("view", { class: "info-text" }, [
                vue.createElementVNode("text", { class: "phone" }, vue.toDisplayString(userInfo2.value.driverPhone || "\u672A\u767B\u5F55"), 1),
                vue.createElementVNode("text", { class: "role" }, "\u8BA4\u8BC1\u53F8\u673A")
              ])
            ]),
            vue.createElementVNode("view", { class: "status-badge" }, [
              vue.createVNode(_component_uni_icons, {
                type: "checkmarkempty",
                size: "14",
                color: "#52c41a"
              }),
              vue.createElementVNode("text", null, "\u5DF2\u8BA4\u8BC1")
            ])
          ]),
          vue.createCommentVNode(" \u8BA2\u5355\u6D88\u606F\u7EC4\u4EF6 "),
          vue.createElementVNode("view", { class: "message-wrapper" }, [
            vue.createVNode(BSseMessage, { onReceiveOrder: handleReceiveOrder })
          ]),
          vue.createCommentVNode(" \u91CD\u8981\u63D0\u793A\u5361\u7247 "),
          vue.createElementVNode("view", { class: "info-tip" }, [
            vue.createVNode(_component_uni_icons, {
              type: "info",
              size: "20",
              color: "#3c7e8c",
              class: "tip-icon"
            }),
            vue.createElementVNode("text", { class: "tip-text" }, "\u53F8\u673A\u7AEF\u5982\u9700\u4FEE\u6539\u4E2A\u4EBA\u4FE1\u606F\u6216\u66F4\u6362\u7ED1\u5B9A\u8F66\u8F86\uFF0C\u8BF7\u4E3B\u52A8\u8054\u7CFB\u5F53\u5730\u7AD9\u70B9\u5DE5\u4F5C\u4EBA\u5458\u8FDB\u884C\u540E\u53F0\u5904\u7406\u3002")
          ]),
          vue.createCommentVNode(" \u529F\u80FD\u83DC\u5355\u5217\u8868 "),
          vue.createElementVNode("view", { class: "menu-section" }, [
            vue.createVNode(_component_uni_list, { border: false }, {
              default: vue.withCtx(() => [
                (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(menuItems.value, (item, index) => {
                  return vue.openBlock(), vue.createBlock(_component_uni_list_item, {
                    key: index,
                    title: item.name,
                    "show-arrow": "",
                    clickable: "",
                    onClick: ($event) => goToPage(item.page)
                  }, null, 8, ["title", "onClick"]);
                }), 128))
              ]),
              _: 1
            })
          ]),
          vue.createCommentVNode(" \u9000\u51FA\u767B\u5F55\u6309\u94AE "),
          vue.createElementVNode("view", { class: "logout-wrapper" }, [
            vue.createElementVNode("button", {
              class: "logout-btn",
              onClick: handleLogout
            }, "\u9000\u51FA\u767B\u5F55")
          ])
        ]);
      };
    }
  };
  var PagesMy = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-c8d905a0"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/my.vue"]]);
  const isObject = (val) => val !== null && typeof val === "object";
  const defaultDelimiters = ["{", "}"];
  class BaseFormatter {
    constructor() {
      this._caches = /* @__PURE__ */ Object.create(null);
    }
    interpolate(message, values, delimiters = defaultDelimiters) {
      if (!values) {
        return [message];
      }
      let tokens = this._caches[message];
      if (!tokens) {
        tokens = parse(message, delimiters);
        this._caches[message] = tokens;
      }
      return compile(tokens, values);
    }
  }
  const RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
  const RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;
  function parse(format, [startDelimiter, endDelimiter]) {
    const tokens = [];
    let position = 0;
    let text = "";
    while (position < format.length) {
      let char = format[position++];
      if (char === startDelimiter) {
        if (text) {
          tokens.push({ type: "text", value: text });
        }
        text = "";
        let sub = "";
        char = format[position++];
        while (char !== void 0 && char !== endDelimiter) {
          sub += char;
          char = format[position++];
        }
        const isClosed = char === endDelimiter;
        const type = RE_TOKEN_LIST_VALUE.test(sub) ? "list" : isClosed && RE_TOKEN_NAMED_VALUE.test(sub) ? "named" : "unknown";
        tokens.push({ value: sub, type });
      } else {
        text += char;
      }
    }
    text && tokens.push({ type: "text", value: text });
    return tokens;
  }
  function compile(tokens, values) {
    const compiled = [];
    let index = 0;
    const mode = Array.isArray(values) ? "list" : isObject(values) ? "named" : "unknown";
    if (mode === "unknown") {
      return compiled;
    }
    while (index < tokens.length) {
      const token = tokens[index];
      switch (token.type) {
        case "text":
          compiled.push(token.value);
          break;
        case "list":
          compiled.push(values[parseInt(token.value, 10)]);
          break;
        case "named":
          if (mode === "named") {
            compiled.push(values[token.value]);
          } else {
            {
              console.warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
            }
          }
          break;
        case "unknown":
          {
            console.warn(`Detect 'unknown' type of token!`);
          }
          break;
      }
      index++;
    }
    return compiled;
  }
  const LOCALE_ZH_HANS = "zh-Hans";
  const LOCALE_ZH_HANT = "zh-Hant";
  const LOCALE_EN = "en";
  const LOCALE_FR = "fr";
  const LOCALE_ES = "es";
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const defaultFormatter = new BaseFormatter();
  function include(str, parts) {
    return !!parts.find((part) => str.indexOf(part) !== -1);
  }
  function startsWith(str, parts) {
    return parts.find((part) => str.indexOf(part) === 0);
  }
  function normalizeLocale(locale, messages2) {
    if (!locale) {
      return;
    }
    locale = locale.trim().replace(/_/g, "-");
    if (messages2 && messages2[locale]) {
      return locale;
    }
    locale = locale.toLowerCase();
    if (locale === "chinese") {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf("zh") === 0) {
      if (locale.indexOf("-hans") > -1) {
        return LOCALE_ZH_HANS;
      }
      if (locale.indexOf("-hant") > -1) {
        return LOCALE_ZH_HANT;
      }
      if (include(locale, ["-tw", "-hk", "-mo", "-cht"])) {
        return LOCALE_ZH_HANT;
      }
      return LOCALE_ZH_HANS;
    }
    const lang = startsWith(locale, [LOCALE_EN, LOCALE_FR, LOCALE_ES]);
    if (lang) {
      return lang;
    }
  }
  class I18n {
    constructor({ locale, fallbackLocale, messages: messages2, watcher, formater }) {
      this.locale = LOCALE_EN;
      this.fallbackLocale = LOCALE_EN;
      this.message = {};
      this.messages = {};
      this.watchers = [];
      if (fallbackLocale) {
        this.fallbackLocale = fallbackLocale;
      }
      this.formater = formater || defaultFormatter;
      this.messages = messages2 || {};
      this.setLocale(locale || LOCALE_EN);
      if (watcher) {
        this.watchLocale(watcher);
      }
    }
    setLocale(locale) {
      const oldLocale = this.locale;
      this.locale = normalizeLocale(locale, this.messages) || this.fallbackLocale;
      if (!this.messages[this.locale]) {
        this.messages[this.locale] = {};
      }
      this.message = this.messages[this.locale];
      if (oldLocale !== this.locale) {
        this.watchers.forEach((watcher) => {
          watcher(this.locale, oldLocale);
        });
      }
    }
    getLocale() {
      return this.locale;
    }
    watchLocale(fn) {
      const index = this.watchers.push(fn) - 1;
      return () => {
        this.watchers.splice(index, 1);
      };
    }
    add(locale, message, override = true) {
      const curMessages = this.messages[locale];
      if (curMessages) {
        if (override) {
          Object.assign(curMessages, message);
        } else {
          Object.keys(message).forEach((key) => {
            if (!hasOwn(curMessages, key)) {
              curMessages[key] = message[key];
            }
          });
        }
      } else {
        this.messages[locale] = message;
      }
    }
    f(message, values, delimiters) {
      return this.formater.interpolate(message, values, delimiters).join("");
    }
    t(key, locale, values) {
      let message = this.message;
      if (typeof locale === "string") {
        locale = normalizeLocale(locale, this.messages);
        locale && (message = this.messages[locale]);
      } else {
        values = locale;
      }
      if (!hasOwn(message, key)) {
        console.warn(`Cannot translate the value of keypath ${key}. Use the value of keypath as default.`);
        return key;
      }
      return this.formater.interpolate(message[key], values).join("");
    }
  }
  function watchAppLocale(appVm, i18n) {
    if (appVm.$watchLocale) {
      appVm.$watchLocale((newLocale) => {
        i18n.setLocale(newLocale);
      });
    } else {
      appVm.$watch(() => appVm.$locale, (newLocale) => {
        i18n.setLocale(newLocale);
      });
    }
  }
  function getDefaultLocale() {
    if (typeof uni !== "undefined" && uni.getLocale) {
      return uni.getLocale();
    }
    if (typeof global !== "undefined" && global.getLocale) {
      return global.getLocale();
    }
    return LOCALE_EN;
  }
  function initVueI18n(locale, messages2 = {}, fallbackLocale, watcher) {
    if (typeof locale !== "string") {
      [locale, messages2] = [
        messages2,
        locale
      ];
    }
    if (typeof locale !== "string") {
      locale = getDefaultLocale();
    }
    if (typeof fallbackLocale !== "string") {
      fallbackLocale = typeof __uniConfig !== "undefined" && __uniConfig.fallbackLocale || LOCALE_EN;
    }
    const i18n = new I18n({
      locale,
      fallbackLocale,
      messages: messages2,
      watcher
    });
    let t2 = (key, values) => {
      if (typeof getApp !== "function") {
        t2 = function(key2, values2) {
          return i18n.t(key2, values2);
        };
      } else {
        let isWatchedAppLocale = false;
        t2 = function(key2, values2) {
          const appVm = getApp().$vm;
          if (appVm) {
            appVm.$locale;
            if (!isWatchedAppLocale) {
              isWatchedAppLocale = true;
              watchAppLocale(appVm, i18n);
            }
          }
          return i18n.t(key2, values2);
        };
      }
      return t2(key, values);
    };
    return {
      i18n,
      f(message, values, delimiters) {
        return i18n.f(message, values, delimiters);
      },
      t(key, values) {
        return t2(key, values);
      },
      add(locale2, message, override = true) {
        return i18n.add(locale2, message, override);
      },
      watch(fn) {
        return i18n.watchLocale(fn);
      },
      getLocale() {
        return i18n.getLocale();
      },
      setLocale(newLocale) {
        return i18n.setLocale(newLocale);
      }
    };
  }
  var en = {
    "uni-load-more.contentdown": "Pull up to show more",
    "uni-load-more.contentrefresh": "loading...",
    "uni-load-more.contentnomore": "No more data"
  };
  var zhHans = {
    "uni-load-more.contentdown": "\u4E0A\u62C9\u663E\u793A\u66F4\u591A",
    "uni-load-more.contentrefresh": "\u6B63\u5728\u52A0\u8F7D...",
    "uni-load-more.contentnomore": "\u6CA1\u6709\u66F4\u591A\u6570\u636E\u4E86"
  };
  var zhHant = {
    "uni-load-more.contentdown": "\u4E0A\u62C9\u986F\u793A\u66F4\u591A",
    "uni-load-more.contentrefresh": "\u6B63\u5728\u52A0\u8F09...",
    "uni-load-more.contentnomore": "\u6C92\u6709\u66F4\u591A\u6578\u64DA\u4E86"
  };
  var messages = {
    en,
    "zh-Hans": zhHans,
    "zh-Hant": zhHant
  };
  let platform;
  setTimeout(() => {
    platform = uni.getSystemInfoSync().platform;
  }, 16);
  const {
    t
  } = initVueI18n(messages);
  const _sfc_main$f = {
    name: "UniLoadMore",
    emits: ["clickLoadMore"],
    props: {
      status: {
        type: String,
        default: "more"
      },
      showIcon: {
        type: Boolean,
        default: true
      },
      iconType: {
        type: String,
        default: "auto"
      },
      iconSize: {
        type: Number,
        default: 24
      },
      color: {
        type: String,
        default: "#777777"
      },
      contentText: {
        type: Object,
        default() {
          return {
            contentdown: "",
            contentrefresh: "",
            contentnomore: ""
          };
        }
      },
      showText: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        webviewHide: false,
        platform,
        imgBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzlBMzU3OTlEOUM0MTFFOUI0NTZDNERBQURBQzI4RkUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzlBMzU3OUFEOUM0MTFFOUI0NTZDNERBQURBQzI4RkUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDOUEzNTc5N0Q5QzQxMUU5QjQ1NkM0REFBREFDMjhGRSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDOUEzNTc5OEQ5QzQxMUU5QjQ1NkM0REFBREFDMjhGRSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pt+ALSwAAA6CSURBVHja1FsLkFZVHb98LM+F5bHL8khA1iSeiyQBCRM+YGqKUnnJTDLGI0BGZlKDIU2MMglUiDApEZvSsZnQtBRJtKwQNKQMFYeRDR10WOLd8ljYXdh+v8v5fR3Od+797t1dnOnO/Ofce77z+J//+b/P+ZqtXbs2sJ9MJhNUV1cHJ06cCJo3bx7EPc2aNcvpy7pWrVoF+/fvDyoqKoI2bdoE9fX1F7TjN8a+EXBn/fkfvw942Tf+wYMHg9mzZwfjxo0LDhw4EPa1x2MbFw/fOGfPng1qa2tzcCkILsLDydq2bRsunpOTMM7TD/W/tZDZhPdeKD+yGxHhdu3aBV27dg3OnDlzMVANMheLAO3btw8KCwuDmpoaX5OxbgUIMEq7K8IcPnw4KCsrC/r37x8cP378/4cAXAB3vqSkJMuiDhTkw+XcuXNhOWbMmKBly5YhUT8xArhyFvP0BfwRsAuwxJZJsm/nzp2DTp06he/OU+cZ64K6o0ePBkOHDg2GDx8e6gEbJ5Q/NHNuAJQ1hgBeHUDlR7nVTkY8rQAvAi4z34vR/mPs1FoRsaCgIJThI0eOBC1atEiFGGV+5MiRoS45efJkqFjJFXV1dQuA012m2WcwTw98fy6CqBdsaiIO4CScrGPHjvk4odhavPquRtFWXEC25VgkREKOCh/qDSq+vn37htzD/mZTOmOc5U7zKzBPEedygWshcDyWvs30igAbU+6oyMgJBCFhwQE0fccxN60Ay9iebbjoDh06hMowjQxT4fXq1SskArmHZpkArvixp/kWzHdMeArExSJEaiXIjjRjRJ4DaAGWpibLzXN3Fm1vA5teBgh3j1Rv3bp1YgKwPdmf2p9zcyNYYgPKMfY0T5f5nNYdw158nJ8QawW4CLKwiOBSEgO/hok2eBydR+3dYH+PLxA5J8Vv0KBBwenTp0P2JWAx6+yFEBfs8lMY+y0SWMBNI9E4ThKi58VKTg3FQZS1RQF1cz27eC0QHMu+3E0SkUowjhVt5VdaWhp07949ZHv2Qd1EjDXM2cla1M0nl3GxAs3J9yREzyTdFVKVFOaE9qRA8GM0WebRuo9JGZKA7Mv2SeS/Z8+eoQ9BArMfFrLGo6jvxbhHbJZnKX2Rzz1O7QhJJ9Cs2ZMaWIyq/zhdeqPNfIoHd58clIQD+JSXl4dKlyIAuBdVXZwFVWKspSSoxE++h8x4k3uCnEhE4I5KwRiFWGOU0QWKiCYLbdoRMRKAu2kQ9vkfLU6dOhX06NEjlH+yMRZSinnuyWnYosVcji8CEA/6Cg2JF+IIUBqnGKUTCNwtwBN4f89RiK1R96DEgO2o0NDmtEdvVFdVVYV+P3UAPUEs6GFwV3PHmXkD4vh74iDFJysVI/MlaQhwKeBNTLYX5VuA8T4/gZxA4MRGFxDB6R7OmYPfyykGRJbyie+XnGYnQIC/coH9+vULiYrxrkL9ZA9+0ykaHIfEpM7ge8TiJ2CsHYwyMfafAF1yCGBHYIbCVDjDjKt7BeB51D+LgQa6OkG7IDYEEtvQ7lnXLKLtLdLuJBpE4gPUXcW2+PkZwOex+4cGDhwYDBkyRL7/HFcEwUGPo/8uWRUpYnfxGHco8HkewLHLyYmAawAPuIFZxhOpDfJQ8gbUv41yORAptMWBNr6oqMhWird5+u+iHmBb2nhjDV7HWBNQTgK8y11l5NetWzc5ULscAtSj7nbNI0skhWeUZCc0W4nyH/jO4Vz0u1IeYhbk4AiwM6tjxIWByHsoZ9qcIBPJd/y+DwPfBESOmCa/QF3WiZHucLlEDpNxcNhmheEOPgdQNx6/VZFQzFZ5TN08AHXQt2Ii3EdyFuUsPtTcGPhW5iMiCNELvz+Gdn9huG4HUJaW/w3g0wxV0XaG7arG2WeKiUWYM4Y7GO5ezshTARbbWGw/DvXkpp/ivVvE0JVoMxN4rpGzJMhE5Pl+xlATsDIqikP9F9D2z3h9nOksEUFhK+qO4rcPkoalMQ/HqJLIyb3F3JdjrCcw1yZ8joyJLR5gCo54etlag7qIoeNh1N1BRYj3DTFJ0elotxPlVzkGuYAmL0VSJVGAJA41c4Z6A3BzTLfn0HYwYKEI6CUAMzZEWvLsIcQOo1AmmyyM72nHJCfYsogflGV6jEk9vyQZXSuq6w4c16NsGcGZbwOPr+H1RkOk2LEzjNepxQkihHSCQ4ynAYNRx2zMKV92CQMWqj8J0BRE8EShxRFN6YrfCRhC0x3r/Zm4IbQCcmJoV0kMamllccR6FjHqUC5F2R/wS2dcymOlfAKOS4KmzQb5cpNC2MC7JhVn5wjXoJ44rYhLh8n0eXOCorJxa7POjbSlCGVczr34/RsAmrcvo9s+wGp3tzVhntxiXiJ4nvEYb4FJkf0O8HocAePmLvCxnL0AORraVekJk6TYjDabRVXfRE2lCN1h6ZQRN1+InUbsCpKwoBZHh0dODN9JBCUffItXxEavTQkUtnfTVAplCWL3JISz29h4NjotnuSsQKJCk8dF+kJR6RARjrqFVmfPnj3ZbK8cIJ0msd6jgHPGtfVTQ8VLmlvh4mct9sobRmPic0DyDQQnx/NlfYUgyz59+oScsH379pAwXABD32nTpoUHIToESeI5mnbE/UqDdyLcafEBf2MCqgC7NwxIbMREJQ0g4D4sfJwnD+AmRrII05cfMWJE+L1169bQr+fip06dGp4oJ83lmYd5wj/EmMa4TaHivo4EeCguYZBnkB5g2aWA69OIEnUHOaGysjIYMGBAMGnSpODYsWPZwCpFmm4lNq+4gSLQA7jcX8DwtjEyRC8wjabnXEx9kfWnTJkSJkAo90xpJVV+FmcVNeYAF5zWngS4C4O91MBxmAv8blLEpbjI5sz9MTdAhcgkCT1RO8mZkAjfiYpTEvStAS53Uw1vAiUGgZ3GpuQEYvoiBqlIan7kSDHnTwJQFNiPu0+5VxCVYhcZIjNrdXUDdp+Eq5AZ3Gkg8QAyVZRZIk4Tl4QAbF9cXJxNYZMAtAokgs4BrNxEpCtteXg7DDTMDKYNSuQdKsnJBek7HxewvxaosWxLYXtw+cJp18217wql4aKCfBNoEu0O5VU+PhctJ0YeXD4C6JQpyrlpSLTojpGGGN5YwNziChdIZLk4lvLcFJ9jMX3QdiImY9bmGQU+TRUL5CHITTRlgF8D9ouD1MfmLoEPl5xokIumZ2cfgMpHt47IW9N64Hsh7wQYYjyIugWuF5fCqYncXRd5vPMWyizzvhi/32+nvG0dZc9vR6fZOu0md5e+uC408FvKSIOZwXlGvxPv95izA2Vtvg1xKFWARI+vMX66HUhpQQb643uW1bSjuTWyw2SBvDrBvjFic1eGGlz5esq3ko9uSIlBRqPuFcCv8F4WIcN12nVaBd0SaYwI6PDDImR11JkqgHcPmQssjxIn6bUshygDFJUTxPMpHk+jfjPgupgdnYV2R/g7xSjtpah8RJBewhwf0gGK6XI92u4wXFEU40afJ4DN4h5LcAd+40HI3JgJecuT0c062W0i2hQJUTcxan3/CMW1PF2K6bbA+Daz4xRs1D3Br1Cm0OihKCqizW78/nXAF/G5TXrEcVzaNMH6CyMswqsAHqDyDLEyou8lwOXnKF8DjI6KjV3KzMBiXkDH8ij/H214J5A596ekrZ3F0zXlWeL7+P5eUrNo3/QwC15uxthuzidy7DzKRwEDaAViiDgKbTbz7CJnzo0bN7pIfIiid8SuPwn25o3QCmpnyjlZkyxPP8EomCJzrGb7GJMx7tNsq4MT2xMUYaiErZOluTzKsnz3gwCeCZyVRZJfYplNEokEjwrPtxlxjeYAk+F1F74VAzPxQRNYYdtpOUvWs8J1sGhBJMNsb7igN8plJs1eSmLIhLKE4rvaCX27gOhLpLOsIzJ7qn/i+wZzcvSOZ23/du8TZjwV8zHIXoP4R3ifBxiFz1dcVpa3aPntPE+c6TmIWE9EtcMmAcPdWAhYhAXxcLOQi9L1WhD1Sc8p1d2oL7XGiRKp8F4A2i8K/nfI+y/gsTDJ/YC/8+AD5Uh04KHiGl+cIFPnBDDrPMjwRGkLXyxO4VGbfQWnDH2v0bVWE3C9QOXlepbgjEfIJQI6XDG3z5ahD9cw2pS78ipB85wyScNTvsVzlzzhL8/jRrnmVjfFJK/m3m4nj9vbgQTguT8XZTjsm672R5uJKEaQmBI/c58gyus8ZDagLpEVSJBIyHp4jn++xqPV71OgQgJYEWOtZ/haxRtKmWOBu8xdBLftWltsY84zE6WIEy/eIOWL+BaayMx+KHtL7EAkqdNDLiEXmEMUHniedtJqg9HmZtfvt26vNi0BdG3Ft3g8ZOf7PAu59TxtzivLNIekyi+wD1i8CuUiD9FXAa8C+/xS3JPmZnomyc7H+fb4/Se0bk41Fel621r4cgVxbq91V4jVqwB7HTe2M7jgB+QWHavZkDRPmZcASoZEmBx6i75bGjPcMdL4/VKGFAGWZkGzPG0XAbdL9A81G5LOmUnC9hHKJeO7dcUMjblSl12867ElFTtaGl20xvvLGPdVz/8TVuU7y0x1PG7vtNg24oz9Uo/Z412++VFWI7Fcog9tu9Lm6gvRmIPv9x1xmQAu6RDkXtbOtlGEmpgD5Nvnyc0dcv0EE6cfdi1HmhMf9wDF3k3gtRvEedhxjpgfqPb9PU9iEJHnyOUA7bQUXh6kq/D7l2iTjWv7XOD530BDr8jIrus+srXjt4MzumJMHuTsBa63YKE1+RR5lBjEikCCnWKWiHdzOgKO+nRIBAF88za/IFmJ3eMZov4CYxGBabcpGL8EYx+SeMXJeRwHNsV/h+vdxeuhEpN3ZyNY78Gm2fknJxVGhyjixPiQvVkNzT1elD9Py/aTAL64Hb9vcYmC9zfdXdT/C1LeGbg4rnBaAihDFJH12W5ulfNCNe/xTsP3bp8ikzJs5BF+5PNfAQYAPaseTdsEcaYAAAAASUVORK5CYII="
      };
    },
    computed: {
      iconSnowWidth() {
        return (Math.floor(this.iconSize / 24) || 1) * 2;
      },
      contentdownText() {
        return this.contentText.contentdown || t("uni-load-more.contentdown");
      },
      contentrefreshText() {
        return this.contentText.contentrefresh || t("uni-load-more.contentrefresh");
      },
      contentnomoreText() {
        return this.contentText.contentnomore || t("uni-load-more.contentnomore");
      }
    },
    mounted() {
      var pages = getCurrentPages();
      var page = pages[pages.length - 1];
      var currentWebview = page.$getAppWebview();
      currentWebview.addEventListener("hide", () => {
        this.webviewHide = true;
      });
      currentWebview.addEventListener("show", () => {
        this.webviewHide = false;
      });
    },
    methods: {
      onClick() {
        this.$emit("clickLoadMore", {
          detail: {
            status: this.status
          }
        });
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "uni-load-more",
      onClick: _cache[0] || (_cache[0] = (...args) => $options.onClick && $options.onClick(...args))
    }, [
      !$data.webviewHide && ($props.iconType === "circle" || $props.iconType === "auto" && $data.platform === "android") && $props.status === "loading" && $props.showIcon ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        style: vue.normalizeStyle({ width: $props.iconSize + "px", height: $props.iconSize + "px" }),
        class: "uni-load-more__img uni-load-more__img--android-MP"
      }, [
        vue.createElementVNode("view", {
          class: "uni-load-more__img-icon",
          style: vue.normalizeStyle({ borderTopColor: $props.color, borderTopWidth: $props.iconSize / 12 })
        }, null, 4),
        vue.createElementVNode("view", {
          class: "uni-load-more__img-icon",
          style: vue.normalizeStyle({ borderTopColor: $props.color, borderTopWidth: $props.iconSize / 12 })
        }, null, 4),
        vue.createElementVNode("view", {
          class: "uni-load-more__img-icon",
          style: vue.normalizeStyle({ borderTopColor: $props.color, borderTopWidth: $props.iconSize / 12 })
        }, null, 4)
      ], 4)) : !$data.webviewHide && $props.status === "loading" && $props.showIcon ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        style: vue.normalizeStyle({ width: $props.iconSize + "px", height: $props.iconSize + "px" }),
        class: "uni-load-more__img uni-load-more__img--ios-H5"
      }, [
        vue.createElementVNode("image", {
          src: $data.imgBase64,
          mode: "widthFix"
        }, null, 8, ["src"])
      ], 4)) : vue.createCommentVNode("v-if", true),
      $props.showText ? (vue.openBlock(), vue.createElementBlock("text", {
        key: 2,
        class: "uni-load-more__text",
        style: vue.normalizeStyle({ color: $props.color })
      }, vue.toDisplayString($props.status === "more" ? $options.contentdownText : $props.status === "loading" ? $options.contentrefreshText : $options.contentnomoreText), 5)) : vue.createCommentVNode("v-if", true)
    ]);
  }
  var __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$7], ["__scopeId", "data-v-154342f4"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-load-more/uni-load-more.vue"]]);
  const _sfc_main$e = {
    __name: "monsy",
    setup(__props) {
      const store2 = useStore();
      const userInfo2 = vue.computed(() => store2.state.userInfo);
      const driverId2 = vue.computed(() => {
        var _a;
        return (_a = userInfo2.value) == null ? void 0 : _a.driverId;
      });
      const loading = vue.ref(false);
      const monthlyData = vue.ref([]);
      const currentMonthIndex = vue.ref(0);
      const monthOptions = [
        { text: "\u6700\u8FD13\u4E2A\u6708", value: 3 },
        { text: "\u6700\u8FD16\u4E2A\u6708", value: 6 },
        { text: "\u6700\u8FD112\u4E2A\u6708", value: 12 }
      ];
      const loadMoreStatus = vue.ref("noMore");
      const stats = vue.computed(() => [
        {
          label: "\u603B\u6536\u5165",
          value: monthlyData.value.reduce((sum, item) => sum + (item.driverIncome || 0), 0),
          icon: "icon-jinbi",
          iconClass: "income-icon"
        },
        {
          label: "\u603B\u8BA2\u5355\u91D1\u989D",
          value: monthlyData.value.reduce((sum, item) => sum + (item.totalOrderAmount || 0), 0),
          icon: "icon-dingdan",
          iconClass: "order-icon"
        },
        {
          label: "\u5E73\u53F0\u62BD\u6210",
          value: monthlyData.value.reduce((sum, item) => sum + (item.platformCommission || 0), 0),
          icon: "icon-shouyi",
          iconClass: "commission-icon"
        }
      ]);
      const fetchData = async () => {
        if (loading.value)
          return;
        if (!driverId2.value) {
          uni.showToast({ title: "\u7528\u6237\u4FE1\u606F\u672A\u83B7\u53D6\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55", icon: "none" });
          return;
        }
        loading.value = true;
        try {
          const { error, result } = await ApiGetUserMoney(driverId2.value, monthOptions[currentMonthIndex.value].value);
          if (error) {
            uni.showToast({ title: error.message || "\u83B7\u53D6\u8D26\u5355\u5931\u8D25", icon: "none" });
            monthlyData.value = [];
          } else {
            monthlyData.value = result || [];
          }
        } catch (err) {
          formatAppLog("error", "at pages/monsy.vue:138", err);
          uni.showToast({ title: "\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", icon: "none" });
          monthlyData.value = [];
        } finally {
          loading.value = false;
        }
      };
      const onRefresh = () => {
        fetchData();
      };
      const onMonthChange = (e) => {
        currentMonthIndex.value = e.detail.value;
        fetchData();
      };
      const formatMoney = (value) => {
        if (value === void 0 || value === null)
          return "\xA50.00";
        return `\xA5${(value / 100).toFixed(2)}`;
      };
      vue.onMounted(() => {
        fetchData();
      });
      return (_ctx, _cache) => {
        const _component_uni_load_more = resolveEasycom(vue.resolveDynamicComponent("uni-load-more"), __easycom_0);
        return vue.openBlock(), vue.createElementBlock("view", { class: "wallet-page" }, [
          vue.createCommentVNode(" \u7EDF\u8BA1\u5361\u7247\uFF1A\u4E0A\u65B9\u4E24\u5217\uFF0C\u4E0B\u65B9\u5168\u5BBD\uFF08\u603B\u6536\u5165\u72EC\u7ACB\u6837\u5F0F\uFF09 "),
          vue.createElementVNode("view", { class: "stats-grid" }, [
            vue.createCommentVNode(" \u7B2C\u4E00\u884C\uFF1A\u603B\u8BA2\u5355\u91D1\u989D + \u5E73\u53F0\u62BD\u6210 "),
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList([vue.unref(stats)[1], vue.unref(stats)[2]], (stat) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "stat-card",
                key: stat.label
              }, [
                vue.createElementVNode("view", {
                  class: vue.normalizeClass(["stat-icon", stat.iconClass])
                }, [
                  vue.createElementVNode("text", {
                    class: vue.normalizeClass(["iconfont", stat.icon])
                  }, null, 2)
                ], 2),
                vue.createElementVNode("view", { class: "stat-info" }, [
                  vue.createElementVNode("text", { class: "stat-label" }, vue.toDisplayString(stat.label), 1),
                  vue.createElementVNode("text", { class: "stat-value" }, vue.toDisplayString(formatMoney(stat.value)), 1)
                ])
              ]);
            }), 128)),
            vue.createCommentVNode(" \u7B2C\u4E8C\u884C\uFF1A\u603B\u6536\u5165\uFF08\u72EC\u7ACB\u6837\u5F0F\uFF0C\u5C45\u4E2D\u3001\u6E10\u53D8\u80CC\u666F\u3001\u9192\u76EE\u56FE\u6807\uFF09 "),
            vue.createElementVNode("view", { class: "stat-card income-card full-width" }, [
              vue.createElementVNode("view", { class: "stat-icon income-icon-special" }, [
                vue.createElementVNode("text", { class: "iconfont icon-jinbi" })
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode("text", { class: "stat-label" }, "\u603B\u6536\u5165"),
                vue.createElementVNode("text", { class: "stat-value income-value" }, vue.toDisplayString(formatMoney(vue.unref(stats)[0].value)), 1)
              ])
            ])
          ]),
          vue.createCommentVNode(" \u6708\u4EFD\u7B5B\u9009\u5668\uFF08\u4F7F\u7528 picker\uFF09 "),
          vue.createElementVNode("view", { class: "filter-bar" }, [
            vue.createElementVNode("picker", {
              range: monthOptions,
              "range-key": "text",
              onChange: onMonthChange
            }, [
              vue.createElementVNode("view", { class: "picker-btn" }, [
                vue.createElementVNode("text", null, vue.toDisplayString(monthOptions[currentMonthIndex.value].text), 1),
                vue.createElementVNode("text", { class: "uni-icon uni-icon-arrowdown" })
              ])
            ], 32)
          ]),
          vue.createCommentVNode(" \u8D26\u5355\u5217\u8868\uFF08scroll-view + \u4E0B\u62C9\u5237\u65B0\uFF09 "),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "bill-scroll",
            "refresher-enabled": true,
            "refresher-triggered": loading.value,
            onRefresherrefresh: onRefresh
          }, [
            monthlyData.value.length === 0 && !loading.value ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "empty-state"
            }, [
              vue.createElementVNode("text", null, "\u6682\u65E0\u8D26\u5355\u6570\u636E")
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "bill-list"
            }, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(monthlyData.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "bill-item",
                  key: item.id
                }, [
                  vue.createElementVNode("view", { class: "bill-header" }, [
                    vue.createElementVNode("text", { class: "bill-month" }, vue.toDisplayString(item.year) + "\u5E74" + vue.toDisplayString(item.month) + "\u6708", 1),
                    vue.createElementVNode("text", {
                      class: vue.normalizeClass(["bill-status", item.status === 1 ? "status-success" : "status-danger"])
                    }, vue.toDisplayString(item.status === 1 ? "\u5DF2\u53D1\u653E" : "\u672A\u53D1\u653E"), 3)
                  ]),
                  vue.createElementVNode("view", { class: "bill-details" }, [
                    vue.createElementVNode("view", { class: "detail-row" }, [
                      vue.createElementVNode("text", null, "\u8BA2\u5355\u603B\u91D1\u989D"),
                      vue.createElementVNode("text", { class: "amount" }, vue.toDisplayString(formatMoney(item.totalOrderAmount)), 1)
                    ]),
                    vue.createElementVNode("view", { class: "detail-row" }, [
                      vue.createElementVNode("text", null, "\u53F8\u673A\u6536\u5165"),
                      vue.createElementVNode("text", { class: "amount income" }, vue.toDisplayString(formatMoney(item.driverIncome)), 1)
                    ]),
                    vue.createElementVNode("view", { class: "detail-row" }, [
                      vue.createElementVNode("text", null, "\u5E73\u53F0\u62BD\u6210"),
                      vue.createElementVNode("text", { class: "amount commission" }, vue.toDisplayString(formatMoney(item.platformCommission)), 1)
                    ])
                  ])
                ]);
              }), 128))
            ])),
            vue.createVNode(_component_uni_load_more, { status: loadMoreStatus.value }, null, 8, ["status"])
          ], 40, ["refresher-triggered"])
        ]);
      };
    }
  };
  var PagesMonsy = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-938a3cc4"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/monsy.vue"]]);
  function obj2strClass(obj) {
    let classess = "";
    for (let key in obj) {
      const val = obj[key];
      if (val) {
        classess += `${key} `;
      }
    }
    return classess;
  }
  function obj2strStyle(obj) {
    let style = "";
    for (let key in obj) {
      const val = obj[key];
      style += `${key}:${val};`;
    }
    return style;
  }
  const _sfc_main$d = {
    name: "uni-easyinput",
    emits: [
      "click",
      "iconClick",
      "update:modelValue",
      "input",
      "focus",
      "blur",
      "confirm",
      "clear",
      "eyes",
      "change",
      "keyboardheightchange"
    ],
    model: {
      prop: "modelValue",
      event: "update:modelValue"
    },
    options: {
      virtualHost: true
    },
    inject: {
      form: {
        from: "uniForm",
        default: null
      },
      formItem: {
        from: "uniFormItem",
        default: null
      }
    },
    props: {
      name: String,
      value: [Number, String],
      modelValue: [Number, String],
      type: {
        type: String,
        default: "text"
      },
      clearable: {
        type: Boolean,
        default: true
      },
      autoHeight: {
        type: Boolean,
        default: false
      },
      placeholder: {
        type: String,
        default: " "
      },
      placeholderStyle: String,
      focus: {
        type: Boolean,
        default: false
      },
      disabled: {
        type: Boolean,
        default: false
      },
      maxlength: {
        type: [Number, String],
        default: 140
      },
      confirmType: {
        type: String,
        default: "done"
      },
      clearSize: {
        type: [Number, String],
        default: 24
      },
      inputBorder: {
        type: Boolean,
        default: true
      },
      prefixIcon: {
        type: String,
        default: ""
      },
      suffixIcon: {
        type: String,
        default: ""
      },
      trim: {
        type: [Boolean, String],
        default: false
      },
      cursorSpacing: {
        type: Number,
        default: 0
      },
      passwordIcon: {
        type: Boolean,
        default: true
      },
      adjustPosition: {
        type: Boolean,
        default: true
      },
      primaryColor: {
        type: String,
        default: "#2979ff"
      },
      styles: {
        type: Object,
        default() {
          return {
            color: "#333",
            backgroundColor: "#fff",
            disableColor: "#F7F6F6",
            borderColor: "#e5e5e5"
          };
        }
      },
      errorMessage: {
        type: [String, Boolean],
        default: ""
      }
    },
    data() {
      return {
        focused: false,
        val: "",
        showMsg: "",
        border: false,
        isFirstBorder: false,
        showClearIcon: false,
        showPassword: false,
        focusShow: false,
        localMsg: "",
        isEnter: false
      };
    },
    computed: {
      isVal() {
        const val = this.val;
        if (val || val === 0) {
          return true;
        }
        return false;
      },
      msg() {
        return this.localMsg || this.errorMessage;
      },
      inputMaxlength() {
        return Number(this.maxlength);
      },
      boxStyle() {
        return `color:${this.inputBorder && this.msg ? "#e43d33" : this.styles.color};`;
      },
      inputContentClass() {
        return obj2strClass({
          "is-input-border": this.inputBorder,
          "is-input-error-border": this.inputBorder && this.msg,
          "is-textarea": this.type === "textarea",
          "is-disabled": this.disabled,
          "is-focused": this.focusShow
        });
      },
      inputContentStyle() {
        const focusColor = this.focusShow ? this.primaryColor : this.styles.borderColor;
        const borderColor = this.inputBorder && this.msg ? "#dd524d" : focusColor;
        return obj2strStyle({
          "border-color": borderColor || "#e5e5e5",
          "background-color": this.disabled ? this.styles.disableColor : this.styles.backgroundColor
        });
      },
      inputStyle() {
        const paddingRight = this.type === "password" || this.clearable || this.prefixIcon ? "" : "10px";
        return obj2strStyle({
          "padding-right": paddingRight,
          "padding-left": this.prefixIcon ? "" : "10px",
          ...this.styles
        });
      }
    },
    watch: {
      value(newVal) {
        if (newVal === null) {
          this.val = "";
          return;
        }
        this.val = newVal;
      },
      modelValue(newVal) {
        if (newVal === null) {
          this.val = "";
          return;
        }
        this.val = newVal;
      },
      focus(newVal) {
        this.$nextTick(() => {
          this.focused = this.focus;
          this.focusShow = this.focus;
        });
      }
    },
    created() {
      this.init();
      if (this.form && this.formItem) {
        this.$watch("formItem.errMsg", (newVal) => {
          this.localMsg = newVal;
        });
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.focused = this.focus;
        this.focusShow = this.focus;
      });
    },
    methods: {
      init() {
        if (this.value || this.value === 0) {
          this.val = this.value;
        } else if (this.modelValue || this.modelValue === 0 || this.modelValue === "") {
          this.val = this.modelValue;
        } else {
          this.val = "";
        }
      },
      onClickIcon(type) {
        this.$emit("iconClick", type);
      },
      onEyes() {
        this.showPassword = !this.showPassword;
        this.$emit("eyes", this.showPassword);
      },
      onInput(event) {
        let value = event.detail.value;
        if (this.trim) {
          if (typeof this.trim === "boolean" && this.trim) {
            value = this.trimStr(value);
          }
          if (typeof this.trim === "string") {
            value = this.trimStr(value, this.trim);
          }
        }
        if (this.errMsg)
          this.errMsg = "";
        this.val = value;
        this.$emit("input", value);
        this.$emit("update:modelValue", value);
      },
      onFocus() {
        this.$nextTick(() => {
          this.focused = true;
        });
        this.$emit("focus", null);
      },
      _Focus(event) {
        this.focusShow = true;
        this.$emit("focus", event);
      },
      onBlur() {
        this.focused = false;
        this.$emit("blur", null);
      },
      _Blur(event) {
        event.detail.value;
        this.focusShow = false;
        this.$emit("blur", event);
        if (this.isEnter === false) {
          this.$emit("change", this.val);
        }
        if (this.form && this.formItem) {
          const { validateTrigger } = this.form;
          if (validateTrigger === "blur") {
            this.formItem.onFieldChange();
          }
        }
      },
      onConfirm(e) {
        this.$emit("confirm", this.val);
        this.isEnter = true;
        this.$emit("change", this.val);
        this.$nextTick(() => {
          this.isEnter = false;
        });
      },
      onClear(event) {
        this.val = "";
        this.$emit("input", "");
        this.$emit("update:modelValue", "");
        this.$emit("clear");
      },
      onkeyboardheightchange(event) {
        this.$emit("keyboardheightchange", event);
      },
      trimStr(str, pos = "both") {
        if (pos === "both") {
          return str.trim();
        } else if (pos === "left") {
          return str.trimLeft();
        } else if (pos === "right") {
          return str.trimRight();
        } else if (pos === "start") {
          return str.trimStart();
        } else if (pos === "end") {
          return str.trimEnd();
        } else if (pos === "all") {
          return str.replace(/\s+/g, "");
        } else if (pos === "none") {
          return str;
        }
        return str;
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
    return vue.openBlock(), vue.createElementBlock("view", {
      class: vue.normalizeClass(["uni-easyinput", { "uni-easyinput-error": $options.msg }]),
      style: vue.normalizeStyle($options.boxStyle)
    }, [
      vue.createElementVNode("view", {
        class: vue.normalizeClass(["uni-easyinput__content", $options.inputContentClass]),
        style: vue.normalizeStyle($options.inputContentStyle)
      }, [
        $props.prefixIcon ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
          key: 0,
          class: "content-clear-icon",
          type: $props.prefixIcon,
          color: "#c0c4cc",
          onClick: _cache[0] || (_cache[0] = ($event) => $options.onClickIcon("prefix")),
          size: "22"
        }, null, 8, ["type"])) : vue.createCommentVNode("v-if", true),
        vue.renderSlot(_ctx.$slots, "left", {}, void 0, true),
        $props.type === "textarea" ? (vue.openBlock(), vue.createElementBlock("textarea", {
          key: 1,
          class: vue.normalizeClass(["uni-easyinput__content-textarea", { "input-padding": $props.inputBorder }]),
          name: $props.name,
          value: $data.val,
          placeholder: $props.placeholder,
          placeholderStyle: $props.placeholderStyle,
          disabled: $props.disabled,
          "placeholder-class": "uni-easyinput__placeholder-class",
          maxlength: $options.inputMaxlength,
          focus: $data.focused,
          autoHeight: $props.autoHeight,
          "cursor-spacing": $props.cursorSpacing,
          "adjust-position": $props.adjustPosition,
          onInput: _cache[1] || (_cache[1] = (...args) => $options.onInput && $options.onInput(...args)),
          onBlur: _cache[2] || (_cache[2] = (...args) => $options._Blur && $options._Blur(...args)),
          onFocus: _cache[3] || (_cache[3] = (...args) => $options._Focus && $options._Focus(...args)),
          onConfirm: _cache[4] || (_cache[4] = (...args) => $options.onConfirm && $options.onConfirm(...args)),
          onKeyboardheightchange: _cache[5] || (_cache[5] = (...args) => $options.onkeyboardheightchange && $options.onkeyboardheightchange(...args))
        }, null, 42, ["name", "value", "placeholder", "placeholderStyle", "disabled", "maxlength", "focus", "autoHeight", "cursor-spacing", "adjust-position"])) : (vue.openBlock(), vue.createElementBlock("input", {
          key: 2,
          type: $props.type === "password" ? "text" : $props.type,
          class: "uni-easyinput__content-input",
          style: vue.normalizeStyle($options.inputStyle),
          name: $props.name,
          value: $data.val,
          password: !$data.showPassword && $props.type === "password",
          placeholder: $props.placeholder,
          placeholderStyle: $props.placeholderStyle,
          "placeholder-class": "uni-easyinput__placeholder-class",
          disabled: $props.disabled,
          maxlength: $options.inputMaxlength,
          focus: $data.focused,
          confirmType: $props.confirmType,
          "cursor-spacing": $props.cursorSpacing,
          "adjust-position": $props.adjustPosition,
          onFocus: _cache[6] || (_cache[6] = (...args) => $options._Focus && $options._Focus(...args)),
          onBlur: _cache[7] || (_cache[7] = (...args) => $options._Blur && $options._Blur(...args)),
          onInput: _cache[8] || (_cache[8] = (...args) => $options.onInput && $options.onInput(...args)),
          onConfirm: _cache[9] || (_cache[9] = (...args) => $options.onConfirm && $options.onConfirm(...args)),
          onKeyboardheightchange: _cache[10] || (_cache[10] = (...args) => $options.onkeyboardheightchange && $options.onkeyboardheightchange(...args))
        }, null, 44, ["type", "name", "value", "password", "placeholder", "placeholderStyle", "disabled", "maxlength", "focus", "confirmType", "cursor-spacing", "adjust-position"])),
        $props.type === "password" && $props.passwordIcon ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 3 }, [
          vue.createCommentVNode(" \u5F00\u542F\u5BC6\u7801\u65F6\u663E\u793A\u5C0F\u773C\u775B "),
          $options.isVal ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
            key: 0,
            class: vue.normalizeClass(["content-clear-icon", { "is-textarea-icon": $props.type === "textarea" }]),
            type: $data.showPassword ? "eye-slash-filled" : "eye-filled",
            size: 22,
            color: $data.focusShow ? $props.primaryColor : "#c0c4cc",
            onClick: $options.onEyes
          }, null, 8, ["class", "type", "color", "onClick"])) : vue.createCommentVNode("v-if", true)
        ], 64)) : vue.createCommentVNode("v-if", true),
        $props.suffixIcon ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 4 }, [
          $props.suffixIcon ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
            key: 0,
            class: "content-clear-icon",
            type: $props.suffixIcon,
            color: "#c0c4cc",
            onClick: _cache[11] || (_cache[11] = ($event) => $options.onClickIcon("suffix")),
            size: "22"
          }, null, 8, ["type"])) : vue.createCommentVNode("v-if", true)
        ], 64)) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 5 }, [
          $props.clearable && $options.isVal && !$props.disabled && $props.type !== "textarea" ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
            key: 0,
            class: vue.normalizeClass(["content-clear-icon", { "is-textarea-icon": $props.type === "textarea" }]),
            type: "clear",
            size: $props.clearSize,
            color: $options.msg ? "#dd524d" : $data.focusShow ? $props.primaryColor : "#c0c4cc",
            onClick: $options.onClear
          }, null, 8, ["class", "size", "color", "onClick"])) : vue.createCommentVNode("v-if", true)
        ], 64)),
        vue.renderSlot(_ctx.$slots, "right", {}, void 0, true)
      ], 6)
    ], 6);
  }
  var __easycom_2$1 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$6], ["__scopeId", "data-v-20076044"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-easyinput/uni-easyinput.vue"]]);
  const _sfc_main$c = {
    name: "uniFormsItem",
    options: {
      virtualHost: true
    },
    provide() {
      return {
        uniFormItem: this
      };
    },
    inject: {
      form: {
        from: "uniForm",
        default: null
      }
    },
    props: {
      rules: {
        type: Array,
        default() {
          return null;
        }
      },
      name: {
        type: [String, Array],
        default: ""
      },
      required: {
        type: Boolean,
        default: false
      },
      label: {
        type: String,
        default: ""
      },
      labelWidth: {
        type: [String, Number],
        default: ""
      },
      labelAlign: {
        type: String,
        default: ""
      },
      errorMessage: {
        type: [String, Boolean],
        default: ""
      },
      leftIcon: String,
      iconColor: {
        type: String,
        default: "#606266"
      }
    },
    data() {
      return {
        errMsg: "",
        userRules: null,
        localLabelAlign: "left",
        localLabelWidth: "70px",
        localLabelPos: "left",
        border: false,
        isFirstBorder: false
      };
    },
    computed: {
      msg() {
        return this.errorMessage || this.errMsg;
      }
    },
    watch: {
      "form.formRules"(val) {
        this.init();
      },
      "form.labelWidth"(val) {
        this.localLabelWidth = this._labelWidthUnit(val);
      },
      "form.labelPosition"(val) {
        this.localLabelPos = this._labelPosition();
      },
      "form.labelAlign"(val) {
      }
    },
    created() {
      this.init(true);
      if (this.name && this.form) {
        this.$watch(
          () => {
            const val = this.form._getDataValue(this.name, this.form.localData);
            return val;
          },
          (value, oldVal) => {
            const isEqual2 = this.form._isEqual(value, oldVal);
            if (!isEqual2) {
              const val = this.itemSetValue(value);
              this.onFieldChange(val, false);
            }
          },
          {
            immediate: false
          }
        );
      }
    },
    unmounted() {
      this.__isUnmounted = true;
      this.unInit();
    },
    methods: {
      setRules(rules = null) {
        this.userRules = rules;
        this.init(false);
      },
      setValue() {
      },
      async onFieldChange(value, formtrigger = true) {
        const {
          formData,
          localData,
          errShowType,
          validateCheck,
          validateTrigger,
          _isRequiredField,
          _realName
        } = this.form;
        const name = _realName(this.name);
        if (!value) {
          value = this.form.formData[name];
        }
        const ruleLen = this.itemRules.rules && this.itemRules.rules.length;
        if (!this.validator || !ruleLen || ruleLen === 0)
          return;
        const isRequiredField2 = _isRequiredField(this.itemRules.rules || []);
        let result = null;
        if (validateTrigger === "bind" || formtrigger) {
          result = await this.validator.validateUpdate(
            {
              [name]: value
            },
            formData
          );
          if (!isRequiredField2 && (value === void 0 || value === "")) {
            result = null;
          }
          if (result && result.errorMessage) {
            if (errShowType === "undertext") {
              this.errMsg = !result ? "" : result.errorMessage;
            }
            if (errShowType === "toast") {
              uni.showToast({
                title: result.errorMessage || "\u6821\u9A8C\u9519\u8BEF",
                icon: "none"
              });
            }
            if (errShowType === "modal") {
              uni.showModal({
                title: "\u63D0\u793A",
                content: result.errorMessage || "\u6821\u9A8C\u9519\u8BEF"
              });
            }
          } else {
            this.errMsg = "";
          }
          validateCheck(result ? result : null);
        } else {
          this.errMsg = "";
        }
        return result ? result : null;
      },
      init(type = false) {
        const {
          validator,
          formRules,
          childrens,
          formData,
          localData,
          _realName,
          labelWidth,
          _getDataValue,
          _setDataValue
        } = this.form || {};
        this.localLabelAlign = this._justifyContent();
        this.localLabelWidth = this._labelWidthUnit(labelWidth);
        this.localLabelPos = this._labelPosition();
        this.form && type && childrens.push(this);
        if (!validator || !formRules)
          return;
        if (!this.form.isFirstBorder) {
          this.form.isFirstBorder = true;
          this.isFirstBorder = true;
        }
        if (this.group) {
          if (!this.group.isFirstBorder) {
            this.group.isFirstBorder = true;
            this.isFirstBorder = true;
          }
        }
        this.border = this.form.border;
        const name = _realName(this.name);
        const itemRule = this.userRules || this.rules;
        if (typeof formRules === "object" && itemRule) {
          formRules[name] = {
            rules: itemRule
          };
          validator.updateSchema(formRules);
        }
        const itemRules = formRules[name] || {};
        this.itemRules = itemRules;
        this.validator = validator;
        this.itemSetValue(_getDataValue(this.name, localData));
      },
      unInit() {
        if (this.form) {
          const {
            childrens,
            formData,
            _realName
          } = this.form;
          childrens.forEach((item, index) => {
            if (item === this) {
              this.form.childrens.splice(index, 1);
              delete formData[_realName(item.name)];
            }
          });
        }
      },
      itemSetValue(value) {
        const name = this.form._realName(this.name);
        const rules = this.itemRules.rules || [];
        const val = this.form._getValue(name, value, rules);
        this.form._setDataValue(name, this.form.formData, val);
        return val;
      },
      clearValidate() {
        this.errMsg = "";
      },
      _isRequired() {
        return this.required;
      },
      _justifyContent() {
        if (this.form) {
          const {
            labelAlign
          } = this.form;
          let labelAli = this.labelAlign ? this.labelAlign : labelAlign;
          if (labelAli === "left")
            return "flex-start";
          if (labelAli === "center")
            return "center";
          if (labelAli === "right")
            return "flex-end";
        }
        return "flex-start";
      },
      _labelWidthUnit(labelWidth) {
        return this.num2px(this.labelWidth ? this.labelWidth : labelWidth || (this.label ? 70 : "auto"));
      },
      _labelPosition() {
        if (this.form)
          return this.form.labelPosition || "left";
        return "left";
      },
      isTrigger(rule, itemRlue, parentRule) {
        if (rule === "submit" || !rule) {
          if (rule === void 0) {
            if (itemRlue !== "bind") {
              if (!itemRlue) {
                return parentRule === "" ? "bind" : "submit";
              }
              return "submit";
            }
            return "bind";
          }
          return "submit";
        }
        return "bind";
      },
      num2px(num) {
        if (typeof num === "number") {
          return `${num}px`;
        }
        return num;
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: vue.normalizeClass(["uni-forms-item", ["is-direction-" + $data.localLabelPos, $data.border ? "uni-forms-item--border" : "", $data.border && $data.isFirstBorder ? "is-first-border" : ""]])
    }, [
      vue.renderSlot(_ctx.$slots, "label", {}, () => [
        vue.createElementVNode("view", {
          class: vue.normalizeClass(["uni-forms-item__label", { "no-label": !$props.label && !$props.required }]),
          style: vue.normalizeStyle({ width: $data.localLabelWidth, justifyContent: $data.localLabelAlign })
        }, [
          $props.required ? (vue.openBlock(), vue.createElementBlock("text", {
            key: 0,
            class: "is-required"
          }, "*")) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("text", null, vue.toDisplayString($props.label), 1)
        ], 6)
      ], true),
      vue.createElementVNode("view", { class: "uni-forms-item__content" }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
        vue.createElementVNode("view", {
          class: vue.normalizeClass(["uni-forms-item__error", { "msg--active": $options.msg }])
        }, [
          vue.createElementVNode("text", null, vue.toDisplayString($options.msg), 1)
        ], 2)
      ])
    ], 2);
  }
  var __easycom_3 = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$5], ["__scopeId", "data-v-1359f286"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-forms-item/uni-forms-item.vue"]]);
  var pattern = {
    email: /^\S+?@\S+?\.\S+?$/,
    idcard: /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
    url: new RegExp(
      "^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$",
      "i"
    )
  };
  const FORMAT_MAPPING = {
    "int": "integer",
    "bool": "boolean",
    "double": "number",
    "long": "number",
    "password": "string"
  };
  function formatMessage(args, resources = "") {
    var defaultMessage = ["label"];
    defaultMessage.forEach((item) => {
      if (args[item] === void 0) {
        args[item] = "";
      }
    });
    let str = resources;
    for (let key in args) {
      let reg = new RegExp("{" + key + "}");
      str = str.replace(reg, args[key]);
    }
    return str;
  }
  function isEmptyValue(value, type) {
    if (value === void 0 || value === null) {
      return true;
    }
    if (typeof value === "string" && !value) {
      return true;
    }
    if (Array.isArray(value) && !value.length) {
      return true;
    }
    if (type === "object" && !Object.keys(value).length) {
      return true;
    }
    return false;
  }
  const types = {
    integer(value) {
      return types.number(value) && parseInt(value, 10) === value;
    },
    string(value) {
      return typeof value === "string";
    },
    number(value) {
      if (isNaN(value)) {
        return false;
      }
      return typeof value === "number";
    },
    "boolean": function(value) {
      return typeof value === "boolean";
    },
    "float": function(value) {
      return types.number(value) && !types.integer(value);
    },
    array(value) {
      return Array.isArray(value);
    },
    object(value) {
      return typeof value === "object" && !types.array(value);
    },
    date(value) {
      return value instanceof Date;
    },
    timestamp(value) {
      if (!this.integer(value) || Math.abs(value).toString().length > 16) {
        return false;
      }
      return true;
    },
    file(value) {
      return typeof value.url === "string";
    },
    email(value) {
      return typeof value === "string" && !!value.match(pattern.email) && value.length < 255;
    },
    url(value) {
      return typeof value === "string" && !!value.match(pattern.url);
    },
    pattern(reg, value) {
      try {
        return new RegExp(reg).test(value);
      } catch (e) {
        return false;
      }
    },
    method(value) {
      return typeof value === "function";
    },
    idcard(value) {
      return typeof value === "string" && !!value.match(pattern.idcard);
    },
    "url-https"(value) {
      return this.url(value) && value.startsWith("https://");
    },
    "url-scheme"(value) {
      return value.startsWith("://");
    },
    "url-web"(value) {
      return false;
    }
  };
  class RuleValidator {
    constructor(message) {
      this._message = message;
    }
    async validateRule(fieldKey, fieldValue, value, data, allData) {
      var result = null;
      let rules = fieldValue.rules;
      let hasRequired = rules.findIndex((item) => {
        return item.required;
      });
      if (hasRequired < 0) {
        if (value === null || value === void 0) {
          return result;
        }
        if (typeof value === "string" && !value.length) {
          return result;
        }
      }
      var message = this._message;
      if (rules === void 0) {
        return message["default"];
      }
      for (var i = 0; i < rules.length; i++) {
        let rule = rules[i];
        let vt = this._getValidateType(rule);
        Object.assign(rule, {
          label: fieldValue.label || `["${fieldKey}"]`
        });
        if (RuleValidatorHelper[vt]) {
          result = RuleValidatorHelper[vt](rule, value, message);
          if (result != null) {
            break;
          }
        }
        if (rule.validateExpr) {
          let now2 = Date.now();
          let resultExpr = rule.validateExpr(value, allData, now2);
          if (resultExpr === false) {
            result = this._getMessage(rule, rule.errorMessage || this._message["default"]);
            break;
          }
        }
        if (rule.validateFunction) {
          result = await this.validateFunction(rule, value, data, allData, vt);
          if (result !== null) {
            break;
          }
        }
      }
      if (result !== null) {
        result = message.TAG + result;
      }
      return result;
    }
    async validateFunction(rule, value, data, allData, vt) {
      let result = null;
      try {
        let callbackMessage = null;
        const res = await rule.validateFunction(rule, value, allData || data, (message) => {
          callbackMessage = message;
        });
        if (callbackMessage || typeof res === "string" && res || res === false) {
          result = this._getMessage(rule, callbackMessage || res, vt);
        }
      } catch (e) {
        result = this._getMessage(rule, e.message, vt);
      }
      return result;
    }
    _getMessage(rule, message, vt) {
      return formatMessage(rule, message || rule.errorMessage || this._message[vt] || message["default"]);
    }
    _getValidateType(rule) {
      var result = "";
      if (rule.required) {
        result = "required";
      } else if (rule.format) {
        result = "format";
      } else if (rule.arrayType) {
        result = "arrayTypeFormat";
      } else if (rule.range) {
        result = "range";
      } else if (rule.maximum !== void 0 || rule.minimum !== void 0) {
        result = "rangeNumber";
      } else if (rule.maxLength !== void 0 || rule.minLength !== void 0) {
        result = "rangeLength";
      } else if (rule.pattern) {
        result = "pattern";
      } else if (rule.validateFunction) {
        result = "validateFunction";
      }
      return result;
    }
  }
  const RuleValidatorHelper = {
    required(rule, value, message) {
      if (rule.required && isEmptyValue(value, rule.format || typeof value)) {
        return formatMessage(rule, rule.errorMessage || message.required);
      }
      return null;
    },
    range(rule, value, message) {
      const {
        range,
        errorMessage
      } = rule;
      let list = new Array(range.length);
      for (let i = 0; i < range.length; i++) {
        const item = range[i];
        if (types.object(item) && item.value !== void 0) {
          list[i] = item.value;
        } else {
          list[i] = item;
        }
      }
      let result = false;
      if (Array.isArray(value)) {
        result = new Set(value.concat(list)).size === list.length;
      } else {
        if (list.indexOf(value) > -1) {
          result = true;
        }
      }
      if (!result) {
        return formatMessage(rule, errorMessage || message["enum"]);
      }
      return null;
    },
    rangeNumber(rule, value, message) {
      if (!types.number(value)) {
        return formatMessage(rule, rule.errorMessage || message.pattern.mismatch);
      }
      let {
        minimum,
        maximum,
        exclusiveMinimum,
        exclusiveMaximum
      } = rule;
      let min = exclusiveMinimum ? value <= minimum : value < minimum;
      let max = exclusiveMaximum ? value >= maximum : value > maximum;
      if (minimum !== void 0 && min) {
        return formatMessage(rule, rule.errorMessage || message["number"][exclusiveMinimum ? "exclusiveMinimum" : "minimum"]);
      } else if (maximum !== void 0 && max) {
        return formatMessage(rule, rule.errorMessage || message["number"][exclusiveMaximum ? "exclusiveMaximum" : "maximum"]);
      } else if (minimum !== void 0 && maximum !== void 0 && (min || max)) {
        return formatMessage(rule, rule.errorMessage || message["number"].range);
      }
      return null;
    },
    rangeLength(rule, value, message) {
      if (!types.string(value) && !types.array(value)) {
        return formatMessage(rule, rule.errorMessage || message.pattern.mismatch);
      }
      let min = rule.minLength;
      let max = rule.maxLength;
      let val = value.length;
      if (min !== void 0 && val < min) {
        return formatMessage(rule, rule.errorMessage || message["length"].minLength);
      } else if (max !== void 0 && val > max) {
        return formatMessage(rule, rule.errorMessage || message["length"].maxLength);
      } else if (min !== void 0 && max !== void 0 && (val < min || val > max)) {
        return formatMessage(rule, rule.errorMessage || message["length"].range);
      }
      return null;
    },
    pattern(rule, value, message) {
      if (!types["pattern"](rule.pattern, value)) {
        return formatMessage(rule, rule.errorMessage || message.pattern.mismatch);
      }
      return null;
    },
    format(rule, value, message) {
      var customTypes = Object.keys(types);
      var format = FORMAT_MAPPING[rule.format] ? FORMAT_MAPPING[rule.format] : rule.format || rule.arrayType;
      if (customTypes.indexOf(format) > -1) {
        if (!types[format](value)) {
          return formatMessage(rule, rule.errorMessage || message.typeError);
        }
      }
      return null;
    },
    arrayTypeFormat(rule, value, message) {
      if (!Array.isArray(value)) {
        return formatMessage(rule, rule.errorMessage || message.typeError);
      }
      for (let i = 0; i < value.length; i++) {
        const element = value[i];
        let formatResult = this.format(rule, element, message);
        if (formatResult !== null) {
          return formatResult;
        }
      }
      return null;
    }
  };
  class SchemaValidator extends RuleValidator {
    constructor(schema, options) {
      super(SchemaValidator.message);
      this._schema = schema;
      this._options = options || null;
    }
    updateSchema(schema) {
      this._schema = schema;
    }
    async validate(data, allData) {
      let result = this._checkFieldInSchema(data);
      if (!result) {
        result = await this.invokeValidate(data, false, allData);
      }
      return result.length ? result[0] : null;
    }
    async validateAll(data, allData) {
      let result = this._checkFieldInSchema(data);
      if (!result) {
        result = await this.invokeValidate(data, true, allData);
      }
      return result;
    }
    async validateUpdate(data, allData) {
      let result = this._checkFieldInSchema(data);
      if (!result) {
        result = await this.invokeValidateUpdate(data, false, allData);
      }
      return result.length ? result[0] : null;
    }
    async invokeValidate(data, all, allData) {
      let result = [];
      let schema = this._schema;
      for (let key in schema) {
        let value = schema[key];
        let errorMessage = await this.validateRule(key, value, data[key], data, allData);
        if (errorMessage != null) {
          result.push({
            key,
            errorMessage
          });
          if (!all)
            break;
        }
      }
      return result;
    }
    async invokeValidateUpdate(data, all, allData) {
      let result = [];
      for (let key in data) {
        let errorMessage = await this.validateRule(key, this._schema[key], data[key], data, allData);
        if (errorMessage != null) {
          result.push({
            key,
            errorMessage
          });
          if (!all)
            break;
        }
      }
      return result;
    }
    _checkFieldInSchema(data) {
      var keys = Object.keys(data);
      var keys2 = Object.keys(this._schema);
      if (new Set(keys.concat(keys2)).size === keys2.length) {
        return "";
      }
      var noExistFields = keys.filter((key) => {
        return keys2.indexOf(key) < 0;
      });
      var errorMessage = formatMessage({
        field: JSON.stringify(noExistFields)
      }, SchemaValidator.message.TAG + SchemaValidator.message["defaultInvalid"]);
      return [{
        key: "invalid",
        errorMessage
      }];
    }
  }
  function Message() {
    return {
      TAG: "",
      default: "\u9A8C\u8BC1\u9519\u8BEF",
      defaultInvalid: "\u63D0\u4EA4\u7684\u5B57\u6BB5{field}\u5728\u6570\u636E\u5E93\u4E2D\u5E76\u4E0D\u5B58\u5728",
      validateFunction: "\u9A8C\u8BC1\u65E0\u6548",
      required: "{label}\u5FC5\u586B",
      "enum": "{label}\u8D85\u51FA\u8303\u56F4",
      timestamp: "{label}\u683C\u5F0F\u65E0\u6548",
      whitespace: "{label}\u4E0D\u80FD\u4E3A\u7A7A",
      typeError: "{label}\u7C7B\u578B\u65E0\u6548",
      date: {
        format: "{label}\u65E5\u671F{value}\u683C\u5F0F\u65E0\u6548",
        parse: "{label}\u65E5\u671F\u65E0\u6CD5\u89E3\u6790,{value}\u65E0\u6548",
        invalid: "{label}\u65E5\u671F{value}\u65E0\u6548"
      },
      length: {
        minLength: "{label}\u957F\u5EA6\u4E0D\u80FD\u5C11\u4E8E{minLength}",
        maxLength: "{label}\u957F\u5EA6\u4E0D\u80FD\u8D85\u8FC7{maxLength}",
        range: "{label}\u5FC5\u987B\u4ECB\u4E8E{minLength}\u548C{maxLength}\u4E4B\u95F4"
      },
      number: {
        minimum: "{label}\u4E0D\u80FD\u5C0F\u4E8E{minimum}",
        maximum: "{label}\u4E0D\u80FD\u5927\u4E8E{maximum}",
        exclusiveMinimum: "{label}\u4E0D\u80FD\u5C0F\u4E8E\u7B49\u4E8E{minimum}",
        exclusiveMaximum: "{label}\u4E0D\u80FD\u5927\u4E8E\u7B49\u4E8E{maximum}",
        range: "{label}\u5FC5\u987B\u4ECB\u4E8E{minimum}and{maximum}\u4E4B\u95F4"
      },
      pattern: {
        mismatch: "{label}\u683C\u5F0F\u4E0D\u5339\u914D"
      }
    };
  }
  SchemaValidator.message = new Message();
  const deepCopy = (val) => {
    return JSON.parse(JSON.stringify(val));
  };
  const typeFilter = (format) => {
    return format === "int" || format === "double" || format === "number" || format === "timestamp";
  };
  const getValue = (key, value, rules) => {
    const isRuleNumType = rules.find((val) => val.format && typeFilter(val.format));
    const isRuleBoolType = rules.find((val) => val.format && val.format === "boolean" || val.format === "bool");
    if (!!isRuleNumType) {
      if (!value && value !== 0) {
        value = null;
      } else {
        value = isNumber(Number(value)) ? Number(value) : value;
      }
    }
    if (!!isRuleBoolType) {
      value = isBoolean(value) ? value : false;
    }
    return value;
  };
  const setDataValue = (field, formdata, value) => {
    formdata[field] = value;
    return value || "";
  };
  const getDataValue = (field, data) => {
    return objGet(data, field);
  };
  const realName = (name, data = {}) => {
    const base_name = _basePath(name);
    if (typeof base_name === "object" && Array.isArray(base_name) && base_name.length > 1) {
      const realname = base_name.reduce((a, b) => a += `#${b}`, "_formdata_");
      return realname;
    }
    return base_name[0] || name;
  };
  const isRealName = (name) => {
    const reg = /^_formdata_#*/;
    return reg.test(name);
  };
  const rawData = (object = {}, name) => {
    let newData = JSON.parse(JSON.stringify(object));
    let formData = {};
    for (let i in newData) {
      let path = name2arr(i);
      objSet(formData, path, newData[i]);
    }
    return formData;
  };
  const name2arr = (name) => {
    let field = name.replace("_formdata_#", "");
    field = field.split("#").map((v) => isNumber(v) ? Number(v) : v);
    return field;
  };
  const objSet = (object, path, value) => {
    if (typeof object !== "object")
      return object;
    _basePath(path).reduce((o, k, i, _) => {
      if (i === _.length - 1) {
        o[k] = value;
        return null;
      } else if (k in o) {
        return o[k];
      } else {
        o[k] = /^[0-9]{1,}$/.test(_[i + 1]) ? [] : {};
        return o[k];
      }
    }, object);
    return object;
  };
  function _basePath(path) {
    if (Array.isArray(path))
      return path;
    return path.replace(/\[/g, ".").replace(/\]/g, "").split(".");
  }
  const objGet = (object, path, defaultVal = "undefined") => {
    let newPath = _basePath(path);
    let val = newPath.reduce((o, k) => {
      return (o || {})[k];
    }, object);
    return !val || val !== void 0 ? val : defaultVal;
  };
  const isNumber = (num) => {
    return !isNaN(Number(num));
  };
  const isBoolean = (bool) => {
    return typeof bool === "boolean";
  };
  const isRequiredField = (rules) => {
    let isNoField = false;
    for (let i = 0; i < rules.length; i++) {
      const ruleData = rules[i];
      if (ruleData.required) {
        isNoField = true;
        break;
      }
    }
    return isNoField;
  };
  const isEqual = (a, b) => {
    if (a === b) {
      return a !== 0 || 1 / a === 1 / b;
    }
    if (a == null || b == null) {
      return a === b;
    }
    var classNameA = toString.call(a), classNameB = toString.call(b);
    if (classNameA !== classNameB) {
      return false;
    }
    switch (classNameA) {
      case "[object RegExp]":
      case "[object String]":
        return "" + a === "" + b;
      case "[object Number]":
        if (+a !== +a) {
          return +b !== +b;
        }
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case "[object Date]":
      case "[object Boolean]":
        return +a === +b;
    }
    if (classNameA == "[object Object]") {
      var propsA = Object.getOwnPropertyNames(a), propsB = Object.getOwnPropertyNames(b);
      if (propsA.length != propsB.length) {
        return false;
      }
      for (var i = 0; i < propsA.length; i++) {
        var propName = propsA[i];
        if (a[propName] !== b[propName]) {
          return false;
        }
      }
      return true;
    }
    if (classNameA == "[object Array]") {
      if (a.toString() == b.toString()) {
        return true;
      }
      return false;
    }
  };
  const _sfc_main$b = {
    name: "uniForms",
    emits: ["validate", "submit"],
    options: {
      virtualHost: true
    },
    props: {
      value: {
        type: Object,
        default() {
          return null;
        }
      },
      modelValue: {
        type: Object,
        default() {
          return null;
        }
      },
      model: {
        type: Object,
        default() {
          return null;
        }
      },
      rules: {
        type: Object,
        default() {
          return {};
        }
      },
      errShowType: {
        type: String,
        default: "undertext"
      },
      validateTrigger: {
        type: String,
        default: "submit"
      },
      labelPosition: {
        type: String,
        default: "left"
      },
      labelWidth: {
        type: [String, Number],
        default: ""
      },
      labelAlign: {
        type: String,
        default: "left"
      },
      border: {
        type: Boolean,
        default: false
      }
    },
    provide() {
      return {
        uniForm: this
      };
    },
    data() {
      return {
        formData: {},
        formRules: {}
      };
    },
    computed: {
      localData() {
        const localVal = this.model || this.modelValue || this.value;
        if (localVal) {
          return deepCopy(localVal);
        }
        return {};
      }
    },
    watch: {
      rules: {
        handler: function(val, oldVal) {
          this.setRules(val);
        },
        deep: true,
        immediate: true
      }
    },
    created() {
      let getbinddata = getApp().$vm.$.appContext.config.globalProperties.binddata;
      if (!getbinddata) {
        getApp().$vm.$.appContext.config.globalProperties.binddata = function(name, value, formName) {
          if (formName) {
            this.$refs[formName].setValue(name, value);
          } else {
            let formVm;
            for (let i in this.$refs) {
              const vm = this.$refs[i];
              if (vm && vm.$options && vm.$options.name === "uniForms") {
                formVm = vm;
                break;
              }
            }
            if (!formVm)
              return console.error("\u5F53\u524D uni-froms \u7EC4\u4EF6\u7F3A\u5C11 ref \u5C5E\u6027");
            if (formVm.model)
              formVm.model[name] = value;
            if (formVm.modelValue)
              formVm.modelValue[name] = value;
            if (formVm.value)
              formVm.value[name] = value;
          }
        };
      }
      this.childrens = [];
      this.inputChildrens = [];
      this.setRules(this.rules);
    },
    methods: {
      setRules(rules) {
        this.formRules = Object.assign({}, this.formRules, rules);
        this.validator = new SchemaValidator(rules);
      },
      setValue(key, value) {
        let example = this.childrens.find((child) => child.name === key);
        if (!example)
          return null;
        this.formData[key] = getValue(key, value, this.formRules[key] && this.formRules[key].rules || []);
        return example.onFieldChange(this.formData[key]);
      },
      validate(keepitem, callback) {
        return this.checkAll(this.formData, keepitem, callback);
      },
      validateField(props = [], callback) {
        props = [].concat(props);
        let invalidFields = {};
        this.childrens.forEach((item) => {
          const name = realName(item.name);
          if (props.indexOf(name) !== -1) {
            invalidFields = Object.assign({}, invalidFields, {
              [name]: this.formData[name]
            });
          }
        });
        return this.checkAll(invalidFields, [], callback);
      },
      clearValidate(props = []) {
        props = [].concat(props);
        this.childrens.forEach((item) => {
          if (props.length === 0) {
            item.errMsg = "";
          } else {
            const name = realName(item.name);
            if (props.indexOf(name) !== -1) {
              item.errMsg = "";
            }
          }
        });
      },
      submit(keepitem, callback, type) {
        for (let i in this.dataValue) {
          const itemData = this.childrens.find((v) => v.name === i);
          if (itemData) {
            if (this.formData[i] === void 0) {
              this.formData[i] = this._getValue(i, this.dataValue[i]);
            }
          }
        }
        if (!type) {
          console.warn("submit \u65B9\u6CD5\u5373\u5C06\u5E9F\u5F03\uFF0C\u8BF7\u4F7F\u7528validate\u65B9\u6CD5\u4EE3\u66FF\uFF01");
        }
        return this.checkAll(this.formData, keepitem, callback, "submit");
      },
      async checkAll(invalidFields, keepitem, callback, type) {
        if (!this.validator)
          return;
        let childrens = [];
        for (let i in invalidFields) {
          const item = this.childrens.find((v) => realName(v.name) === i);
          if (item) {
            childrens.push(item);
          }
        }
        if (!callback && typeof keepitem === "function") {
          callback = keepitem;
        }
        let promise;
        if (!callback && typeof callback !== "function" && Promise) {
          promise = new Promise((resolve, reject) => {
            callback = function(valid, invalidFields2) {
              !valid ? resolve(invalidFields2) : reject(valid);
            };
          });
        }
        let results = [];
        let tempFormData = JSON.parse(JSON.stringify(invalidFields));
        for (let i in childrens) {
          const child = childrens[i];
          let name = realName(child.name);
          const result = await child.onFieldChange(tempFormData[name]);
          if (result) {
            results.push(result);
            if (this.errShowType === "toast" || this.errShowType === "modal")
              break;
          }
        }
        if (Array.isArray(results)) {
          if (results.length === 0)
            results = null;
        }
        if (Array.isArray(keepitem)) {
          keepitem.forEach((v) => {
            let vName = realName(v);
            let value = getDataValue(v, this.localData);
            if (value !== void 0) {
              tempFormData[vName] = value;
            }
          });
        }
        if (type === "submit") {
          this.$emit("submit", {
            detail: {
              value: tempFormData,
              errors: results
            }
          });
        } else {
          this.$emit("validate", results);
        }
        let resetFormData = {};
        resetFormData = rawData(tempFormData, this.name);
        callback && typeof callback === "function" && callback(results, resetFormData);
        if (promise && callback) {
          return promise;
        } else {
          return null;
        }
      },
      validateCheck(result) {
        this.$emit("validate", result);
      },
      _getValue: getValue,
      _isRequiredField: isRequiredField,
      _setDataValue: setDataValue,
      _getDataValue: getDataValue,
      _realName: realName,
      _isRealName: isRealName,
      _isEqual: isEqual
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-forms" }, [
      vue.createElementVNode("form", null, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ])
    ]);
  }
  var __easycom_4 = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$4], ["__scopeId", "data-v-5a49926c"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-forms/uni-forms.vue"]]);
  const _sfc_main$a = {
    name: "UniCard",
    emits: ["click"],
    props: {
      title: {
        type: String,
        default: ""
      },
      subTitle: {
        type: String,
        default: ""
      },
      padding: {
        type: String,
        default: "10px"
      },
      margin: {
        type: String,
        default: "15px"
      },
      spacing: {
        type: String,
        default: "0 10px"
      },
      extra: {
        type: String,
        default: ""
      },
      cover: {
        type: String,
        default: ""
      },
      thumbnail: {
        type: String,
        default: ""
      },
      isFull: {
        type: Boolean,
        default: false
      },
      isShadow: {
        type: Boolean,
        default: true
      },
      shadow: {
        type: String,
        default: "0px 0px 3px 1px rgba(0, 0, 0, 0.08)"
      },
      border: {
        type: Boolean,
        default: true
      }
    },
    methods: {
      onClick(type) {
        this.$emit("click", type);
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: vue.normalizeClass(["uni-card", { "uni-card--full": $props.isFull, "uni-card--shadow": $props.isShadow, "uni-card--border": $props.border }]),
      style: vue.normalizeStyle({ "margin": $props.isFull ? 0 : $props.margin, "padding": $props.spacing, "box-shadow": $props.isShadow ? $props.shadow : "" })
    }, [
      vue.createCommentVNode(" \u5C01\u9762 "),
      vue.renderSlot(_ctx.$slots, "cover", {}, () => [
        $props.cover ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uni-card__cover"
        }, [
          vue.createElementVNode("image", {
            class: "uni-card__cover-image",
            mode: "widthFix",
            onClick: _cache[0] || (_cache[0] = ($event) => $options.onClick("cover")),
            src: $props.cover
          }, null, 8, ["src"])
        ])) : vue.createCommentVNode("v-if", true)
      ], true),
      vue.renderSlot(_ctx.$slots, "title", {}, () => [
        $props.title || $props.extra ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "uni-card__header"
        }, [
          vue.createCommentVNode(" \u5361\u7247\u6807\u9898 "),
          vue.createElementVNode("view", {
            class: "uni-card__header-box",
            onClick: _cache[1] || (_cache[1] = ($event) => $options.onClick("title"))
          }, [
            $props.thumbnail ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "uni-card__header-avatar"
            }, [
              vue.createElementVNode("image", {
                class: "uni-card__header-avatar-image",
                src: $props.thumbnail,
                mode: "aspectFit"
              }, null, 8, ["src"])
            ])) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", { class: "uni-card__header-content" }, [
              vue.createElementVNode("text", { class: "uni-card__header-content-title uni-ellipsis" }, vue.toDisplayString($props.title), 1),
              $props.title && $props.subTitle ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 0,
                class: "uni-card__header-content-subtitle uni-ellipsis"
              }, vue.toDisplayString($props.subTitle), 1)) : vue.createCommentVNode("v-if", true)
            ])
          ]),
          vue.createElementVNode("view", {
            class: "uni-card__header-extra",
            onClick: _cache[2] || (_cache[2] = ($event) => $options.onClick("extra"))
          }, [
            vue.createElementVNode("text", { class: "uni-card__header-extra-text" }, vue.toDisplayString($props.extra), 1)
          ])
        ])) : vue.createCommentVNode("v-if", true)
      ], true),
      vue.createCommentVNode(" \u5361\u7247\u5185\u5BB9 "),
      vue.createElementVNode("view", {
        class: "uni-card__content",
        style: vue.normalizeStyle({ padding: $props.padding }),
        onClick: _cache[3] || (_cache[3] = ($event) => $options.onClick("content"))
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ], 4),
      vue.createElementVNode("view", {
        class: "uni-card__actions",
        onClick: _cache[4] || (_cache[4] = ($event) => $options.onClick("actions"))
      }, [
        vue.renderSlot(_ctx.$slots, "actions", {}, void 0, true)
      ])
    ], 6);
  }
  var __easycom_5 = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$3], ["__scopeId", "data-v-80554eb4"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-card/uni-card.vue"]]);
  const _sfc_main$9 = {
    __name: "myInfo",
    setup(__props) {
      const globalUserInfo = getApp().globalData.userInfo || {};
      const genderMap = { 0: "\u672A\u77E5", 1: "\u7537", 2: "\u5973" };
      const taxiDriverMap = { 0: "\u5426", 1: "\u662F" };
      const commercialTypeMap = { 1: "\u5168\u804C", 2: "\u517C\u804C" };
      const stateMap = { 0: "\u6B63\u5E38", 1: "\u505C\u7528", 2: "\u5F85\u5BA1\u6838" };
      const getFullName = () => {
        const surname = globalUserInfo.driverSurname || "";
        const name = globalUserInfo.driverName || "";
        if (name && surname && name.startsWith(surname)) {
          return name;
        }
        return surname + name;
      };
      const formData = vue.reactive({
        fullName: getFullName(),
        driverPhone: globalUserInfo.driverPhone || "",
        genderText: genderMap[globalUserInfo.driverGender] || "\u672A\u77E5",
        driverNation: globalUserInfo.driverNation || "",
        driverBirthday: globalUserInfo.driverBirthday || "",
        driverContactAddress: globalUserInfo.driverContactAddress || "",
        registerDate: globalUserInfo.registerDate || "",
        licenseId: globalUserInfo.licenseId || "",
        getDriverLicenseDate: globalUserInfo.getDriverLicenseDate || "",
        driverLicensePeriod: `${globalUserInfo.driverLicenseOn || ""} \u81F3 ${globalUserInfo.driverLicenseOff || ""}`,
        taxiDriverText: taxiDriverMap[globalUserInfo.taxiDriver] || "\u5426",
        certificateNo: globalUserInfo.certificateNo || "",
        networkCarIssueOrganization: globalUserInfo.networkCarIssueOrganization || "",
        networkCarIssueDate: globalUserInfo.networkCarIssueDate || "",
        networkCarProofPeriod: `${globalUserInfo.networkCarProofOn || ""} \u81F3 ${globalUserInfo.networkCarProofOff || ""}`,
        contractCompany: globalUserInfo.contractCompany || "",
        commercialTypeText: commercialTypeMap[globalUserInfo.commercialType] || "\u672A\u77E5",
        contractPeriod: `${globalUserInfo.contractOn || ""} \u81F3 ${globalUserInfo.contractOff || ""}`,
        stateText: stateMap[globalUserInfo.state] || "\u672A\u77E5"
      });
      return (_ctx, _cache) => {
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
        const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_2$1);
        const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_3);
        const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4);
        const _component_uni_card = resolveEasycom(vue.resolveDynamicComponent("uni-card"), __easycom_5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "personal-info-page" }, [
          vue.createCommentVNode(" \u9875\u9762\u6807\u9898 "),
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "page-title" }, "\u4E2A\u4EBA\u4FE1\u606F"),
            vue.createElementVNode("text", { class: "page-subtitle" }, "\u4FE1\u606F\u53EA\u8BFB\uFF0C\u4E0D\u53EF\u4FEE\u6539")
          ]),
          vue.createCommentVNode(" \u57FA\u672C\u4FE1\u606F\u5361\u7247 "),
          vue.createVNode(_component_uni_card, {
            "is-full": true,
            class: "info-card",
            border: false
          }, {
            title: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "person",
                  size: "20",
                  color: "#3c7e8c"
                }),
                vue.createElementVNode("text", null, "\u57FA\u672C\u4FE1\u606F")
              ])
            ]),
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_forms, {
                model: formData,
                "label-width": "140"
              }, {
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms_item, { label: "\u59D3\u540D" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.fullName,
                        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => formData.fullName = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u624B\u673A\u53F7" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.driverPhone,
                        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => formData.driverPhone = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u6027\u522B" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.genderText,
                        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => formData.genderText = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u6C11\u65CF" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.driverNation,
                        "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => formData.driverNation = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u51FA\u751F\u65E5\u671F" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.driverBirthday,
                        "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => formData.driverBirthday = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u901A\u4FE1\u5730\u5740" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.driverContactAddress,
                        "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => formData.driverContactAddress = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u6CE8\u518C\u65E5\u671F" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.registerDate,
                        "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => formData.registerDate = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])
            ]),
            _: 1
          }),
          vue.createCommentVNode(" \u9A7E\u9A76\u8BC1\u4FE1\u606F\u5361\u7247 "),
          vue.createVNode(_component_uni_card, {
            "is-full": true,
            class: "info-card",
            border: false
          }, {
            title: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "starhalf",
                  size: "20",
                  color: "#3c7e8c"
                }),
                vue.createElementVNode("text", null, "\u9A7E\u9A76\u8BC1\u4FE1\u606F")
              ])
            ]),
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_forms, {
                model: formData,
                "label-width": "140"
              }, {
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms_item, { label: "\u9A7E\u9A76\u8BC1\u53F7" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.licenseId,
                        "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => formData.licenseId = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u521D\u6B21\u9886\u8BC1\u65E5\u671F" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.getDriverLicenseDate,
                        "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => formData.getDriverLicenseDate = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u9A7E\u9A76\u8BC1\u6709\u6548\u671F" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.driverLicensePeriod,
                        "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => formData.driverLicensePeriod = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u51FA\u79DF\u8F66\u9A7E\u9A76\u5458" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.taxiDriverText,
                        "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => formData.taxiDriverText = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])
            ]),
            _: 1
          }),
          vue.createCommentVNode(" \u7F51\u7EA6\u8F66\u8D44\u683C\u8BC1\u5361\u7247 "),
          vue.createVNode(_component_uni_card, {
            "is-full": true,
            class: "info-card",
            border: false
          }, {
            title: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "paperplane",
                  size: "20",
                  color: "#3c7e8c"
                }),
                vue.createElementVNode("text", null, "\u7F51\u7EA6\u8F66\u8D44\u683C\u8BC1")
              ])
            ]),
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_forms, {
                model: formData,
                "label-width": "140"
              }, {
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms_item, { label: "\u8D44\u683C\u8BC1\u53F7" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.certificateNo,
                        "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => formData.certificateNo = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u53D1\u8BC1\u673A\u6784" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.networkCarIssueOrganization,
                        "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => formData.networkCarIssueOrganization = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u53D1\u8BC1\u65E5\u671F" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.networkCarIssueDate,
                        "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => formData.networkCarIssueDate = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u6709\u6548\u671F" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.networkCarProofPeriod,
                        "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => formData.networkCarProofPeriod = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])
            ]),
            _: 1
          }),
          vue.createCommentVNode(" \u5408\u540C\u4FE1\u606F\u5361\u7247 "),
          vue.createVNode(_component_uni_card, {
            "is-full": true,
            class: "info-card",
            border: false
          }, {
            title: vue.withCtx(() => [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "email-filled",
                  size: "20",
                  color: "#3c7e8c"
                }),
                vue.createElementVNode("text", null, "\u5408\u540C\u4FE1\u606F")
              ])
            ]),
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_forms, {
                model: formData,
                "label-width": "140"
              }, {
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms_item, { label: "\u5408\u7EA6\u516C\u53F8" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.contractCompany,
                        "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => formData.contractCompany = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u5408\u540C\u7C7B\u578B" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.commercialTypeText,
                        "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => formData.commercialTypeText = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u5408\u540C\u6709\u6548\u671F" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.contractPeriod,
                        "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => formData.contractPeriod = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(_component_uni_forms_item, { label: "\u5F53\u524D\u72B6\u6001" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.stateText,
                        "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => formData.stateText = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])
            ]),
            _: 1
          })
        ]);
      };
    }
  };
  var PagesMyInfo = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-9a6b9a04"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/myInfo.vue"]]);
  const _sfc_main$8 = {
    __name: "setOperatingCity",
    setup(__props) {
      const $store = useStore();
      const userInfo2 = vue.computed(() => $store.state.userInfo);
      const cityList = vue.ref([]);
      const searchStr = vue.ref("");
      const selectedCityCode = vue.ref("");
      const selectedCityName = vue.ref("");
      const selectedAdCode = vue.ref("");
      const showList = vue.ref(false);
      const filterList = vue.computed(() => {
        if (!searchStr.value)
          return cityList.value;
        return cityList.value.filter((item) => item.name.includes(searchStr.value));
      });
      vue.onMounted(() => {
        getCityList();
        getCurrentCity();
      });
      const getCityList = () => {
        uni.request({
          method: "GET",
          url: `${MAP_CON.cityApiUrl}?subdistrict=2&key=${MAP_CON.cityKey}`,
          success(res) {
            cityList.value = formatCity2(res.data.districts[0].districts).sort((a, b) => {
              return a.name.localeCompare(b.name, "zh-CN");
            });
          },
          fail(err) {
            formatAppLog("log", "at pages/setOperatingCity.vue:93", "\u83B7\u53D6\u57CE\u5E02\u5217\u8868\u5931\u8D25", err);
          }
        });
      };
      const formatCity2 = (data) => {
        let arr = [];
        data.forEach((i) => {
          if (i.citycode.length) {
            arr.push(i);
          }
          if (i.districts.length) {
            arr = arr.concat(formatCity2(i.districts));
          }
        });
        return arr;
      };
      const getCurrentCity = async () => {
        const { error, result } = await ApiGetWorkStatus({ driverId: userInfo2.value.driverId });
        if (!error && result) {
          searchStr.value = result.adname;
          selectedCityCode.value = result.citycode;
          selectedCityName.value = result.adname;
        }
      };
      const handleCity = (item) => {
        formatAppLog("log", "at pages/setOperatingCity.vue:124", item);
        vue.nextTick(() => {
          searchStr.value = item.name;
          selectedCityCode.value = item.citycode;
          selectedCityName.value = item.name;
          selectedAdCode.value = item.adcode;
          showList.value = false;
        });
      };
      const handleBlur = () => {
        setTimeout(() => {
          showList.value = false;
        }, 200);
      };
      const handleSubmit = async () => {
        if (!selectedCityCode.value) {
          uni.showToast({ title: "\u8BF7\u5148\u9009\u62E9\u57CE\u5E02", icon: "none" });
          return;
        }
        const { error } = await ApiPostUpdateWorkCity({
          driverId: userInfo2.value.driverId,
          citycode: selectedCityCode.value,
          adname: selectedCityName.value,
          adcode: selectedAdCode.value
        });
        if (!error) {
          uni.showToast({ title: "\u63D0\u4EA4\u6210\u529F", icon: "success" });
          setTimeout(() => {
            uni.navigateBack({ delta: 1 });
          }, 600);
        } else {
          uni.showToast({ title: "\u63D0\u4EA4\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", icon: "none" });
        }
      };
      return (_ctx, _cache) => {
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
        const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_2$1);
        const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_3);
        const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4);
        const _component_uni_list_item = resolveEasycom(vue.resolveDynamicComponent("uni-list-item"), __easycom_4$1);
        const _component_uni_list = resolveEasycom(vue.resolveDynamicComponent("uni-list"), __easycom_5$1);
        const _component_uni_card = resolveEasycom(vue.resolveDynamicComponent("uni-card"), __easycom_5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "city-page" }, [
          vue.createCommentVNode(" \u9875\u9762\u6807\u9898 "),
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "page-title" }, "\u8BBE\u7F6E\u8FD0\u8425\u57CE\u5E02"),
            vue.createElementVNode("text", { class: "page-subtitle" }, "\u9009\u62E9\u60A8\u7684\u4E3B\u8981\u670D\u52A1\u533A\u57DF")
          ]),
          vue.createCommentVNode(" \u57CE\u5E02\u9009\u62E9\u5361\u7247 "),
          vue.createVNode(_component_uni_card, {
            "is-full": true,
            border: false,
            class: "city-card"
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_forms, { "label-width": "0" }, {
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms_item, null, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: searchStr.value,
                        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchStr.value = $event),
                        placeholder: "\u8BF7\u8F93\u5165\u57CE\u5E02\u540D\u79F0\u641C\u7D22",
                        clearable: "",
                        onFocus: _cache[1] || (_cache[1] = ($event) => showList.value = true),
                        onBlur: handleBlur
                      }, {
                        left: vue.withCtx(() => [
                          vue.createVNode(_component_uni_icons, {
                            type: "search",
                            size: "18",
                            color: "#86909c"
                          })
                        ]),
                        _: 1
                      }, 8, ["modelValue"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }),
              vue.createCommentVNode(" \u57CE\u5E02\u5217\u8868 "),
              vue.withDirectives(vue.createElementVNode("view", { class: "city-list-wrapper" }, [
                vue.createElementVNode("scroll-view", {
                  "scroll-y": "",
                  class: "city-list"
                }, [
                  vue.createVNode(_component_uni_list, { border: false }, {
                    default: vue.withCtx(() => [
                      (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(filterList), (item) => {
                        return vue.openBlock(), vue.createBlock(_component_uni_list_item, {
                          key: item.adcode,
                          title: item.name,
                          clickable: "",
                          onClick: ($event) => handleCity(item)
                        }, null, 8, ["title", "onClick"]);
                      }), 128))
                    ]),
                    _: 1
                  })
                ])
              ], 512), [
                [vue.vShow, showList.value && vue.unref(filterList).length]
              ]),
              vue.createCommentVNode(" \u65E0\u5339\u914D\u7ED3\u679C\u63D0\u793A "),
              showList.value && searchStr.value && !vue.unref(filterList).length ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "empty-tip"
              }, [
                vue.createVNode(_component_uni_icons, {
                  type: "search",
                  size: "32",
                  color: "#dee2e6"
                }),
                vue.createElementVNode("text", null, "\u672A\u627E\u5230\u76F8\u5173\u57CE\u5E02")
              ])) : vue.createCommentVNode("v-if", true)
            ]),
            _: 1
          }),
          vue.createCommentVNode(" \u63D0\u4EA4\u6309\u94AE "),
          vue.createElementVNode("view", { class: "submit-wrapper" }, [
            vue.createElementVNode("button", {
              class: "submit-btn",
              onClick: handleSubmit
            }, "\u4FDD\u5B58\u57CE\u5E02")
          ])
        ]);
      };
    }
  };
  var PagesSetOperatingCity = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-d44cfee4"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/setOperatingCity.vue"]]);
  const _sfc_main$7 = {
    __name: "orderInfo",
    setup(__props) {
      const orders = vue.ref([]);
      const currentFilter = vue.ref("all");
      const emptyText = vue.computed(() => {
        const map = {
          all: "\u6682\u65E0\u8BA2\u5355",
          ongoing: "\u6682\u65E0\u8FDB\u884C\u4E2D\u7684\u8BA2\u5355",
          completed: "\u6682\u65E0\u5DF2\u5B8C\u6210\u7684\u8BA2\u5355",
          canceled: "\u6682\u65E0\u5DF2\u53D6\u6D88\u7684\u8BA2\u5355"
        };
        return map[currentFilter.value] || "\u6682\u65E0\u8BA2\u5355";
      });
      onShow(() => {
        fetchAllOrders();
      });
      const fetchAllOrders = async () => {
        const { error, result } = await ApiGetAllOrderInfo();
        if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
          const filteredOrders2 = result.filter((order) => order.orderStatus !== 0);
          orders.value = filteredOrders2;
        }
      };
      const filterOrders = (status) => {
        currentFilter.value = status;
      };
      const filteredOrders = vue.computed(() => {
        if (currentFilter.value === "all")
          return orders.value;
        const statusMap = {
          ongoing: [3, 4, 5, 6],
          completed: [8],
          canceled: [9]
        };
        const allowedStatus = statusMap[currentFilter.value];
        return orders.value.filter((order) => allowedStatus.includes(order.orderStatus));
      });
      const getOrderStatusText = (status) => {
        switch (status) {
          case 1:
            return "\u5F85\u63A5\u5355";
          case 2:
            return "\u5DF2\u63A5\u5355";
          case 3:
          case 4:
          case 5:
          case 6:
            return "\u8FDB\u884C\u4E2D";
          case 7:
            return "\u5F85\u652F\u4ED8";
          case 8:
            return "\u5DF2\u5B8C\u6210";
          case 9:
            return "\u5DF2\u53D6\u6D88";
          default:
            return "\u8BA2\u5355\u65E0\u6548";
        }
      };
      const getOrderStatusClass = (status) => {
        switch (status) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            return "tag-warning";
          case 8:
            return "tag-success";
          case 9:
            return "tag-error";
          default:
            return "";
        }
      };
      const goToOrderDetail = (orderId2) => {
        uni.navigateTo({ url: `/pages/orderDetail?orderId=${orderId2}` });
      };
      const handleReceiveOrder = (arg) => {
        if (arg && arg.orderId) {
          uni.redirectTo({ url: `/pages/orderDetail?orderId=${arg.orderId}` });
        }
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "order-info" }, [
          vue.createCommentVNode(" \u9876\u90E8\u7B5B\u9009\u5206\u6BB5\u5668  "),
          vue.createElementVNode("view", { class: "top-scroll" }, [
            vue.createElementVNode("view", {
              class: vue.normalizeClass(["top-tab", { active: currentFilter.value === "all" }]),
              onClick: _cache[0] || (_cache[0] = ($event) => filterOrders("all"))
            }, "\u5168\u90E8", 2),
            vue.createElementVNode("view", {
              class: vue.normalizeClass(["top-tab", { active: currentFilter.value === "ongoing" }]),
              onClick: _cache[1] || (_cache[1] = ($event) => filterOrders("ongoing"))
            }, "\u8FDB\u884C\u4E2D", 2),
            vue.createElementVNode("view", {
              class: vue.normalizeClass(["top-tab", { active: currentFilter.value === "completed" }]),
              onClick: _cache[2] || (_cache[2] = ($event) => filterOrders("completed"))
            }, "\u5DF2\u5B8C\u6210", 2),
            vue.createElementVNode("view", {
              class: vue.normalizeClass(["top-tab", { active: currentFilter.value === "canceled" }]),
              onClick: _cache[3] || (_cache[3] = ($event) => filterOrders("canceled"))
            }, "\u5DF2\u53D6\u6D88", 2)
          ]),
          vue.createCommentVNode(" \u6D88\u606F\u7EC4\u4EF6 "),
          vue.createVNode(BSseMessage, { onReceiveOrder: handleReceiveOrder }),
          vue.createCommentVNode(" \u8BA2\u5355\u5217\u8868 "),
          vue.unref(filteredOrders).length ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "order-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(filteredOrders), (order) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: order.id,
                class: "order-item"
              }, [
                vue.createElementVNode("view", { class: "order-header" }, [
                  vue.createElementVNode("view", { class: "header-left" }, [
                    vue.createElementVNode("text", { class: "company-name" }, "\u8FC5\u5BB6\u51FA\u884C"),
                    vue.createCommentVNode(" \u81EA\u5B9A\u4E49\u6807\u7B7E "),
                    vue.createElementVNode("view", {
                      class: vue.normalizeClass(["order-tag", getOrderStatusClass(order.orderStatus)])
                    }, vue.toDisplayString(getOrderStatusText(order.orderStatus)), 3)
                  ]),
                  vue.createElementVNode("view", { class: "header-right" }, [
                    order.orderStatus == 8 || order.orderStatus == 7 ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 0,
                      class: "order-price"
                    }, vue.toDisplayString(order.price) + " \u5143", 1)) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("text", {
                      class: "iconfont icon-jinru",
                      onClick: ($event) => goToOrderDetail(order.id)
                    }, null, 8, ["onClick"])
                  ])
                ]),
                vue.createElementVNode("view", { class: "order-details" }, [
                  vue.createElementVNode("view", { class: "order-date" }, vue.toDisplayString(order.orderTime), 1),
                  vue.createElementVNode("view", { class: "route" }, [
                    vue.createElementVNode("view", { class: "start" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(order.departure), 1)
                    ]),
                    vue.createElementVNode("view", { class: "end" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(order.destination), 1)
                    ])
                  ])
                ])
              ]);
            }), 128))
          ])) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
            vue.createCommentVNode(" \u81EA\u5B9A\u4E49\u7A7A\u72B6\u6001 "),
            vue.createElementVNode("view", { class: "empty-state" }, [
              vue.createElementVNode("image", {
                class: "empty-image",
                src: "/static/empty-order.png",
                mode: "aspectFit"
              }),
              vue.createElementVNode("text", { class: "empty-text" }, vue.toDisplayString(vue.unref(emptyText)), 1)
            ])
          ], 2112))
        ]);
      };
    }
  };
  var PagesOrderInfo = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-62767948"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/orderInfo.vue"]]);
  const formatCity = (data) => {
    let arr = [];
    data.forEach((i) => {
      if (i.citycode.length) {
        arr.push(i);
      }
      if (i.districts.length) {
        arr = arr.concat(formatCity(i.districts));
      }
    });
    return arr;
  };
  const ApiGetCityList = () => _ToAsyncAwait(
    new Promise((res, rej) => {
      uni.request({
        method: "GET",
        url: `${MAP_CON.cityApiUrl}?subdistrict=2&key=${MAP_CON.cityKey}`,
        success(result) {
          res(
            formatCity(result.data.districts[0].districts).sort((a, b) => {
              return a.name.localeCompare(b.name, "zh-CN");
            })
          );
        },
        error(e) {
          rej(e);
        }
      });
    })
  );
  const _sfc_main$6 = {
    __name: "map",
    setup(__props) {
      const mapRef = vue.ref(null);
      const $store = useStore();
      let point = vue.computed(() => $store.state.point);
      let city = vue.computed(() => $store.state.city);
      let orderId2 = null;
      vue.onMounted(() => {
        getLocation();
        updatalocaltion();
      });
      vue.onUnmounted(() => {
        if (pointTimer) {
          clearTimeout(pointTimer);
          pointTimer = null;
          formatAppLog("log", "at pages/map.vue:28", "\u5B9A\u4F4D\u5B9A\u65F6\u5668\u5DF2\u6E05\u9664");
        }
      });
      let pointTimer = null;
      function updatalocaltion() {
        if (point != null) {
          formatAppLog("log", "at pages/map.vue:57", "map\u5730\u56FE\u4ECE\u4E3B\u9875\u54CD\u5E94\u53D8\u91CFpoint\u66F4\u65B0\u5F53\u524D\u4F4D\u7F6E");
          const location = {
            "center": [point.value.lng, point.value.lat],
            "accuracy": point.value.accuracy
          };
          mapRef.value.updateLocationMarker(location);
          pointTimer = setTimeout(() => {
            updatalocaltion();
          }, 6e3);
        }
      }
      function handleReceiveOrder(arg) {
        orderId2 = arg.orderId;
        uni.redirectTo({ url: `/pages/orderDetail?orderId=${orderId2}` });
      }
      async function getLocation() {
        const { error, result } = await ApiGetCityList();
        uni.getLocation({
          type: "gcj02",
          geocode: true,
          success(res) {
            formatAppLog("log", "at pages/map.vue:86", JSON.stringify(res));
            const { address, longitude, latitude, accuracy } = res;
            $store.commit("setCity", {
              adcode: result.find((i) => i.citycode === address.cityCode).adcode,
              cityCode: address.cityCode,
              name: address.city,
              center: `${longitude},${latitude}`,
              accuracy: `${accuracy}`,
              locationRes: true
            });
            setLocation();
          },
          fail(err) {
            formatAppLog("error", "at pages/map.vue:104", "\u83B7\u53D6\u4F4D\u7F6E\u4FE1\u606F\u5931\u8D25:", err);
            setLocation();
          }
        });
      }
      function setLocation() {
        if (!mapRef.value) {
          return;
        }
        const location = {
          "center": city.value.center.split(","),
          "accuracy": city.value.accuracy,
          "locationRes": city.value.locationRes
        };
        mapRef.value.setLocation(location);
        setTimeout(() => mapRef.value.clearDriving(), 500);
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "wrapper" }, [
          vue.createVNode(BSseMessage, { onReceiveOrder: handleReceiveOrder }),
          vue.createVNode(BMap, {
            ref_key: "mapRef",
            ref: mapRef
          }, null, 512)
        ]);
      };
    }
  };
  var PagesMap = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-9d2d96f0"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/map.vue"]]);
  const _sfc_main$5 = {
    name: "uniCollapseItem",
    props: {
      title: {
        type: String,
        default: ""
      },
      name: {
        type: [Number, String],
        default: ""
      },
      disabled: {
        type: Boolean,
        default: false
      },
      showAnimation: {
        type: Boolean,
        default: false
      },
      open: {
        type: Boolean,
        default: false
      },
      thumb: {
        type: String,
        default: ""
      },
      titleBorder: {
        type: String,
        default: "auto"
      },
      border: {
        type: Boolean,
        default: true
      },
      showArrow: {
        type: Boolean,
        default: true
      }
    },
    data() {
      const elId = `Uni_${Math.ceil(Math.random() * 1e6).toString(36)}`;
      return {
        isOpen: false,
        isheight: null,
        height: 0,
        elId,
        nameSync: 0
      };
    },
    watch: {
      open(val) {
        this.isOpen = val;
        this.onClick(val, "init");
      }
    },
    updated(e) {
      this.$nextTick(() => {
        this.init(true);
      });
    },
    created() {
      this.collapse = this.getCollapse();
      this.oldHeight = 0;
      this.onClick(this.open, "init");
    },
    unmounted() {
      this.__isUnmounted = true;
      this.uninstall();
    },
    mounted() {
      if (!this.collapse)
        return;
      if (this.name !== "") {
        this.nameSync = this.name;
      } else {
        this.nameSync = this.collapse.childrens.length + "";
      }
      if (this.collapse.names.indexOf(this.nameSync) === -1) {
        this.collapse.names.push(this.nameSync);
      } else {
        console.warn(`name \u503C ${this.nameSync} \u91CD\u590D`);
      }
      if (this.collapse.childrens.indexOf(this) === -1) {
        this.collapse.childrens.push(this);
      }
      this.init();
    },
    methods: {
      init(type) {
        this.getCollapseHeight(type);
      },
      uninstall() {
        if (this.collapse) {
          this.collapse.childrens.forEach((item, index) => {
            if (item === this) {
              this.collapse.childrens.splice(index, 1);
            }
          });
          this.collapse.names.forEach((item, index) => {
            if (item === this.nameSync) {
              this.collapse.names.splice(index, 1);
            }
          });
        }
      },
      onClick(isOpen, type) {
        if (this.disabled)
          return;
        this.isOpen = isOpen;
        if (this.isOpen && this.collapse) {
          this.collapse.setAccordion(this);
        }
        if (type !== "init") {
          this.collapse.onChange(isOpen, this);
        }
      },
      getCollapseHeight(type, index = 0) {
        const views = uni.createSelectorQuery().in(this);
        views.select(`#${this.elId}`).fields({
          size: true
        }, (data) => {
          if (index >= 10)
            return;
          if (!data) {
            index++;
            this.getCollapseHeight(false, index);
            return;
          }
          this.height = data.height;
          this.isheight = true;
          if (type)
            return;
          this.onClick(this.isOpen, "init");
        }).exec();
      },
      getNvueHwight(type) {
        dom.getComponentRect(this.$refs["collapse--hook"], (option) => {
          if (option && option.result && option.size) {
            this.height = option.size.height;
            this.isheight = true;
            if (type)
              return;
            this.onClick(this.open, "init");
          }
        });
      },
      getCollapse(name = "uniCollapse") {
        let parent = this.$parent;
        let parentName = parent.$options.name;
        while (parentName !== name) {
          parent = parent.$parent;
          if (!parent)
            return false;
          parentName = parent.$options.name;
        }
        return parent;
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-collapse-item" }, [
      vue.createCommentVNode(" onClick(!isOpen) "),
      vue.createElementVNode("view", {
        onClick: _cache[0] || (_cache[0] = ($event) => $options.onClick(!$data.isOpen)),
        class: vue.normalizeClass(["uni-collapse-item__title", { "is-open": $data.isOpen && $props.titleBorder === "auto", "uni-collapse-item-border": $props.titleBorder !== "none" }])
      }, [
        vue.createElementVNode("view", { class: "uni-collapse-item__title-wrap" }, [
          vue.renderSlot(_ctx.$slots, "title", {}, () => [
            vue.createElementVNode("view", {
              class: vue.normalizeClass(["uni-collapse-item__title-box", { "is-disabled": $props.disabled }])
            }, [
              $props.thumb ? (vue.openBlock(), vue.createElementBlock("image", {
                key: 0,
                src: $props.thumb,
                class: "uni-collapse-item__title-img"
              }, null, 8, ["src"])) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("text", { class: "uni-collapse-item__title-text" }, vue.toDisplayString($props.title), 1)
            ], 2)
          ], true)
        ]),
        $props.showArrow ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: vue.normalizeClass([{ "uni-collapse-item__title-arrow-active": $data.isOpen, "uni-collapse-item--animation": $props.showAnimation === true }, "uni-collapse-item__title-arrow"])
        }, [
          vue.createVNode(_component_uni_icons, {
            color: $props.disabled ? "#ddd" : "#bbb",
            size: "14",
            type: "bottom"
          }, null, 8, ["color"])
        ], 2)) : vue.createCommentVNode("v-if", true)
      ], 2),
      vue.createElementVNode("view", {
        class: vue.normalizeClass(["uni-collapse-item__wrap", { "is--transition": $props.showAnimation }]),
        style: vue.normalizeStyle({ height: ($data.isOpen ? $data.height : 0) + "px" })
      }, [
        vue.createElementVNode("view", {
          id: $data.elId,
          ref: "collapse--hook",
          class: vue.normalizeClass(["uni-collapse-item__wrap-content", { open: $data.isheight, "uni-collapse-item--border": $props.border && $data.isOpen }])
        }, [
          vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
        ], 10, ["id"])
      ], 6)
    ]);
  }
  var __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$2], ["__scopeId", "data-v-22afc074"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-collapse-item/uni-collapse-item.vue"]]);
  const _sfc_main$4 = {
    name: "uniCollapse",
    emits: ["change", "activeItem", "input", "update:modelValue"],
    props: {
      value: {
        type: [String, Array],
        default: ""
      },
      modelValue: {
        type: [String, Array],
        default: ""
      },
      accordion: {
        type: [Boolean, String],
        default: false
      }
    },
    data() {
      return {};
    },
    computed: {
      dataValue() {
        let value = typeof this.value === "string" && this.value === "" || Array.isArray(this.value) && this.value.length === 0;
        let modelValue = typeof this.modelValue === "string" && this.modelValue === "" || Array.isArray(this.modelValue) && this.modelValue.length === 0;
        if (value) {
          return this.modelValue;
        }
        if (modelValue) {
          return this.value;
        }
        return this.value;
      }
    },
    watch: {
      dataValue(val) {
        this.setOpen(val);
      }
    },
    created() {
      this.childrens = [];
      this.names = [];
    },
    mounted() {
      this.$nextTick(() => {
        this.setOpen(this.dataValue);
      });
    },
    methods: {
      setOpen(val) {
        let str = typeof val === "string";
        let arr = Array.isArray(val);
        this.childrens.forEach((vm, index) => {
          if (str) {
            if (val === vm.nameSync) {
              if (!this.accordion) {
                console.warn("accordion \u5C5E\u6027\u4E3A false ,v-model \u7C7B\u578B\u5E94\u8BE5\u4E3A array");
                return;
              }
              vm.isOpen = true;
            }
          }
          if (arr) {
            val.forEach((v) => {
              if (v === vm.nameSync) {
                if (this.accordion) {
                  console.warn("accordion \u5C5E\u6027\u4E3A true ,v-model \u7C7B\u578B\u5E94\u8BE5\u4E3A string");
                  return;
                }
                vm.isOpen = true;
              }
            });
          }
        });
        this.emit(val);
      },
      setAccordion(self) {
        if (!this.accordion)
          return;
        this.childrens.forEach((vm, index) => {
          if (self !== vm) {
            vm.isOpen = false;
          }
        });
      },
      resize() {
        this.childrens.forEach((vm, index) => {
          vm.getCollapseHeight();
        });
      },
      onChange(isOpen, self) {
        let activeItem = [];
        if (this.accordion) {
          activeItem = isOpen ? self.nameSync : "";
        } else {
          this.childrens.forEach((vm, index) => {
            if (vm.isOpen) {
              activeItem.push(vm.nameSync);
            }
          });
        }
        this.$emit("change", activeItem);
        this.emit(activeItem);
      },
      emit(val) {
        this.$emit("input", val);
        this.$emit("update:modelValue", val);
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-collapse" }, [
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
    ]);
  }
  var __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$1], ["__scopeId", "data-v-0cc15fc6"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/node_modules/@dcloudio/uni-ui/lib/uni-collapse/uni-collapse.vue"]]);
  const _sfc_main$3 = {
    __name: "termsAndRules",
    setup(__props) {
      return (_ctx, _cache) => {
        const _component_uni_card = resolveEasycom(vue.resolveDynamicComponent("uni-card"), __easycom_5);
        const _component_uni_collapse_item = resolveEasycom(vue.resolveDynamicComponent("uni-collapse-item"), __easycom_1);
        const _component_uni_collapse = resolveEasycom(vue.resolveDynamicComponent("uni-collapse"), __easycom_2);
        return vue.openBlock(), vue.createElementBlock("view", { class: "agreement-page" }, [
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "scroll-content"
          }, [
            vue.createCommentVNode(" \u5F15\u8A00 "),
            vue.createVNode(_component_uni_card, {
              "is-full": true,
              border: false,
              class: "intro-card"
            }, {
              default: vue.withCtx(() => [
                vue.createElementVNode("view", { class: "intro-content" }, [
                  vue.createElementVNode("text", { class: "intro-title" }, "\u6B22\u8FCE\u4F7F\u7528\u8FC5\u5BB6\u51FA\u884C\u53F8\u673A\u7AEF"),
                  vue.createElementVNode("text", { class: "intro-desc" }, "\u8FC5\u5BB6\u51FA\u884C\u81F4\u529B\u4E8E\u4E3A\u53F8\u673A\u63D0\u4F9B\u5B89\u5168\u3001\u9AD8\u6548\u3001\u516C\u5E73\u7684\u51FA\u884C\u670D\u52A1\u5E73\u53F0\u3002\u8BF7\u60A8\u5728\u4F7F\u7528\u672C\u5E73\u53F0\u524D\u4ED4\u7EC6\u9605\u8BFB\u5E76\u5145\u5206\u7406\u89E3\u672C\u534F\u8BAE\u7684\u5168\u90E8\u5185\u5BB9\u3002")
                ])
              ]),
              _: 1
            }),
            vue.createCommentVNode(" \u534F\u8BAE\u4E3B\u4F53\u5185\u5BB9 - \u4F7F\u7528\u6298\u53E0\u9762\u677F "),
            vue.createVNode(_component_uni_card, {
              "is-full": true,
              border: false,
              class: "agreement-card"
            }, {
              default: vue.withCtx(() => [
                vue.createVNode(_component_uni_collapse, {
                  ref: "collapse",
                  accordion: ""
                }, {
                  default: vue.withCtx(() => [
                    vue.createVNode(_component_uni_collapse_item, {
                      title: "\u4E00\u3001\u53F8\u673A\u5165\u9A7B\u4E0E\u8D44\u8D28\u8981\u6C42",
                      open: ""
                    }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "1.1 \u53F8\u673A\u5FC5\u987B\u5E74\u6EE121\u5468\u5C81\uFF0C\u6301\u6709\u6709\u6548\u7684\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u673A\u52A8\u8F66\u9A7E\u9A76\u8BC1\uFF08\u51C6\u9A7E\u8F66\u578B\u7B26\u5408\u5E73\u53F0\u8981\u6C42\uFF09\uFF0C\u4E14\u9A7E\u9F84\u4E0D\u4F4E\u4E8E3\u5E74\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "1.2 \u53F8\u673A\u9700\u63D0\u4F9B\u672C\u4EBA\u8EAB\u4EFD\u8BC1\u3001\u9A7E\u9A76\u8BC1\u3001\u884C\u9A76\u8BC1\u3001\u7F51\u7EDC\u9884\u7EA6\u51FA\u79DF\u6C7D\u8F66\u9A7E\u9A76\u5458\u8BC1\u7B49\u771F\u5B9E\u6709\u6548\u8BC1\u4EF6\uFF0C\u5E76\u786E\u4FDD\u5728\u670D\u52A1\u671F\u95F4\u6301\u7EED\u6709\u6548\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "1.3 \u8F66\u8F86\u9700\u7B26\u5408\u5F53\u5730\u7F51\u7EA6\u8F66\u8FD0\u8425\u6807\u51C6\uFF0C\u8F66\u51B5\u826F\u597D\uFF0C\u4FDD\u9669\u9F50\u5168\uFF08\u5305\u62EC\u4EA4\u5F3A\u9669\u3001\u5546\u4E1A\u7B2C\u4E09\u8005\u8D23\u4EFB\u9669\u7B49\uFF09\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "1.4 \u5E73\u53F0\u5BF9\u53F8\u673A\u8D44\u8D28\u8FDB\u884C\u5BA1\u6838\uFF0C\u5BA1\u6838\u901A\u8FC7\u540E\u65B9\u53EF\u63A5\u5355\u3002\u5982\u8D44\u8D28\u8FC7\u671F\u6216\u5931\u6548\uFF0C\u5E73\u53F0\u6709\u6743\u6682\u505C\u670D\u52A1\u76F4\u81F3\u91CD\u65B0\u5BA1\u6838\u901A\u8FC7\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u4E8C\u3001\u670D\u52A1\u89C4\u8303\u4E0E\u884C\u4E3A\u51C6\u5219" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "2.1 \u53F8\u673A\u5E94\u4FDD\u6301\u826F\u597D\u7684\u4EEA\u5BB9\u4EEA\u8868\uFF0C\u8F66\u8F86\u5185\u5916\u6574\u6D01\u536B\u751F\uFF0C\u4F7F\u7528\u6587\u660E\u7528\u8BED\uFF0C\u5C0A\u91CD\u4E58\u5BA2\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "2.2 \u63A5\u5355\u540E\u5E94\u53CA\u65F6\u8054\u7CFB\u4E58\u5BA2\u786E\u8BA4\u4E0A\u8F66\u4F4D\u7F6E\uFF0C\u51C6\u65F6\u5230\u8FBE\uFF0C\u4E0D\u5F97\u65E0\u6545\u62D2\u8F7D\u3001\u4E2D\u9014\u7529\u5BA2\u3001\u7ED5\u8DEF\u6216\u52A0\u4EF7\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "2.3 \u4E25\u683C\u6309\u7167\u5E73\u53F0\u5BFC\u822A\u8DEF\u7EBF\u884C\u9A76\uFF0C\u5982\u4E58\u5BA2\u8981\u6C42\u53D8\u66F4\u8DEF\u7EBF\uFF0C\u9700\u5F81\u5F97\u4E58\u5BA2\u540C\u610F\u5E76\u4FDD\u7559\u8BB0\u5F55\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "2.4 \u670D\u52A1\u8FC7\u7A0B\u4E2D\u4E0D\u5F97\u6709\u5438\u70DF\u3001\u996E\u9152\u3001\u4F7F\u7528\u624B\u673A\u7B49\u5371\u9669\u9A7E\u9A76\u884C\u4E3A\uFF0C\u4E0D\u5F97\u642D\u8F7D\u4E0E\u8BA2\u5355\u65E0\u5173\u7684\u4EBA\u5458\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "2.5 \u5982\u9047\u4E58\u5BA2\u9057\u5931\u7269\u54C1\uFF0C\u5E94\u4E3B\u52A8\u8054\u7CFB\u4E58\u5BA2\u5F52\u8FD8\uFF0C\u6216\u4E0A\u4EA4\u81F3\u5E73\u53F0\u5BA2\u670D\u5904\u7406\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u4E09\u3001\u8D39\u7528\u7ED3\u7B97\u4E0E\u5956\u52B1\u673A\u5236" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "3.1 \u5E73\u53F0\u6839\u636E\u8BA2\u5355\u5B9E\u9645\u91CC\u7A0B\u3001\u65F6\u957F\u53CA\u52A8\u6001\u6EA2\u4EF7\u8BA1\u7B97\u8F66\u8D39\uFF0C\u4E58\u5BA2\u652F\u4ED8\u540E\uFF0C\u5E73\u53F0\u5C06\u6309\u7EA6\u5B9A\u6BD4\u4F8B\u8FDB\u884C\u7ED3\u7B97\uFF0C\u901A\u5E38\u4E8E\u8BA2\u5355\u5B8C\u6210\u540E24\u5C0F\u65F6\u5185\u5230\u8D26\u53F8\u673A\u94B1\u5305\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "3.2 \u53F8\u673A\u53EF\u968F\u65F6\u7533\u8BF7\u63D0\u73B0\uFF0C\u63D0\u73B0\u624B\u7EED\u8D39\u53CA\u5230\u8D26\u65F6\u95F4\u4EE5\u5E73\u53F0\u516C\u793A\u4E3A\u51C6\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "3.3 \u5E73\u53F0\u53EF\u80FD\u6839\u636E\u8FD0\u8425\u6D3B\u52A8\u8BBE\u7F6E\u51B2\u5355\u5956\u52B1\u3001\u9AD8\u5CF0\u5956\u52B1\u3001\u670D\u52A1\u5206\u5956\u52B1\u7B49\uFF0C\u5177\u4F53\u89C4\u5219\u4EE5\u6D3B\u52A8\u9875\u9762\u8BF4\u660E\u4E3A\u51C6\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "3.4 \u82E5\u4E58\u5BA2\u6295\u8BC9\u6210\u7ACB\u6216\u53F8\u673A\u5B58\u5728\u8FDD\u89C4\u884C\u4E3A\uFF0C\u5E73\u53F0\u6709\u6743\u6263\u9664\u76F8\u5E94\u8D39\u7528\u6216\u53D6\u6D88\u5956\u52B1\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u56DB\u3001\u8FDD\u89C4\u5904\u7406\u4E0E\u4FE1\u7528\u4F53\u7CFB" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "4.1 \u5E73\u53F0\u5EFA\u7ACB\u53F8\u673A\u4FE1\u7528\u5206\u5236\u5EA6\uFF0C\u521D\u59CB\u5206\u4E3A12\u5206\uFF0C\u6839\u636E\u670D\u52A1\u8D28\u91CF\u3001\u8BA2\u5355\u5B8C\u6210\u7387\u3001\u4E58\u5BA2\u8BC4\u4EF7\u7B49\u8FDB\u884C\u52A8\u6001\u8C03\u6574\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "4.2 \u8FDD\u89C4\u884C\u4E3A\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\uFF1A\u62D2\u5355\u3001\u8FDF\u5230\u3001\u7ED5\u8DEF\u3001\u6001\u5EA6\u6076\u52A3\u3001\u5371\u9669\u9A7E\u9A76\u3001\u8FDD\u89C4\u6536\u8D39\u7B49\u3002\u6BCF\u6B21\u8FDD\u89C4\u5C06\u6263\u9664\u76F8\u5E94\u4FE1\u7528\u5206\uFF0C\u5E76\u53EF\u80FD\u6682\u505C\u670D\u52A1\u6743\u9650\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "4.3 \u4FE1\u7528\u5206\u4F4E\u4E8E6\u5206\u65F6\uFF0C\u5E73\u53F0\u5C06\u9650\u5236\u63A5\u5355\uFF1B\u4F4E\u4E8E0\u5206\u65F6\uFF0C\u6C38\u4E45\u7EC8\u6B62\u5408\u4F5C\u3002\u53F8\u673A\u53EF\u901A\u8FC7\u540E\u7EED\u4F18\u8D28\u670D\u52A1\u9010\u6B65\u6062\u590D\u4FE1\u7528\u5206\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "4.4 \u4E25\u91CD\u8FDD\u89C4\uFF08\u5982\u8FDD\u6CD5\u72AF\u7F6A\u3001\u4E25\u91CD\u4EA4\u901A\u4E8B\u6545\u3001\u6B3A\u8BC8\u7B49\uFF09\u5C06\u7ACB\u5373\u5C01\u7981\u8D26\u53F7\uFF0C\u5E76\u79FB\u4EA4\u53F8\u6CD5\u673A\u5173\u5904\u7406\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u4E94\u3001\u5E73\u53F0\u8D23\u4EFB\u4E0E\u514D\u8D23" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "5.1 \u5E73\u53F0\u4E3A\u53F8\u673A\u548C\u4E58\u5BA2\u63D0\u4F9B\u4FE1\u606F\u64AE\u5408\u670D\u52A1\uFF0C\u4E0D\u627F\u62C5\u5B9E\u9645\u8FD0\u8F93\u8FC7\u7A0B\u4E2D\u7684\u98CE\u9669\u3002\u53F8\u673A\u9700\u81EA\u884C\u627F\u62C5\u8FD0\u8425\u8FC7\u7A0B\u4E2D\u53EF\u80FD\u53D1\u751F\u7684\u4EA4\u901A\u4E8B\u6545\u3001\u4EBA\u8EAB\u4F24\u5BB3\u7B49\u8D23\u4EFB\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "5.2 \u56E0\u4E0D\u53EF\u6297\u529B\uFF08\u5982\u81EA\u7136\u707E\u5BB3\u3001\u653F\u5E9C\u7BA1\u5236\u3001\u7F51\u7EDC\u6545\u969C\u7B49\uFF09\u5BFC\u81F4\u670D\u52A1\u4E2D\u65AD\u6216\u635F\u5931\u7684\uFF0C\u5E73\u53F0\u4E0D\u627F\u62C5\u8D23\u4EFB\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "5.3 \u5E73\u53F0\u6709\u6743\u6839\u636E\u6CD5\u5F8B\u6CD5\u89C4\u6216\u4E1A\u52A1\u9700\u8981\u8C03\u6574\u534F\u8BAE\u5185\u5BB9\uFF0C\u5E76\u63D0\u524D\u516C\u793A\u3002\u5982\u53F8\u673A\u7EE7\u7EED\u4F7F\u7528\u5E73\u53F0\u670D\u52A1\uFF0C\u89C6\u4E3A\u540C\u610F\u4FEE\u6539\u540E\u7684\u534F\u8BAE\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u516D\u3001\u9690\u79C1\u4FDD\u62A4\u4E0E\u6570\u636E\u5B89\u5168" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "6.1 \u5E73\u53F0\u6536\u96C6\u53F8\u673A\u7684\u4E2A\u4EBA\u4FE1\u606F\u4EC5\u7528\u4E8E\u8EAB\u4EFD\u6838\u9A8C\u3001\u8BA2\u5355\u5339\u914D\u3001\u5B89\u5168\u4FDD\u969C\u53CA\u6CD5\u5F8B\u6CD5\u89C4\u8981\u6C42\uFF0C\u672A\u7ECF\u53F8\u673A\u540C\u610F\u4E0D\u4F1A\u5411\u7B2C\u4E09\u65B9\u63D0\u4F9B\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "6.2 \u53F8\u673A\u5E94\u59A5\u5584\u4FDD\u7BA1\u8D26\u53F7\u5BC6\u7801\uFF0C\u4E0D\u5F97\u5C06\u8D26\u53F7\u8F6C\u501F\u4ED6\u4EBA\u4F7F\u7528\u3002\u56E0\u8D26\u53F7\u6CC4\u9732\u9020\u6210\u7684\u635F\u5931\u7531\u53F8\u673A\u81EA\u884C\u627F\u62C5\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "6.3 \u5E73\u53F0\u91C7\u7528\u52A0\u5BC6\u6280\u672F\u4FDD\u62A4\u6570\u636E\u5B89\u5168\uFF0C\u4F46\u65E0\u6CD5\u4FDD\u8BC1\u7EDD\u5BF9\u5B89\u5168\u3002\u5982\u53D1\u751F\u6570\u636E\u6CC4\u9732\u4E8B\u4EF6\uFF0C\u5E73\u53F0\u5C06\u53CA\u65F6\u901A\u77E5\u5E76\u91C7\u53D6\u8865\u6551\u63AA\u65BD\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u4E03\u3001\u9644\u5219" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "7.1 \u672C\u534F\u8BAE\u81EA\u53F8\u673A\u70B9\u51FB\u201C\u540C\u610F\u201D\u6216\u9996\u6B21\u4F7F\u7528\u5E73\u53F0\u670D\u52A1\u65F6\u751F\u6548\uFF0C\u6709\u6548\u671F\u81F3\u534F\u8BAE\u7EC8\u6B62\u6216\u53F8\u673A\u6CE8\u9500\u8D26\u53F7\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "7.2 \u672C\u534F\u8BAE\u7684\u89E3\u91CA\u6743\u5F52\u8FC5\u5BB6\u51FA\u884C\u5E73\u53F0\u6240\u6709\uFF0C\u5982\u6709\u4E89\u8BAE\uFF0C\u53CC\u65B9\u5E94\u53CB\u597D\u534F\u5546\u89E3\u51B3\uFF1B\u534F\u5546\u4E0D\u6210\u7684\uFF0C\u4EFB\u4F55\u4E00\u65B9\u5747\u53EF\u5411\u5E73\u53F0\u6240\u5728\u5730\u6709\u7BA1\u8F96\u6743\u7684\u4EBA\u6C11\u6CD5\u9662\u63D0\u8D77\u8BC9\u8BBC\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "7.3 \u672C\u534F\u8BAE\u4EE5\u4E2D\u6587\u4E66\u5199\uFF0C\u5176\u4ED6\u8BED\u8A00\u7248\u672C\u4EC5\u4F9B\u53C2\u8003\uFF0C\u5982\u6709\u6B67\u4E49\u4EE5\u4E2D\u6587\u7248\u672C\u4E3A\u51C6\u3002")
                        ])
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 512)
              ]),
              _: 1
            }),
            vue.createCommentVNode(" \u5E95\u90E8\u786E\u8BA4\u6309\u94AE "),
            vue.createElementVNode("view", { class: "footer-btn" }, [
              vue.createElementVNode("button", { class: "confirm-btn" }, "\u60A8\u5DF2\u9605\u8BFB\u5E76\u540C\u610F")
            ])
          ])
        ]);
      };
    }
  };
  var PagesTermsAndRules = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-c5f4869a"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/termsAndRules.vue"]]);
  const _sfc_main$2 = {};
  function _sfc_render(_ctx, _cache) {
    const _component_uni_card = resolveEasycom(vue.resolveDynamicComponent("uni-card"), __easycom_5);
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
    return vue.openBlock(), vue.createElementBlock("view", { class: "feedback-page" }, [
      vue.createCommentVNode(" \u9876\u90E8\u88C5\u9970 "),
      vue.createElementVNode("view", { class: "top-decoration" }),
      vue.createElementVNode("view", { class: "content" }, [
        vue.createCommentVNode(" \u9879\u76EE\u6807\u9898 "),
        vue.createElementVNode("view", { class: "project-title" }, [
          vue.createElementVNode("text", { class: "title" }, "\u8FC5\u5BB6\u51FA\u884C"),
          vue.createElementVNode("text", { class: "subtitle" }, "Express Home Taxi")
        ]),
        vue.createCommentVNode(" \u7B80\u4ECB\u5361\u7247 "),
        vue.createVNode(_component_uni_card, {
          "is-full": true,
          border: false,
          class: "intro-card"
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode("view", { class: "intro-content" }, [
              vue.createElementVNode("text", { class: "intro-text" }, "\u51FA\u79DF\u8F66\u51FA\u884C\u8F6F\u4EF6\uFF0C\u6DB5\u76D6\u4E58\u5BA2\u7AEF\u4E0E\u53F8\u673A\u7AEF\uFF0C\u5B9E\u73B0\u5B9E\u65F6\u53EB\u8F66\u3001\u8BA2\u5355\u7BA1\u7406\u3001\u5730\u56FE\u5BFC\u822A\u3001\u652F\u4ED8\u7ED3\u7B97\u7B49\u6838\u5FC3\u529F\u80FD\u3002"),
              vue.createElementVNode("text", { class: "intro-text" }, "\u9996\u6B21\u72EC\u7ACB\u4E3B\u5BFC\u5168\u6808\u5F00\u53D1\uFF0C\u8BDA\u9080\u60A8\u4F53\u9A8C\u5E76\u63D0\u51FA\u5B9D\u8D35\u5EFA\u8BAE\uFF0C\u60A8\u7684\u53CD\u9988\u5C06\u5E2E\u52A9\u6211\u6210\u957F\uFF01")
            ])
          ]),
          _: 1
        }),
        vue.createCommentVNode(" \u5F00\u53D1\u8005\u4FE1\u606F\u5361\u7247 "),
        vue.createVNode(_component_uni_card, {
          "is-full": true,
          border: false,
          class: "info-card"
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createVNode(_component_uni_icons, {
                type: "person",
                size: "24",
                color: "#3c7e8c"
              }),
              vue.createElementVNode("text", { class: "card-title" }, "\u5F00\u53D1\u8005\u4FE1\u606F")
            ]),
            vue.createElementVNode("view", { class: "info-list" }, [
              vue.createElementVNode("view", { class: "info-item" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "email",
                  size: "18",
                  color: "#86909c"
                }),
                vue.createElementVNode("text", { class: "info-label" }, "\u90AE\u7BB1\uFF1A"),
                vue.createElementVNode("text", { class: "info-value" }, "2473579923@qq.com")
              ]),
              vue.createElementVNode("view", { class: "info-item" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "phone",
                  size: "18",
                  color: "#86909c"
                }),
                vue.createElementVNode("text", { class: "info-label" }, "\u624B\u673A\uFF1A"),
                vue.createElementVNode("text", { class: "info-value" }, "15069840419")
              ]),
              vue.createElementVNode("view", { class: "info-item" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "weixin",
                  size: "18",
                  color: "#86909c"
                }),
                vue.createElementVNode("text", { class: "info-label" }, "\u5FAE\u4FE1\uFF1A"),
                vue.createElementVNode("text", { class: "info-value" }, "wxid_9edrz2yesi2f22")
              ])
            ])
          ]),
          _: 1
        }),
        vue.createCommentVNode(" \u671F\u5F85\u53CD\u9988\u5361\u7247 "),
        vue.createVNode(_component_uni_card, {
          "is-full": true,
          border: false,
          class: "expect-card"
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createVNode(_component_uni_icons, {
                type: "chatbubbles",
                size: "24",
                color: "#3c7e8c"
              }),
              vue.createElementVNode("text", { class: "card-title" }, "\u671F\u5F85\u60A8\u7684\u53CD\u9988")
            ]),
            vue.createElementVNode("view", { class: "expect-content" }, [
              vue.createElementVNode("text", null, "\u65E0\u8BBA\u662F\u529F\u80FD\u5EFA\u8BAE\u3001\u754C\u9762\u4F18\u5316\u8FD8\u662F\u4EE3\u7801\u5C42\u9762\u7684\u6307\u5BFC\uFF0C\u90FD\u5BF9\u6211\u610F\u4E49\u91CD\u5927\u3002"),
              vue.createElementVNode("text", null, "\u60A8\u53EF\u901A\u8FC7\u4EE5\u4E0A\u4EFB\u4E00\u65B9\u5F0F\u4E0E\u6211\u8054\u7CFB\uFF0C\u611F\u8C22\u60A8\u7684\u5B9D\u8D35\u65F6\u95F4\uFF01")
            ])
          ]),
          _: 1
        }),
        vue.createCommentVNode(" \u5E95\u90E8\u7F72\u540D "),
        vue.createElementVNode("view", { class: "footer" }, [
          vue.createElementVNode("text", null, "\xA9 2025 \u8FC5\u5BB6\u51FA\u884C")
        ])
      ])
    ]);
  }
  var PagesOpinion = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render], ["__scopeId", "data-v-645655ae"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/opinion.vue"]]);
  const _sfc_main$1 = {
    __name: "paymentSettings",
    setup(__props) {
      const $store = useStore();
      const userInfo2 = vue.computed(() => $store.state.userInfo);
      const loading = vue.ref(true);
      const vehicleData = vue.ref({});
      const loadingText = {
        contentdown: "",
        contentrefresh: "\u52A0\u8F7D\u4E2D...",
        contentnomore: ""
      };
      const plateColorMap = {
        "1": "\u84DD\u8272",
        "2": "\u9EC4\u8272",
        "3": "\u9ED1\u8272",
        "4": "\u767D\u8272",
        "5": "\u7EFF\u8272",
        "9": "\u5176\u4ED6"
      };
      const vehicleColorMap = {
        "1": "\u767D\u8272",
        "2": "\u9ED1\u8272"
      };
      const fuelTypeMap = {
        "1": "\u6C7D\u6CB9",
        "2": "\u67F4\u6CB9",
        "3": "\u5929\u7136\u6C14",
        "4": "\u6DB2\u5316\u6C14",
        "5": "\u7535\u52A8",
        "9": "\u5176\u4ED6"
      };
      const fixStateMap = {
        "0": "\u672A\u68C0\u4FEE",
        "1": "\u5DF2\u68C0\u4FEE",
        "2": "\u672A\u77E5"
      };
      const checkStateMap = {
        "0": "\u672A\u5E74\u5BA1",
        "1": "\u5E74\u5BA1\u5408\u683C",
        "2": "\u5E74\u5BA1\u4E0D\u5408\u683C"
      };
      const vehicleTypeMap = {
        "1": "\u8F7F\u8F66",
        "2": "SUV",
        "3": "MPV",
        "4": "\u9762\u5305\u8F66",
        "9": "\u5176\u4ED6"
      };
      const formatVehicleType = (code) => vehicleTypeMap[code] || code || "\u672A\u77E5";
      const formatPlateColor = (code) => plateColorMap[code] || code || "\u672A\u77E5";
      const formatVehicleColor = (code) => vehicleColorMap[code] || code || "\u672A\u77E5";
      const formatFuelType = (code) => fuelTypeMap[code] || code || "\u672A\u77E5";
      const formatFixState = (code) => fixStateMap[code] || code || "\u672A\u77E5";
      const formatCheckState = (code) => checkStateMap[code] || code || "\u672A\u77E5";
      const formatDateRange = (start, end) => {
        if (!start && !end)
          return "";
        return `${start || "\u672A\u77E5"} \u81F3 ${end || "\u672A\u77E5"}`;
      };
      const getVehicleInfo = async () => {
        try {
          const { error, result } = await ApiGetCarInfo(userInfo2.value.carId);
          if (!error && result)
            vehicleData.value = result;
        } catch (e) {
          formatAppLog("error", "at pages/paymentSettings.vue:251", "\u83B7\u53D6\u8F66\u8F86\u4FE1\u606F\u5931\u8D25", e);
        } finally {
          loading.value = false;
        }
      };
      vue.onMounted(() => {
        getVehicleInfo();
      });
      return (_ctx, _cache) => {
        const _component_uni_load_more = resolveEasycom(vue.resolveDynamicComponent("uni-load-more"), __easycom_0);
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$2);
        const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_2$1);
        const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_3);
        const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_4);
        const _component_uni_card = resolveEasycom(vue.resolveDynamicComponent("uni-card"), __easycom_5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "vehicle-page" }, [
          vue.createCommentVNode(" \u9875\u9762\u6807\u9898 "),
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "page-title" }, "\u7ED1\u5B9A\u8F66\u8F86\u4FE1\u606F"),
            vue.createElementVNode("text", { class: "page-subtitle" }, "\u8F66\u8F86\u4FE1\u606F\u53EA\u8BFB\uFF0C\u5982\u9700\u4FEE\u6539\u8BF7\u8054\u7CFB\u7AD9\u70B9\u5DE5\u4F5C\u4EBA\u5458")
          ]),
          vue.createCommentVNode(" \u52A0\u8F7D\u72B6\u6001 "),
          loading.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "loading-state"
          }, [
            vue.createVNode(_component_uni_load_more, {
              status: "loading",
              "content-text": loadingText
            })
          ])) : !vehicleData.value || Object.keys(vehicleData.value).length === 0 ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
            vue.createCommentVNode(" \u65E0\u6570\u636E\u72B6\u6001 "),
            vue.createElementVNode("view", { class: "empty-state" }, [
              vue.createVNode(_component_uni_icons, {
                type: "home",
                size: "64",
                color: "#dee2e6"
              }),
              vue.createElementVNode("text", null, "\u6682\u65E0\u7ED1\u5B9A\u8F66\u8F86\u4FE1\u606F"),
              vue.createElementVNode("text", { class: "empty-tip" }, "\u8BF7\u8054\u7CFB\u7AD9\u70B9\u5DE5\u4F5C\u4EBA\u5458\u7ED1\u5B9A\u8F66\u8F86")
            ])
          ], 2112)) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 2 }, [
            vue.createCommentVNode(" \u8F66\u8F86\u4FE1\u606F\u5C55\u793A "),
            vue.createElementVNode("view", { class: "vehicle-content" }, [
              vue.createCommentVNode(" \u57FA\u672C\u4FE1\u606F\u5361\u7247 "),
              vue.createVNode(_component_uni_card, {
                "is-full": true,
                border: false,
                class: "info-card"
              }, {
                title: vue.withCtx(() => [
                  vue.createElementVNode("view", { class: "card-header" }, [
                    vue.createVNode(_component_uni_icons, {
                      type: "home",
                      size: "20",
                      color: "#3c7e8c"
                    }),
                    vue.createElementVNode("text", null, "\u57FA\u672C\u4FE1\u606F")
                  ])
                ]),
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms, {
                    model: vehicleData.value,
                    "label-width": "140"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_forms_item, { label: "\u8F66\u724C\u53F7" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.vehicleNo,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u8F66\u724C\u989C\u8272" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: formatPlateColor(vehicleData.value.plateColor),
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u8F66\u8F86\u989C\u8272" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: formatVehicleColor(vehicleData.value.vehicleColor),
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u8F66\u8F86\u7C7B\u578B" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: formatVehicleType(vehicleData.value.vehicleType),
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u54C1\u724C/\u578B\u53F7" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: `${vehicleData.value.brand || ""} ${vehicleData.value.model || ""}`,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u6838\u5B9A\u8F7D\u5BA2\u4F4D" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.seats ? `${vehicleData.value.seats}\u4EBA` : "",
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u8F66\u8F86\u6240\u6709\u4EBA" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.ownerName,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["model"])
                ]),
                _: 1
              }),
              vue.createCommentVNode(" \u6280\u672F\u53C2\u6570\u5361\u7247 "),
              vue.createVNode(_component_uni_card, {
                "is-full": true,
                border: false,
                class: "info-card"
              }, {
                title: vue.withCtx(() => [
                  vue.createElementVNode("view", { class: "card-header" }, [
                    vue.createVNode(_component_uni_icons, {
                      type: "gear",
                      size: "20",
                      color: "#3c7e8c"
                    }),
                    vue.createElementVNode("text", null, "\u6280\u672F\u53C2\u6570")
                  ])
                ]),
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms, {
                    model: vehicleData.value,
                    "label-width": "140"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_forms_item, { label: "\u53D1\u52A8\u673A\u53F7" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.engineId,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u8F66\u8F86\u8BC6\u522B\u4EE3\u53F7(VIN)" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.vin,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u71C3\u6599\u7C7B\u578B" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: formatFuelType(vehicleData.value.fueType),
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u53D1\u52A8\u673A\u6392\u91CF" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.engineDisplace ? `${vehicleData.value.engineDisplace}ml` : "",
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["model"])
                ]),
                _: 1
              }),
              vue.createCommentVNode(" \u8BC1\u4EF6\u4FE1\u606F\u5361\u7247 "),
              vue.createVNode(_component_uni_card, {
                "is-full": true,
                border: false,
                class: "info-card"
              }, {
                title: vue.withCtx(() => [
                  vue.createElementVNode("view", { class: "card-header" }, [
                    vue.createVNode(_component_uni_icons, {
                      type: "paperplane",
                      size: "20",
                      color: "#3c7e8c"
                    }),
                    vue.createElementVNode("text", null, "\u8F66\u8F86\u8FD0\u8F93\u8BC1\u4FE1\u606F")
                  ])
                ]),
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms, {
                    model: vehicleData.value,
                    "label-width": "140"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_forms_item, { label: "\u53D1\u8BC1\u673A\u6784" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.transAgency,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u7ECF\u8425\u533A\u57DF" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.transArea,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u6709\u6548\u671F" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: formatDateRange(vehicleData.value.transDateStart, vehicleData.value.transDateEnd),
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u8F66\u8F86\u6CE8\u518C\u65E5\u671F" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.certifyDateA,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u521D\u6B21\u767B\u8BB0\u65E5\u671F" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.certifyDateB,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["model"])
                ]),
                _: 1
              }),
              vue.createCommentVNode(" \u7EF4\u62A4\u4E0E\u5E74\u68C0\u5361\u7247 "),
              vue.createVNode(_component_uni_card, {
                "is-full": true,
                border: false,
                class: "info-card"
              }, {
                title: vue.withCtx(() => [
                  vue.createElementVNode("view", { class: "card-header" }, [
                    vue.createVNode(_component_uni_icons, {
                      type: "calendar",
                      size: "20",
                      color: "#3c7e8c"
                    }),
                    vue.createElementVNode("text", null, "\u7EF4\u62A4\u4E0E\u5E74\u68C0")
                  ])
                ]),
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms, {
                    model: vehicleData.value,
                    "label-width": "140"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_forms_item, { label: "\u68C0\u4FEE\u72B6\u6001" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: formatFixState(vehicleData.value.fixState),
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u4E0B\u6B21\u5E74\u68C0\u65F6\u95F4" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.nextFixDate,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      }),
                      vue.createVNode(_component_uni_forms_item, { label: "\u5E74\u5EA6\u5BA1\u9A8C\u72B6\u6001" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: formatCheckState(vehicleData.value.checkState),
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["model"])
                ]),
                _: 1
              }),
              vue.createCommentVNode(" \u5176\u4ED6\u4FE1\u606F\u5361\u7247 "),
              vue.createVNode(_component_uni_card, {
                "is-full": true,
                border: false,
                class: "info-card"
              }, {
                title: vue.withCtx(() => [
                  vue.createElementVNode("view", { class: "card-header" }, [
                    vue.createVNode(_component_uni_icons, {
                      type: "more-filled",
                      size: "20",
                      color: "#3c7e8c"
                    }),
                    vue.createElementVNode("text", null, "\u5176\u4ED6\u4FE1\u606F")
                  ])
                ]),
                default: vue.withCtx(() => [
                  vue.createVNode(_component_uni_forms, {
                    model: vehicleData.value,
                    "label-width": "140"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_forms_item, { label: "\u53D1\u7968\u6253\u5370\u8BBE\u5907\u5E8F\u5217\u53F7" }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_uni_easyinput, {
                            value: vehicleData.value.feePrintId,
                            disabled: ""
                          }, null, 8, ["value"])
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["model"])
                ]),
                _: 1
              }),
              vue.createCommentVNode(" \u63D0\u793A\u4FE1\u606F "),
              vue.createElementVNode("view", { class: "info-tip" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "info",
                  size: "50",
                  color: "#3c7e8c"
                }),
                vue.createElementVNode("text", null, "\u5982\u9700\u4FEE\u6539\u8F66\u8F86\u4FE1\u606F\uFF0C\u8BF7\u8054\u7CFB\u5F53\u5730\u7AD9\u70B9\u5DE5\u4F5C\u4EBA\u5458\u8FDB\u884C\u540E\u53F0\u5904\u7406\u3002")
              ])
            ])
          ], 2112))
        ]);
      };
    }
  };
  var PagesPaymentSettings = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-215a0216"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/pages/paymentSettings.vue"]]);
  __definePage("pages/login", PagesLogin);
  __definePage("pages/index", PagesIndex);
  __definePage("pages/city", PagesCity);
  __definePage("pages/orderDetail", PagesOrderDetail);
  __definePage("pages/my", PagesMy);
  __definePage("pages/monsy", PagesMonsy);
  __definePage("pages/myInfo", PagesMyInfo);
  __definePage("pages/setOperatingCity", PagesSetOperatingCity);
  __definePage("pages/orderInfo", PagesOrderInfo);
  __definePage("pages/map", PagesMap);
  __definePage("pages/termsAndRules", PagesTermsAndRules);
  __definePage("pages/opinion", PagesOpinion);
  __definePage("pages/paymentSettings", PagesPaymentSettings);
  const _sfc_main = {
    __name: "App",
    setup(__props) {
      onLaunch(() => {
      });
      return () => {
      };
    }
  };
  var App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/driver/src/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(store);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue, uni.VueShared);
