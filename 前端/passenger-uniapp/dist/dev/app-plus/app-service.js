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
  const ON_BACK_PRESS = "onBackPress";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom2) {
    return shared.isString(component) ? easycom2 : component;
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createHook(ON_SHOW);
  const onLaunch = /* @__PURE__ */ createHook(ON_LAUNCH);
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  const onBackPress = /* @__PURE__ */ createHook(ON_BACK_PRESS);
  var _GetVarType = (o2) => {
    let typeStr = (Object.prototype.toString.call(o2).match(/\[object (.*?)\]/) || [])[1];
    if (typeStr === "Object") {
      const constName = o2.constructor.name;
      constName !== "Object" && (typeStr = `${typeStr}:${constName}`);
    } else if (typeStr === "Number") {
      if (!isFinite(o2)) {
        if (isNaN(o2)) {
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
    const o2 = {
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
    for (let k2 in o2) {
      if (new RegExp(`(${k2})`, "i").test(fmt)) {
        const str = o2[k2].toString();
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
  var gdMapConf = {
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
  const formatCity = (data) => {
    let arr = [];
    data.forEach((i2) => {
      if (i2.citycode.length) {
        arr.push(i2);
      }
      if (i2.districts.length) {
        arr = arr.concat(formatCity(i2.districts));
      }
    });
    return arr;
  };
  const ApiGetCityList = () => _ToAsyncAwait(
    new Promise((res, rej) => {
      uni.request({
        method: "GET",
        url: `${gdMapConf.cityApiUrl}?subdistrict=2&key=${gdMapConf.cityKey}`,
        success(result) {
          res(
            formatCity(result.data.districts[0].districts).sort((a2, b2) => {
              return a2.name.localeCompare(b2.name, "zh-CN");
            })
          );
        },
        error(e) {
          rej(e);
        }
      });
    })
  );
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
  function forEachValue(obj, fn2) {
    Object.keys(obj).forEach(function(key) {
      return fn2(obj[key], key);
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
  function partial(fn2, arg) {
    return function() {
      return fn2(arg);
    };
  }
  function genericSubscribe(fn2, subs, options) {
    if (subs.indexOf(fn2) < 0) {
      options && options.prepend ? subs.unshift(fn2) : subs.push(fn2);
    }
    return function() {
      var i2 = subs.indexOf(fn2);
      if (i2 > -1) {
        subs.splice(i2, 1);
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
      forEachValue(wrappedGetters, function(fn2, key) {
        computedObj[key] = partial(fn2, store2);
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
        path.forEach(function(p2) {
          if (!target[p2]) {
            target[p2] = {
              _custom: {
                value: {},
                display: p2,
                tooltip: "Module",
                abstract: true
              }
            };
          }
          target = target[p2]._custom.value;
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
    var names = path.split("/").filter(function(n2) {
      return n2;
    });
    return names.reduce(
      function(module, moduleName, i2) {
        var child = module[moduleName];
        if (!child) {
          throw new Error('Missing module "' + moduleName + '" for path "' + path + '".');
        }
        return i2 === names.length - 1 ? child : child._children;
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
  Module.prototype.forEachChild = function forEachChild(fn2) {
    forEachValue(this._children, fn2);
  };
  Module.prototype.forEachGetter = function forEachGetter(fn2) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn2);
    }
  };
  Module.prototype.forEachAction = function forEachAction(fn2) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn2);
    }
  };
  Module.prototype.forEachMutation = function forEachMutation(fn2) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn2);
    }
  };
  Object.defineProperties(Module.prototype, prototypeAccessors$1);
  var ModuleCollection = function ModuleCollection2(rawRootModule) {
    this.register([], rawRootModule, false);
  };
  ModuleCollection.prototype.get = function get2(path) {
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
    var ref2 = this;
    var dispatch = ref2.dispatch;
    var commit = ref2.commit;
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
  prototypeAccessors.state.set = function(v2) {
    {
      assert(false, "use store.replaceState() to explicit replace store state.");
    }
  };
  Store.prototype.commit = function commit(_type, _payload, _options) {
    var this$1$1 = this;
    var ref2 = unifyObjectStyle(_type, _payload, _options);
    var type = ref2.type;
    var payload = ref2.payload;
    var options = ref2.options;
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
    var ref2 = unifyObjectStyle(_type, _payload);
    var type = ref2.type;
    var payload = ref2.payload;
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
  Store.prototype.subscribe = function subscribe(fn2, options) {
    return genericSubscribe(fn2, this._subscribers, options);
  };
  Store.prototype.subscribeAction = function subscribeAction(fn2, options) {
    var subs = typeof fn2 === "function" ? { before: fn2 } : fn2;
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
  Store.prototype._withCommit = function _withCommit(fn2) {
    var committing = this._committing;
    this._committing = true;
    fn2();
    this._committing = committing;
  };
  Object.defineProperties(Store.prototype, prototypeAccessors);
  var block0 = (Comp) => {
    (Comp.$renderjs || (Comp.$renderjs = [])).push("renderScript");
    (Comp.$renderjsModules || (Comp.$renderjsModules = {}))["renderScript"] = "31c7d03c";
  };
  var _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$s = {
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
      updateLocationMarker(location2) {
        this.eventBus = { name: "updateLocationMarker", args: [location2] };
      }
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      eventBus: $data.eventBus,
      "change:eventBus": _ctx.renderScript.receiveEvent,
      id: "map-container"
    }, null, 8, ["eventBus", "change:eventBus"]);
  }
  if (typeof block0 === "function")
    block0(_sfc_main$s);
  var BMap = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["render", _sfc_render$c], ["__scopeId", "data-v-f804d4b6"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/component/BMap.vue"]]);
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
  const _sfc_main$r = {
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
        let code = this.icons.find((v2) => v2.font_class === this.type);
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
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("text", {
      style: vue.normalizeStyle($options.styleObj),
      class: vue.normalizeClass(["uni-icons", ["uniui-" + $props.type, $props.customPrefix, $props.customPrefix ? $props.type : ""]]),
      onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
    }, [
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
    ], 6);
  }
  var __easycom_1$3 = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["render", _sfc_render$b], ["__scopeId", "data-v-857088fc"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue"]]);
  const _sfc_main$q = {
    __name: "PointList",
    props: {
      visible: {
        type: Boolean,
        default: false
      }
    },
    emits: ["change", "update:visible"],
    setup(__props, { emit: emits }) {
      const props = __props;
      const store2 = useStore();
      const mapSearch = vue.inject("mapSearch");
      const city = vue.computed(() => store2.state.city);
      const myVisible = vue.computed({
        get: () => props.visible,
        set: (val) => emits("update:visible", val)
      });
      const searchStr = vue.ref("");
      const searchList = vue.ref([]);
      const handleSearch = () => {
        if (!searchStr.value.trim()) {
          searchList.value = [];
          return;
        }
        mapSearch(searchStr.value, (result) => {
          searchList.value = result.pois || [];
        });
      };
      const handleChangePoint = (item) => {
        emits("change", item);
        myVisible.value = false;
      };
      const handleCity = () => {
        uni.navigateTo({ url: "/pages/city" });
      };
      return (_ctx, _cache) => {
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
        return vue.openBlock(), vue.createElementBlock("view", {
          class: vue.normalizeClass(["point-search", { "point-search_show": vue.unref(myVisible) }])
        }, [
          vue.createCommentVNode(" \u534A\u900F\u660E\u906E\u7F69\u5C42\uFF0C\u70B9\u51FB\u5173\u95ED "),
          vue.createElementVNode("view", {
            class: "mask",
            onClick: _cache[0] || (_cache[0] = ($event) => myVisible.value = false)
          }),
          vue.createElementVNode("view", { class: "search-container" }, [
            vue.createCommentVNode(" \u9876\u90E8\u641C\u7D22\u680F "),
            vue.createElementVNode("view", { class: "search-header" }, [
              vue.createElementVNode("view", {
                class: "city-selector",
                onClick: handleCity
              }, [
                vue.createElementVNode("text", { class: "city-name" }, vue.toDisplayString(vue.unref(city).name), 1),
                vue.createVNode(_component_uni_icons, {
                  type: "arrowdown",
                  size: "14",
                  color: "#6c757d"
                })
              ]),
              vue.createElementVNode("view", { class: "search-input-wrapper" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "search",
                  size: "16",
                  color: "#adb5bd",
                  class: "search-icon"
                }),
                vue.withDirectives(vue.createElementVNode("input", {
                  class: "search-input",
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => searchStr.value = $event),
                  onInput: handleSearch,
                  placeholder: "\u8BF7\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22",
                  "placeholder-class": "search-placeholder"
                }, null, 544), [
                  [vue.vModelText, searchStr.value]
                ])
              ]),
              vue.createElementVNode("text", {
                class: "cancel-btn",
                onClick: _cache[2] || (_cache[2] = ($event) => myVisible.value = false)
              }, "\u53D6\u6D88")
            ]),
            vue.createCommentVNode(" \u641C\u7D22\u7ED3\u679C\u5217\u8868 "),
            searchList.value.length ? (vue.openBlock(), vue.createElementBlock("scroll-view", {
              key: 0,
              "scroll-y": "",
              class: "result-list"
            }, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(searchList.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "point-item",
                  key: item.id,
                  onClick: ($event) => handleChangePoint(item)
                }, [
                  vue.createElementVNode("view", { class: "point-item--icon" }, [
                    vue.createVNode(_component_uni_icons, {
                      type: "location",
                      size: "20",
                      color: "#3c7e8c"
                    })
                  ]),
                  vue.createElementVNode("view", { class: "point-item--info" }, [
                    vue.createElementVNode("text", { class: "point-item--name" }, vue.toDisplayString(item.name), 1),
                    vue.createElementVNode("text", { class: "point-item--address" }, vue.toDisplayString(item.address), 1)
                  ]),
                  vue.createVNode(_component_uni_icons, {
                    type: "forward",
                    size: "14",
                    color: "#adb5bd"
                  })
                ], 8, ["onClick"]);
              }), 128))
            ])) : searchStr.value && !searchList.value.length ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
              vue.createCommentVNode(" \u7A7A\u72B6\u6001\u63D0\u793A "),
              vue.createElementVNode("view", { class: "empty-state" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "search",
                  size: "48",
                  color: "#dee2e6"
                }),
                vue.createElementVNode("text", null, "\u672A\u627E\u5230\u76F8\u5173\u5730\u70B9")
              ])
            ], 2112)) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 2 }, [
              vue.createCommentVNode(" \u9ED8\u8BA4\u63D0\u793A "),
              vue.createElementVNode("view", { class: "empty-state" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "location",
                  size: "48",
                  color: "#dee2e6"
                }),
                vue.createElementVNode("text", null, "\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22\u5730\u70B9")
              ])
            ], 2112))
          ])
        ], 2);
      };
    }
  };
  var PointList = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["__scopeId", "data-v-4295a756"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/index/modules/PointList.vue"]]);
  const _sfc_main$p = {
    __name: "SelectPoint",
    emits: ["confirm"],
    setup(__props, { emit: $emits }) {
      const $store = useStore();
      let startPointVisible = vue.ref(false);
      let startPoint = vue.ref({});
      let endPointVisible = vue.ref(false);
      let endPoint = vue.ref({});
      let city = vue.computed(() => $store.state.city);
      const mapSearch = vue.inject("mapSearch");
      vue.watch(city, () => {
        startPoint.value = {};
        endPoint.value = {};
        if (city.value.poiName) {
          setTimeout(() => {
            if (!mapSearch)
              return;
            mapSearch(city.value.poiName, (result) => {
              if (result.pois && result.pois.length > 0) {
                startPoint.value = result.pois[0];
                formatAppLog("log", "at pages/index/modules/SelectPoint.vue:44", "\u8BBE\u7F6E\u9ED8\u8BA4\u4E0A\u8F66\u5730\u70B9");
              }
            });
          }, 500);
        }
      });
      const handleChangeStart = (item) => {
        formatAppLog("log", "at pages/index/modules/SelectPoint.vue:52", "\u66F4\u6539\u4E0A\u8F66\u5730\u70B9");
        startPoint.value = item;
        endPoint.value = {};
        formatAppLog("log", "at pages/index/modules/SelectPoint.vue:55", startPoint.value);
      };
      const handleChangeEnd = (item) => {
        endPoint.value = item;
        if (startPoint.value.id) {
          $emits("confirm", startPoint.value, endPoint.value);
        }
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("view", { class: "select-box" }, [
            vue.createElementVNode("view", {
              class: "start",
              onClick: _cache[0] || (_cache[0] = ($event) => vue.isRef(startPointVisible) ? startPointVisible.value = true : startPointVisible = true)
            }, [
              !vue.unref(startPoint).id ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, "\u60A8\u5728\u54EA\u4E0A\u8F66\uFF1F")) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
                vue.createElementVNode("text", null, "\u60A8\u5C06\u4ECE"),
                vue.createElementVNode("view", { class: "start-point-text" }, vue.toDisplayString(vue.unref(startPoint).name), 1),
                vue.createElementVNode("text", null, "\u4E0A\u8F66")
              ], 64))
            ]),
            vue.createElementVNode("view", {
              class: "end",
              onClick: _cache[1] || (_cache[1] = ($event) => vue.isRef(endPointVisible) ? endPointVisible.value = true : endPointVisible = true)
            }, [
              vue.createElementVNode("text", null, "\u60A8\u8981\u53BB\u54EA\u513F\uFF1F")
            ])
          ]),
          vue.createVNode(PointList, {
            visible: vue.unref(startPointVisible),
            "onUpdate:visible": _cache[2] || (_cache[2] = ($event) => vue.isRef(startPointVisible) ? startPointVisible.value = $event : startPointVisible = $event),
            onChange: handleChangeStart
          }, null, 8, ["visible"]),
          vue.createVNode(PointList, {
            visible: vue.unref(endPointVisible),
            "onUpdate:visible": _cache[3] || (_cache[3] = ($event) => vue.isRef(endPointVisible) ? endPointVisible.value = $event : endPointVisible = $event),
            onChange: handleChangeEnd
          }, null, 8, ["visible"])
        ], 64);
      };
    }
  };
  var SelectPoint = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["__scopeId", "data-v-1c79c53b"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/index/modules/SelectPoint.vue"]]);
  const _sfc_main$o = {
    __name: "index",
    setup(__props) {
      const mapRef = vue.ref(null);
      const $store = useStore();
      let city = vue.computed(() => $store.state.city);
      vue.provide("mapSearch", (str, cb) => mapRef.value.search(cb, str));
      vue.onMounted(() => {
        vue.watch(city, setLocation);
        getLocation();
        updatalocaltion();
      });
      vue.onUnmounted(() => {
        if (pointTimer) {
          clearTimeout(pointTimer);
          pointTimer = null;
          formatAppLog("log", "at pages/index/index.vue:35", "\u5B9A\u4F4D\u5B9A\u65F6\u5668\u5DF2\u6E05\u9664");
        }
      });
      let pointTimer = null;
      function updatalocaltion() {
        uni.getLocation({
          type: "gcj02",
          geocode: true,
          success(res) {
            formatAppLog("log", "at pages/index/index.vue:46", "\u66F4\u65B0\u5F53\u524D\u4F4D\u7F6E");
            const { address: address2, longitude, latitude, accuracy } = res;
            const location2 = {
              "center": [longitude, latitude],
              "accuracy": accuracy
            };
            mapRef.value.updateLocationMarker(location2);
            pointTimer = setTimeout(() => {
              updatalocaltion();
            }, 6e3);
          },
          fail(err) {
            formatAppLog("error", "at pages/index/index.vue:60", "\u83B7\u53D6\u4F4D\u7F6E\u4FE1\u606F\u5931\u8D25:", err);
          }
        });
      }
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
      const getLocation = async () => {
        requestLocationPermission();
        const { error, result } = await ApiGetCityList();
        uni.getLocation({
          type: "gcj02",
          geocode: true,
          success(res) {
            formatAppLog("log", "at pages/index/index.vue:106", "\u83B7\u53D6\u5F53\u524D\u4F4D\u7F6E");
            const { address: address2, longitude, latitude, accuracy } = res;
            $store.commit("setCity", {
              adcode: result.find((i2) => i2.citycode === address2.cityCode).adcode,
              cityCode: address2.cityCode,
              name: address2.city,
              center: `${longitude},${latitude}`,
              accuracy: `${accuracy}`,
              locationRes: true,
              poiName: address2.poiName
            });
          },
          fail(err) {
            formatAppLog("error", "at pages/index/index.vue:120", "\u83B7\u53D6\u4F4D\u7F6E\u4FE1\u606F\u5931\u8D25:", err);
            setLocation();
          }
        });
      };
      function setLocation() {
        if (!mapRef.value) {
          return;
        }
        const location2 = {
          "center": city.value.center.split(","),
          "accuracy": city.value.accuracy,
          "locationRes": city.value.locationRes
        };
        mapRef.value.setLocation(location2);
        setTimeout(() => mapRef.value.clearDriving(), 500);
      }
      const handleConfrimPoint = async (start, end) => {
        const [startLng, startLat] = start.location;
        const [endLng, endLat] = end.location;
        uni.navigateTo({
          url: `/pages/createOrder?slng=${startLng}&slat=${startLat}&elng=${endLng}&elat=${endLat}&s=${start.name}&e=${end.name}`
        });
      };
      const handleCity = () => {
        uni.navigateTo({ url: "/pages/city" });
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("view", { class: "map-wrapper" }, [
            vue.createVNode(BMap, {
              ref_key: "mapRef",
              ref: mapRef
            }, null, 512)
          ]),
          vue.createElementVNode("view", {
            class: "city",
            onClick: _cache[0] || (_cache[0] = ($event) => handleCity())
          }, vue.toDisplayString(vue.unref(city).name), 1),
          vue.createVNode(SelectPoint, { onConfirm: handleConfrimPoint })
        ], 64);
      };
    }
  };
  var PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["__scopeId", "data-v-1badc801"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/index/index.vue"]]);
  const _sfc_main$n = {
    __name: "city",
    setup(__props) {
      const $store = useStore();
      let cityList = vue.ref([]);
      let searchStr = vue.ref("");
      let filterList = vue.computed(() => {
        return cityList.value.filter((i2) => i2.name.includes(searchStr.value));
      });
      vue.onMounted(() => {
        getCityList();
      });
      const getCityList = () => {
        uni.request({
          method: "GET",
          url: `${gdMapConf.cityApiUrl}?subdistrict=2&key=${gdMapConf.cityKey}`,
          success(res) {
            cityList.value = formatCity2(res.data.districts[0].districts).sort((a2, b2) => {
              return a2.name.localeCompare(b2.name, "zh-CN");
            });
          }
        });
      };
      const formatCity2 = (data) => {
        let arr = [];
        data.forEach((i2) => {
          if (i2.citycode.length) {
            arr.push(i2);
          }
          if (i2.districts.length) {
            arr = arr.concat(formatCity2(i2.districts));
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
  var PagesCity = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["__scopeId", "data-v-1ef7066f"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/city.vue"]]);
  const _sfc_main$m = {
    __name: "BSseMessage",
    emits: ["receiveMsg"],
    setup(__props, { emit: $emits }) {
      const $store = useStore();
      const userInfo = vue.computed(() => $store.state.userInfo);
      const isConnected = vue.ref(false);
      let heartTimer = null;
      vue.watch(
        () => {
          var _a;
          return (_a = userInfo.value) == null ? void 0 : _a.id;
        },
        (id) => {
          if (!id)
            return;
          uni.closeSocket();
          clearInterval(heartTimer);
          const url2 = `${$store.state.serverConf.sse}/connect/${id}/1`;
          formatAppLog("log", "at component/BSseMessage.vue:27", "\u{1F517} \u4E58\u5BA2\u8FDE\u63A5\uFF1A", url2);
          uni.connectSocket({ url: url2 });
          uni.onSocketOpen(() => {
            formatAppLog("log", "at component/BSseMessage.vue:34", "\u2705 \u4E58\u5BA2 WebSocket \u5DF2\u8FDE\u63A5");
            isConnected.value = true;
            startHeartBeat();
          });
          uni.onSocketMessage((res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.type === "pong") {
                return;
              }
              formatAppLog("log", "at component/BSseMessage.vue:50", "\u{1F4E9} \u4E58\u5BA2\u6536\u5230\u6D88\u606F\uFF1A", data);
              $emits("receiveMsg", data);
            } catch (err) {
              formatAppLog("error", "at component/BSseMessage.vue:53", "\u89E3\u6790\u5931\u8D25", err);
            }
          });
          uni.onSocketClose(() => {
            isConnected.value = false;
            setTimeout(() => {
              userInfo.value.id && (() => {
              })();
            }, 3e3);
          });
        },
        { immediate: true }
      );
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
  var BSseMessage = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/component/BSseMessage.vue"]]);
  const HandleApiError = (error, name) => {
    let result = false;
    if (error) {
      const tip = name ? `${name}\u9519\u8BEF\uFF1A` : "";
      ShowToast(error.message ? `${tip}${error.message}` : `\u8BF7\u6C42\u5931\u8D25: ${error}`);
      result = true;
    }
    return result;
  };
  const ShowToast = (str, duration = 3e3, icon = "none") => {
    uni.showToast({ title: str, duration, icon });
  };
  const ShowLoading = (str) => {
    uni.showLoading({
      title: str,
      mask: true
    });
  };
  const HideLoading = () => {
    uni.hideLoading();
  };
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
      formatAppLog("log", "at plugins/msbUniRequest.js:67", option);
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
  const STORAGE_KEY = {
    token: "tk",
    userInfo: "u_i",
    serverConf: "s_c",
    city: "city"
  };
  const url = "8.140.211.132";
  var SERVER_CONF = {
    pay: "http://" + url + ":7073",
    sse: "ws://" + url + ":9000",
    other: "http://" + url + ":7073"
  };
  const serverConf = uni.getStorageSync(STORAGE_KEY.serverConf);
  var store = createStore({
    state: {
      city: gdMapConf.city,
      token: uni.getStorageSync(STORAGE_KEY.token) || "",
      userInfo: JSON.parse(uni.getStorageSync(STORAGE_KEY.userInfo) || "{}"),
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
      setUserInfo(state, userInfo = {}) {
        state.userInfo = userInfo;
        uni.setStorageSync(STORAGE_KEY.userInfo, JSON.stringify(userInfo));
      },
      setServerConf(state, config) {
        state.serverConf = config;
        uni.setStorageSync(STORAGE_KEY.serverConf, JSON.stringify(config));
      }
    }
  });
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
        uni.redirectTo({ url: "../pages/login" });
        store.commit("setToken", "");
        store.commit("setCity", gdMapConf.city);
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
    repeatFlag = repeatFlag.filter((i2) => {
      return i2 !== JSON.stringify({
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
  const ApiGetPrice = (params = {
    depLongitude,
    depLatitude,
    destLongitude,
    destLatitude,
    cityCode,
    vehicleType
  }) => MsbRequest.post("/forecast-price", params);
  const ApiPostOrderAdd = (data = {
    address,
    departTime,
    orderTime,
    departure,
    depLongitude,
    depLatitude,
    destination,
    destLongitude,
    destLatitude,
    encrypt,
    fareType,
    fareVersion,
    passengerId,
    passengerPhone,
    vehicleType
  }) => MsbRequest.post("/order/add", data);
  const ApiPostOrderCancel = ({ orderId }) => MsbRequest.post("/order/cancel", { orderId }, {
    "content-type": "application/x-www-form-urlencoded"
  });
  const ApiGetCurrentOrder = () => MsbRequest.get("/order/current");
  const ApiGetCurrentOrderDetail = ({ orderId }) => MsbRequest.get("/order/current-order-detail", { orderId });
  const ApiGetAllOrderInfo = () => MsbRequest.get("/order/get-all-orders", null, { repeat: false });
  const _sfc_main$l = {
    __name: "createOrder",
    setup(__props) {
      const $store = useStore();
      const city = vue.computed(() => $store.state.city);
      const userInfo = vue.computed(() => $store.state.userInfo);
      const start = _FormatDate(new Date(), "yyyy-mm-dd");
      const end = _FormatDate(new Date().getTime() + 3 * 24 * 60 * 60 * 1e3, "yyyy-mm-dd");
      const mapRef = vue.ref(null);
      const callingDriver = vue.ref(false);
      let $routerQuery = {};
      let priceResult = vue.ref({});
      let departTime2 = vue.ref();
      let departDay = vue.ref();
      let orderId = null;
      let msgFlag = false;
      let timeId = null;
      onLoad((option) => {
        $routerQuery = option;
      });
      vue.onMounted(() => {
        getUserProgressOrder();
        getPrice();
        departDay.value = _FormatDate(new Date(), "yyyy-mm-dd");
        departTime2.value = _FormatDate(new Date().getTime() + 5 * 60 * 1e3, "hh:ii");
      });
      const handleReceiveMsg = (arg) => {
        if (arg.driverId) {
          if (orderId == null) {
            orderId = arg.orderId;
          }
          uni.redirectTo({ url: `/pages/orderDetail?orderId=${orderId}` });
        } else {
          ShowToast("\u672A\u80FD\u627E\u5230\u53F8\u673A");
          callingDriver.value = false;
        }
        clearTimeout(timeId);
        msgFlag = true;
      };
      const getPrice = async () => {
        const { slng: depLongitude2, slat: depLatitude2, elng: destLongitude2, elat: destLatitude2, s: dep, e: dest } = $routerQuery;
        const { error, result } = await ApiGetPrice({
          depLongitude: depLongitude2,
          depLatitude: depLatitude2,
          destLongitude: destLongitude2,
          destLatitude: destLatitude2,
          vehicleType: 1,
          cityCode: city.value.adcode
        });
        if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
          priceResult.value = result;
          vue.nextTick(() => {
            mapDriving([depLongitude2, depLatitude2], [destLongitude2, destLatitude2]);
          });
        } else {
          ShowToast(result.message);
          handleCancel();
        }
      };
      const handleTimeChange = (e) => {
        departTime2.value = e.detail.value;
      };
      const handleConfirm = async () => {
        timeId = setTimeout(() => {
          if (!msgFlag) {
            ShowToast("\u672A\u80FD\u627E\u5230\u53F8\u673A");
            handleCancelCalling();
          }
        }, 1e3 * 3 * 60);
        const { slng: depLongitude2, slat: depLatitude2, elng: destLongitude2, elat: destLatitude2, s: dep, e: dest } = $routerQuery;
        ShowLoading("\u8BA2\u5355\u53D1\u9001\u4E2D");
        try {
          const { error, result } = await ApiPostOrderAdd({
            address: city.value.adcode,
            departTime: `${departDay.value} ${departTime2.value}:01`,
            orderTime: _FormatDate(new Date(), "yyyy-mm-dd hh:ii:ss"),
            departure: dep,
            depLongitude: depLongitude2,
            depLatitude: depLatitude2,
            destination: dest,
            destLongitude: destLongitude2,
            destLatitude: destLatitude2,
            encrypt: 14,
            fareType: priceResult.value.fareType,
            fareVersion: priceResult.value.fareVersion,
            passengerId: userInfo.value.id,
            passengerPhone: userInfo.value.passengerPhone,
            vehicleType: priceResult.value.vehicleType
          });
          if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
            callingDriver.value = true;
            orderId = result.id;
          } else {
            ShowToast(result.message);
          }
        } catch (error) {
          formatAppLog("error", "at pages/createOrder.vue:175", "An error occurred during API call:", error);
        } finally {
          HideLoading();
        }
      };
      const handleCancel = () => {
        uni.switchTab({ url: "/pages/index/index" });
      };
      const handleCancelCalling = async () => {
        const { error, result } = await ApiPostOrderCancel({ orderId });
        if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
          callingDriver.value = false;
        } else {
          ShowToast(result.message);
        }
      };
      const mapDriving = (dep, dest) => {
        if (!mapRef.value || !mapRef.value.driving) {
          setTimeout(() => {
            mapDriving(dep, dest);
          }, 500);
          return false;
        }
        mapRef.value.driving(dep, dest);
      };
      const getUserProgressOrder = async () => {
        const { error, result } = await ApiGetCurrentOrder();
        if (!HandleApiError(error) && result != null && !result.hasOwnProperty("code")) {
          orderId = result.id;
          uni.redirectTo({ url: `/pages/orderDetail?orderId=${orderId}` });
        }
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("view", { class: "map-wrapper" }, [
            vue.createVNode(BMap, {
              ref_key: "mapRef",
              ref: mapRef
            }, null, 512),
            vue.createVNode(BSseMessage, { onReceiveMsg: handleReceiveMsg })
          ]),
          !callingDriver.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "panel"
          }, [
            vue.createElementVNode("view", { class: "panel--bar" }, [
              vue.createElementVNode("text", null, "\u65F6\u95F4\uFF1A"),
              vue.createElementVNode("text", null, [
                vue.createElementVNode("text", null, "\u5927\u7EA6\u9700\u8981 "),
                vue.createElementVNode("text", { class: "price" }, vue.toDisplayString(vue.unref(priceResult).timeMinute), 1),
                vue.createElementVNode("text", null, " \u5206\u949F")
              ])
            ]),
            vue.createElementVNode("view", { class: "panel--bar" }, [
              vue.createElementVNode("text", null, "\u8DDD\u79BB\uFF1A"),
              vue.createElementVNode("text", null, [
                vue.createElementVNode("text", { class: "price" }, vue.toDisplayString(vue.unref(priceResult).distanceMile), 1),
                vue.createElementVNode("text", null, " \u5343\u7C73")
              ])
            ]),
            vue.createElementVNode("view", { class: "panel--bar" }, [
              vue.createElementVNode("text", null, "\u9884\u8BA1\u4EF7\u683C\uFF1A"),
              vue.createElementVNode("text", {
                class: "price",
                style: { "font-size": "35rpx" }
              }, "\uFFE5" + vue.toDisplayString(vue.unref(priceResult).price), 1)
            ]),
            vue.createElementVNode("view", { class: "panel--bar" }, [
              vue.createElementVNode("text", null, "\u51FA\u53D1\u65F6\u95F4\uFF1A"),
              vue.createElementVNode("view", { class: "time-bar" }, [
                vue.createElementVNode("picker", {
                  mode: "date",
                  fields: "day",
                  value: vue.unref(departDay),
                  start: vue.unref(start),
                  end: vue.unref(end),
                  style: { "margin-right": "10px" }
                }, [
                  vue.createElementVNode("view", { class: "time" }, vue.toDisplayString(vue.unref(departDay)), 1)
                ], 8, ["value", "start", "end"]),
                vue.createElementVNode("picker", {
                  mode: "time",
                  value: vue.unref(departTime2),
                  onChange: handleTimeChange,
                  start: "00:00",
                  end: "23:59"
                }, [
                  vue.createElementVNode("view", null, vue.toDisplayString(vue.unref(departTime2)), 1)
                ], 40, ["value"])
              ])
            ]),
            vue.createElementVNode("view", { class: "operation" }, [
              vue.createElementVNode("button", {
                class: "btn btn__cancel",
                onClick: handleCancel
              }, "\u53D6\u6D88"),
              vue.createElementVNode("button", {
                class: "btn",
                disabled: !vue.unref(priceResult).price,
                onClick: handleConfirm
              }, "\u786E\u8BA4\u547C\u53EB", 8, ["disabled"])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          callingDriver.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "panel calling_driver"
          }, [
            vue.createElementVNode("view", { style: { "font-size": "18px" } }, [
              vue.createElementVNode("text", null, "\u6B63\u5728\u4E3A\u60A8\u5168\u529B\u547C\u53EB\u53F8\u673A"),
              vue.createElementVNode("text", { class: "dotting" })
            ]),
            vue.createElementVNode("button", {
              class: "btn btn__cancel",
              onClick: handleCancelCalling,
              style: { "width": "65%" }
            }, "\u53D6\u6D88\u7528\u8F66")
          ])) : vue.createCommentVNode("v-if", true)
        ], 64);
      };
    }
  };
  var PagesCreateOrder = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["__scopeId", "data-v-1be4d3de"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/createOrder.vue"]]);
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
  const _sfc_main$k = {
    __name: "orderDetail",
    setup(__props) {
      let $routerQuery = {};
      let orderDetail = vue.ref({});
      let mapRef = vue.ref(null);
      let remainingTime = vue.ref("");
      onLoad((option) => {
        $routerQuery = option;
      });
      vue.onMounted(() => {
        getCurrentOrderDetail();
      });
      const getCurrentOrderDetail = async () => {
        const { orderId } = $routerQuery;
        const { error, result } = await ApiGetCurrentOrderDetail({ orderId });
        if (!result.hasOwnProperty("code") && result != null) {
          orderDetail.value = result;
          const orderTime2 = new Date(orderDetail.value.receiveOrderTime);
          orderTime2.setMinutes(orderTime2.getMinutes() + 2);
          const formattedTime = `${String(orderTime2.getHours()).padStart(2, "0")}:${String(orderTime2.getMinutes()).padStart(2, "0")}:${String(orderTime2.getSeconds()).padStart(2, "0")}`;
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
                  formatAppLog("error", "at pages/orderDetail.vue:249", "\u83B7\u53D6\u4F4D\u7F6E\u4FE1\u606F\u5931\u8D25:", err);
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
      const getVehicleColorText = (num) => {
        switch (num) {
          case "1":
            return "\u767D\u8272";
          case "2":
            return "\u9ED1\u8272";
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
          uni.switchTab({ url: "/pages/index/index" });
        } else {
          ShowToast(result.message);
        }
      };
      const handlePay = () => {
        formatAppLog("log", "at pages/orderDetail.vue:328", orderDetail.value);
        if (orderDetail.value.id != null || orderDetail.value.id != void 0) {
          uni.navigateTo({
            url: `/pages/pay?id=${orderDetail.value.id}&price=${orderDetail.value.price}`
          });
        }
        if (orderDetail.value.orderId != null || orderDetail.value.orderId != void 0) {
          uni.navigateTo({
            url: `/pages/pay?id=${orderDetail.value.orderId}&price=${orderDetail.value.price}`
          });
        }
      };
      const handleReceiveMsg = (msg) => {
        if (msg.code != null) {
          if (msg.code == 801) {
            ShowToast("\u53D6\u6D88\u8BA2\u5355\u6210\u529F");
            uni.switchTab({
              url: "/pages/index/index"
            });
          }
          if (msg.code == 802) {
            msg.orderStatus = ORDER_STATUS.orderFinish;
            ShowToast("\u652F\u4ED8\u8BA2\u5355\u6210\u529F");
          }
        }
        if (msg) {
          formatAppLog("log", "at pages/orderDetail.vue:359", "\u6D88\u606F:");
          formatAppLog("log", "at pages/orderDetail.vue:360", msg);
          if (msg.orderStatus == ORDER_STATUS.awaitPay) {
            orderDetail.value = msg;
          } else {
            orderDetail.value.orderStatus = msg.orderStatus;
          }
          if (mapRef.value) {
            mapRef.value.driverUpdatePosition(msg.currentLongitude, msg.currentLatitude);
          }
        }
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("view", { class: "wrapper" }, [
            vue.createVNode(BMap, {
              ref_key: "mapRef",
              ref: mapRef
            }, null, 512)
          ]),
          vue.createElementVNode("view", { class: "operation" }, [
            vue.createCommentVNode(" \u5F85\u63A5\u5355 "),
            vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).orderStart ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
              vue.createVNode(BSseMessage, { onReceiveMsg: handleReceiveMsg }),
              vue.createElementVNode("view", { class: "calling_driver" }, [
                vue.createElementVNode("view", {
                  class: "desc",
                  style: { "font-weight": "normal" }
                }, [
                  vue.createElementVNode("text", null, "\u6B63\u5728\u4E3A\u60A8\u5168\u529B\u547C\u53EB\u53F8\u673A"),
                  vue.createElementVNode("text", { class: "dotting" })
                ]),
                vue.createElementVNode("view", { class: "route" }, [
                  vue.createElementVNode("view", { class: "start" }, [
                    vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).departure), 1)
                  ]),
                  vue.createElementVNode("view", { class: "end" }, [
                    vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).destination), 1)
                  ])
                ]),
                vue.createElementVNode("button", {
                  class: "btn btn__cancel",
                  onClick: handleCancel,
                  style: { "width": "100%" }
                }, "\u53D6\u6D88\u7528\u8F66")
              ])
            ], 64)) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" \u5F85\u652F\u4ED8 "),
            vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).awaitPay ? (vue.openBlock(), vue.createElementBlock("view", { key: 1 }, [
              vue.createElementVNode("view", { class: "desc" }, [
                vue.createElementVNode("text", null, "\u60A8\u7684\u884C\u7A0B\u5DF2\u7ED3\u675F\uFF0C\u8BF7\u60A8\u5C3D\u5FEB\u5B8C\u6210\u652F\u4ED8")
              ]),
              vue.createElementVNode("view", { class: "order_info" }, [
                vue.createElementVNode("view", { class: "route" }, [
                  vue.createElementVNode("view", { class: "start" }, [
                    vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).departure), 1)
                  ]),
                  vue.createElementVNode("view", { class: "end" }, [
                    vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).destination), 1)
                  ])
                ]),
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
              vue.createElementVNode("button", {
                onClick: handlePay,
                class: "btn"
              }, "\uFFE5" + vue.toDisplayString(vue.unref(orderDetail).price) + " \u7ACB\u5373\u652F\u4ED8", 1)
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" \u884C\u7A0B\u4E2D "),
            vue.unref(orderDetail).orderStatus >= vue.unref(ORDER_STATUS).driverReceive && vue.unref(orderDetail).orderStatus <= vue.unref(ORDER_STATUS).tripFinish ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 2 }, [
              vue.createVNode(BSseMessage, { onReceiveMsg: handleReceiveMsg }),
              vue.createElementVNode("view", null, [
                vue.createElementVNode("view", { class: "tips" }, [
                  vue.createElementVNode("view", { class: "order_tips" }, [
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverReceive ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, "\u53F8\u673A\u5DF2\u63A5\u5355")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverToPickUp ? (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, "\u53F8\u673A\u6B63\u5728\u8D76\u6765\u7684\u8DEF\u4E0A")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).driverArriveStartPoint ? (vue.openBlock(), vue.createElementBlock("text", { key: 2 }, "\u53F8\u673A\u5230\u8FBE\u4E0A\u8F66\u70B9")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).tripStart ? (vue.openBlock(), vue.createElementBlock("text", { key: 3 }, "\u53F8\u673A\u6B63\u5728\u4E3A\u60A8\u670D\u52A1")) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).tripFinish ? (vue.openBlock(), vue.createElementBlock("text", { key: 4 }, "\u884C\u7A0B\u5DF2\u5B8C\u6210\uFF0C\u8BF7\u7B49\u5F85\u53F8\u673A\u53D1\u8D77\u6536\u6B3E")) : vue.createCommentVNode("v-if", true)
                  ]),
                  vue.createElementVNode("view", { class: "cancel_tips" }, [
                    vue.unref(remainingTime) && vue.unref(orderDetail).orderStatus < vue.unref(ORDER_STATUS).tripStart ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, [
                      vue.createTextVNode(" \u82E5\u60A8\u6539\u53D8\u884C\u7A0B\uFF0C\u53EF\u5728"),
                      vue.createElementVNode("text", { style: { "color": "red" } }, vue.toDisplayString(vue.unref(remainingTime)), 1),
                      vue.createTextVNode("\u4E4B\u524D\u514D\u8D39\u53D6\u6D88 ")
                    ])) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).orderStatus >= vue.unref(ORDER_STATUS).tripStart ? (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, " \u8BA2\u5355\u5DF2\u65E0\u6CD5\u53D6\u6D88\uFF0C\u8BF7\u8054\u7CFB\u53F8\u673A\u7ED3\u675F\u8BA2\u5355 ")) : vue.createCommentVNode("v-if", true)
                  ])
                ]),
                vue.createCommentVNode(" \u53F8\u673A\u4FE1\u606F "),
                vue.createElementVNode("view", { class: "driver-info" }, [
                  vue.createElementVNode("view", { class: "info-left" }, [
                    vue.createElementVNode("view", { class: "license-plate" }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).vehicleNo), 1)
                    ]),
                    vue.unref(orderDetail).vehicleBrand ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "car"
                    }, [
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).vehicleBrand), 1),
                      vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).vehicleModel), 1),
                      vue.createElementVNode("text", null, "\xB7"),
                      vue.createElementVNode("text", null, vue.toDisplayString(getVehicleColorText(vue.unref(orderDetail).vehicleColor)), 1)
                    ])) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("view", { class: "driver" }, [
                      vue.unref(orderDetail).driverSurname ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, vue.toDisplayString(vue.unref(orderDetail).driverSurname) + "\u5E08\u5085", 1)) : vue.createCommentVNode("v-if", true),
                      vue.unref(orderDetail).driverTotalOrders ? (vue.openBlock(), vue.createElementBlock("text", {
                        key: 1,
                        style: { "margin-left": "20rpx" }
                      }, vue.toDisplayString(vue.unref(orderDetail).driverTotalOrders) + "\u5355", 1)) : vue.createCommentVNode("v-if", true)
                    ]),
                    vue.createElementVNode("view", { class: "phone-number" }, [
                      vue.unref(orderDetail).driverPhone ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, vue.toDisplayString(vue.unref(orderDetail).driverPhone), 1)) : vue.createCommentVNode("v-if", true)
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
                vue.createCommentVNode(" \u53D6\u6D88\u8BA2\u5355\u6309\u94AE "),
                vue.createElementVNode("button", {
                  onClick: handleCancel,
                  class: "btn btn_cancel"
                }, "\u53D6\u6D88\u8BA2\u5355")
              ])
            ], 64)) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" \u5DF2\u5B8C\u6210 "),
            vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).orderFinish ? (vue.openBlock(), vue.createElementBlock("view", { key: 3 }, [
              vue.createElementVNode("view", { class: "desc" }, [
                vue.createElementVNode("text", null, "\u60A8\u7684\u884C\u7A0B\u5DF2\u987A\u5229\u7ED3\u675F")
              ]),
              vue.createElementVNode("view", {
                class: "driver-info",
                style: { "height": "140rpx", "margin-top": "0" }
              }, [
                vue.createElementVNode("view", { class: "info-left" }, [
                  vue.createElementVNode("view", { class: "license-plate" }, [
                    vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).vehicleNo), 1)
                  ]),
                  vue.createCommentVNode(' <view class="car" v-if="orderDetail.vehicleBrand">\r\n					  <text>{{ orderDetail.vehicleBrand }}</text>\r\n					  <text>{{ orderDetail.vehicleModel }}</text>\r\n					  <text>\xB7</text>\r\n					  <text>{{ getVehicleColorText(orderDetail.vehicleColor) }}</text>\r\n					</view> '),
                  vue.createElementVNode("view", { class: "driver" }, [
                    vue.unref(orderDetail).driverSurname ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, vue.toDisplayString(vue.unref(orderDetail).driverSurname) + "\u5E08\u5085", 1)) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).driverPhone ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 1,
                      style: { "margin-left": "20rpx" }
                    }, vue.toDisplayString(vue.unref(orderDetail).driverPhone), 1)) : vue.createCommentVNode("v-if", true)
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
              ]),
              vue.createElementVNode("button", { class: "btn btn_cancel" }, "\u53BB\u8BC4\u4EF7")
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" \u5DF2\u53D6\u6D88 "),
            vue.unref(orderDetail).orderStatus === vue.unref(ORDER_STATUS).orderCancel ? (vue.openBlock(), vue.createElementBlock("view", { key: 4 }, [
              vue.createElementVNode("view", { class: "desc" }, [
                vue.createElementVNode("text", null, "\u60A8\u7684\u8BA2\u5355\u5DF2\u53D6\u6D88")
              ]),
              vue.createElementVNode("view", {
                class: "driver-info",
                style: { "margin-top": "0" }
              }, [
                vue.createElementVNode("view", { class: "info-left" }, [
                  vue.createElementVNode("view", { class: "license-plate" }, [
                    vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).vehicleNo), 1)
                  ]),
                  vue.unref(orderDetail).vehicleBrand ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "car"
                  }, [
                    vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).vehicleBrand), 1),
                    vue.createElementVNode("text", null, vue.toDisplayString(vue.unref(orderDetail).vehicleModel), 1),
                    vue.createElementVNode("text", null, "\xB7"),
                    vue.createElementVNode("text", null, vue.toDisplayString(getVehicleColorText(vue.unref(orderDetail).vehicleColor)), 1)
                  ])) : vue.createCommentVNode("v-if", true),
                  vue.createElementVNode("view", { class: "driver" }, [
                    vue.unref(orderDetail).driverSurname ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, vue.toDisplayString(vue.unref(orderDetail).driverSurname) + "\u5E08\u5085", 1)) : vue.createCommentVNode("v-if", true),
                    vue.unref(orderDetail).driverPhone ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 1,
                      style: { "margin-left": "20rpx" }
                    }, vue.toDisplayString(vue.unref(orderDetail).driverPhone), 1)) : vue.createCommentVNode("v-if", true)
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
                disabled: ""
              }, "\u53BB\u652F\u4ED8")
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ], 64);
      };
    }
  };
  var PagesOrderDetail = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["__scopeId", "data-v-5ebf2a2a"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/orderDetail.vue"]]);
  function warn(msg, ...args) {
    console.warn(`[Vue warn] ${msg}`, ...args);
  }
  const createDep = (effects) => {
    const dep = new Set(effects);
    dep.w = 0;
    dep.n = 0;
    return dep;
  };
  const wasTracked = (dep) => (dep.w & trackOpBit) > 0;
  const newTracked = (dep) => (dep.n & trackOpBit) > 0;
  const targetMap = /* @__PURE__ */ new WeakMap();
  let trackOpBit = 1;
  let activeEffect;
  const ITERATE_KEY = Symbol("iterate");
  const MAP_KEY_ITERATE_KEY = Symbol("Map key iterate");
  let shouldTrack = true;
  const trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function track(target, type, key) {
    if (shouldTrack && activeEffect) {
      let depsMap = targetMap.get(target);
      if (!depsMap) {
        targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
      }
      let dep = depsMap.get(key);
      if (!dep) {
        depsMap.set(key, dep = createDep());
      }
      trackEffects(dep);
    }
  }
  function trackEffects(dep, debuggerEventExtraInfo) {
    let shouldTrack2 = false;
    {
      if (!newTracked(dep)) {
        dep.n |= trackOpBit;
        shouldTrack2 = !wasTracked(dep);
      }
    }
    if (shouldTrack2) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
      if (activeEffect.onTrack)
        ;
    }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    let deps = [];
    if (type === "clear") {
      deps = [...depsMap.values()];
    } else if (key === "length" && shared.isArray(target)) {
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 >= newValue) {
          deps.push(dep);
        }
      });
    } else {
      if (key !== void 0) {
        deps.push(depsMap.get(key));
      }
      switch (type) {
        case "add":
          if (!shared.isArray(target)) {
            deps.push(depsMap.get(ITERATE_KEY));
            if (shared.isMap(target)) {
              deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (shared.isIntegerKey(key)) {
            deps.push(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!shared.isArray(target)) {
            deps.push(depsMap.get(ITERATE_KEY));
            if (shared.isMap(target)) {
              deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (shared.isMap(target)) {
            deps.push(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
    const eventInfo = { target, type, key, newValue, oldValue, oldTarget };
    if (deps.length === 1) {
      if (deps[0]) {
        {
          triggerEffects(deps[0], eventInfo);
        }
      }
    } else {
      const effects = [];
      for (const dep of deps) {
        if (dep) {
          effects.push(...dep);
        }
      }
      {
        triggerEffects(createDep(effects), eventInfo);
      }
    }
  }
  function triggerEffects(dep, debuggerEventExtraInfo) {
    const effects = shared.isArray(dep) ? dep : [...dep];
    for (const effect of effects) {
      if (effect.computed) {
        triggerEffect(effect, debuggerEventExtraInfo);
      }
    }
    for (const effect of effects) {
      if (!effect.computed) {
        triggerEffect(effect, debuggerEventExtraInfo);
      }
    }
  }
  function triggerEffect(effect, debuggerEventExtraInfo) {
    if (effect !== activeEffect || effect.allowRecurse) {
      if (effect.onTrigger) {
        effect.onTrigger(shared.extend({ effect }, debuggerEventExtraInfo));
      }
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  }
  const isNonTrackableKeys = /* @__PURE__ */ shared.makeMap(`__proto__,__v_isRef,__isVue`);
  const builtInSymbols = new Set(
    /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(shared.isSymbol)
  );
  const get = /* @__PURE__ */ createGetter();
  const readonlyGet = /* @__PURE__ */ createGetter(true);
  const arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
  function createArrayInstrumentations() {
    const instrumentations = {};
    ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
      instrumentations[key] = function(...args) {
        const arr = toRaw(this);
        for (let i2 = 0, l2 = this.length; i2 < l2; i2++) {
          track(arr, "get", i2 + "");
        }
        const res = arr[key](...args);
        if (res === -1 || res === false) {
          return arr[key](...args.map(toRaw));
        } else {
          return res;
        }
      };
    });
    ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
      instrumentations[key] = function(...args) {
        pauseTracking();
        const res = toRaw(this)[key].apply(this, args);
        resetTracking();
        return res;
      };
    });
    return instrumentations;
  }
  function createGetter(isReadonly2 = false, shallow = false) {
    return function get2(target, key, receiver) {
      if (key === "__v_isReactive") {
        return !isReadonly2;
      } else if (key === "__v_isReadonly") {
        return isReadonly2;
      } else if (key === "__v_isShallow") {
        return shallow;
      } else if (key === "__v_raw" && receiver === (isReadonly2 ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
        return target;
      }
      const targetIsArray = shared.isArray(target);
      if (!isReadonly2 && targetIsArray && shared.hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const res = Reflect.get(target, key, receiver);
      if (shared.isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res;
      }
      if (!isReadonly2) {
        track(target, "get", key);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        return targetIsArray && shared.isIntegerKey(key) ? res : res.value;
      }
      if (shared.isObject(res)) {
        return isReadonly2 ? readonly(res) : reactive(res);
      }
      return res;
    };
  }
  const set = /* @__PURE__ */ createSetter();
  function createSetter(shallow = false) {
    return function set2(target, key, value, receiver) {
      let oldValue = target[key];
      if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
        return false;
      }
      if (!shallow) {
        if (!isShallow(value) && !isReadonly(value)) {
          oldValue = toRaw(oldValue);
          value = toRaw(value);
        }
        if (!shared.isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        }
      }
      const hadKey = shared.isArray(target) && shared.isIntegerKey(key) ? Number(key) < target.length : shared.hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (shared.hasChanged(value, oldValue)) {
          trigger(target, "set", key, value, oldValue);
        }
      }
      return result;
    };
  }
  function deleteProperty(target, key) {
    const hadKey = shared.hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function has(target, key) {
    const result = Reflect.has(target, key);
    if (!shared.isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  function ownKeys(target) {
    track(target, "iterate", shared.isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
  const mutableHandlers = {
    get,
    set,
    deleteProperty,
    has,
    ownKeys
  };
  const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      {
        warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    },
    deleteProperty(target, key) {
      {
        warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    }
  };
  const toShallow = (value) => value;
  const getProto = (v2) => Reflect.getPrototypeOf(v2);
  function get$1(target, key, isReadonly2 = false, isShallow2 = false) {
    target = target["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (!isReadonly2) {
      if (key !== rawKey) {
        track(rawTarget, "get", key);
      }
      track(rawTarget, "get", rawKey);
    }
    const { has: has2 } = getProto(rawTarget);
    const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    } else if (target !== rawTarget) {
      target.get(key);
    }
  }
  function has$1(key, isReadonly2 = false) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (!isReadonly2) {
      if (key !== rawKey) {
        track(rawTarget, "has", key);
      }
      track(rawTarget, "has", rawKey);
    }
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly2 = false) {
    target = target["__v_raw"];
    !isReadonly2 && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
      target.add(value);
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const { has: has2, get: get2 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get2.call(target, key);
    target.set(key, value);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (shared.hasChanged(value, oldValue)) {
      trigger(target, "set", key, value, oldValue);
    }
    return this;
  }
  function deleteEntry(key) {
    const target = toRaw(this);
    const { has: has2, get: get2 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get2 ? get2.call(target, key) : void 0;
    const result = target.delete(key);
    if (hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget = shared.isMap(target) ? new Map(target) : new Set(target);
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0, oldTarget);
    }
    return result;
  }
  function createForEach(isReadonly2, isShallow2) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
      !isReadonly2 && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly2, isShallow2) {
    return function(...args) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const targetIsMap = shared.isMap(rawTarget);
      const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
      !isReadonly2 && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
      return {
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        },
        [Symbol.iterator]() {
          return this;
        }
      };
    };
  }
  function createReadonlyMethod(type) {
    return function(...args) {
      {
        const key = args[0] ? `on key "${args[0]}" ` : ``;
        console.warn(`${shared.capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
      }
      return type === "delete" ? false : this;
    };
  }
  function createInstrumentations() {
    const mutableInstrumentations2 = {
      get(key) {
        return get$1(this, key);
      },
      get size() {
        return size(this);
      },
      has: has$1,
      add,
      set: set$1,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, false)
    };
    const shallowInstrumentations2 = {
      get(key) {
        return get$1(this, key, false, true);
      },
      get size() {
        return size(this);
      },
      has: has$1,
      add,
      set: set$1,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, true)
    };
    const readonlyInstrumentations2 = {
      get(key) {
        return get$1(this, key, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has$1.call(this, key, true);
      },
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear"),
      forEach: createForEach(true, false)
    };
    const shallowReadonlyInstrumentations2 = {
      get(key) {
        return get$1(this, key, true, true);
      },
      get size() {
        return size(this, true);
      },
      has(key) {
        return has$1.call(this, key, true);
      },
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear"),
      forEach: createForEach(true, true)
    };
    const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
    iteratorMethods.forEach((method) => {
      mutableInstrumentations2[method] = createIterableMethod(method, false, false);
      readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
      shallowInstrumentations2[method] = createIterableMethod(method, false, true);
      shallowReadonlyInstrumentations2[method] = createIterableMethod(method, true, true);
    });
    return [
      mutableInstrumentations2,
      readonlyInstrumentations2,
      shallowInstrumentations2,
      shallowReadonlyInstrumentations2
    ];
  }
  const [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* @__PURE__ */ createInstrumentations();
  function createInstrumentationGetter(isReadonly2, shallow) {
    const instrumentations = shallow ? isReadonly2 ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly2 ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key, receiver) => {
      if (key === "__v_isReactive") {
        return !isReadonly2;
      } else if (key === "__v_isReadonly") {
        return isReadonly2;
      } else if (key === "__v_raw") {
        return target;
      }
      return Reflect.get(shared.hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
    };
  }
  const mutableCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(false, false)
  };
  const readonlyCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(true, false)
  };
  function checkIdentityKeys(target, has2, key) {
    const rawKey = toRaw(key);
    if (rawKey !== key && has2.call(target, rawKey)) {
      const type = shared.toRawType(target);
      console.warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
    }
  }
  const reactiveMap = /* @__PURE__ */ new WeakMap();
  const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
  const readonlyMap = /* @__PURE__ */ new WeakMap();
  const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function getTargetType(value) {
    return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(shared.toRawType(value));
  }
  function reactive(target) {
    if (isReadonly(target)) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
  }
  function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
    if (!shared.isObject(target)) {
      {
        console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
    }
    if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function isReadonly(value) {
    return !!(value && value["__v_isReadonly"]);
  }
  function isShallow(value) {
    return !!(value && value["__v_isShallow"]);
  }
  function toRaw(observed) {
    const raw = observed && observed["__v_raw"];
    return raw ? toRaw(raw) : observed;
  }
  const toReactive = (value) => shared.isObject(value) ? reactive(value) : value;
  const toReadonly = (value) => shared.isObject(value) ? readonly(value) : value;
  function trackRefValue(ref2) {
    if (shouldTrack && activeEffect) {
      ref2 = toRaw(ref2);
      {
        trackEffects(ref2.dep || (ref2.dep = createDep()));
      }
    }
  }
  function triggerRefValue(ref2, newVal) {
    ref2 = toRaw(ref2);
    if (ref2.dep) {
      {
        triggerEffects(ref2.dep, {
          target: ref2,
          type: "set",
          key: "value",
          newValue: newVal
        });
      }
    }
  }
  function isRef(r2) {
    return !!(r2 && r2.__v_isRef === true);
  }
  function ref(value) {
    return createRef(value, false);
  }
  function createRef(rawValue, shallow) {
    if (isRef(rawValue)) {
      return rawValue;
    }
    return new RefImpl(rawValue, shallow);
  }
  class RefImpl {
    constructor(value, __v_isShallow) {
      this.__v_isShallow = __v_isShallow;
      this.dep = void 0;
      this.__v_isRef = true;
      this._rawValue = __v_isShallow ? value : toRaw(value);
      this._value = __v_isShallow ? value : toReactive(value);
    }
    get value() {
      trackRefValue(this);
      return this._value;
    }
    set value(newVal) {
      const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal);
      newVal = useDirectValue ? newVal : toRaw(newVal);
      if (shared.hasChanged(newVal, this._rawValue)) {
        this._rawValue = newVal;
        this._value = useDirectValue ? newVal : toReactive(newVal);
        triggerRefValue(this, newVal);
      }
    }
  }
  const _sfc_main$j = {
    __name: "pay",
    setup(__props) {
      const $store = useStore();
      const orderId = ref("");
      let url2 = ref();
      onLoad((option) => {
        url2.value = `${$store.state.serverConf.pay}/alipay/pay?subject=${decodeURIComponent("\u8F66\u8D39")}&outTradeNo=${option.id}&totalAmount=${option.price}`;
        orderId.value = option.id;
      });
      onBackPress(async () => {
        const { error, result } = await ApiGetCurrentOrderDetail({ orderId: orderId.value });
        if (result.orderStatus != 7) {
          uni.navigateBack({ delta: 2 });
          return true;
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("web-view", { src: vue.unref(url2) }, null, 8, ["src"]);
      };
    }
  };
  var PagesPay = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/pay.vue"]]);
  const ApiGetVerifyCode = (data = { passengerPhone }) => MsbRequest.post("/verification-code", data, { notVerifyToken: true });
  const ApiPostVerifyCodeCheck = (data = { passengerPhone, verificationCode }) => MsbRequest.post("/verification-code-check", data, { notVerifyToken: true });
  const ApiGetUserInfo = () => MsbRequest.get("/passenger-user");
  const ApiPutUserInfo = (UserInfo) => MsbRequest.put("/passenger-user", UserInfo);
  const _sfc_main$i = {
    __name: "login",
    setup(__props) {
      const $store = useStore();
      vue.computed(() => $store.state.token);
      let codeText = vue.ref("\u83B7\u53D6\u9A8C\u8BC1\u7801");
      let codeTimerNum = vue.ref(0);
      let codeTimer = null;
      let isDisableCode = vue.computed(() => codeTimerNum.value !== 0);
      let phone = vue.ref("");
      let code = vue.ref("");
      const handleGetVerifyCode = async () => {
        if (isDisableCode.value || !verifyPhone(phone.value)) {
          return false;
        }
        codeTimerNum.value = 10;
        calcTimer();
        const { error, result } = await ApiGetVerifyCode({ passengerPhone: phone.value });
        formatAppLog("log", "at pages/login.vue:37", error, { passengerPhone: phone.value });
        if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
          ShowToast("\u9A8C\u8BC1\u7801\u53D1\u9001\u6210\u529F");
        }
      };
      const getUserInfo = async () => {
        const { error, result } = await ApiGetUserInfo();
        if (!result.hasOwnProperty("code")) {
          $store.commit("setUserInfo", result);
        }
      };
      const handleLogin = async () => {
        if (!verifyPhone(phone.value)) {
          return false;
        }
        if (!code.value) {
          ShowToast("\u8BF7\u8F93\u5165\u6B63\u786E\u9A8C\u8BC1\u7801");
          return false;
        }
        const { error, result } = await ApiPostVerifyCodeCheck({
          passengerPhone: phone.value,
          verificationCode: code.value
        });
        if (!HandleApiError(error) && result.hasOwnProperty("code")) {
          ShowToast(result.message);
        } else {
          $store.commit("setToken", result.accessToken);
          getUserInfo();
          uni.reLaunch({ url: "/pages/index/index" });
        }
      };
      const calcTimer = () => {
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
      };
      const verifyPhone = (phone2) => {
        let result = phone2 && isPhone(phone2);
        if (!result) {
          ShowToast("\u8BF7\u586B\u5199\u6B63\u786E\u624B\u673A\u53F7\uFF01");
          result = false;
        }
        return result;
      };
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
          }, "\u767B\u5F55\u6216\u6CE8\u518C")
        ]);
      };
    }
  };
  var PagesLogin = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["__scopeId", "data-v-c40149d6"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/login.vue"]]);
  const _sfc_main$h = {
    __name: "account",
    setup(__props) {
      const $store = useStore();
      let serverConf2 = vue.computed({
        get: () => $store.state.serverConf,
        set(val) {
        }
      });
      const handleSave = () => {
        $store.commit("setServerConf", serverConf2.value);
        ShowToast("\u4FDD\u5B58\u6210\u529F");
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "wrapper" }, [
          vue.createElementVNode("view", { class: "title" }, "\u5728\u6B64\u8BBE\u7F6E\u4F60\u7684\u540E\u7AEF\u670D\u52A1\u5730\u5740\uFF1A"),
          vue.createElementVNode("view", { class: "item" }, [
            vue.createElementVNode("text", { class: "label" }, "\u652F\u4ED8\u670D\u52A1"),
            vue.withDirectives(vue.createElementVNode("input", {
              class: "input",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => vue.unref(serverConf2).pay = $event)
            }, null, 512), [
              [vue.vModelText, vue.unref(serverConf2).pay]
            ])
          ]),
          vue.createElementVNode("view", { class: "item" }, [
            vue.createElementVNode("text", { class: "label" }, "SSE\u670D\u52A1"),
            vue.withDirectives(vue.createElementVNode("input", {
              class: "input",
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => vue.unref(serverConf2).sse = $event)
            }, null, 512), [
              [vue.vModelText, vue.unref(serverConf2).sse]
            ])
          ]),
          vue.createElementVNode("view", { class: "item" }, [
            vue.createElementVNode("text", { class: "label" }, "\u5176\u4ED6\u670D\u52A1"),
            vue.withDirectives(vue.createElementVNode("input", {
              class: "input",
              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => vue.unref(serverConf2).other = $event)
            }, null, 512), [
              [vue.vModelText, vue.unref(serverConf2).other]
            ])
          ]),
          vue.createElementVNode("button", {
            class: "btn",
            onClick: handleSave
          }, "\u4FDD\u5B58"),
          vue.createElementVNode("view", { class: "desc" }, "\u4FDD\u5B58\u6210\u529F\u540E\u5982\u4E0D\u751F\u6548\uFF0C\u8BF7\u91CD\u542FAPP")
        ]);
      };
    }
  };
  var PagesAccount = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["__scopeId", "data-v-3fcaded9"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/account.vue"]]);
  const _sfc_main$g = {
    __name: "orderInfo",
    setup(__props) {
      const tabs = [
        { key: "all", label: "\u5168\u90E8" },
        { key: "pending", label: "\u5F85\u63A5\u5355" },
        { key: "accepted", label: "\u5DF2\u63A5\u5355" },
        { key: "ongoing", label: "\u8FDB\u884C\u4E2D" },
        { key: "pendingPayment", label: "\u5F85\u652F\u4ED8" },
        { key: "completed", label: "\u5DF2\u5B8C\u6210" },
        { key: "canceled", label: "\u5DF2\u53D6\u6D88" }
      ];
      const orders = vue.ref([]);
      const currentFilter = vue.ref("all");
      onShow(() => {
        fetchAllOrders();
      });
      const fetchAllOrders = async () => {
        const { error, result } = await ApiGetAllOrderInfo();
        if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
          orders.value = result;
        }
      };
      const filteredOrders = vue.computed(() => {
        if (currentFilter.value === "all")
          return orders.value;
        const filterStatus = getOrderStatusValue(currentFilter.value);
        if (Array.isArray(filterStatus)) {
          return orders.value.filter((order) => filterStatus.includes(order.orderStatus));
        } else {
          return orders.value.filter((order) => order.orderStatus === filterStatus);
        }
      });
      const filterOrders = (status) => {
        currentFilter.value = status;
      };
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
      const getOrderStatusValue = (text) => {
        switch (text) {
          case "pending":
            return 1;
          case "accepted":
            return 2;
          case "ongoing":
            return [3, 4, 5, 6];
          case "pendingPayment":
            return 7;
          case "completed":
            return 8;
          case "canceled":
            return 9;
          default:
            return 0;
        }
      };
      const getStatusClass = (status) => {
        switch (status) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            return "status-warning";
          case 8:
            return "status-success";
          case 9:
            return "status-error";
          default:
            return "";
        }
      };
      const goToOrderDetail = (orderId) => {
        uni.navigateTo({ url: `/pages/orderDetail?orderId=${orderId}` });
      };
      return (_ctx, _cache) => {
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
        return vue.openBlock(), vue.createElementBlock("view", { class: "order-info" }, [
          vue.createCommentVNode(" \u9876\u90E8\u7B5B\u9009\u6807\u7B7E\uFF08\u6A2A\u5411\u6EDA\u52A8\uFF09 "),
          vue.createElementVNode("scroll-view", {
            "scroll-x": "",
            class: "top-scroll",
            "show-scrollbar": "false"
          }, [
            (vue.openBlock(), vue.createElementBlock(vue.Fragment, null, vue.renderList(tabs, (tab) => {
              return vue.createElementVNode("view", {
                key: tab.key,
                class: vue.normalizeClass(["top-tab", { active: currentFilter.value === tab.key }]),
                onClick: ($event) => filterOrders(tab.key)
              }, [
                vue.createElementVNode("text", null, vue.toDisplayString(tab.label), 1)
              ], 10, ["onClick"]);
            }), 64))
          ]),
          vue.createCommentVNode(" \u8BA2\u5355\u5217\u8868 "),
          vue.createElementVNode("view", { class: "order-list" }, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(filteredOrders), (order) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: order.id,
                class: "order-card"
              }, [
                vue.createElementVNode("view", { class: "order-header" }, [
                  vue.createElementVNode("view", { class: "header-left" }, [
                    vue.createElementVNode("text", { class: "company-name" }, "\u8FC5\u5BB6\u51FA\u884C"),
                    vue.createElementVNode("view", {
                      class: vue.normalizeClass(["order-status", getStatusClass(order.orderStatus)])
                    }, vue.toDisplayString(getOrderStatusText(order.orderStatus)), 3)
                  ]),
                  vue.createElementVNode("view", { class: "header-right" }, [
                    order.orderStatus == 8 || order.orderStatus == 7 ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 0,
                      class: "order-price"
                    }, vue.toDisplayString(order.price) + " \u5143 ", 1)) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("text", {
                      class: "iconfont icon-jinru arrow-icon",
                      onClick: ($event) => goToOrderDetail(order.id)
                    }, null, 8, ["onClick"])
                  ])
                ]),
                vue.createElementVNode("view", { class: "order-details" }, [
                  vue.createElementVNode("view", { class: "order-date" }, [
                    vue.createVNode(_component_uni_icons, {
                      type: "calendar",
                      size: "14",
                      color: "#86909c"
                    }),
                    vue.createElementVNode("text", null, vue.toDisplayString(order.orderTime), 1)
                  ]),
                  vue.createElementVNode("view", { class: "route" }, [
                    vue.createElementVNode("view", { class: "start" }, [
                      vue.createElementVNode("view", { class: "dot start-dot" }),
                      vue.createElementVNode("text", null, vue.toDisplayString(order.departure), 1)
                    ]),
                    vue.createElementVNode("view", { class: "end" }, [
                      vue.createElementVNode("view", { class: "dot end-dot" }),
                      vue.createElementVNode("text", null, vue.toDisplayString(order.destination), 1)
                    ])
                  ])
                ])
              ]);
            }), 128)),
            vue.createCommentVNode(" \u7A7A\u72B6\u6001\u63D0\u793A "),
            !vue.unref(filteredOrders).length ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "empty-state"
            }, [
              vue.createElementVNode("image", {
                src: "/static/empty-order.png",
                mode: "aspectFit",
                class: "empty-image"
              }),
              vue.createElementVNode("text", { class: "empty-text" }, "\u6682\u65E0\u8BA2\u5355")
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ]);
      };
    }
  };
  var PagesOrderInfo = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-62767948"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/orderInfo.vue"]]);
  const _sfc_main$f = {
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
          size: size2,
          absolute
        } = this;
        return [
          inverted ? "uni-badge--" + type + "-inverted" : "",
          "uni-badge--" + type,
          "uni-badge--" + size2,
          absolute ? "uni-badge--absolute" : ""
        ].join(" ");
      },
      positionStyle() {
        if (!this.absolute)
          return {};
        let w = this.width / 2, h2 = 10;
        if (this.isDot) {
          w = 5;
          h2 = 5;
        }
        const x2 = `${-w + this.offset[0]}px`;
        const y2 = `${-h2 + this.offset[1]}px`;
        const whiteList = {
          rightTop: {
            right: x2,
            top: y2
          },
          rightBottom: {
            right: x2,
            bottom: y2
          },
          leftBottom: {
            left: x2,
            bottom: y2
          },
          leftTop: {
            left: x2,
            top: y2
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
  var __easycom_1$2 = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$a], ["__scopeId", "data-v-50168758"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-badge/uni-badge.vue"]]);
  const _sfc_main$e = {
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
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
    const _component_uni_badge = resolveEasycom(vue.resolveDynamicComponent("uni-badge"), __easycom_1$2);
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
  var __easycom_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$9], ["__scopeId", "data-v-b2f877dc"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-list-item/uni-list-item.vue"]]);
  const _sfc_main$d = {
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
  var __easycom_2$2 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$8], ["__scopeId", "data-v-6ac7d866"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-list/uni-list.vue"]]);
  const _sfc_main$c = {
    __name: "my",
    setup(__props) {
      const $store = useStore();
      const userInfo = vue.computed(() => $store.state.userInfo);
      const menuItems = [
        { name: "\u4E2A\u4EBA\u4FE1\u606F\u7BA1\u7406", page: "/pages/myInfo" },
        { name: "\u652F\u4ED8\u8BBE\u7F6E", page: "/pages/paymentSettings" },
        { name: "\u5BA2\u670D", page: "/pages/customerService" },
        { name: "\u5411\u5F00\u53D1\u8005\u63D0\u610F\u89C1", page: "/pages/opinion" },
        { name: "\u670D\u52A1\u534F\u8BAE\u4E0E\u5E73\u53F0\u89C4\u5219", page: "/pages/termsAndRules" },
        { name: "\u670D\u52A1\u7AEF\u5730\u5740(\u4EC5\u4F9B\u6D4B\u8BD5)", page: "/pages/account" }
      ];
      const handleLogout = () => {
        $store.commit("setToken", "");
        $store.commit("setCity", gdMapConf.city);
        uni.redirectTo({ url: "/pages/login" });
      };
      const goToPage = (page) => {
        uni.navigateTo({ url: page });
      };
      return (_ctx, _cache) => {
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
        const _component_uni_list_item = resolveEasycom(vue.resolveDynamicComponent("uni-list-item"), __easycom_1$1);
        const _component_uni_list = resolveEasycom(vue.resolveDynamicComponent("uni-list"), __easycom_2$2);
        return vue.openBlock(), vue.createElementBlock("view", { class: "personal-center" }, [
          vue.createCommentVNode(" \u9876\u90E8\u7528\u6237\u5361\u7247 "),
          vue.createElementVNode("view", { class: "user-card" }, [
            vue.createElementVNode("view", { class: "user-info" }, [
              vue.createElementVNode("image", {
                class: "avatar",
                src: vue.unref(userInfo).profilePhoto || "/static/default-avatar.png",
                mode: "aspectFill"
              }, null, 8, ["src"]),
              vue.createElementVNode("view", { class: "info-text" }, [
                vue.createElementVNode("text", { class: "phone" }, vue.toDisplayString(vue.unref(userInfo).passengerPhone), 1),
                vue.createElementVNode("text", { class: "role" }, "\u4E58\u5BA2")
              ])
            ]),
            vue.createCommentVNode(" \u53EF\u9009\u72B6\u6001\u6807\u8BC6 "),
            vue.createElementVNode("view", { class: "status-badge" }, [
              vue.createVNode(_component_uni_icons, {
                type: "checkmarkempty",
                size: "14",
                color: "#52c41a"
              }),
              vue.createElementVNode("text", null, "\u5DF2\u8BA4\u8BC1")
            ])
          ]),
          vue.createCommentVNode(" \u529F\u80FD\u83DC\u5355\u5217\u8868 "),
          vue.createElementVNode("view", { class: "menu-section" }, [
            vue.createVNode(_component_uni_list, { border: false }, {
              default: vue.withCtx(() => [
                (vue.openBlock(), vue.createElementBlock(vue.Fragment, null, vue.renderList(menuItems, (item, index) => {
                  return vue.createVNode(_component_uni_list_item, {
                    key: index,
                    title: item.name,
                    "show-arrow": "",
                    clickable: "",
                    onClick: ($event) => goToPage(item.page)
                  }, null, 8, ["title", "onClick"]);
                }), 64))
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
  var PagesMy = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-c8d905a0"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/my.vue"]]);
  const _sfc_main$b = {
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
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
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
  var __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$7], ["__scopeId", "data-v-80554eb4"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-card/uni-card.vue"]]);
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
  const _sfc_main$a = {
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
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
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
  var __easycom_2$1 = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$6], ["__scopeId", "data-v-20076044"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-easyinput/uni-easyinput.vue"]]);
  const _sfc_main$9 = {
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
  var __easycom_3 = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$5], ["__scopeId", "data-v-1359f286"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-forms-item/uni-forms-item.vue"]]);
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
  function normalizeLocale(locale, messages) {
    if (!locale) {
      return;
    }
    locale = locale.trim().replace(/_/g, "-");
    if (messages && messages[locale]) {
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
    constructor({ locale, fallbackLocale, messages, watcher, formater }) {
      this.locale = LOCALE_EN;
      this.fallbackLocale = LOCALE_EN;
      this.message = {};
      this.messages = {};
      this.watchers = [];
      if (fallbackLocale) {
        this.fallbackLocale = fallbackLocale;
      }
      this.formater = formater || defaultFormatter;
      this.messages = messages || {};
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
    watchLocale(fn2) {
      const index = this.watchers.push(fn2) - 1;
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
  function initVueI18n(locale, messages = {}, fallbackLocale, watcher) {
    if (typeof locale !== "string") {
      [locale, messages] = [
        messages,
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
      messages,
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
      watch(fn2) {
        return i18n.watchLocale(fn2);
      },
      getLocale() {
        return i18n.getLocale();
      },
      setLocale(newLocale) {
        return i18n.setLocale(newLocale);
      }
    };
  }
  const easycom = {
    autoscan: true,
    custom: {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
    }
  };
  const pages = [
    {
      path: "pages/index/index",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/city",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/createOrder",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/orderDetail",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/pay"
    },
    {
      path: "pages/login",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/account",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/orderInfo",
      "app-plus": {
        scrollIndicator: "none"
      },
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/my",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/myInfo",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/paymentSettings",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/termsAndRules",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    },
    {
      path: "pages/opinion",
      style: {
        titleImage: "/static/passenger-logo.png"
      }
    }
  ];
  const globalStyle = {
    navigationBarTextStyle: "black",
    navigationBarTitleText: "\u8FC5\u5BB6\u51FA\u884C",
    navigationBarBackgroundColor: "#F8F8F8",
    backgroundColor: "#F8F8F8"
  };
  const tabBar = {
    color: "#888",
    selectedColor: "#318eff",
    height: "64px",
    fontSize: "14px",
    iconfontSrc: "/static/icon/iconfont.ttf",
    list: [
      {
        pagePath: "pages/index/index",
        text: "\u9996\u9875",
        iconfont: {
          text: "\uE622",
          selectedText: "\uE622",
          fontSize: "24px",
          color: "#318eff",
          selectedColor: "#318eff"
        }
      },
      {
        pagePath: "pages/orderInfo",
        text: "\u8BA2\u5355",
        iconfont: {
          text: "\uE64E",
          selectedText: "\uE64E",
          fontSize: "24px",
          color: "#318eff",
          selectedColor: "#318eff"
        }
      },
      {
        pagePath: "pages/my",
        text: "\u6211\u7684",
        iconfont: {
          text: "\uE62B",
          selectedText: "\uE62B",
          fontSize: "24px",
          color: "#318eff",
          selectedColor: "#318eff"
        }
      }
    ]
  };
  var t = {
    easycom,
    pages,
    globalStyle,
    tabBar
  };
  function n(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
  }
  function s(e, t2, n2) {
    return e(n2 = { path: t2, exports: {}, require: function(e2, t3) {
      return function() {
        throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
      }(null == t3 && n2.path);
    } }, n2.exports), n2.exports;
  }
  var o = s(function(e, t2) {
    var n2;
    e.exports = (n2 = n2 || function(e2, t3) {
      var n3 = Object.create || function() {
        function e3() {
        }
        return function(t4) {
          var n4;
          return e3.prototype = t4, n4 = new e3(), e3.prototype = null, n4;
        };
      }(), s2 = {}, o2 = s2.lib = {}, r2 = o2.Base = { extend: function(e3) {
        var t4 = n3(this);
        return e3 && t4.mixIn(e3), t4.hasOwnProperty("init") && this.init !== t4.init || (t4.init = function() {
          t4.$super.init.apply(this, arguments);
        }), t4.init.prototype = t4, t4.$super = this, t4;
      }, create: function() {
        var e3 = this.extend();
        return e3.init.apply(e3, arguments), e3;
      }, init: function() {
      }, mixIn: function(e3) {
        for (var t4 in e3)
          e3.hasOwnProperty(t4) && (this[t4] = e3[t4]);
        e3.hasOwnProperty("toString") && (this.toString = e3.toString);
      }, clone: function() {
        return this.init.prototype.extend(this);
      } }, i2 = o2.WordArray = r2.extend({ init: function(e3, n4) {
        e3 = this.words = e3 || [], this.sigBytes = n4 != t3 ? n4 : 4 * e3.length;
      }, toString: function(e3) {
        return (e3 || c2).stringify(this);
      }, concat: function(e3) {
        var t4 = this.words, n4 = e3.words, s3 = this.sigBytes, o3 = e3.sigBytes;
        if (this.clamp(), s3 % 4)
          for (var r3 = 0; r3 < o3; r3++) {
            var i3 = n4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
            t4[s3 + r3 >>> 2] |= i3 << 24 - (s3 + r3) % 4 * 8;
          }
        else
          for (r3 = 0; r3 < o3; r3 += 4)
            t4[s3 + r3 >>> 2] = n4[r3 >>> 2];
        return this.sigBytes += o3, this;
      }, clamp: function() {
        var t4 = this.words, n4 = this.sigBytes;
        t4[n4 >>> 2] &= 4294967295 << 32 - n4 % 4 * 8, t4.length = e2.ceil(n4 / 4);
      }, clone: function() {
        var e3 = r2.clone.call(this);
        return e3.words = this.words.slice(0), e3;
      }, random: function(t4) {
        for (var n4, s3 = [], o3 = function(t5) {
          t5 = t5;
          var n5 = 987654321, s4 = 4294967295;
          return function() {
            var o4 = ((n5 = 36969 * (65535 & n5) + (n5 >> 16) & s4) << 16) + (t5 = 18e3 * (65535 & t5) + (t5 >> 16) & s4) & s4;
            return o4 /= 4294967296, (o4 += 0.5) * (e2.random() > 0.5 ? 1 : -1);
          };
        }, r3 = 0; r3 < t4; r3 += 4) {
          var a3 = o3(4294967296 * (n4 || e2.random()));
          n4 = 987654071 * a3(), s3.push(4294967296 * a3() | 0);
        }
        return new i2.init(s3, t4);
      } }), a2 = s2.enc = {}, c2 = a2.Hex = { stringify: function(e3) {
        for (var t4 = e3.words, n4 = e3.sigBytes, s3 = [], o3 = 0; o3 < n4; o3++) {
          var r3 = t4[o3 >>> 2] >>> 24 - o3 % 4 * 8 & 255;
          s3.push((r3 >>> 4).toString(16)), s3.push((15 & r3).toString(16));
        }
        return s3.join("");
      }, parse: function(e3) {
        for (var t4 = e3.length, n4 = [], s3 = 0; s3 < t4; s3 += 2)
          n4[s3 >>> 3] |= parseInt(e3.substr(s3, 2), 16) << 24 - s3 % 8 * 4;
        return new i2.init(n4, t4 / 2);
      } }, u2 = a2.Latin1 = { stringify: function(e3) {
        for (var t4 = e3.words, n4 = e3.sigBytes, s3 = [], o3 = 0; o3 < n4; o3++) {
          var r3 = t4[o3 >>> 2] >>> 24 - o3 % 4 * 8 & 255;
          s3.push(String.fromCharCode(r3));
        }
        return s3.join("");
      }, parse: function(e3) {
        for (var t4 = e3.length, n4 = [], s3 = 0; s3 < t4; s3++)
          n4[s3 >>> 2] |= (255 & e3.charCodeAt(s3)) << 24 - s3 % 4 * 8;
        return new i2.init(n4, t4);
      } }, l2 = a2.Utf8 = { stringify: function(e3) {
        try {
          return decodeURIComponent(escape(u2.stringify(e3)));
        } catch (e4) {
          throw new Error("Malformed UTF-8 data");
        }
      }, parse: function(e3) {
        return u2.parse(unescape(encodeURIComponent(e3)));
      } }, h2 = o2.BufferedBlockAlgorithm = r2.extend({ reset: function() {
        this._data = new i2.init(), this._nDataBytes = 0;
      }, _append: function(e3) {
        "string" == typeof e3 && (e3 = l2.parse(e3)), this._data.concat(e3), this._nDataBytes += e3.sigBytes;
      }, _process: function(t4) {
        var n4 = this._data, s3 = n4.words, o3 = n4.sigBytes, r3 = this.blockSize, a3 = o3 / (4 * r3), c3 = (a3 = t4 ? e2.ceil(a3) : e2.max((0 | a3) - this._minBufferSize, 0)) * r3, u3 = e2.min(4 * c3, o3);
        if (c3) {
          for (var l3 = 0; l3 < c3; l3 += r3)
            this._doProcessBlock(s3, l3);
          var h3 = s3.splice(0, c3);
          n4.sigBytes -= u3;
        }
        return new i2.init(h3, u3);
      }, clone: function() {
        var e3 = r2.clone.call(this);
        return e3._data = this._data.clone(), e3;
      }, _minBufferSize: 0 });
      o2.Hasher = h2.extend({ cfg: r2.extend(), init: function(e3) {
        this.cfg = this.cfg.extend(e3), this.reset();
      }, reset: function() {
        h2.reset.call(this), this._doReset();
      }, update: function(e3) {
        return this._append(e3), this._process(), this;
      }, finalize: function(e3) {
        return e3 && this._append(e3), this._doFinalize();
      }, blockSize: 16, _createHelper: function(e3) {
        return function(t4, n4) {
          return new e3.init(n4).finalize(t4);
        };
      }, _createHmacHelper: function(e3) {
        return function(t4, n4) {
          return new d2.HMAC.init(e3, n4).finalize(t4);
        };
      } });
      var d2 = s2.algo = {};
      return s2;
    }(Math), n2);
  }), r = (s(function(e, t2) {
    var n2;
    e.exports = (n2 = o, function(e2) {
      var t3 = n2, s2 = t3.lib, o2 = s2.WordArray, r2 = s2.Hasher, i2 = t3.algo, a2 = [];
      !function() {
        for (var t4 = 0; t4 < 64; t4++)
          a2[t4] = 4294967296 * e2.abs(e2.sin(t4 + 1)) | 0;
      }();
      var c2 = i2.MD5 = r2.extend({ _doReset: function() {
        this._hash = new o2.init([1732584193, 4023233417, 2562383102, 271733878]);
      }, _doProcessBlock: function(e3, t4) {
        for (var n3 = 0; n3 < 16; n3++) {
          var s3 = t4 + n3, o3 = e3[s3];
          e3[s3] = 16711935 & (o3 << 8 | o3 >>> 24) | 4278255360 & (o3 << 24 | o3 >>> 8);
        }
        var r3 = this._hash.words, i3 = e3[t4 + 0], c3 = e3[t4 + 1], f2 = e3[t4 + 2], p2 = e3[t4 + 3], g2 = e3[t4 + 4], m2 = e3[t4 + 5], y2 = e3[t4 + 6], _2 = e3[t4 + 7], w = e3[t4 + 8], v2 = e3[t4 + 9], k2 = e3[t4 + 10], T2 = e3[t4 + 11], S2 = e3[t4 + 12], A2 = e3[t4 + 13], P2 = e3[t4 + 14], I2 = e3[t4 + 15], b2 = r3[0], O2 = r3[1], C2 = r3[2], E2 = r3[3];
        b2 = u2(b2, O2, C2, E2, i3, 7, a2[0]), E2 = u2(E2, b2, O2, C2, c3, 12, a2[1]), C2 = u2(C2, E2, b2, O2, f2, 17, a2[2]), O2 = u2(O2, C2, E2, b2, p2, 22, a2[3]), b2 = u2(b2, O2, C2, E2, g2, 7, a2[4]), E2 = u2(E2, b2, O2, C2, m2, 12, a2[5]), C2 = u2(C2, E2, b2, O2, y2, 17, a2[6]), O2 = u2(O2, C2, E2, b2, _2, 22, a2[7]), b2 = u2(b2, O2, C2, E2, w, 7, a2[8]), E2 = u2(E2, b2, O2, C2, v2, 12, a2[9]), C2 = u2(C2, E2, b2, O2, k2, 17, a2[10]), O2 = u2(O2, C2, E2, b2, T2, 22, a2[11]), b2 = u2(b2, O2, C2, E2, S2, 7, a2[12]), E2 = u2(E2, b2, O2, C2, A2, 12, a2[13]), C2 = u2(C2, E2, b2, O2, P2, 17, a2[14]), b2 = l2(b2, O2 = u2(O2, C2, E2, b2, I2, 22, a2[15]), C2, E2, c3, 5, a2[16]), E2 = l2(E2, b2, O2, C2, y2, 9, a2[17]), C2 = l2(C2, E2, b2, O2, T2, 14, a2[18]), O2 = l2(O2, C2, E2, b2, i3, 20, a2[19]), b2 = l2(b2, O2, C2, E2, m2, 5, a2[20]), E2 = l2(E2, b2, O2, C2, k2, 9, a2[21]), C2 = l2(C2, E2, b2, O2, I2, 14, a2[22]), O2 = l2(O2, C2, E2, b2, g2, 20, a2[23]), b2 = l2(b2, O2, C2, E2, v2, 5, a2[24]), E2 = l2(E2, b2, O2, C2, P2, 9, a2[25]), C2 = l2(C2, E2, b2, O2, p2, 14, a2[26]), O2 = l2(O2, C2, E2, b2, w, 20, a2[27]), b2 = l2(b2, O2, C2, E2, A2, 5, a2[28]), E2 = l2(E2, b2, O2, C2, f2, 9, a2[29]), C2 = l2(C2, E2, b2, O2, _2, 14, a2[30]), b2 = h2(b2, O2 = l2(O2, C2, E2, b2, S2, 20, a2[31]), C2, E2, m2, 4, a2[32]), E2 = h2(E2, b2, O2, C2, w, 11, a2[33]), C2 = h2(C2, E2, b2, O2, T2, 16, a2[34]), O2 = h2(O2, C2, E2, b2, P2, 23, a2[35]), b2 = h2(b2, O2, C2, E2, c3, 4, a2[36]), E2 = h2(E2, b2, O2, C2, g2, 11, a2[37]), C2 = h2(C2, E2, b2, O2, _2, 16, a2[38]), O2 = h2(O2, C2, E2, b2, k2, 23, a2[39]), b2 = h2(b2, O2, C2, E2, A2, 4, a2[40]), E2 = h2(E2, b2, O2, C2, i3, 11, a2[41]), C2 = h2(C2, E2, b2, O2, p2, 16, a2[42]), O2 = h2(O2, C2, E2, b2, y2, 23, a2[43]), b2 = h2(b2, O2, C2, E2, v2, 4, a2[44]), E2 = h2(E2, b2, O2, C2, S2, 11, a2[45]), C2 = h2(C2, E2, b2, O2, I2, 16, a2[46]), b2 = d2(b2, O2 = h2(O2, C2, E2, b2, f2, 23, a2[47]), C2, E2, i3, 6, a2[48]), E2 = d2(E2, b2, O2, C2, _2, 10, a2[49]), C2 = d2(C2, E2, b2, O2, P2, 15, a2[50]), O2 = d2(O2, C2, E2, b2, m2, 21, a2[51]), b2 = d2(b2, O2, C2, E2, S2, 6, a2[52]), E2 = d2(E2, b2, O2, C2, p2, 10, a2[53]), C2 = d2(C2, E2, b2, O2, k2, 15, a2[54]), O2 = d2(O2, C2, E2, b2, c3, 21, a2[55]), b2 = d2(b2, O2, C2, E2, w, 6, a2[56]), E2 = d2(E2, b2, O2, C2, I2, 10, a2[57]), C2 = d2(C2, E2, b2, O2, y2, 15, a2[58]), O2 = d2(O2, C2, E2, b2, A2, 21, a2[59]), b2 = d2(b2, O2, C2, E2, g2, 6, a2[60]), E2 = d2(E2, b2, O2, C2, T2, 10, a2[61]), C2 = d2(C2, E2, b2, O2, f2, 15, a2[62]), O2 = d2(O2, C2, E2, b2, v2, 21, a2[63]), r3[0] = r3[0] + b2 | 0, r3[1] = r3[1] + O2 | 0, r3[2] = r3[2] + C2 | 0, r3[3] = r3[3] + E2 | 0;
      }, _doFinalize: function() {
        var t4 = this._data, n3 = t4.words, s3 = 8 * this._nDataBytes, o3 = 8 * t4.sigBytes;
        n3[o3 >>> 5] |= 128 << 24 - o3 % 32;
        var r3 = e2.floor(s3 / 4294967296), i3 = s3;
        n3[15 + (o3 + 64 >>> 9 << 4)] = 16711935 & (r3 << 8 | r3 >>> 24) | 4278255360 & (r3 << 24 | r3 >>> 8), n3[14 + (o3 + 64 >>> 9 << 4)] = 16711935 & (i3 << 8 | i3 >>> 24) | 4278255360 & (i3 << 24 | i3 >>> 8), t4.sigBytes = 4 * (n3.length + 1), this._process();
        for (var a3 = this._hash, c3 = a3.words, u3 = 0; u3 < 4; u3++) {
          var l3 = c3[u3];
          c3[u3] = 16711935 & (l3 << 8 | l3 >>> 24) | 4278255360 & (l3 << 24 | l3 >>> 8);
        }
        return a3;
      }, clone: function() {
        var e3 = r2.clone.call(this);
        return e3._hash = this._hash.clone(), e3;
      } });
      function u2(e3, t4, n3, s3, o3, r3, i3) {
        var a3 = e3 + (t4 & n3 | ~t4 & s3) + o3 + i3;
        return (a3 << r3 | a3 >>> 32 - r3) + t4;
      }
      function l2(e3, t4, n3, s3, o3, r3, i3) {
        var a3 = e3 + (t4 & s3 | n3 & ~s3) + o3 + i3;
        return (a3 << r3 | a3 >>> 32 - r3) + t4;
      }
      function h2(e3, t4, n3, s3, o3, r3, i3) {
        var a3 = e3 + (t4 ^ n3 ^ s3) + o3 + i3;
        return (a3 << r3 | a3 >>> 32 - r3) + t4;
      }
      function d2(e3, t4, n3, s3, o3, r3, i3) {
        var a3 = e3 + (n3 ^ (t4 | ~s3)) + o3 + i3;
        return (a3 << r3 | a3 >>> 32 - r3) + t4;
      }
      t3.MD5 = r2._createHelper(c2), t3.HmacMD5 = r2._createHmacHelper(c2);
    }(Math), n2.MD5);
  }), s(function(e, t2) {
    var n2, s2, r2;
    e.exports = (s2 = (n2 = o).lib.Base, r2 = n2.enc.Utf8, void (n2.algo.HMAC = s2.extend({ init: function(e2, t3) {
      e2 = this._hasher = new e2.init(), "string" == typeof t3 && (t3 = r2.parse(t3));
      var n3 = e2.blockSize, s3 = 4 * n3;
      t3.sigBytes > s3 && (t3 = e2.finalize(t3)), t3.clamp();
      for (var o2 = this._oKey = t3.clone(), i2 = this._iKey = t3.clone(), a2 = o2.words, c2 = i2.words, u2 = 0; u2 < n3; u2++)
        a2[u2] ^= 1549556828, c2[u2] ^= 909522486;
      o2.sigBytes = i2.sigBytes = s3, this.reset();
    }, reset: function() {
      var e2 = this._hasher;
      e2.reset(), e2.update(this._iKey);
    }, update: function(e2) {
      return this._hasher.update(e2), this;
    }, finalize: function(e2) {
      var t3 = this._hasher, n3 = t3.finalize(e2);
      return t3.reset(), t3.finalize(this._oKey.clone().concat(n3));
    } })));
  }), s(function(e, t2) {
    e.exports = o.HmacMD5;
  })), i = s(function(e, t2) {
    e.exports = o.enc.Utf8;
  }), a = s(function(e, t2) {
    var n2;
    e.exports = (n2 = o, function() {
      var e2 = n2, t3 = e2.lib.WordArray;
      function s2(e3, n3, s3) {
        for (var o2 = [], r2 = 0, i2 = 0; i2 < n3; i2++)
          if (i2 % 4) {
            var a2 = s3[e3.charCodeAt(i2 - 1)] << i2 % 4 * 2, c2 = s3[e3.charCodeAt(i2)] >>> 6 - i2 % 4 * 2;
            o2[r2 >>> 2] |= (a2 | c2) << 24 - r2 % 4 * 8, r2++;
          }
        return t3.create(o2, r2);
      }
      e2.enc.Base64 = { stringify: function(e3) {
        var t4 = e3.words, n3 = e3.sigBytes, s3 = this._map;
        e3.clamp();
        for (var o2 = [], r2 = 0; r2 < n3; r2 += 3)
          for (var i2 = (t4[r2 >>> 2] >>> 24 - r2 % 4 * 8 & 255) << 16 | (t4[r2 + 1 >>> 2] >>> 24 - (r2 + 1) % 4 * 8 & 255) << 8 | t4[r2 + 2 >>> 2] >>> 24 - (r2 + 2) % 4 * 8 & 255, a2 = 0; a2 < 4 && r2 + 0.75 * a2 < n3; a2++)
            o2.push(s3.charAt(i2 >>> 6 * (3 - a2) & 63));
        var c2 = s3.charAt(64);
        if (c2)
          for (; o2.length % 4; )
            o2.push(c2);
        return o2.join("");
      }, parse: function(e3) {
        var t4 = e3.length, n3 = this._map, o2 = this._reverseMap;
        if (!o2) {
          o2 = this._reverseMap = [];
          for (var r2 = 0; r2 < n3.length; r2++)
            o2[n3.charCodeAt(r2)] = r2;
        }
        var i2 = n3.charAt(64);
        if (i2) {
          var a2 = e3.indexOf(i2);
          -1 !== a2 && (t4 = a2);
        }
        return s2(e3, t4, o2);
      }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" };
    }(), n2.enc.Base64);
  });
  const c = "FUNCTION", u = "OBJECT", l = "CLIENT_DB";
  function h(e) {
    return Object.prototype.toString.call(e).slice(8, -1).toLowerCase();
  }
  function d(e) {
    return "object" === h(e);
  }
  function f(e) {
    return e && "string" == typeof e ? JSON.parse(e) : e;
  }
  const p = true, g = "app";
  let m;
  m = g;
  const y = f(""), _ = f("[]") || [];
  let v = "";
  try {
    v = "__UNI__AC6FD81";
  } catch (e) {
  }
  let k = {};
  function T(e, t2 = {}) {
    var n2, s2;
    return n2 = k, s2 = e, Object.prototype.hasOwnProperty.call(n2, s2) || (k[e] = t2), k[e];
  }
  "app" === m && (k = uni._globalUniCloudObj ? uni._globalUniCloudObj : uni._globalUniCloudObj = {});
  const S = ["invoke", "success", "fail", "complete"], A = T("_globalUniCloudInterceptor");
  function P(e, t2) {
    A[e] || (A[e] = {}), d(t2) && Object.keys(t2).forEach((n2) => {
      S.indexOf(n2) > -1 && function(e2, t3, n3) {
        let s2 = A[e2][t3];
        s2 || (s2 = A[e2][t3] = []), -1 === s2.indexOf(n3) && "function" == typeof n3 && s2.push(n3);
      }(e, n2, t2[n2]);
    });
  }
  function I(e, t2) {
    A[e] || (A[e] = {}), d(t2) ? Object.keys(t2).forEach((n2) => {
      S.indexOf(n2) > -1 && function(e2, t3, n3) {
        const s2 = A[e2][t3];
        if (!s2)
          return;
        const o2 = s2.indexOf(n3);
        o2 > -1 && s2.splice(o2, 1);
      }(e, n2, t2[n2]);
    }) : delete A[e];
  }
  function b(e, t2) {
    return e && 0 !== e.length ? e.reduce((e2, n2) => e2.then(() => n2(t2)), Promise.resolve()) : Promise.resolve();
  }
  function O(e, t2) {
    return A[e] && A[e][t2] || [];
  }
  function C(e) {
    P("callObject", e);
  }
  const E = T("_globalUniCloudListener"), R = "response", U = "needLogin", x = "refreshToken", L = "clientdb", D = "cloudfunction", N = "cloudobject";
  function q(e) {
    return E[e] || (E[e] = []), E[e];
  }
  function F(e, t2) {
    const n2 = q(e);
    n2.includes(t2) || n2.push(t2);
  }
  function M(e, t2) {
    const n2 = q(e), s2 = n2.indexOf(t2);
    -1 !== s2 && n2.splice(s2, 1);
  }
  function j(e, t2) {
    const n2 = q(e);
    for (let e2 = 0; e2 < n2.length; e2++) {
      (0, n2[e2])(t2);
    }
  }
  let $ = false;
  const B = new Promise((e) => {
    $ && e(), function t2() {
      if ("function" == typeof getCurrentPages) {
        const t3 = getCurrentPages();
        t3 && t3[0] && ($ = true, e());
      }
      $ || setTimeout(() => {
        t2();
      }, 30);
    }();
  });
  function K() {
    return B;
  }
  function W(e, t2) {
    return t2 ? function(n2) {
      let s2 = false;
      if ("callFunction" === t2) {
        const e2 = n2 && n2.type || c;
        s2 = e2 !== c;
      }
      const o2 = "callFunction" === t2 && !s2;
      let r2;
      r2 = this.isReady ? Promise.resolve() : this.initUniCloud, n2 = n2 || {};
      const i2 = r2.then(() => s2 ? Promise.resolve() : b(O(t2, "invoke"), n2)).then(() => e.call(this, n2)).then((e2) => s2 ? Promise.resolve(e2) : b(O(t2, "success"), e2).then(() => b(O(t2, "complete"), e2)).then(() => (o2 && j(R, { type: D, content: e2 }), Promise.resolve(e2))), (e2) => s2 ? Promise.reject(e2) : b(O(t2, "fail"), e2).then(() => b(O(t2, "complete"), e2)).then(() => (j(R, { type: D, content: e2 }), Promise.reject(e2))));
      if (!(n2.success || n2.fail || n2.complete))
        return i2;
      i2.then((e2) => {
        n2.success && n2.success(e2), n2.complete && n2.complete(e2), o2 && j(R, { type: D, content: e2 });
      }, (e2) => {
        n2.fail && n2.fail(e2), n2.complete && n2.complete(e2), o2 && j(R, { type: D, content: e2 });
      });
    } : function(t3) {
      if (!((t3 = t3 || {}).success || t3.fail || t3.complete))
        return e.call(this, t3);
      e.call(this, t3).then((e2) => {
        t3.success && t3.success(e2), t3.complete && t3.complete(e2);
      }, (e2) => {
        t3.fail && t3.fail(e2), t3.complete && t3.complete(e2);
      });
    };
  }
  class H extends Error {
    constructor(e) {
      const t2 = e.code || "SYSTEM_ERROR", n2 = e.message || "unknown system error";
      super(n2), this.errMsg = n2, this.errCode = this.code = t2, this.requestId = e.requestId;
    }
  }
  function z() {
    let e, t2;
    try {
      if (uni.getLaunchOptionsSync) {
        if (uni.getLaunchOptionsSync.toString().indexOf("not yet implemented") > -1)
          return;
        const { scene: n2, channel: s2 } = uni.getLaunchOptionsSync();
        e = s2, t2 = n2;
      }
    } catch (e2) {
    }
    return { channel: e, scene: t2 };
  }
  let J;
  function V() {
    const e = uni.getLocale && uni.getLocale() || "en";
    if (J)
      return { ...J, locale: e, LOCALE: e };
    const t2 = uni.getSystemInfoSync(), { deviceId: n2, osName: s2, uniPlatform: o2, appId: r2 } = t2, i2 = ["pixelRatio", "brand", "model", "system", "language", "version", "platform", "host", "SDKVersion", "swanNativeVersion", "app", "AppPlatform", "fontSizeSetting"];
    for (let e2 = 0; e2 < i2.length; e2++) {
      delete t2[i2[e2]];
    }
    return J = { PLATFORM: o2, OS: s2, APPID: r2, DEVICEID: n2, ...z(), ...t2 }, { ...J, locale: e, LOCALE: e };
  }
  var Y = { sign: function(e, t2) {
    let n2 = "";
    return Object.keys(e).sort().forEach(function(t3) {
      e[t3] && (n2 = n2 + "&" + t3 + "=" + e[t3]);
    }), n2 = n2.slice(1), r(n2, t2).toString();
  }, wrappedRequest: function(e, t2) {
    return new Promise((n2, s2) => {
      t2(Object.assign(e, { complete(e2) {
        e2 || (e2 = {}), "web" === m && e2.errMsg && 0 === e2.errMsg.indexOf("request:fail") && console.warn("\u53D1\u5E03H5\uFF0C\u9700\u8981\u5728uniCloud\u540E\u53F0\u64CD\u4F5C\uFF0C\u7ED1\u5B9A\u5B89\u5168\u57DF\u540D\uFF0C\u5426\u5219\u4F1A\u56E0\u4E3A\u8DE8\u57DF\u95EE\u9898\u800C\u65E0\u6CD5\u8BBF\u95EE\u3002\u6559\u7A0B\u53C2\u8003\uFF1Ahttps://uniapp.dcloud.io/uniCloud/quickstart?id=useinh5");
        const t3 = e2.data && e2.data.header && e2.data.header["x-serverless-request-id"] || e2.header && e2.header["request-id"];
        if (!e2.statusCode || e2.statusCode >= 400)
          return s2(new H({ code: "SYS_ERR", message: e2.errMsg || "request:fail", requestId: t3 }));
        const o2 = e2.data;
        if (o2.error)
          return s2(new H({ code: o2.error.code, message: o2.error.message, requestId: t3 }));
        o2.result = o2.data, o2.requestId = t3, delete o2.data, n2(o2);
      } }));
    });
  }, toBase64: function(e) {
    return a.stringify(i.parse(e));
  } };
  var X = { request: (e) => uni.request(e), uploadFile: (e) => uni.uploadFile(e), setStorageSync: (e, t2) => uni.setStorageSync(e, t2), getStorageSync: (e) => uni.getStorageSync(e), removeStorageSync: (e) => uni.removeStorageSync(e), clearStorageSync: () => uni.clearStorageSync() }, G = { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" };
  const { t: Q } = initVueI18n({ "zh-Hans": { "uniCloud.init.paramRequired": "\u7F3A\u5C11\u53C2\u6570\uFF1A{param}", "uniCloud.uploadFile.fileError": "filePath\u5E94\u4E3AFile\u5BF9\u8C61" }, "zh-Hant": { "uniCloud.init.paramRequired": "\u7F3A\u5C11\u53C2\u6570\uFF1A{param}", "uniCloud.uploadFile.fileError": "filePath\u5E94\u4E3AFile\u5BF9\u8C61" }, en: G, fr: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, es: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, ja: G }, "zh-Hans");
  var Z = class {
    constructor(e) {
      ["spaceId", "clientSecret"].forEach((t2) => {
        if (!Object.prototype.hasOwnProperty.call(e, t2))
          throw new Error(Q("uniCloud.init.paramRequired", { param: t2 }));
      }), this.config = Object.assign({}, { endpoint: "https://api.bspapp.com" }, e), this.config.provider = "aliyun", this.config.requestUrl = this.config.endpoint + "/client", this.config.envType = this.config.envType || "public", this.config.accessTokenKey = "access_token_" + this.config.spaceId, this.adapter = X, this._getAccessTokenPromise = null, this._getAccessTokenPromiseStatus = null;
    }
    get hasAccessToken() {
      return !!this.accessToken;
    }
    setAccessToken(e) {
      this.accessToken = e;
    }
    requestWrapped(e) {
      return Y.wrappedRequest(e, this.adapter.request);
    }
    requestAuth(e) {
      return this.requestWrapped(e);
    }
    request(e, t2) {
      return Promise.resolve().then(() => this.hasAccessToken ? t2 ? this.requestWrapped(e) : this.requestWrapped(e).catch((t3) => new Promise((e2, n2) => {
        !t3 || "GATEWAY_INVALID_TOKEN" !== t3.code && "InvalidParameter.InvalidToken" !== t3.code ? n2(t3) : e2();
      }).then(() => this.getAccessToken()).then(() => {
        const t4 = this.rebuildRequest(e);
        return this.request(t4, true);
      })) : this.getAccessToken().then(() => {
        const t3 = this.rebuildRequest(e);
        return this.request(t3, true);
      }));
    }
    rebuildRequest(e) {
      const t2 = Object.assign({}, e);
      return t2.data.token = this.accessToken, t2.header["x-basement-token"] = this.accessToken, t2.header["x-serverless-sign"] = Y.sign(t2.data, this.config.clientSecret), t2;
    }
    setupRequest(e, t2) {
      const n2 = Object.assign({}, e, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      return "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = Y.sign(n2, this.config.clientSecret), { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: s2 };
    }
    getAccessToken() {
      if ("pending" === this._getAccessTokenPromiseStatus)
        return this._getAccessTokenPromise;
      this._getAccessTokenPromiseStatus = "pending";
      return this._getAccessTokenPromise = this.requestAuth(this.setupRequest({ method: "serverless.auth.user.anonymousAuthorize", params: "{}" }, "auth")).then((e) => new Promise((t2, n2) => {
        e.result && e.result.accessToken ? (this.setAccessToken(e.result.accessToken), this._getAccessTokenPromiseStatus = "fulfilled", t2(this.accessToken)) : (this._getAccessTokenPromiseStatus = "rejected", n2(new H({ code: "AUTH_FAILED", message: "\u83B7\u53D6accessToken\u5931\u8D25" })));
      }), (e) => (this._getAccessTokenPromiseStatus = "rejected", Promise.reject(e))), this._getAccessTokenPromise;
    }
    authorize() {
      this.getAccessToken();
    }
    callFunction(e) {
      const t2 = { method: "serverless.function.runtime.invoke", params: JSON.stringify({ functionTarget: e.name, functionArgs: e.data || {} }) };
      return this.request(this.setupRequest(t2));
    }
    getOSSUploadOptionsFromPath(e) {
      const t2 = { method: "serverless.file.resource.generateProximalSign", params: JSON.stringify(e) };
      return this.request(this.setupRequest(t2));
    }
    uploadFileToOSS({ url: e, formData: t2, name: n2, filePath: s2, fileType: o2, onUploadProgress: r2 }) {
      return new Promise((i2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e, formData: t2, name: n2, filePath: s2, fileType: o2, header: { "X-OSS-server-side-encrpytion": "AES256" }, success(e2) {
          e2 && e2.statusCode < 400 ? i2(e2) : a2(new H({ code: "UPLOAD_FAILED", message: "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25" }));
        }, fail(e2) {
          a2(new H({ code: e2.code || "UPLOAD_FAILED", message: e2.message || e2.errMsg || "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25" }));
        } });
        "function" == typeof r2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e2) => {
          r2({ loaded: e2.totalBytesSent, total: e2.totalBytesExpectedToSend });
        });
      });
    }
    reportOSSUpload(e) {
      const t2 = { method: "serverless.file.resource.report", params: JSON.stringify(e) };
      return this.request(this.setupRequest(t2));
    }
    async uploadFile({ filePath: e, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2, config: o2 }) {
      if ("string" !== h(t2))
        throw new H({ code: "INVALID_PARAM", message: "cloudPath\u5FC5\u987B\u4E3A\u5B57\u7B26\u4E32\u7C7B\u578B" });
      if (!(t2 = t2.trim()))
        throw new H({ code: "CLOUDPATH_REQUIRED", message: "cloudPath\u4E0D\u53EF\u4E3A\u7A7A" });
      if (/:\/\//.test(t2))
        throw new H({ code: "INVALID_PARAM", message: "cloudPath\u4E0D\u5408\u6CD5" });
      const r2 = o2 && o2.envType || this.config.envType, i2 = (await this.getOSSUploadOptionsFromPath({ env: r2, filename: t2 })).result, a2 = "https://" + i2.cdnDomain + "/" + i2.ossPath, { securityToken: c2, accessKeyId: u2, signature: l2, host: d2, ossPath: f2, id: p2, policy: g2, ossCallbackUrl: m2 } = i2, y2 = { "Cache-Control": "max-age=2592000", "Content-Disposition": "attachment", OSSAccessKeyId: u2, Signature: l2, host: d2, id: p2, key: f2, policy: g2, success_action_status: 200 };
      if (c2 && (y2["x-oss-security-token"] = c2), m2) {
        const e2 = JSON.stringify({ callbackUrl: m2, callbackBody: JSON.stringify({ fileId: p2, spaceId: this.config.spaceId }), callbackBodyType: "application/json" });
        y2.callback = Y.toBase64(e2);
      }
      const _2 = { url: "https://" + i2.host, formData: y2, fileName: "file", name: "file", filePath: e, fileType: n2 };
      if (await this.uploadFileToOSS(Object.assign({}, _2, { onUploadProgress: s2 })), m2)
        return { success: true, filePath: e, fileID: a2 };
      if ((await this.reportOSSUpload({ id: p2 })).success)
        return { success: true, filePath: e, fileID: a2 };
      throw new H({ code: "UPLOAD_FAILED", message: "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25" });
    }
    deleteFile({ fileList: e }) {
      const t2 = { method: "serverless.file.resource.delete", params: JSON.stringify({ id: e[0] }) };
      return this.request(this.setupRequest(t2));
    }
    getTempFileURL({ fileList: e } = {}) {
      return new Promise((t2, n2) => {
        Array.isArray(e) && 0 !== e.length || n2(new H({ code: "INVALID_PARAM", message: "fileList\u7684\u5143\u7D20\u5FC5\u987B\u662F\u975E\u7A7A\u7684\u5B57\u7B26\u4E32" })), t2({ fileList: e.map((e2) => ({ fileID: e2, tempFileURL: e2 })) });
      });
    }
    async getFileInfo({ fileList: e } = {}) {
      if (!Array.isArray(e) || 0 === e.length)
        throw new H({ code: "INVALID_PARAM", message: "fileList\u7684\u5143\u7D20\u5FC5\u987B\u662F\u975E\u7A7A\u7684\u5B57\u7B26\u4E32" });
      const t2 = { method: "serverless.file.resource.info", params: JSON.stringify({ id: e.map((e2) => e2.split("?")[0]).join(",") }) };
      return { fileList: (await this.request(this.setupRequest(t2))).result };
    }
  };
  var ee = { init(e) {
    const t2 = new Z(e), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  const te = "undefined" != typeof location && "http:" === location.protocol ? "http:" : "https:";
  var ne;
  !function(e) {
    e.local = "local", e.none = "none", e.session = "session";
  }(ne || (ne = {}));
  var se = function() {
  };
  const oe = () => {
    let e;
    if (!Promise) {
      e = () => {
      }, e.promise = {};
      const t3 = () => {
        throw new H({ message: 'Your Node runtime does support ES6 Promises. Set "global.Promise" to your preferred implementation of promises.' });
      };
      return Object.defineProperty(e.promise, "then", { get: t3 }), Object.defineProperty(e.promise, "catch", { get: t3 }), e;
    }
    const t2 = new Promise((t3, n2) => {
      e = (e2, s2) => e2 ? n2(e2) : t3(s2);
    });
    return e.promise = t2, e;
  };
  function re(e) {
    return void 0 === e;
  }
  function ie(e) {
    return "[object Null]" === Object.prototype.toString.call(e);
  }
  var ae;
  function ce(e) {
    const t2 = (n2 = e, "[object Array]" === Object.prototype.toString.call(n2) ? e : [e]);
    var n2;
    for (const e2 of t2) {
      const { isMatch: t3, genAdapter: n3, runtime: s2 } = e2;
      if (t3())
        return { adapter: n3(), runtime: s2 };
    }
  }
  !function(e) {
    e.WEB = "web", e.WX_MP = "wx_mp";
  }(ae || (ae = {}));
  const ue = { adapter: null, runtime: void 0 }, le = ["anonymousUuidKey"];
  class he extends se {
    constructor() {
      super(), ue.adapter.root.tcbObject || (ue.adapter.root.tcbObject = {});
    }
    setItem(e, t2) {
      ue.adapter.root.tcbObject[e] = t2;
    }
    getItem(e) {
      return ue.adapter.root.tcbObject[e];
    }
    removeItem(e) {
      delete ue.adapter.root.tcbObject[e];
    }
    clear() {
      delete ue.adapter.root.tcbObject;
    }
  }
  function de(e, t2) {
    switch (e) {
      case "local":
        return t2.localStorage || new he();
      case "none":
        return new he();
      default:
        return t2.sessionStorage || new he();
    }
  }
  class fe {
    constructor(e) {
      if (!this._storage) {
        this._persistence = ue.adapter.primaryStorage || e.persistence, this._storage = de(this._persistence, ue.adapter);
        const t2 = `access_token_${e.env}`, n2 = `access_token_expire_${e.env}`, s2 = `refresh_token_${e.env}`, o2 = `anonymous_uuid_${e.env}`, r2 = `login_type_${e.env}`, i2 = `user_info_${e.env}`;
        this.keys = { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2, anonymousUuidKey: o2, loginTypeKey: r2, userInfoKey: i2 };
      }
    }
    updatePersistence(e) {
      if (e === this._persistence)
        return;
      const t2 = "local" === this._persistence;
      this._persistence = e;
      const n2 = de(e, ue.adapter);
      for (const e2 in this.keys) {
        const s2 = this.keys[e2];
        if (t2 && le.includes(e2))
          continue;
        const o2 = this._storage.getItem(s2);
        re(o2) || ie(o2) || (n2.setItem(s2, o2), this._storage.removeItem(s2));
      }
      this._storage = n2;
    }
    setStore(e, t2, n2) {
      if (!this._storage)
        return;
      const s2 = { version: n2 || "localCachev1", content: t2 }, o2 = JSON.stringify(s2);
      try {
        this._storage.setItem(e, o2);
      } catch (e2) {
        throw e2;
      }
    }
    getStore(e, t2) {
      try {
        if (!this._storage)
          return;
      } catch (e2) {
        return "";
      }
      t2 = t2 || "localCachev1";
      const n2 = this._storage.getItem(e);
      if (!n2)
        return "";
      if (n2.indexOf(t2) >= 0) {
        return JSON.parse(n2).content;
      }
      return "";
    }
    removeStore(e) {
      this._storage.removeItem(e);
    }
  }
  const pe = {}, ge = {};
  function me(e) {
    return pe[e];
  }
  class ye {
    constructor(e, t2) {
      this.data = t2 || null, this.name = e;
    }
  }
  class _e extends ye {
    constructor(e, t2) {
      super("error", { error: e, data: t2 }), this.error = e;
    }
  }
  const we = new class {
    constructor() {
      this._listeners = {};
    }
    on(e, t2) {
      return function(e2, t3, n2) {
        n2[e2] = n2[e2] || [], n2[e2].push(t3);
      }(e, t2, this._listeners), this;
    }
    off(e, t2) {
      return function(e2, t3, n2) {
        if (n2 && n2[e2]) {
          const s2 = n2[e2].indexOf(t3);
          -1 !== s2 && n2[e2].splice(s2, 1);
        }
      }(e, t2, this._listeners), this;
    }
    fire(e, t2) {
      if (e instanceof _e)
        return console.error(e.error), this;
      const n2 = "string" == typeof e ? new ye(e, t2 || {}) : e;
      const s2 = n2.name;
      if (this._listens(s2)) {
        n2.target = this;
        const e2 = this._listeners[s2] ? [...this._listeners[s2]] : [];
        for (const t3 of e2)
          t3.call(this, n2);
      }
      return this;
    }
    _listens(e) {
      return this._listeners[e] && this._listeners[e].length > 0;
    }
  }();
  function ve(e, t2) {
    we.on(e, t2);
  }
  function ke(e, t2 = {}) {
    we.fire(e, t2);
  }
  function Te(e, t2) {
    we.off(e, t2);
  }
  const Se = "loginStateChanged", Ae = "loginStateExpire", Pe = "loginTypeChanged", Ie = "anonymousConverted", be = "refreshAccessToken";
  var Oe;
  !function(e) {
    e.ANONYMOUS = "ANONYMOUS", e.WECHAT = "WECHAT", e.WECHAT_PUBLIC = "WECHAT-PUBLIC", e.WECHAT_OPEN = "WECHAT-OPEN", e.CUSTOM = "CUSTOM", e.EMAIL = "EMAIL", e.USERNAME = "USERNAME", e.NULL = "NULL";
  }(Oe || (Oe = {}));
  const Ce = ["auth.getJwt", "auth.logout", "auth.signInWithTicket", "auth.signInAnonymously", "auth.signIn", "auth.fetchAccessTokenWithRefreshToken", "auth.signUpWithEmailAndPassword", "auth.activateEndUserMail", "auth.sendPasswordResetEmail", "auth.resetPasswordWithToken", "auth.isUsernameRegistered"], Ee = { "X-SDK-Version": "1.3.5" };
  function Re(e, t2, n2) {
    const s2 = e[t2];
    e[t2] = function(t3) {
      const o2 = {}, r2 = {};
      n2.forEach((n3) => {
        const { data: s3, headers: i3 } = n3.call(e, t3);
        Object.assign(o2, s3), Object.assign(r2, i3);
      });
      const i2 = t3.data;
      return i2 && (() => {
        var e2;
        if (e2 = i2, "[object FormData]" !== Object.prototype.toString.call(e2))
          t3.data = { ...i2, ...o2 };
        else
          for (const e3 in o2)
            i2.append(e3, o2[e3]);
      })(), t3.headers = { ...t3.headers || {}, ...r2 }, s2.call(e, t3);
    };
  }
  function Ue() {
    const e = Math.random().toString(16).slice(2);
    return { data: { seqId: e }, headers: { ...Ee, "x-seqid": e } };
  }
  class xe {
    constructor(e = {}) {
      var t2;
      this.config = e, this._reqClass = new ue.adapter.reqClass({ timeout: this.config.timeout, timeoutMsg: `\u8BF7\u6C42\u5728${this.config.timeout / 1e3}s\u5185\u672A\u5B8C\u6210\uFF0C\u5DF2\u4E2D\u65AD`, restrictedMethods: ["post"] }), this._cache = me(this.config.env), this._localCache = (t2 = this.config.env, ge[t2]), Re(this._reqClass, "post", [Ue]), Re(this._reqClass, "upload", [Ue]), Re(this._reqClass, "download", [Ue]);
    }
    async post(e) {
      return await this._reqClass.post(e);
    }
    async upload(e) {
      return await this._reqClass.upload(e);
    }
    async download(e) {
      return await this._reqClass.download(e);
    }
    async refreshAccessToken() {
      let e, t2;
      this._refreshAccessTokenPromise || (this._refreshAccessTokenPromise = this._refreshAccessToken());
      try {
        e = await this._refreshAccessTokenPromise;
      } catch (e2) {
        t2 = e2;
      }
      if (this._refreshAccessTokenPromise = null, this._shouldRefreshAccessTokenHook = null, t2)
        throw t2;
      return e;
    }
    async _refreshAccessToken() {
      const { accessTokenKey: e, accessTokenExpireKey: t2, refreshTokenKey: n2, loginTypeKey: s2, anonymousUuidKey: o2 } = this._cache.keys;
      this._cache.removeStore(e), this._cache.removeStore(t2);
      let r2 = this._cache.getStore(n2);
      if (!r2)
        throw new H({ message: "\u672A\u767B\u5F55CloudBase" });
      const i2 = { refresh_token: r2 }, a2 = await this.request("auth.fetchAccessTokenWithRefreshToken", i2);
      if (a2.data.code) {
        const { code: e2 } = a2.data;
        if ("SIGN_PARAM_INVALID" === e2 || "REFRESH_TOKEN_EXPIRED" === e2 || "INVALID_REFRESH_TOKEN" === e2) {
          if (this._cache.getStore(s2) === Oe.ANONYMOUS && "INVALID_REFRESH_TOKEN" === e2) {
            const e3 = this._cache.getStore(o2), t3 = this._cache.getStore(n2), s3 = await this.send("auth.signInAnonymously", { anonymous_uuid: e3, refresh_token: t3 });
            return this.setRefreshToken(s3.refresh_token), this._refreshAccessToken();
          }
          ke(Ae), this._cache.removeStore(n2);
        }
        throw new H({ code: a2.data.code, message: `\u5237\u65B0access token\u5931\u8D25\uFF1A${a2.data.code}` });
      }
      if (a2.data.access_token)
        return ke(be), this._cache.setStore(e, a2.data.access_token), this._cache.setStore(t2, a2.data.access_token_expire + Date.now()), { accessToken: a2.data.access_token, accessTokenExpire: a2.data.access_token_expire };
      a2.data.refresh_token && (this._cache.removeStore(n2), this._cache.setStore(n2, a2.data.refresh_token), this._refreshAccessToken());
    }
    async getAccessToken() {
      const { accessTokenKey: e, accessTokenExpireKey: t2, refreshTokenKey: n2 } = this._cache.keys;
      if (!this._cache.getStore(n2))
        throw new H({ message: "refresh token\u4E0D\u5B58\u5728\uFF0C\u767B\u5F55\u72B6\u6001\u5F02\u5E38" });
      let s2 = this._cache.getStore(e), o2 = this._cache.getStore(t2), r2 = true;
      return this._shouldRefreshAccessTokenHook && !await this._shouldRefreshAccessTokenHook(s2, o2) && (r2 = false), (!s2 || !o2 || o2 < Date.now()) && r2 ? this.refreshAccessToken() : { accessToken: s2, accessTokenExpire: o2 };
    }
    async request(e, t2, n2) {
      const s2 = `x-tcb-trace_${this.config.env}`;
      let o2 = "application/x-www-form-urlencoded";
      const r2 = { action: e, env: this.config.env, dataVersion: "2019-08-16", ...t2 };
      if (-1 === Ce.indexOf(e)) {
        const { refreshTokenKey: e2 } = this._cache.keys;
        this._cache.getStore(e2) && (r2.access_token = (await this.getAccessToken()).accessToken);
      }
      let i2;
      if ("storage.uploadFile" === e) {
        i2 = new FormData();
        for (let e2 in i2)
          i2.hasOwnProperty(e2) && void 0 !== i2[e2] && i2.append(e2, r2[e2]);
        o2 = "multipart/form-data";
      } else {
        o2 = "application/json", i2 = {};
        for (let e2 in r2)
          void 0 !== r2[e2] && (i2[e2] = r2[e2]);
      }
      let a2 = { headers: { "content-type": o2 } };
      n2 && n2.onUploadProgress && (a2.onUploadProgress = n2.onUploadProgress);
      const c2 = this._localCache.getStore(s2);
      c2 && (a2.headers["X-TCB-Trace"] = c2);
      const { parse: u2, inQuery: l2, search: h2 } = t2;
      let d2 = { env: this.config.env };
      u2 && (d2.parse = true), l2 && (d2 = { ...l2, ...d2 });
      let f2 = function(e2, t3, n3 = {}) {
        const s3 = /\?/.test(t3);
        let o3 = "";
        for (let e3 in n3)
          "" === o3 ? !s3 && (t3 += "?") : o3 += "&", o3 += `${e3}=${encodeURIComponent(n3[e3])}`;
        return /^http(s)?\:\/\//.test(t3 += o3) ? t3 : `${e2}${t3}`;
      }(te, "//tcb-api.tencentcloudapi.com/web", d2);
      h2 && (f2 += h2);
      const p2 = await this.post({ url: f2, data: i2, ...a2 }), g2 = p2.header && p2.header["x-tcb-trace"];
      if (g2 && this._localCache.setStore(s2, g2), 200 !== Number(p2.status) && 200 !== Number(p2.statusCode) || !p2.data)
        throw new H({ code: "NETWORK_ERROR", message: "network request error" });
      return p2;
    }
    async send(e, t2 = {}) {
      const n2 = await this.request(e, t2, { onUploadProgress: t2.onUploadProgress });
      if ("ACCESS_TOKEN_EXPIRED" === n2.data.code && -1 === Ce.indexOf(e)) {
        await this.refreshAccessToken();
        const n3 = await this.request(e, t2, { onUploadProgress: t2.onUploadProgress });
        if (n3.data.code)
          throw new H({ code: n3.data.code, message: n3.data.message });
        return n3.data;
      }
      if (n2.data.code)
        throw new H({ code: n2.data.code, message: n2.data.message });
      return n2.data;
    }
    setRefreshToken(e) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e);
    }
  }
  const Le = {};
  function De(e) {
    return Le[e];
  }
  class Ne {
    constructor(e) {
      this.config = e, this._cache = me(e.env), this._request = De(e.env);
    }
    setRefreshToken(e) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e);
    }
    setAccessToken(e, t2) {
      const { accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys;
      this._cache.setStore(n2, e), this._cache.setStore(s2, t2);
    }
    async refreshUserInfo() {
      const { data: e } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e), e;
    }
    setLocalUserInfo(e) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e);
    }
  }
  class qe {
    constructor(e) {
      if (!e)
        throw new H({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._envId = e, this._cache = me(this._envId), this._request = De(this._envId), this.setUserInfo();
    }
    linkWithTicket(e) {
      if ("string" != typeof e)
        throw new H({ code: "PARAM_ERROR", message: "ticket must be string" });
      return this._request.send("auth.linkWithTicket", { ticket: e });
    }
    linkWithRedirect(e) {
      e.signInWithRedirect();
    }
    updatePassword(e, t2) {
      return this._request.send("auth.updatePassword", { oldPassword: t2, newPassword: e });
    }
    updateEmail(e) {
      return this._request.send("auth.updateEmail", { newEmail: e });
    }
    updateUsername(e) {
      if ("string" != typeof e)
        throw new H({ code: "PARAM_ERROR", message: "username must be a string" });
      return this._request.send("auth.updateUsername", { username: e });
    }
    async getLinkedUidList() {
      const { data: e } = await this._request.send("auth.getLinkedUidList", {});
      let t2 = false;
      const { users: n2 } = e;
      return n2.forEach((e2) => {
        e2.wxOpenId && e2.wxPublicId && (t2 = true);
      }), { users: n2, hasPrimaryUid: t2 };
    }
    setPrimaryUid(e) {
      return this._request.send("auth.setPrimaryUid", { uid: e });
    }
    unlink(e) {
      return this._request.send("auth.unlink", { platform: e });
    }
    async update(e) {
      const { nickName: t2, gender: n2, avatarUrl: s2, province: o2, country: r2, city: i2 } = e, { data: a2 } = await this._request.send("auth.updateUserInfo", { nickName: t2, gender: n2, avatarUrl: s2, province: o2, country: r2, city: i2 });
      this.setLocalUserInfo(a2);
    }
    async refresh() {
      const { data: e } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e), e;
    }
    setUserInfo() {
      const { userInfoKey: e } = this._cache.keys, t2 = this._cache.getStore(e);
      ["uid", "loginType", "openid", "wxOpenId", "wxPublicId", "unionId", "qqMiniOpenId", "email", "hasPassword", "customUserId", "nickName", "gender", "avatarUrl"].forEach((e2) => {
        this[e2] = t2[e2];
      }), this.location = { country: t2.country, province: t2.province, city: t2.city };
    }
    setLocalUserInfo(e) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e), this.setUserInfo();
    }
  }
  class Fe {
    constructor(e) {
      if (!e)
        throw new H({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._cache = me(e);
      const { refreshTokenKey: t2, accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys, o2 = this._cache.getStore(t2), r2 = this._cache.getStore(n2), i2 = this._cache.getStore(s2);
      this.credential = { refreshToken: o2, accessToken: r2, accessTokenExpire: i2 }, this.user = new qe(e);
    }
    get isAnonymousAuth() {
      return this.loginType === Oe.ANONYMOUS;
    }
    get isCustomAuth() {
      return this.loginType === Oe.CUSTOM;
    }
    get isWeixinAuth() {
      return this.loginType === Oe.WECHAT || this.loginType === Oe.WECHAT_OPEN || this.loginType === Oe.WECHAT_PUBLIC;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
  }
  class Me extends Ne {
    async signIn() {
      this._cache.updatePersistence("local");
      const { anonymousUuidKey: e, refreshTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e) || void 0, s2 = this._cache.getStore(t2) || void 0, o2 = await this._request.send("auth.signInAnonymously", { anonymous_uuid: n2, refresh_token: s2 });
      if (o2.uuid && o2.refresh_token) {
        this._setAnonymousUUID(o2.uuid), this.setRefreshToken(o2.refresh_token), await this._request.refreshAccessToken(), ke(Se), ke(Pe, { env: this.config.env, loginType: Oe.ANONYMOUS, persistence: "local" });
        const e2 = new Fe(this.config.env);
        return await e2.user.refresh(), e2;
      }
      throw new H({ message: "\u533F\u540D\u767B\u5F55\u5931\u8D25" });
    }
    async linkAndRetrieveDataWithTicket(e) {
      const { anonymousUuidKey: t2, refreshTokenKey: n2 } = this._cache.keys, s2 = this._cache.getStore(t2), o2 = this._cache.getStore(n2), r2 = await this._request.send("auth.linkAndRetrieveDataWithTicket", { anonymous_uuid: s2, refresh_token: o2, ticket: e });
      if (r2.refresh_token)
        return this._clearAnonymousUUID(), this.setRefreshToken(r2.refresh_token), await this._request.refreshAccessToken(), ke(Ie, { env: this.config.env }), ke(Pe, { loginType: Oe.CUSTOM, persistence: "local" }), { credential: { refreshToken: r2.refresh_token } };
      throw new H({ message: "\u533F\u540D\u8F6C\u5316\u5931\u8D25" });
    }
    _setAnonymousUUID(e) {
      const { anonymousUuidKey: t2, loginTypeKey: n2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.setStore(t2, e), this._cache.setStore(n2, Oe.ANONYMOUS);
    }
    _clearAnonymousUUID() {
      this._cache.removeStore(this._cache.keys.anonymousUuidKey);
    }
  }
  class je extends Ne {
    async signIn(e) {
      if ("string" != typeof e)
        throw new H({ param: "PARAM_ERROR", message: "ticket must be a string" });
      const { refreshTokenKey: t2 } = this._cache.keys, n2 = await this._request.send("auth.signInWithTicket", { ticket: e, refresh_token: this._cache.getStore(t2) || "" });
      if (n2.refresh_token)
        return this.setRefreshToken(n2.refresh_token), await this._request.refreshAccessToken(), ke(Se), ke(Pe, { env: this.config.env, loginType: Oe.CUSTOM, persistence: this.config.persistence }), await this.refreshUserInfo(), new Fe(this.config.env);
      throw new H({ message: "\u81EA\u5B9A\u4E49\u767B\u5F55\u5931\u8D25" });
    }
  }
  class $e extends Ne {
    async signIn(e, t2) {
      if ("string" != typeof e)
        throw new H({ code: "PARAM_ERROR", message: "email must be a string" });
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: "EMAIL", email: e, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: o2, access_token: r2, access_token_expire: i2 } = s2;
      if (o2)
        return this.setRefreshToken(o2), r2 && i2 ? this.setAccessToken(r2, i2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), ke(Se), ke(Pe, { env: this.config.env, loginType: Oe.EMAIL, persistence: this.config.persistence }), new Fe(this.config.env);
      throw s2.code ? new H({ code: s2.code, message: `\u90AE\u7BB1\u767B\u5F55\u5931\u8D25: ${s2.message}` }) : new H({ message: "\u90AE\u7BB1\u767B\u5F55\u5931\u8D25" });
    }
    async activate(e) {
      return this._request.send("auth.activateEndUserMail", { token: e });
    }
    async resetPasswordWithToken(e, t2) {
      return this._request.send("auth.resetPasswordWithToken", { token: e, newPassword: t2 });
    }
  }
  class Be extends Ne {
    async signIn(e, t2) {
      if ("string" != typeof e)
        throw new H({ code: "PARAM_ERROR", message: "username must be a string" });
      "string" != typeof t2 && (t2 = "", console.warn("password is empty"));
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: Oe.USERNAME, username: e, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: o2, access_token_expire: r2, access_token: i2 } = s2;
      if (o2)
        return this.setRefreshToken(o2), i2 && r2 ? this.setAccessToken(i2, r2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), ke(Se), ke(Pe, { env: this.config.env, loginType: Oe.USERNAME, persistence: this.config.persistence }), new Fe(this.config.env);
      throw s2.code ? new H({ code: s2.code, message: `\u7528\u6237\u540D\u5BC6\u7801\u767B\u5F55\u5931\u8D25: ${s2.message}` }) : new H({ message: "\u7528\u6237\u540D\u5BC6\u7801\u767B\u5F55\u5931\u8D25" });
    }
  }
  class Ke {
    constructor(e) {
      this.config = e, this._cache = me(e.env), this._request = De(e.env), this._onAnonymousConverted = this._onAnonymousConverted.bind(this), this._onLoginTypeChanged = this._onLoginTypeChanged.bind(this), ve(Pe, this._onLoginTypeChanged);
    }
    get currentUser() {
      const e = this.hasLoginState();
      return e && e.user || null;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
    anonymousAuthProvider() {
      return new Me(this.config);
    }
    customAuthProvider() {
      return new je(this.config);
    }
    emailAuthProvider() {
      return new $e(this.config);
    }
    usernameAuthProvider() {
      return new Be(this.config);
    }
    async signInAnonymously() {
      return new Me(this.config).signIn();
    }
    async signInWithEmailAndPassword(e, t2) {
      return new $e(this.config).signIn(e, t2);
    }
    signInWithUsernameAndPassword(e, t2) {
      return new Be(this.config).signIn(e, t2);
    }
    async linkAndRetrieveDataWithTicket(e) {
      this._anonymousAuthProvider || (this._anonymousAuthProvider = new Me(this.config)), ve(Ie, this._onAnonymousConverted);
      return await this._anonymousAuthProvider.linkAndRetrieveDataWithTicket(e);
    }
    async signOut() {
      if (this.loginType === Oe.ANONYMOUS)
        throw new H({ message: "\u533F\u540D\u7528\u6237\u4E0D\u652F\u6301\u767B\u51FA\u64CD\u4F5C" });
      const { refreshTokenKey: e, accessTokenKey: t2, accessTokenExpireKey: n2 } = this._cache.keys, s2 = this._cache.getStore(e);
      if (!s2)
        return;
      const o2 = await this._request.send("auth.logout", { refresh_token: s2 });
      return this._cache.removeStore(e), this._cache.removeStore(t2), this._cache.removeStore(n2), ke(Se), ke(Pe, { env: this.config.env, loginType: Oe.NULL, persistence: this.config.persistence }), o2;
    }
    async signUpWithEmailAndPassword(e, t2) {
      return this._request.send("auth.signUpWithEmailAndPassword", { email: e, password: t2 });
    }
    async sendPasswordResetEmail(e) {
      return this._request.send("auth.sendPasswordResetEmail", { email: e });
    }
    onLoginStateChanged(e) {
      ve(Se, () => {
        const t3 = this.hasLoginState();
        e.call(this, t3);
      });
      const t2 = this.hasLoginState();
      e.call(this, t2);
    }
    onLoginStateExpired(e) {
      ve(Ae, e.bind(this));
    }
    onAccessTokenRefreshed(e) {
      ve(be, e.bind(this));
    }
    onAnonymousConverted(e) {
      ve(Ie, e.bind(this));
    }
    onLoginTypeChanged(e) {
      ve(Pe, () => {
        const t2 = this.hasLoginState();
        e.call(this, t2);
      });
    }
    async getAccessToken() {
      return { accessToken: (await this._request.getAccessToken()).accessToken, env: this.config.env };
    }
    hasLoginState() {
      const { refreshTokenKey: e } = this._cache.keys;
      return this._cache.getStore(e) ? new Fe(this.config.env) : null;
    }
    async isUsernameRegistered(e) {
      if ("string" != typeof e)
        throw new H({ code: "PARAM_ERROR", message: "username must be a string" });
      const { data: t2 } = await this._request.send("auth.isUsernameRegistered", { username: e });
      return t2 && t2.isRegistered;
    }
    getLoginState() {
      return Promise.resolve(this.hasLoginState());
    }
    async signInWithTicket(e) {
      return new je(this.config).signIn(e);
    }
    shouldRefreshAccessToken(e) {
      this._request._shouldRefreshAccessTokenHook = e.bind(this);
    }
    getUserInfo() {
      return this._request.send("auth.getUserInfo", {}).then((e) => e.code ? e : { ...e.data, requestId: e.seqId });
    }
    getAuthHeader() {
      const { refreshTokenKey: e, accessTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e);
      return { "x-cloudbase-credentials": this._cache.getStore(t2) + "/@@/" + n2 };
    }
    _onAnonymousConverted(e) {
      const { env: t2 } = e.data;
      t2 === this.config.env && this._cache.updatePersistence(this.config.persistence);
    }
    _onLoginTypeChanged(e) {
      const { loginType: t2, persistence: n2, env: s2 } = e.data;
      s2 === this.config.env && (this._cache.updatePersistence(n2), this._cache.setStore(this._cache.keys.loginTypeKey, t2));
    }
  }
  const We = function(e, t2) {
    t2 = t2 || oe();
    const n2 = De(this.config.env), { cloudPath: s2, filePath: o2, onUploadProgress: r2, fileType: i2 = "image" } = e;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e2) => {
      const { data: { url: a2, authorization: c2, token: u2, fileId: l2, cosFileId: h2 }, requestId: d2 } = e2, f2 = { key: s2, signature: c2, "x-cos-meta-fileid": h2, success_action_status: "201", "x-cos-security-token": u2 };
      n2.upload({ url: a2, data: f2, file: o2, name: s2, fileType: i2, onUploadProgress: r2 }).then((e3) => {
        201 === e3.statusCode ? t2(null, { fileID: l2, requestId: d2 }) : t2(new H({ code: "STORAGE_REQUEST_FAIL", message: `STORAGE_REQUEST_FAIL: ${e3.data}` }));
      }).catch((e3) => {
        t2(e3);
      });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, He = function(e, t2) {
    t2 = t2 || oe();
    const n2 = De(this.config.env), { cloudPath: s2 } = e;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e2) => {
      t2(null, e2);
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, ze = function({ fileList: e }, t2) {
    if (t2 = t2 || oe(), !e || !Array.isArray(e))
      return { code: "INVALID_PARAM", message: "fileList\u5FC5\u987B\u662F\u975E\u7A7A\u7684\u6570\u7EC4" };
    for (let t3 of e)
      if (!t3 || "string" != typeof t3)
        return { code: "INVALID_PARAM", message: "fileList\u7684\u5143\u7D20\u5FC5\u987B\u662F\u975E\u7A7A\u7684\u5B57\u7B26\u4E32" };
    const n2 = { fileid_list: e };
    return De(this.config.env).send("storage.batchDeleteFile", n2).then((e2) => {
      e2.code ? t2(null, e2) : t2(null, { fileList: e2.data.delete_list, requestId: e2.requestId });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, Je = function({ fileList: e }, t2) {
    t2 = t2 || oe(), e && Array.isArray(e) || t2(null, { code: "INVALID_PARAM", message: "fileList\u5FC5\u987B\u662F\u975E\u7A7A\u7684\u6570\u7EC4" });
    let n2 = [];
    for (let s3 of e)
      "object" == typeof s3 ? (s3.hasOwnProperty("fileID") && s3.hasOwnProperty("maxAge") || t2(null, { code: "INVALID_PARAM", message: "fileList\u7684\u5143\u7D20\u5FC5\u987B\u662F\u5305\u542BfileID\u548CmaxAge\u7684\u5BF9\u8C61" }), n2.push({ fileid: s3.fileID, max_age: s3.maxAge })) : "string" == typeof s3 ? n2.push({ fileid: s3 }) : t2(null, { code: "INVALID_PARAM", message: "fileList\u7684\u5143\u7D20\u5FC5\u987B\u662F\u5B57\u7B26\u4E32" });
    const s2 = { file_list: n2 };
    return De(this.config.env).send("storage.batchGetDownloadUrl", s2).then((e2) => {
      e2.code ? t2(null, e2) : t2(null, { fileList: e2.data.download_list, requestId: e2.requestId });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, Ve = async function({ fileID: e }, t2) {
    const n2 = (await Je.call(this, { fileList: [{ fileID: e, maxAge: 600 }] })).fileList[0];
    if ("SUCCESS" !== n2.code)
      return t2 ? t2(n2) : new Promise((e2) => {
        e2(n2);
      });
    const s2 = De(this.config.env);
    let o2 = n2.download_url;
    if (o2 = encodeURI(o2), !t2)
      return s2.download({ url: o2 });
    t2(await s2.download({ url: o2 }));
  }, Ye = function({ name: e, data: t2, query: n2, parse: s2, search: o2 }, r2) {
    const i2 = r2 || oe();
    let a2;
    try {
      a2 = t2 ? JSON.stringify(t2) : "";
    } catch (e2) {
      return Promise.reject(e2);
    }
    if (!e)
      return Promise.reject(new H({ code: "PARAM_ERROR", message: "\u51FD\u6570\u540D\u4E0D\u80FD\u4E3A\u7A7A" }));
    const c2 = { inQuery: n2, parse: s2, search: o2, function_name: e, request_data: a2 };
    return De(this.config.env).send("functions.invokeFunction", c2).then((e2) => {
      if (e2.code)
        i2(null, e2);
      else {
        let t3 = e2.data.response_data;
        if (s2)
          i2(null, { result: t3, requestId: e2.requestId });
        else
          try {
            t3 = JSON.parse(e2.data.response_data), i2(null, { result: t3, requestId: e2.requestId });
          } catch (e3) {
            i2(new H({ message: "response data must be json" }));
          }
      }
      return i2.promise;
    }).catch((e2) => {
      i2(e2);
    }), i2.promise;
  }, Xe = { timeout: 15e3, persistence: "session" }, Ge = {};
  class Qe {
    constructor(e) {
      this.config = e || this.config, this.authObj = void 0;
    }
    init(e) {
      switch (ue.adapter || (this.requestClient = new ue.adapter.reqClass({ timeout: e.timeout || 5e3, timeoutMsg: `\u8BF7\u6C42\u5728${(e.timeout || 5e3) / 1e3}s\u5185\u672A\u5B8C\u6210\uFF0C\u5DF2\u4E2D\u65AD` })), this.config = { ...Xe, ...e }, true) {
        case this.config.timeout > 6e5:
          console.warn("timeout\u5927\u4E8E\u53EF\u914D\u7F6E\u4E0A\u9650[10\u5206\u949F]\uFF0C\u5DF2\u91CD\u7F6E\u4E3A\u4E0A\u9650\u6570\u503C"), this.config.timeout = 6e5;
          break;
        case this.config.timeout < 100:
          console.warn("timeout\u5C0F\u4E8E\u53EF\u914D\u7F6E\u4E0B\u9650[100ms]\uFF0C\u5DF2\u91CD\u7F6E\u4E3A\u4E0B\u9650\u6570\u503C"), this.config.timeout = 100;
      }
      return new Qe(this.config);
    }
    auth({ persistence: e } = {}) {
      if (this.authObj)
        return this.authObj;
      const t2 = e || ue.adapter.primaryStorage || Xe.persistence;
      var n2;
      return t2 !== this.config.persistence && (this.config.persistence = t2), function(e2) {
        const { env: t3 } = e2;
        pe[t3] = new fe(e2), ge[t3] = new fe({ ...e2, persistence: "local" });
      }(this.config), n2 = this.config, Le[n2.env] = new xe(n2), this.authObj = new Ke(this.config), this.authObj;
    }
    on(e, t2) {
      return ve.apply(this, [e, t2]);
    }
    off(e, t2) {
      return Te.apply(this, [e, t2]);
    }
    callFunction(e, t2) {
      return Ye.apply(this, [e, t2]);
    }
    deleteFile(e, t2) {
      return ze.apply(this, [e, t2]);
    }
    getTempFileURL(e, t2) {
      return Je.apply(this, [e, t2]);
    }
    downloadFile(e, t2) {
      return Ve.apply(this, [e, t2]);
    }
    uploadFile(e, t2) {
      return We.apply(this, [e, t2]);
    }
    getUploadMetadata(e, t2) {
      return He.apply(this, [e, t2]);
    }
    registerExtension(e) {
      Ge[e.name] = e;
    }
    async invokeExtension(e, t2) {
      const n2 = Ge[e];
      if (!n2)
        throw new H({ message: `\u6269\u5C55${e} \u5FC5\u987B\u5148\u6CE8\u518C` });
      return await n2.invoke(t2, this);
    }
    useAdapters(e) {
      const { adapter: t2, runtime: n2 } = ce(e) || {};
      t2 && (ue.adapter = t2), n2 && (ue.runtime = n2);
    }
  }
  var Ze = new Qe();
  function et(e, t2, n2) {
    void 0 === n2 && (n2 = {});
    var s2 = /\?/.test(t2), o2 = "";
    for (var r2 in n2)
      "" === o2 ? !s2 && (t2 += "?") : o2 += "&", o2 += r2 + "=" + encodeURIComponent(n2[r2]);
    return /^http(s)?:\/\//.test(t2 += o2) ? t2 : "" + e + t2;
  }
  class tt {
    post(e) {
      const { url: t2, data: n2, headers: s2 } = e;
      return new Promise((e2, o2) => {
        X.request({ url: et("https:", t2), data: n2, method: "POST", header: s2, success(t3) {
          e2(t3);
        }, fail(e3) {
          o2(e3);
        } });
      });
    }
    upload(e) {
      return new Promise((t2, n2) => {
        const { url: s2, file: o2, data: r2, headers: i2, fileType: a2 } = e, c2 = X.uploadFile({ url: et("https:", s2), name: "file", formData: Object.assign({}, r2), filePath: o2, fileType: a2, header: i2, success(e2) {
          const n3 = { statusCode: e2.statusCode, data: e2.data || {} };
          200 === e2.statusCode && r2.success_action_status && (n3.statusCode = parseInt(r2.success_action_status, 10)), t2(n3);
        }, fail(e2) {
          n2(new Error(e2.errMsg || "uploadFile:fail"));
        } });
        "function" == typeof e.onUploadProgress && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((t3) => {
          e.onUploadProgress({ loaded: t3.totalBytesSent, total: t3.totalBytesExpectedToSend });
        });
      });
    }
  }
  const nt = { setItem(e, t2) {
    X.setStorageSync(e, t2);
  }, getItem: (e) => X.getStorageSync(e), removeItem(e) {
    X.removeStorageSync(e);
  }, clear() {
    X.clearStorageSync();
  } };
  var st = { genAdapter: function() {
    return { root: {}, reqClass: tt, localStorage: nt, primaryStorage: "local" };
  }, isMatch: function() {
    return true;
  }, runtime: "uni_app" };
  Ze.useAdapters(st);
  const ot = Ze, rt = ot.init;
  ot.init = function(e) {
    e.env = e.spaceId;
    const t2 = rt.call(this, e);
    t2.config.provider = "tencent", t2.config.spaceId = e.spaceId;
    const n2 = t2.auth;
    return t2.auth = function(e2) {
      const t3 = n2.call(this, e2);
      return ["linkAndRetrieveDataWithTicket", "signInAnonymously", "signOut", "getAccessToken", "getLoginState", "signInWithTicket", "getUserInfo"].forEach((e3) => {
        t3[e3] = W(t3[e3]).bind(t3);
      }), t3;
    }, t2.customAuth = t2.auth, t2;
  };
  var it = ot;
  function at(e) {
    return e && at(e.__v_raw) || e;
  }
  function ct() {
    return { token: X.getStorageSync("uni_id_token") || X.getStorageSync("uniIdToken"), tokenExpired: X.getStorageSync("uni_id_token_expired") };
  }
  function ut({ token: e, tokenExpired: t2 } = {}) {
    e && X.setStorageSync("uni_id_token", e), t2 && X.setStorageSync("uni_id_token_expired", t2);
  }
  function lt() {
    if ("web" !== m)
      return;
    uni.getStorageSync("__LAST_DCLOUD_APPID") !== v && (uni.setStorageSync("__LAST_DCLOUD_APPID", v), console.warn("\u68C0\u6D4B\u5230\u5F53\u524D\u9879\u76EE\u4E0E\u4E0A\u6B21\u8FD0\u884C\u5230\u6B64\u7AEF\u53E3\u7684\u9879\u76EE\u4E0D\u4E00\u81F4\uFF0C\u81EA\u52A8\u6E05\u7406uni-id\u4FDD\u5B58\u7684token\u4FE1\u606F\uFF08\u4EC5\u5F00\u53D1\u8C03\u8BD5\u65F6\u751F\u6548\uFF09"), X.removeStorageSync("uni_id_token"), X.removeStorageSync("uniIdToken"), X.removeStorageSync("uni_id_token_expired"));
  }
  var ht = class extends Z {
    getAccessToken() {
      return new Promise((e, t2) => {
        const n2 = "Anonymous_Access_token";
        this.setAccessToken(n2), e(n2);
      });
    }
    setupRequest(e, t2) {
      const n2 = Object.assign({}, e, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = Y.sign(n2, this.config.clientSecret);
      const o2 = V();
      s2["x-client-info"] = encodeURIComponent(JSON.stringify(o2));
      const { token: r2 } = ct();
      return s2["x-client-token"] = r2, { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: JSON.parse(JSON.stringify(s2)) };
    }
    uploadFileToOSS({ url: e, formData: t2, name: n2, filePath: s2, fileType: o2, onUploadProgress: r2 }) {
      return new Promise((i2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e, formData: t2, name: n2, filePath: s2, fileType: o2, success(e2) {
          e2 && e2.statusCode < 400 ? i2(e2) : a2(new H({ code: "UPLOAD_FAILED", message: "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25" }));
        }, fail(e2) {
          a2(new H({ code: e2.code || "UPLOAD_FAILED", message: e2.message || e2.errMsg || "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25" }));
        } });
        "function" == typeof r2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e2) => {
          r2({ loaded: e2.totalBytesSent, total: e2.totalBytesExpectedToSend });
        });
      });
    }
    uploadFile({ filePath: e, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2 }) {
      if (!t2)
        throw new H({ code: "CLOUDPATH_REQUIRED", message: "cloudPath\u4E0D\u53EF\u4E3A\u7A7A" });
      let o2;
      return this.getOSSUploadOptionsFromPath({ cloudPath: t2 }).then((t3) => {
        const { url: r2, formData: i2, name: a2 } = t3.result;
        o2 = t3.result.fileUrl;
        const c2 = { url: r2, formData: i2, name: a2, filePath: e, fileType: n2 };
        return this.uploadFileToOSS(Object.assign({}, c2, { onUploadProgress: s2 }));
      }).then(() => this.reportOSSUpload({ cloudPath: t2 })).then((t3) => new Promise((n3, s3) => {
        t3.success ? n3({ success: true, filePath: e, fileID: o2 }) : s3(new H({ code: "UPLOAD_FAILED", message: "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25" }));
      }));
    }
    deleteFile({ fileList: e }) {
      const t2 = { method: "serverless.file.resource.delete", params: JSON.stringify({ fileList: e }) };
      return this.request(this.setupRequest(t2));
    }
    getTempFileURL({ fileList: e } = {}) {
      const t2 = { method: "serverless.file.resource.getTempFileURL", params: JSON.stringify({ fileList: e }) };
      return this.request(this.setupRequest(t2));
    }
  };
  var dt = { init(e) {
    const t2 = new ht(e), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  function ft({ data: e }) {
    let t2;
    t2 = V();
    const n2 = JSON.parse(JSON.stringify(e || {}));
    if (Object.assign(n2, { clientInfo: t2 }), !n2.uniIdToken) {
      const { token: e2 } = ct();
      e2 && (n2.uniIdToken = e2);
    }
    return n2;
  }
  function pt({ name: e, data: t2 } = {}) {
    const { localAddress: n2, localPort: s2 } = this.__dev__, o2 = { aliyun: "aliyun", tencent: "tcb" }[this.config.provider], r2 = this.config.spaceId, i2 = `http://${n2}:${s2}/system/check-function`, a2 = `http://${n2}:${s2}/cloudfunctions/${e}`;
    return new Promise((t3, n3) => {
      X.request({ method: "POST", url: i2, data: { name: e, platform: m, provider: o2, spaceId: r2 }, timeout: 3e3, success(e2) {
        t3(e2);
      }, fail() {
        t3({ data: { code: "NETWORK_ERROR", message: "\u8FDE\u63A5\u672C\u5730\u8C03\u8BD5\u670D\u52A1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5BA2\u6237\u7AEF\u662F\u5426\u548C\u4E3B\u673A\u5728\u540C\u4E00\u5C40\u57DF\u7F51\u4E0B\uFF0C\u81EA\u52A8\u5207\u6362\u4E3A\u5DF2\u90E8\u7F72\u7684\u4E91\u51FD\u6570\u3002" } });
      } });
    }).then(({ data: e2 } = {}) => {
      const { code: t3, message: n3 } = e2 || {};
      return { code: 0 === t3 ? 0 : t3 || "SYS_ERR", message: n3 || "SYS_ERR" };
    }).then(({ code: n3, message: s3 }) => {
      if (0 !== n3) {
        switch (n3) {
          case "MODULE_ENCRYPTED":
            console.error(`\u6B64\u4E91\u51FD\u6570\uFF08${e}\uFF09\u4F9D\u8D56\u52A0\u5BC6\u516C\u5171\u6A21\u5757\u4E0D\u53EF\u672C\u5730\u8C03\u8BD5\uFF0C\u81EA\u52A8\u5207\u6362\u4E3A\u4E91\u7AEF\u5DF2\u90E8\u7F72\u7684\u4E91\u51FD\u6570`);
            break;
          case "FUNCTION_ENCRYPTED":
            console.error(`\u6B64\u4E91\u51FD\u6570\uFF08${e}\uFF09\u5DF2\u52A0\u5BC6\u4E0D\u53EF\u672C\u5730\u8C03\u8BD5\uFF0C\u81EA\u52A8\u5207\u6362\u4E3A\u4E91\u7AEF\u5DF2\u90E8\u7F72\u7684\u4E91\u51FD\u6570`);
            break;
          case "ACTION_ENCRYPTED":
            console.error(s3 || "\u9700\u8981\u8BBF\u95EE\u52A0\u5BC6\u7684uni-clientDB-action\uFF0C\u81EA\u52A8\u5207\u6362\u4E3A\u4E91\u7AEF\u73AF\u5883");
            break;
          case "NETWORK_ERROR": {
            const e2 = "\u8FDE\u63A5\u672C\u5730\u8C03\u8BD5\u670D\u52A1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5BA2\u6237\u7AEF\u662F\u5426\u548C\u4E3B\u673A\u5728\u540C\u4E00\u5C40\u57DF\u7F51\u4E0B";
            throw console.error(e2), new Error(e2);
          }
          case "SWITCH_TO_CLOUD":
            break;
          default: {
            const e2 = `\u68C0\u6D4B\u672C\u5730\u8C03\u8BD5\u670D\u52A1\u51FA\u73B0\u9519\u8BEF\uFF1A${s3}\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u73AF\u5883\u6216\u91CD\u542F\u5BA2\u6237\u7AEF\u518D\u8BD5`;
            throw console.error(e2), new Error(e2);
          }
        }
        return this._callCloudFunction({ name: e, data: t2 });
      }
      return new Promise((e2, n4) => {
        const s4 = ft.call(this, { data: t2 });
        X.request({ method: "POST", url: a2, data: { provider: o2, platform: m, param: s4 }, success: ({ statusCode: t3, data: s5 } = {}) => !t3 || t3 >= 400 ? n4(new H({ code: s5.code || "SYS_ERR", message: s5.message || "request:fail" })) : e2({ result: s5 }), fail(e3) {
          n4(new H({ code: e3.code || e3.errCode || "SYS_ERR", message: e3.message || e3.errMsg || "request:fail" }));
        } });
      });
    });
  }
  const gt = [{ rule: /fc_function_not_found|FUNCTION_NOT_FOUND/, content: "\uFF0C\u4E91\u51FD\u6570[{functionName}]\u5728\u4E91\u7AEF\u4E0D\u5B58\u5728\uFF0C\u8BF7\u68C0\u67E5\u6B64\u4E91\u51FD\u6570\u540D\u79F0\u662F\u5426\u6B63\u786E\u4EE5\u53CA\u8BE5\u4E91\u51FD\u6570\u662F\u5426\u5DF2\u4E0A\u4F20\u5230\u670D\u52A1\u7A7A\u95F4", mode: "append" }];
  var mt = /[\\^$.*+?()[\]{}|]/g, yt = RegExp(mt.source);
  function _t(e, t2, n2) {
    return e.replace(new RegExp((s2 = t2) && yt.test(s2) ? s2.replace(mt, "\\$&") : s2, "g"), n2);
    var s2;
  }
  function wt({ functionName: e, result: t2, logPvd: n2 }) {
    if (this.__dev__.debugLog && t2 && t2.requestId) {
      const s2 = JSON.stringify({ spaceId: this.config.spaceId, functionName: e, requestId: t2.requestId });
      console.log(`[${n2}-request]${s2}[/${n2}-request]`);
    }
  }
  function vt(e) {
    const t2 = e.callFunction, n2 = function(n3) {
      const s2 = n3.name;
      n3.data = ft.call(e, { data: n3.data });
      const o2 = { aliyun: "aliyun", tencent: "tcb", tcb: "tcb" }[this.config.provider];
      return t2.call(this, n3).then((e2) => (e2.errCode = 0, wt.call(this, { functionName: s2, result: e2, logPvd: o2 }), Promise.resolve(e2)), (e2) => (wt.call(this, { functionName: s2, result: e2, logPvd: o2 }), e2 && e2.message && (e2.message = function({ message: e3 = "", extraInfo: t3 = {}, formatter: n4 = [] } = {}) {
        for (let s3 = 0; s3 < n4.length; s3++) {
          const { rule: o3, content: r2, mode: i2 } = n4[s3], a2 = e3.match(o3);
          if (!a2)
            continue;
          let c2 = r2;
          for (let e4 = 1; e4 < a2.length; e4++)
            c2 = _t(c2, `{$${e4}}`, a2[e4]);
          for (const e4 in t3)
            c2 = _t(c2, `{${e4}}`, t3[e4]);
          return "replace" === i2 ? c2 : e3 + c2;
        }
        return e3;
      }({ message: `[${n3.name}]: ${e2.message}`, formatter: gt, extraInfo: { functionName: s2 } })), Promise.reject(e2)));
    };
    e.callFunction = function(t3) {
      let s2;
      e.__dev__.debugInfo && !e.__dev__.debugInfo.forceRemote && _ ? (e._callCloudFunction || (e._callCloudFunction = n2, e._callLocalFunction = pt), s2 = pt) : s2 = n2, s2 = s2.bind(e);
      const o2 = s2(t3);
      return Object.defineProperty(o2, "result", { get: () => (console.warn("\u5F53\u524D\u8FD4\u56DE\u7ED3\u679C\u4E3APromise\u7C7B\u578B\uFF0C\u4E0D\u53EF\u76F4\u63A5\u8BBF\u95EE\u5176result\u5C5E\u6027\uFF0C\u8BE6\u60C5\u8BF7\u53C2\u8003\uFF1Ahttps://uniapp.dcloud.net.cn/uniCloud/faq?id=promise"), {}) }), o2;
    };
  }
  const kt = Symbol("CLIENT_DB_INTERNAL");
  function Tt(e, t2) {
    return e.then = "DoNotReturnProxyWithAFunctionNamedThen", e._internalType = kt, e.__v_raw = void 0, new Proxy(e, { get(e2, n2, s2) {
      if ("_uniClient" === n2)
        return null;
      if (n2 in e2 || "string" != typeof n2) {
        const t3 = e2[n2];
        return "function" == typeof t3 ? t3.bind(e2) : t3;
      }
      return t2.get(e2, n2, s2);
    } });
  }
  function St(e) {
    return { on: (t2, n2) => {
      e[t2] = e[t2] || [], e[t2].indexOf(n2) > -1 || e[t2].push(n2);
    }, off: (t2, n2) => {
      e[t2] = e[t2] || [];
      const s2 = e[t2].indexOf(n2);
      -1 !== s2 && e[t2].splice(s2, 1);
    } };
  }
  const At = ["db.Geo", "db.command", "command.aggregate"];
  function Pt(e, t2) {
    return At.indexOf(`${e}.${t2}`) > -1;
  }
  function It(e) {
    switch (h(e = at(e))) {
      case "array":
        return e.map((e2) => It(e2));
      case "object":
        return e._internalType === kt || Object.keys(e).forEach((t2) => {
          e[t2] = It(e[t2]);
        }), e;
      case "regexp":
        return { $regexp: { source: e.source, flags: e.flags } };
      case "date":
        return { $date: e.toISOString() };
      default:
        return e;
    }
  }
  function bt(e) {
    return e && e.content && e.content.$method;
  }
  class Ot {
    constructor(e, t2, n2) {
      this.content = e, this.prevStage = t2 || null, this.udb = null, this._database = n2;
    }
    toJSON() {
      let e = this;
      const t2 = [e.content];
      for (; e.prevStage; )
        e = e.prevStage, t2.push(e.content);
      return { $db: t2.reverse().map((e2) => ({ $method: e2.$method, $param: It(e2.$param) })) };
    }
    getAction() {
      const e = this.toJSON().$db.find((e2) => "action" === e2.$method);
      return e && e.$param && e.$param[0];
    }
    getCommand() {
      return { $db: this.toJSON().$db.filter((e) => "action" !== e.$method) };
    }
    get isAggregate() {
      let e = this;
      for (; e; ) {
        const t2 = bt(e), n2 = bt(e.prevStage);
        if ("aggregate" === t2 && "collection" === n2 || "pipeline" === t2)
          return true;
        e = e.prevStage;
      }
      return false;
    }
    get isCommand() {
      let e = this;
      for (; e; ) {
        if ("command" === bt(e))
          return true;
        e = e.prevStage;
      }
      return false;
    }
    get isAggregateCommand() {
      let e = this;
      for (; e; ) {
        const t2 = bt(e), n2 = bt(e.prevStage);
        if ("aggregate" === t2 && "command" === n2)
          return true;
        e = e.prevStage;
      }
      return false;
    }
    get count() {
      if (!this.isAggregate)
        return function() {
          return this._send("count", Array.from(arguments));
        };
      const e = this;
      return function() {
        return Ct({ $method: "count", $param: It(Array.from(arguments)) }, e, this._database);
      };
    }
    get remove() {
      if (!this.isCommand)
        return function() {
          return this._send("remove", Array.from(arguments));
        };
      const e = this;
      return function() {
        return Ct({ $method: "remove", $param: It(Array.from(arguments)) }, e, this._database);
      };
    }
    get() {
      return this._send("get", Array.from(arguments));
    }
    add() {
      return this._send("add", Array.from(arguments));
    }
    update() {
      return this._send("update", Array.from(arguments));
    }
    end() {
      return this._send("end", Array.from(arguments));
    }
    get set() {
      if (!this.isCommand)
        return function() {
          throw new Error("JQL\u7981\u6B62\u4F7F\u7528set\u65B9\u6CD5");
        };
      const e = this;
      return function() {
        return Ct({ $method: "set", $param: It(Array.from(arguments)) }, e, this._database);
      };
    }
    _send(e, t2) {
      const n2 = this.getAction(), s2 = this.getCommand();
      if (s2.$db.push({ $method: e, $param: It(t2) }), p) {
        const e2 = s2.$db.find((e3) => "collection" === e3.$method), t3 = e2 && e2.$param;
        t3 && 1 === t3.length && "string" == typeof e2.$param[0] && e2.$param[0].indexOf(",") > -1 && console.warn("\u68C0\u6D4B\u5230\u4F7F\u7528JQL\u8BED\u6CD5\u8054\u8868\u67E5\u8BE2\u65F6\uFF0C\u672A\u4F7F\u7528getTemp\u5148\u8FC7\u6EE4\u4E3B\u8868\u6570\u636E\uFF0C\u5728\u4E3B\u8868\u6570\u636E\u91CF\u5927\u7684\u60C5\u51B5\u4E0B\u53EF\u80FD\u4F1A\u67E5\u8BE2\u7F13\u6162\u3002\n- \u5982\u4F55\u4F18\u5316\u8BF7\u53C2\u8003\u6B64\u6587\u6863\uFF1Ahttps://uniapp.dcloud.net.cn/uniCloud/jql?id=lookup-with-temp \n- \u5982\u679C\u4E3B\u8868\u6570\u636E\u91CF\u5F88\u5C0F\u8BF7\u5FFD\u7565\u6B64\u4FE1\u606F\uFF0C\u9879\u76EE\u53D1\u884C\u65F6\u4E0D\u4F1A\u51FA\u73B0\u6B64\u63D0\u793A\u3002");
      }
      return this._database._callCloudFunction({ action: n2, command: s2 });
    }
  }
  function Ct(e, t2, n2) {
    return Tt(new Ot(e, t2, n2), { get(e2, t3) {
      let s2 = "db";
      return e2 && e2.content && (s2 = e2.content.$method), Pt(s2, t3) ? Ct({ $method: t3 }, e2, n2) : function() {
        return Ct({ $method: t3, $param: It(Array.from(arguments)) }, e2, n2);
      };
    } });
  }
  function Et({ path: e, method: t2 }) {
    return class {
      constructor() {
        this.param = Array.from(arguments);
      }
      toJSON() {
        return { $newDb: [...e.map((e2) => ({ $method: e2 })), { $method: t2, $param: this.param }] };
      }
    };
  }
  class Rt extends class {
    constructor({ uniClient: e = {} } = {}) {
      this._uniClient = e, this._authCallBacks = {}, this._dbCallBacks = {}, e.isDefault && (this._dbCallBacks = T("_globalUniCloudDatabaseCallback")), this.auth = St(this._authCallBacks), Object.assign(this, St(this._dbCallBacks)), this.env = Tt({}, { get: (e2, t2) => ({ $env: t2 }) }), this.Geo = Tt({}, { get: (e2, t2) => Et({ path: ["Geo"], method: t2 }) }), this.serverDate = Et({ path: [], method: "serverDate" }), this.RegExp = Et({ path: [], method: "RegExp" });
    }
    getCloudEnv(e) {
      if ("string" != typeof e || !e.trim())
        throw new Error("getCloudEnv\u53C2\u6570\u9519\u8BEF");
      return { $env: e.replace("$cloudEnv_", "") };
    }
    _callback(e, t2) {
      const n2 = this._dbCallBacks;
      n2[e] && n2[e].forEach((e2) => {
        e2(...t2);
      });
    }
    _callbackAuth(e, t2) {
      const n2 = this._authCallBacks;
      n2[e] && n2[e].forEach((e2) => {
        e2(...t2);
      });
    }
    multiSend() {
      const e = Array.from(arguments), t2 = e.map((e2) => {
        const t3 = e2.getAction(), n2 = e2.getCommand();
        if ("getTemp" !== n2.$db[n2.$db.length - 1].$method)
          throw new Error("multiSend\u53EA\u652F\u6301\u5B50\u547D\u4EE4\u5185\u4F7F\u7528getTemp");
        return { action: t3, command: n2 };
      });
      return this._callCloudFunction({ multiCommand: t2, queryList: e });
    }
  } {
    _callCloudFunction({ action: e, command: t2, multiCommand: n2, queryList: s2 }) {
      function o2(e2, t3) {
        if (n2 && s2)
          for (let n3 = 0; n3 < s2.length; n3++) {
            const o3 = s2[n3];
            o3.udb && "function" == typeof o3.udb.setResult && (t3 ? o3.udb.setResult(t3) : o3.udb.setResult(e2.result.dataList[n3]));
          }
      }
      const r2 = this;
      function i2(e2) {
        return r2._callback("error", [e2]), b(O("database", "fail"), e2).then(() => b(O("database", "complete"), e2)).then(() => (o2(null, e2), j(R, { type: L, content: e2 }), Promise.reject(e2)));
      }
      const a2 = b(O("database", "invoke")), c2 = this._uniClient;
      return a2.then(() => c2.callFunction({ name: "DCloud-clientDB", type: l, data: { action: e, command: t2, multiCommand: n2 } })).then((e2) => {
        const { code: t3, message: n3, token: s3, tokenExpired: r3, systemInfo: a3 = [] } = e2.result;
        if (a3)
          for (let e3 = 0; e3 < a3.length; e3++) {
            const { level: t4, message: n4, detail: s4 } = a3[e3], o3 = console["app" === m && "warn" === t4 ? "error" : t4] || console.log;
            let r4 = "[System Info]" + n4;
            s4 && (r4 = `${r4}
\u8BE6\u7EC6\u4FE1\u606F\uFF1A${s4}`), o3(r4);
          }
        if (t3) {
          return i2(new H({ code: t3, message: n3, requestId: e2.requestId }));
        }
        e2.result.errCode = e2.result.code, e2.result.errMsg = e2.result.message, s3 && r3 && (ut({ token: s3, tokenExpired: r3 }), this._callbackAuth("refreshToken", [{ token: s3, tokenExpired: r3 }]), this._callback("refreshToken", [{ token: s3, tokenExpired: r3 }]), j(x, { token: s3, tokenExpired: r3 }));
        const c3 = [{ prop: "affectedDocs", tips: "affectedDocs\u4E0D\u518D\u63A8\u8350\u4F7F\u7528\uFF0C\u8BF7\u4F7F\u7528inserted/deleted/updated/data.length\u66FF\u4EE3" }, { prop: "code", tips: "code\u4E0D\u518D\u63A8\u8350\u4F7F\u7528\uFF0C\u8BF7\u4F7F\u7528errCode\u66FF\u4EE3" }, { prop: "message", tips: "message\u4E0D\u518D\u63A8\u8350\u4F7F\u7528\uFF0C\u8BF7\u4F7F\u7528errMsg\u66FF\u4EE3" }];
        for (let t4 = 0; t4 < c3.length; t4++) {
          const { prop: n4, tips: s4 } = c3[t4];
          if (n4 in e2.result) {
            const t5 = e2.result[n4];
            Object.defineProperty(e2.result, n4, { get: () => (console.warn(s4), t5) });
          }
        }
        return function(e3) {
          return b(O("database", "success"), e3).then(() => b(O("database", "complete"), e3)).then(() => (o2(e3, null), j(R, { type: L, content: e3 }), Promise.resolve(e3)));
        }(e2);
      }, (e2) => {
        /fc_function_not_found|FUNCTION_NOT_FOUND/g.test(e2.message) && console.warn("clientDB\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u5728web\u63A7\u5236\u53F0\u4FDD\u5B58\u4E00\u6B21schema\u4EE5\u5F00\u542FclientDB");
        return i2(new H({ code: e2.code || "SYSTEM_ERROR", message: e2.message, requestId: e2.requestId }));
      });
    }
  }
  function Ut(e) {
    e.database = function(t2) {
      if (t2 && Object.keys(t2).length > 0)
        return e.init(t2).database();
      if (this._database)
        return this._database;
      const n2 = function(e2, t3 = {}) {
        return Tt(new e2(t3), { get: (e3, t4) => Pt("db", t4) ? Ct({ $method: t4 }, null, e3) : function() {
          return Ct({ $method: t4, $param: It(Array.from(arguments)) }, null, e3);
        } });
      }(Rt, { uniClient: e });
      return this._database = n2, n2;
    };
  }
  const xt = "token\u65E0\u6548\uFF0C\u8DF3\u8F6C\u767B\u5F55\u9875\u9762", Lt = "token\u8FC7\u671F\uFF0C\u8DF3\u8F6C\u767B\u5F55\u9875\u9762", Dt = { TOKEN_INVALID_TOKEN_EXPIRED: Lt, TOKEN_INVALID_INVALID_CLIENTID: xt, TOKEN_INVALID: xt, TOKEN_INVALID_WRONG_TOKEN: xt, TOKEN_INVALID_ANONYMOUS_USER: xt }, Nt = { "uni-id-token-expired": Lt, "uni-id-check-token-failed": xt, "uni-id-token-not-exist": xt, "uni-id-check-device-feature-failed": xt };
  function qt(e, t2) {
    let n2 = "";
    return n2 = e ? `${e}/${t2}` : t2, n2.replace(/^\//, "");
  }
  function Ft(e = [], t2 = "") {
    const n2 = [], s2 = [];
    return e.forEach((e2) => {
      true === e2.needLogin ? n2.push(qt(t2, e2.path)) : false === e2.needLogin && s2.push(qt(t2, e2.path));
    }), { needLoginPage: n2, notNeedLoginPage: s2 };
  }
  function Mt(e) {
    return e.split("?")[0].replace(/^\//, "");
  }
  function jt() {
    return function(e) {
      let t2 = e && e.$page && e.$page.fullPath || "";
      return t2 ? ("/" !== t2.charAt(0) && (t2 = "/" + t2), t2) : t2;
    }(function() {
      const e = getCurrentPages();
      return e[e.length - 1];
    }());
  }
  function $t() {
    return Mt(jt());
  }
  function Bt(e = "", t2 = {}) {
    if (!e)
      return false;
    if (!(t2 && t2.list && t2.list.length))
      return false;
    const n2 = t2.list, s2 = Mt(e);
    return n2.some((e2) => e2.pagePath === s2);
  }
  const Kt = !!t.uniIdRouter;
  const { loginPage: Wt, routerNeedLogin: Ht, resToLogin: zt, needLoginPage: Jt, notNeedLoginPage: Vt, loginPageInTabBar: Yt } = function({ pages: e = [], subPackages: n2 = [], uniIdRouter: s2 = {}, tabBar: o2 = {} } = t) {
    const { loginPage: r2, needLogin: i2 = [], resToLogin: a2 = true } = s2, { needLoginPage: c2, notNeedLoginPage: u2 } = Ft(e), { needLoginPage: l2, notNeedLoginPage: h2 } = function(e2 = []) {
      const t2 = [], n3 = [];
      return e2.forEach((e3) => {
        const { root: s3, pages: o3 = [] } = e3, { needLoginPage: r3, notNeedLoginPage: i3 } = Ft(o3, s3);
        t2.push(...r3), n3.push(...i3);
      }), { needLoginPage: t2, notNeedLoginPage: n3 };
    }(n2);
    return { loginPage: r2, routerNeedLogin: i2, resToLogin: a2, needLoginPage: [...c2, ...l2], notNeedLoginPage: [...u2, ...h2], loginPageInTabBar: Bt(r2, o2) };
  }();
  if (Jt.indexOf(Wt) > -1)
    throw new Error(`Login page [${Wt}] should not be "needLogin", please check your pages.json`);
  function Xt(e) {
    const t2 = Mt(function(e2) {
      const t3 = $t(), n2 = e2.charAt(0), s2 = e2.split("?")[0];
      if ("/" === n2)
        return s2;
      const o2 = s2.replace(/^\//, "").split("/"), r2 = t3.split("/");
      r2.pop();
      for (let e3 = 0; e3 < o2.length; e3++) {
        const t4 = o2[e3];
        ".." === t4 ? r2.pop() : "." !== t4 && r2.push(t4);
      }
      return "" === r2[0] && r2.shift(), r2.join("/");
    }(e));
    return !(Vt.indexOf(t2) > -1) && (Jt.indexOf(t2) > -1 || Ht.some((t3) => function(e2, t4) {
      return new RegExp(t4).test(e2);
    }(e, t3)));
  }
  function Gt({ redirect: e }) {
    const t2 = Mt(e), n2 = Mt(Wt);
    return $t() !== n2 && t2 !== n2;
  }
  function Qt({ api: e, redirect: t2 } = {}) {
    if (!t2 || !Gt({ redirect: t2 }))
      return;
    const n2 = function(e2, t3) {
      return "/" !== e2.charAt(0) && (e2 = "/" + e2), t3 ? e2.indexOf("?") > -1 ? e2 + `&uniIdRedirectUrl=${encodeURIComponent(t3)}` : e2 + `?uniIdRedirectUrl=${encodeURIComponent(t3)}` : e2;
    }(Wt, t2);
    Yt ? "navigateTo" !== e && "redirectTo" !== e || (e = "switchTab") : "switchTab" === e && (e = "navigateTo"), setTimeout(() => {
      uni[e]({ url: n2 });
    });
  }
  function Zt({ url: e } = {}) {
    const t2 = { abortLoginPageJump: false, autoToLoginPage: false }, n2 = function() {
      const { token: e2, tokenExpired: t3 } = ct();
      let n3;
      if (e2) {
        if (t3 < Date.now()) {
          const e3 = "uni-id-token-expired";
          n3 = { errCode: e3, errMsg: Nt[e3] };
        }
      } else {
        const e3 = "uni-id-check-token-failed";
        n3 = { errCode: e3, errMsg: Nt[e3] };
      }
      return n3;
    }();
    if (Xt(e) && n2) {
      n2.uniIdRedirectUrl = e;
      if (q(U).length > 0)
        return setTimeout(() => {
          j(U, n2);
        }, 0), t2.abortLoginPageJump = true, t2;
      t2.autoToLoginPage = true;
    }
    return t2;
  }
  function en() {
    !function() {
      const e2 = jt(), { abortLoginPageJump: t2, autoToLoginPage: n2 } = Zt({ url: e2 });
      t2 || n2 && Qt({ api: "redirectTo", redirect: e2 });
    }();
    const e = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
    for (let t2 = 0; t2 < e.length; t2++) {
      const n2 = e[t2];
      uni.addInterceptor(n2, { invoke(e2) {
        const { abortLoginPageJump: t3, autoToLoginPage: s2 } = Zt({ url: e2.url });
        return t3 ? e2 : s2 ? (Qt({ api: n2, redirect: e2.url }), false) : e2;
      } });
    }
  }
  function tn() {
    this.onResponse((e) => {
      const { type: t2, content: n2 } = e;
      let s2 = false;
      switch (t2) {
        case "cloudobject":
          s2 = function(e2) {
            const { errCode: t3 } = e2;
            return t3 in Nt;
          }(n2);
          break;
        case "clientdb":
          s2 = function(e2) {
            const { errCode: t3 } = e2;
            return t3 in Dt;
          }(n2);
      }
      s2 && function(e2 = {}) {
        const t3 = q(U);
        K().then(() => {
          const n3 = jt();
          if (n3 && Gt({ redirect: n3 }))
            return t3.length > 0 ? j(U, Object.assign({ uniIdRedirectUrl: n3 }, e2)) : void (Wt && Qt({ api: "navigateTo", redirect: n3 }));
        });
      }(n2);
    });
  }
  function nn(e) {
    !function(e2) {
      e2.onResponse = function(e3) {
        F(R, e3);
      }, e2.offResponse = function(e3) {
        M(R, e3);
      };
    }(e), function(e2) {
      e2.onNeedLogin = function(e3) {
        F(U, e3);
      }, e2.offNeedLogin = function(e3) {
        M(U, e3);
      }, Kt && (T("uni-cloud-status").needLoginInit || (T("uni-cloud-status").needLoginInit = true, K().then(() => {
        en.call(e2);
      }), zt && tn.call(e2)));
    }(e), function(e2) {
      e2.onRefreshToken = function(e3) {
        F(x, e3);
      }, e2.offRefreshToken = function(e3) {
        M(x, e3);
      };
    }(e);
  }
  let sn;
  const on = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", rn = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;
  function an() {
    const e = ct().token || "", t2 = e.split(".");
    if (!e || 3 !== t2.length)
      return { uid: null, role: [], permission: [], tokenExpired: 0 };
    let n2;
    try {
      n2 = JSON.parse((s2 = t2[1], decodeURIComponent(sn(s2).split("").map(function(e2) {
        return "%" + ("00" + e2.charCodeAt(0).toString(16)).slice(-2);
      }).join(""))));
    } catch (e2) {
      throw new Error("\u83B7\u53D6\u5F53\u524D\u7528\u6237\u4FE1\u606F\u51FA\u9519\uFF0C\u8BE6\u7EC6\u9519\u8BEF\u4FE1\u606F\u4E3A\uFF1A" + e2.message);
    }
    var s2;
    return n2.tokenExpired = 1e3 * n2.exp, delete n2.exp, delete n2.iat, n2;
  }
  sn = "function" != typeof atob ? function(e) {
    if (e = String(e).replace(/[\t\n\f\r ]+/g, ""), !rn.test(e))
      throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
    var t2;
    e += "==".slice(2 - (3 & e.length));
    for (var n2, s2, o2 = "", r2 = 0; r2 < e.length; )
      t2 = on.indexOf(e.charAt(r2++)) << 18 | on.indexOf(e.charAt(r2++)) << 12 | (n2 = on.indexOf(e.charAt(r2++))) << 6 | (s2 = on.indexOf(e.charAt(r2++))), o2 += 64 === n2 ? String.fromCharCode(t2 >> 16 & 255) : 64 === s2 ? String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255) : String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255, 255 & t2);
    return o2;
  } : atob;
  var cn = s(function(e, t2) {
    Object.defineProperty(t2, "__esModule", { value: true });
    const n2 = "chooseAndUploadFile:ok", s2 = "chooseAndUploadFile:fail";
    function o2(e2, t3) {
      return e2.tempFiles.forEach((e3, n3) => {
        e3.name || (e3.name = e3.path.substring(e3.path.lastIndexOf("/") + 1)), t3 && (e3.fileType = t3), e3.cloudPath = Date.now() + "_" + n3 + e3.name.substring(e3.name.lastIndexOf("."));
      }), e2.tempFilePaths || (e2.tempFilePaths = e2.tempFiles.map((e3) => e3.path)), e2;
    }
    function r2(e2, t3, { onChooseFile: s3, onUploadProgress: o3 }) {
      return t3.then((e3) => {
        if (s3) {
          const t4 = s3(e3);
          if (void 0 !== t4)
            return Promise.resolve(t4).then((t5) => void 0 === t5 ? e3 : t5);
        }
        return e3;
      }).then((t4) => false === t4 ? { errMsg: n2, tempFilePaths: [], tempFiles: [] } : function(e3, t5, s4 = 5, o4) {
        (t5 = Object.assign({}, t5)).errMsg = n2;
        const r3 = t5.tempFiles, i2 = r3.length;
        let a2 = 0;
        return new Promise((n3) => {
          for (; a2 < s4; )
            c2();
          function c2() {
            const s5 = a2++;
            if (s5 >= i2)
              return void (!r3.find((e4) => !e4.url && !e4.errMsg) && n3(t5));
            const u2 = r3[s5];
            e3.uploadFile({ filePath: u2.path, cloudPath: u2.cloudPath, fileType: u2.fileType, onUploadProgress(e4) {
              e4.index = s5, e4.tempFile = u2, e4.tempFilePath = u2.path, o4 && o4(e4);
            } }).then((e4) => {
              u2.url = e4.fileID, s5 < i2 && c2();
            }).catch((e4) => {
              u2.errMsg = e4.errMsg || e4.message, s5 < i2 && c2();
            });
          }
        });
      }(e2, t4, 5, o3));
    }
    t2.initChooseAndUploadFile = function(e2) {
      return function(t3 = { type: "all" }) {
        return "image" === t3.type ? r2(e2, function(e3) {
          const { count: t4, sizeType: n3, sourceType: r3 = ["album", "camera"], extension: i2 } = e3;
          return new Promise((e4, a2) => {
            uni.chooseImage({ count: t4, sizeType: n3, sourceType: r3, extension: i2, success(t5) {
              e4(o2(t5, "image"));
            }, fail(e5) {
              a2({ errMsg: e5.errMsg.replace("chooseImage:fail", s2) });
            } });
          });
        }(t3), t3) : "video" === t3.type ? r2(e2, function(e3) {
          const { camera: t4, compressed: n3, maxDuration: r3, sourceType: i2 = ["album", "camera"], extension: a2 } = e3;
          return new Promise((e4, c2) => {
            uni.chooseVideo({ camera: t4, compressed: n3, maxDuration: r3, sourceType: i2, extension: a2, success(t5) {
              const { tempFilePath: n4, duration: s3, size: r4, height: i3, width: a3 } = t5;
              e4(o2({ errMsg: "chooseVideo:ok", tempFilePaths: [n4], tempFiles: [{ name: t5.tempFile && t5.tempFile.name || "", path: n4, size: r4, type: t5.tempFile && t5.tempFile.type || "", width: a3, height: i3, duration: s3, fileType: "video", cloudPath: "" }] }, "video"));
            }, fail(e5) {
              c2({ errMsg: e5.errMsg.replace("chooseVideo:fail", s2) });
            } });
          });
        }(t3), t3) : r2(e2, function(e3) {
          const { count: t4, extension: n3 } = e3;
          return new Promise((e4, r3) => {
            let i2 = uni.chooseFile;
            if ("undefined" != typeof wx && "function" == typeof wx.chooseMessageFile && (i2 = wx.chooseMessageFile), "function" != typeof i2)
              return r3({ errMsg: s2 + " \u8BF7\u6307\u5B9A type \u7C7B\u578B\uFF0C\u8BE5\u5E73\u53F0\u4EC5\u652F\u6301\u9009\u62E9 image \u6216 video\u3002" });
            i2({ type: "all", count: t4, extension: n3, success(t5) {
              e4(o2(t5));
            }, fail(e5) {
              r3({ errMsg: e5.errMsg.replace("chooseFile:fail", s2) });
            } });
          });
        }(t3), t3);
      };
    };
  }), un = n(cn);
  const ln = "manual";
  function hn(e) {
    return { props: { localdata: { type: Array, default: () => [] }, options: { type: [Object, Array], default: () => ({}) }, spaceInfo: { type: Object, default: () => ({}) }, collection: { type: [String, Array], default: "" }, action: { type: String, default: "" }, field: { type: String, default: "" }, orderby: { type: String, default: "" }, where: { type: [String, Object], default: "" }, pageData: { type: String, default: "add" }, pageCurrent: { type: Number, default: 1 }, pageSize: { type: Number, default: 20 }, getcount: { type: [Boolean, String], default: false }, gettree: { type: [Boolean, String], default: false }, gettreepath: { type: [Boolean, String], default: false }, startwith: { type: String, default: "" }, limitlevel: { type: Number, default: 10 }, groupby: { type: String, default: "" }, groupField: { type: String, default: "" }, distinct: { type: [Boolean, String], default: false }, foreignKey: { type: String, default: "" }, loadtime: { type: String, default: "auto" }, manual: { type: Boolean, default: false } }, data: () => ({ mixinDatacomLoading: false, mixinDatacomHasMore: false, mixinDatacomResData: [], mixinDatacomErrorMessage: "", mixinDatacomPage: {} }), created() {
      this.mixinDatacomPage = { current: this.pageCurrent, size: this.pageSize, count: 0 }, this.$watch(() => {
        var e2 = [];
        return ["pageCurrent", "pageSize", "localdata", "collection", "action", "field", "orderby", "where", "getont", "getcount", "gettree", "groupby", "groupField", "distinct"].forEach((t2) => {
          e2.push(this[t2]);
        }), e2;
      }, (e2, t2) => {
        if (this.loadtime === ln)
          return;
        let n2 = false;
        const s2 = [];
        for (let o2 = 2; o2 < e2.length; o2++)
          e2[o2] !== t2[o2] && (s2.push(e2[o2]), n2 = true);
        e2[0] !== t2[0] && (this.mixinDatacomPage.current = this.pageCurrent), this.mixinDatacomPage.size = this.pageSize, this.onMixinDatacomPropsChange(n2, s2);
      });
    }, methods: { onMixinDatacomPropsChange(e2, t2) {
    }, mixinDatacomEasyGet({ getone: e2 = false, success: t2, fail: n2 } = {}) {
      this.mixinDatacomLoading || (this.mixinDatacomLoading = true, this.mixinDatacomErrorMessage = "", this.mixinDatacomGet().then((n3) => {
        this.mixinDatacomLoading = false;
        const { data: s2, count: o2 } = n3.result;
        this.getcount && (this.mixinDatacomPage.count = o2), this.mixinDatacomHasMore = s2.length < this.pageSize;
        const r2 = e2 ? s2.length ? s2[0] : void 0 : s2;
        this.mixinDatacomResData = r2, t2 && t2(r2);
      }).catch((e3) => {
        this.mixinDatacomLoading = false, this.mixinDatacomErrorMessage = e3, n2 && n2(e3);
      }));
    }, mixinDatacomGet(t2 = {}) {
      let n2 = e.database(this.spaceInfo);
      const s2 = t2.action || this.action;
      s2 && (n2 = n2.action(s2));
      const o2 = t2.collection || this.collection;
      n2 = Array.isArray(o2) ? n2.collection(...o2) : n2.collection(o2);
      const r2 = t2.where || this.where;
      r2 && Object.keys(r2).length && (n2 = n2.where(r2));
      const i2 = t2.field || this.field;
      i2 && (n2 = n2.field(i2));
      const a2 = t2.foreignKey || this.foreignKey;
      a2 && (n2 = n2.foreignKey(a2));
      const c2 = t2.groupby || this.groupby;
      c2 && (n2 = n2.groupBy(c2));
      const u2 = t2.groupField || this.groupField;
      u2 && (n2 = n2.groupField(u2));
      true === (void 0 !== t2.distinct ? t2.distinct : this.distinct) && (n2 = n2.distinct());
      const l2 = t2.orderby || this.orderby;
      l2 && (n2 = n2.orderBy(l2));
      const h2 = void 0 !== t2.pageCurrent ? t2.pageCurrent : this.mixinDatacomPage.current, d2 = void 0 !== t2.pageSize ? t2.pageSize : this.mixinDatacomPage.size, f2 = void 0 !== t2.getcount ? t2.getcount : this.getcount, p2 = void 0 !== t2.gettree ? t2.gettree : this.gettree, g2 = void 0 !== t2.gettreepath ? t2.gettreepath : this.gettreepath, m2 = { getCount: f2 }, y2 = { limitLevel: void 0 !== t2.limitlevel ? t2.limitlevel : this.limitlevel, startWith: void 0 !== t2.startwith ? t2.startwith : this.startwith };
      return p2 && (m2.getTree = y2), g2 && (m2.getTreePath = y2), n2 = n2.skip(d2 * (h2 - 1)).limit(d2).get(m2), n2;
    } } };
  }
  function dn(e) {
    return function(t2, n2 = {}) {
      n2 = function(e2, t3 = {}) {
        return e2.customUI = t3.customUI || e2.customUI, Object.assign(e2.loadingOptions, t3.loadingOptions), Object.assign(e2.errorOptions, t3.errorOptions), "object" == typeof t3.secretMethods && (e2.secretMethods = t3.secretMethods), e2;
      }({ customUI: false, loadingOptions: { title: "\u52A0\u8F7D\u4E2D...", mask: true }, errorOptions: { type: "modal", retry: false } }, n2);
      const { customUI: s2, loadingOptions: o2, errorOptions: r2 } = n2, i2 = !s2;
      return new Proxy({}, { get: (s3, a2) => function({ fn: e2, interceptorName: t3, getCallbackArgs: n3 } = {}) {
        return async function(...s4) {
          const o3 = n3 ? n3({ params: s4 }) : {};
          let r3, i3;
          try {
            return await b(O(t3, "invoke"), { ...o3 }), r3 = await e2(...s4), await b(O(t3, "success"), { ...o3, result: r3 }), r3;
          } catch (e3) {
            throw i3 = e3, await b(O(t3, "fail"), { ...o3, error: i3 }), i3;
          } finally {
            await b(O(t3, "complete"), i3 ? { ...o3, error: i3 } : { ...o3, result: r3 });
          }
        };
      }({ fn: async function s4(...c2) {
        let l2;
        i2 && uni.showLoading({ title: o2.title, mask: o2.mask });
        const h2 = { name: t2, type: u, data: { method: a2, params: c2 } };
        "object" == typeof n2.secretMethods && function(e2, t3) {
          const n3 = t3.data.method, s5 = e2.secretMethods || {}, o3 = s5[n3] || s5["*"];
          o3 && (t3.secret = o3);
        }(n2, h2);
        try {
          l2 = await e.callFunction(h2);
        } catch (e2) {
          l2 = { result: e2 };
        }
        const { errCode: d2, errMsg: f2, newToken: p2 } = l2.result || {};
        if (i2 && uni.hideLoading(), p2 && p2.token && p2.tokenExpired && (ut(p2), j(x, { ...p2 })), d2) {
          if (i2)
            if ("toast" === r2.type)
              uni.showToast({ title: f2, icon: "none" });
            else {
              if ("modal" !== r2.type)
                throw new Error(`Invalid errorOptions.type: ${r2.type}`);
              {
                const { confirm: e3 } = await async function({ title: e4, content: t3, showCancel: n3, cancelText: s5, confirmText: o3 } = {}) {
                  return new Promise((r3, i3) => {
                    uni.showModal({ title: e4, content: t3, showCancel: n3, cancelText: s5, confirmText: o3, success(e5) {
                      r3(e5);
                    }, fail() {
                      r3({ confirm: false, cancel: true });
                    } });
                  });
                }({ title: "\u63D0\u793A", content: f2, showCancel: r2.retry, cancelText: "\u53D6\u6D88", confirmText: r2.retry ? "\u91CD\u8BD5" : "\u786E\u5B9A" });
                if (r2.retry && e3)
                  return s4(...c2);
              }
            }
          const e2 = new H({ code: d2, message: f2, requestId: l2.requestId });
          throw e2.detail = l2.result, j(R, { type: N, content: e2 }), e2;
        }
        return j(R, { type: N, content: l2.result }), l2.result;
      }, interceptorName: "callObject", getCallbackArgs: function({ params: e2 } = {}) {
        return { objectName: t2, methodName: a2, params: e2 };
      } }) });
    };
  }
  async function fn(e, t2) {
    const n2 = `http://${e}:${t2}/system/ping`;
    try {
      const e2 = await (s2 = { url: n2, timeout: 500 }, new Promise((e3, t3) => {
        X.request({ ...s2, success(t4) {
          e3(t4);
        }, fail(e4) {
          t3(e4);
        } });
      }));
      return !(!e2.data || 0 !== e2.data.code);
    } catch (e2) {
      return false;
    }
    var s2;
  }
  function pn(e) {
    if (e.initUniCloudStatus && "rejected" !== e.initUniCloudStatus)
      return;
    let t2 = Promise.resolve();
    var n2;
    n2 = 1, t2 = new Promise((e2, t3) => {
      setTimeout(() => {
        e2();
      }, n2);
    }), e.isReady = false, e.isDefault = false;
    const s2 = e.auth();
    e.initUniCloudStatus = "pending", e.initUniCloud = t2.then(() => s2.getLoginState()).then((e2) => e2 ? Promise.resolve() : s2.signInAnonymously()).then(() => {
      if ("app" === m) {
        const { osName: e2, osVersion: t3 } = uni.getSystemInfoSync();
        "ios" === e2 && function(e3) {
          if (!e3 || "string" != typeof e3)
            return 0;
          const t4 = e3.match(/^(\d+)./);
          return t4 && t4[1] ? parseInt(t4[1]) : 0;
        }(t3) >= 14 && console.warn("iOS 14\u53CA\u4EE5\u4E0A\u7248\u672C\u8FDE\u63A5uniCloud\u672C\u5730\u8C03\u8BD5\u670D\u52A1\u9700\u8981\u5141\u8BB8\u5BA2\u6237\u7AEF\u67E5\u627E\u5E76\u8FDE\u63A5\u5230\u672C\u5730\u7F51\u7EDC\u4E0A\u7684\u8BBE\u5907\uFF08\u4EC5\u5F00\u53D1\u6A21\u5F0F\u751F\u6548\uFF0C\u53D1\u884C\u6A21\u5F0F\u4F1A\u8FDE\u63A5uniCloud\u4E91\u7AEF\u670D\u52A1\uFF09");
      }
      if (e.__dev__.debugInfo) {
        const { address: t3, servePort: n3 } = e.__dev__.debugInfo;
        return async function(e2, t4) {
          let n4;
          for (let s3 = 0; s3 < e2.length; s3++) {
            const o2 = e2[s3];
            if (await fn(o2, t4)) {
              n4 = o2;
              break;
            }
          }
          return { address: n4, port: t4 };
        }(t3, n3);
      }
    }).then(({ address: t3, port: n3 } = {}) => {
      const s3 = console["app" === m ? "error" : "warn"];
      if (t3)
        e.__dev__.localAddress = t3, e.__dev__.localPort = n3;
      else if (e.__dev__.debugInfo) {
        let t4 = "";
        "remote" === e.__dev__.debugInfo.initialLaunchType ? (e.__dev__.debugInfo.forceRemote = true, t4 = "\u5F53\u524D\u5BA2\u6237\u7AEF\u548CHBuilderX\u4E0D\u5728\u540C\u4E00\u5C40\u57DF\u7F51\u4E0B\uFF08\u6216\u5176\u4ED6\u7F51\u7EDC\u539F\u56E0\u65E0\u6CD5\u8FDE\u63A5HBuilderX\uFF09\uFF0CuniCloud\u672C\u5730\u8C03\u8BD5\u670D\u52A1\u4E0D\u5BF9\u5F53\u524D\u5BA2\u6237\u7AEF\u751F\u6548\u3002\n- \u5982\u679C\u4E0D\u4F7F\u7528uniCloud\u672C\u5730\u8C03\u8BD5\u670D\u52A1\uFF0C\u8BF7\u76F4\u63A5\u5FFD\u7565\u6B64\u4FE1\u606F\u3002\n- \u5982\u9700\u4F7F\u7528uniCloud\u672C\u5730\u8C03\u8BD5\u670D\u52A1\uFF0C\u8BF7\u5C06\u5BA2\u6237\u7AEF\u4E0E\u4E3B\u673A\u8FDE\u63A5\u5230\u540C\u4E00\u5C40\u57DF\u7F51\u4E0B\u5E76\u91CD\u65B0\u8FD0\u884C\u5230\u5BA2\u6237\u7AEF\u3002\n- \u5982\u679C\u5728HBuilderX\u5F00\u542F\u7684\u72B6\u6001\u4E0B\u5207\u6362\u8FC7\u7F51\u7EDC\u73AF\u5883\uFF0C\u8BF7\u91CD\u542FHBuilderX\u540E\u518D\u8BD5\n- \u68C0\u67E5\u7CFB\u7EDF\u9632\u706B\u5899\u662F\u5426\u62E6\u622A\u4E86HBuilderX\u81EA\u5E26\u7684nodejs") : t4 = "\u65E0\u6CD5\u8FDE\u63A5uniCloud\u672C\u5730\u8C03\u8BD5\u670D\u52A1\uFF0C\u8BF7\u68C0\u67E5\u5F53\u524D\u5BA2\u6237\u7AEF\u662F\u5426\u4E0E\u4E3B\u673A\u5728\u540C\u4E00\u5C40\u57DF\u7F51\u4E0B\u3002\n- \u5982\u9700\u4F7F\u7528uniCloud\u672C\u5730\u8C03\u8BD5\u670D\u52A1\uFF0C\u8BF7\u5C06\u5BA2\u6237\u7AEF\u4E0E\u4E3B\u673A\u8FDE\u63A5\u5230\u540C\u4E00\u5C40\u57DF\u7F51\u4E0B\u5E76\u91CD\u65B0\u8FD0\u884C\u5230\u5BA2\u6237\u7AEF\u3002\n- \u5982\u679C\u5728HBuilderX\u5F00\u542F\u7684\u72B6\u6001\u4E0B\u5207\u6362\u8FC7\u7F51\u7EDC\u73AF\u5883\uFF0C\u8BF7\u91CD\u542FHBuilderX\u540E\u518D\u8BD5\n- \u68C0\u67E5\u7CFB\u7EDF\u9632\u706B\u5899\u662F\u5426\u62E6\u622A\u4E86HBuilderX\u81EA\u5E26\u7684nodejs", "web" === m && (t4 += "\n- \u90E8\u5206\u6D4F\u89C8\u5668\u5F00\u542F\u8282\u6D41\u6A21\u5F0F\u4E4B\u540E\u8BBF\u95EE\u672C\u5730\u5730\u5740\u53D7\u9650\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u542F\u7528\u4E86\u8282\u6D41\u6A21\u5F0F"), 0 === m.indexOf("mp-") && (t4 += "\n- \u5C0F\u7A0B\u5E8F\u4E2D\u5982\u4F55\u4F7F\u7528uniCloud\uFF0C\u8BF7\u53C2\u8003\uFF1Ahttps://uniapp.dcloud.net.cn/uniCloud/publish.html#useinmp"), s3(t4);
      }
    }).then(() => {
      lt(), e.isReady = true, e.initUniCloudStatus = "fulfilled";
    }).catch((t3) => {
      console.error(t3), e.initUniCloudStatus = "rejected";
    });
  }
  const gn = { tcb: it, tencent: it, aliyun: ee, private: dt };
  let mn = new class {
    init(e) {
      let t2 = {};
      const n2 = gn[e.provider];
      if (!n2)
        throw new Error("\u672A\u63D0\u4F9B\u6B63\u786E\u7684provider\u53C2\u6570");
      t2 = n2.init(e), t2.__dev__ = {}, t2.__dev__.debugLog = "web" === m && navigator.userAgent.indexOf("HBuilderX") > 0 || "app" === m;
      const s2 = y;
      s2 && !s2.code && (t2.__dev__.debugInfo = s2), pn(t2), t2.reInit = function() {
        pn(this);
      }, vt(t2), function(e2) {
        const t3 = e2.uploadFile;
        e2.uploadFile = function(e3) {
          return t3.call(this, e3);
        };
      }(t2), Ut(t2), function(e2) {
        e2.getCurrentUserInfo = an, e2.chooseAndUploadFile = un.initChooseAndUploadFile(e2), Object.assign(e2, { get mixinDatacom() {
          return hn(e2);
        } }), e2.importObject = dn(e2);
      }(t2);
      return ["callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "chooseAndUploadFile"].forEach((e2) => {
        if (!t2[e2])
          return;
        const n3 = t2[e2];
        t2[e2] = function() {
          return t2.reInit(), n3.apply(t2, Array.from(arguments));
        }, t2[e2] = W(t2[e2], e2).bind(t2);
      }), t2.init = this.init, t2;
    }
  }();
  (() => {
    const e = _;
    let t2 = {};
    if (e && 1 === e.length)
      t2 = e[0], mn = mn.init(t2), mn.isDefault = true;
    else {
      const t3 = ["auth", "callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "database", "getCurrentUSerInfo", "importObject"];
      let n2;
      n2 = e && e.length > 0 ? "\u5E94\u7528\u6709\u591A\u4E2A\u670D\u52A1\u7A7A\u95F4\uFF0C\u8BF7\u901A\u8FC7uniCloud.init\u65B9\u6CD5\u6307\u5B9A\u8981\u4F7F\u7528\u7684\u670D\u52A1\u7A7A\u95F4" : "\u5E94\u7528\u672A\u5173\u8054\u670D\u52A1\u7A7A\u95F4\uFF0C\u8BF7\u5728uniCloud\u76EE\u5F55\u53F3\u952E\u5173\u8054\u670D\u52A1\u7A7A\u95F4", t3.forEach((e2) => {
        mn[e2] = function() {
          return console.error(n2), Promise.reject(new H({ code: "SYS_ERR", message: n2 }));
        };
      });
    }
    Object.assign(mn, { get mixinDatacom() {
      return hn(mn);
    } }), nn(mn), mn.addInterceptor = P, mn.removeInterceptor = I, mn.interceptObject = C, "web" === m && (window.uniCloud = mn);
  })();
  var yn = mn;
  const _sfc_main$8 = {
    name: "uni-data-select",
    mixins: [yn.mixinDatacom || {}],
    emits: [
      "open",
      "close",
      "update:modelValue",
      "input",
      "clear",
      "change"
    ],
    model: {
      prop: "modelValue",
      event: "update:modelValue"
    },
    options: {
      virtualHost: true
    },
    props: {
      localdata: {
        type: Array,
        default() {
          return [];
        }
      },
      value: {
        type: [String, Number, Array],
        default: ""
      },
      modelValue: {
        type: [String, Number, Array],
        default: ""
      },
      label: {
        type: String,
        default: ""
      },
      placeholder: {
        type: String,
        default: "\u8BF7\u9009\u62E9"
      },
      emptyTips: {
        type: String,
        default: "\u65E0\u9009\u9879"
      },
      clear: {
        type: Boolean,
        default: true
      },
      defItem: {
        type: Number,
        default: 0
      },
      disabled: {
        type: Boolean,
        default: false
      },
      format: {
        type: String,
        default: ""
      },
      placement: {
        type: String,
        default: "bottom"
      },
      multiple: {
        type: Boolean,
        default: false
      },
      wrap: {
        type: Boolean,
        default: false
      },
      align: {
        type: String,
        default: "left"
      },
      hideRight: {
        type: Boolean,
        default: false
      },
      mode: {
        type: String,
        default: "default"
      }
    },
    data() {
      return {
        showSelector: false,
        current: "",
        mixinDatacomResData: [],
        apps: [],
        channels: [],
        cacheKey: "uni-data-select-lastSelectedValue"
      };
    },
    created() {
      this.debounceGet = this.debounce(() => {
        this.query();
      }, 300);
      if (this.collection && !this.localdata.length) {
        this.debounceGet();
      }
    },
    computed: {
      typePlaceholder() {
        const text = {
          "opendb-stat-app-versions": "\u7248\u672C",
          "opendb-app-channels": "\u6E20\u9053",
          "opendb-app-list": "\u5E94\u7528"
        };
        const common = this.placeholder;
        const placeholder = text[this.collection];
        return placeholder ? common + placeholder : common;
      },
      valueCom() {
        if (this.value === "")
          return this.modelValue;
        if (this.modelValue === "")
          return this.value;
        return this.value;
      },
      textShow() {
        if (this.multiple) {
          const currentValues = this.getCurrentValues();
          if (Array.isArray(currentValues) && currentValues.length > 0) {
            const selectedItems = this.mixinDatacomResData.filter((item) => currentValues.includes(item.value));
            return selectedItems.map((item) => this.formatItemName(item)).join(", ");
          } else {
            return "";
          }
        } else {
          return this.current;
        }
      },
      shouldShowClear() {
        if (this.multiple) {
          const currentValues = this.getCurrentValues();
          return Array.isArray(currentValues) && currentValues.length > 0;
        } else {
          return !!this.current;
        }
      },
      shouldWrap() {
        return this.multiple && this.wrap && !!this.textShow;
      },
      getOffsetByPlacement() {
        switch (this.placement) {
          case "top":
            return "bottom:calc(100% + 12px);";
          case "bottom":
            return "top:calc(100% + 12px);";
        }
      },
      slotSelected() {
        return this.$slots ? this.$slots.selected : false;
      },
      slotEmpty() {
        return this.$slots ? this.$slots.empty : false;
      },
      slotOption() {
        return this.$slots ? this.$slots.option : false;
      }
    },
    watch: {
      showSelector: {
        handler(val, old) {
          val ? this.$emit("open") : this.$emit("close");
        }
      },
      localdata: {
        immediate: true,
        handler(val, old) {
          if (Array.isArray(val) && old !== val) {
            this.mixinDatacomResData = val;
          }
        }
      },
      valueCom(val, old) {
        this.initDefVal();
      },
      mixinDatacomResData: {
        immediate: true,
        handler(val) {
          if (val.length) {
            this.initDefVal();
          }
        }
      }
    },
    methods: {
      getSelectedItems() {
        const currentValues = this.getCurrentValues();
        let _minxData = this.mixinDatacomResData;
        if (this.multiple) {
          return _minxData.filter((item) => currentValues.includes(item.value)) || [];
        } else {
          return _minxData.filter((item) => item.value === currentValues) || [];
        }
      },
      debounce(fn2, time = 100) {
        let timer = null;
        return function(...args) {
          if (timer)
            clearTimeout(timer);
          timer = setTimeout(() => {
            fn2.apply(this, args);
          }, time);
        };
      },
      isSelected(item) {
        if (this.multiple) {
          const currentValues = this.getCurrentValues();
          return Array.isArray(currentValues) && currentValues.includes(item.value);
        } else {
          return this.getCurrentValues() === item.value;
        }
      },
      getCurrentValues() {
        if (this.multiple) {
          return Array.isArray(this.valueCom) ? this.valueCom : this.valueCom ? [this.valueCom] : [];
        } else {
          return this.valueCom;
        }
      },
      query() {
        this.mixinDatacomEasyGet();
      },
      onMixinDatacomPropsChange() {
        if (this.collection) {
          this.debounceGet();
        }
      },
      initDefVal() {
        let defValue = this.multiple ? [] : "";
        if ((this.valueCom || this.valueCom === 0) && !this.isDisabled(this.valueCom)) {
          defValue = this.valueCom;
        } else {
          let strogeValue;
          if (this.collection) {
            strogeValue = this.getCache();
          }
          if (strogeValue || strogeValue === 0) {
            defValue = strogeValue;
          } else {
            let defItem = this.multiple ? [] : "";
            if (this.defItem > 0 && this.defItem <= this.mixinDatacomResData.length) {
              defItem = this.multiple ? [this.mixinDatacomResData[this.defItem - 1].value] : this.mixinDatacomResData[this.defItem - 1].value;
            }
            defValue = defItem;
          }
          if (defValue || defValue === 0 || this.multiple && Array.isArray(defValue) && defValue.length > 0) {
            this.emit(defValue);
          }
        }
        if (this.multiple) {
          const selectedValues = Array.isArray(defValue) ? defValue : defValue ? [defValue] : [];
          const selectedItems = this.mixinDatacomResData.filter((item) => selectedValues.includes(item.value));
          this.current = selectedItems.map((item) => this.formatItemName(item));
        } else {
          const def = this.mixinDatacomResData.find((item) => item.value === defValue);
          this.current = def ? this.formatItemName(def) : "";
        }
      },
      isDisabled(value) {
        if (Array.isArray(value)) {
          return value.some((val) => {
            return this.mixinDatacomResData.some((item) => item.value === val && item.disable);
          });
        } else {
          let isDisabled = false;
          this.mixinDatacomResData.forEach((item) => {
            if (item.value === value) {
              isDisabled = item.disable;
            }
          });
          return isDisabled;
        }
      },
      clearVal() {
        const emptyValue = this.multiple ? [] : "";
        this.emit(emptyValue);
        this.current = this.multiple ? [] : "";
        if (this.collection) {
          this.removeCache();
        }
        this.$emit("clear");
      },
      checkBoxChange(res) {
        let range = res.detail.value;
        let currentValues = range && range.length > 0 ? range.map((item) => {
          const index = parseInt(item, 10);
          if (isNaN(index)) {
            console.error(`\u65E0\u6548\u7D22\u5F15: ${item}`);
          }
          if (index < 0 || index >= this.mixinDatacomResData.length) {
            console.error(`\u7D22\u5F15\u8D8A\u754C: ${index}`);
          }
          return this.mixinDatacomResData[index].value;
        }) : [];
        const selectedItems = this.mixinDatacomResData.filter((dataItem) => currentValues.includes(dataItem.value));
        this.current = selectedItems.map((dataItem) => this.formatItemName(dataItem));
        this.emit(currentValues);
      },
      change(item) {
        if (!item.disable) {
          if (this.multiple) {
            let currentValues = this.getCurrentValues();
            if (!Array.isArray(currentValues)) {
              currentValues = currentValues ? [currentValues] : [];
            }
            const itemValue = item.value;
            const index = currentValues.indexOf(itemValue);
            if (index > -1) {
              currentValues.splice(index, 1);
            } else {
              currentValues.push(itemValue);
            }
            const selectedItems = this.mixinDatacomResData.filter((dataItem) => currentValues.includes(dataItem.value));
            this.current = selectedItems.map((dataItem) => this.formatItemName(dataItem));
            this.emit(currentValues);
          } else {
            this.showSelector = false;
            this.current = this.formatItemName(item);
            this.emit(item.value);
          }
        }
      },
      emit(val) {
        this.$emit("input", val);
        this.$emit("update:modelValue", val);
        this.$emit("change", val);
        if (this.collection) {
          this.setCache(val);
        }
      },
      toggleSelector() {
        if (this.disabled) {
          return;
        }
        this.showSelector = !this.showSelector;
      },
      formatItemName(item) {
        let {
          text,
          value,
          channel_code
        } = item;
        channel_code = channel_code ? `(${channel_code})` : "";
        if (this.format) {
          let str = "";
          str = this.format;
          for (let key in item) {
            str = str.replace(new RegExp(`{${key}}`, "g"), item[key]);
          }
          return str;
        } else {
          return this.collection.indexOf("app-list") > 0 ? `${text}(${value})` : text ? text : `\u672A\u547D\u540D${channel_code}`;
        }
      },
      getLoadData() {
        return this.mixinDatacomResData;
      },
      getCurrentCacheKey() {
        return this.collection;
      },
      getCache(name = this.getCurrentCacheKey()) {
        let cacheData = uni.getStorageSync(this.cacheKey) || {};
        return cacheData[name];
      },
      setCache(value, name = this.getCurrentCacheKey()) {
        let cacheData = uni.getStorageSync(this.cacheKey) || {};
        cacheData[name] = value;
        uni.setStorageSync(this.cacheKey, cacheData);
      },
      removeCache(name = this.getCurrentCacheKey()) {
        let cacheData = uni.getStorageSync(this.cacheKey) || {};
        delete cacheData[name];
        uni.setStorageSync(this.cacheKey, cacheData);
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-stat__select" }, [
      $props.label ? (vue.openBlock(), vue.createElementBlock("span", {
        key: 0,
        class: "uni-label-text hide-on-phone"
      }, vue.toDisplayString($props.label + "\uFF1A"), 1)) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("view", {
        class: vue.normalizeClass(["uni-stat-box", { "uni-stat__actived": $data.current }])
      }, [
        vue.createElementVNode("view", {
          class: vue.normalizeClass(["uni-select", { "uni-select--disabled": $props.disabled, "uni-select--wrap": $options.shouldWrap, "border-default": $props.mode == "default", "border-bottom": $props.mode == "underline" }])
        }, [
          vue.createElementVNode("view", {
            class: vue.normalizeClass(["uni-select__input-box", { "uni-select__input-box--wrap": $options.shouldWrap }]),
            onClick: _cache[1] || (_cache[1] = (...args) => $options.toggleSelector && $options.toggleSelector(...args))
          }, [
            $options.slotSelected ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: vue.normalizeClass(["slot-content padding-top-bottom", { "uni-select__input-text--wrap": $options.shouldWrap }])
            }, [
              vue.renderSlot(_ctx.$slots, "selected", {
                selectedItems: $options.getSelectedItems()
              }, void 0, true)
            ], 2)) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
              $options.textShow ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: vue.normalizeClass(["uni-select__input-text", { "uni-select__input-text--wrap": $options.shouldWrap }])
              }, [
                vue.createElementVNode("view", {
                  class: vue.normalizeClass(["padding-top-bottom", "align-" + $props.align])
                }, vue.toDisplayString($options.textShow), 3)
              ], 2)) : (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: vue.normalizeClass(["uni-select__input-text uni-select__input-placeholder", "align-" + $props.align])
              }, vue.toDisplayString($options.typePlaceholder), 3))
            ], 64)),
            !$props.hideRight && $options.shouldShowClear && $props.clear && !$props.disabled ? (vue.openBlock(), vue.createElementBlock("view", {
              key: "clear-button",
              onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $options.clearVal && $options.clearVal(...args), ["stop"]))
            }, [
              vue.createVNode(_component_uni_icons, {
                type: "clear",
                color: "#c0c4cc",
                size: "24"
              })
            ])) : !$props.hideRight ? (vue.openBlock(), vue.createElementBlock("view", { key: "arrow-button" }, [
              vue.createVNode(_component_uni_icons, {
                type: $data.showSelector ? "top" : "bottom",
                size: "14",
                color: "#999"
              }, null, 8, ["type"])
            ])) : vue.createCommentVNode("v-if", true)
          ], 2),
          $data.showSelector ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "uni-select--mask",
            onClick: _cache[2] || (_cache[2] = (...args) => $options.toggleSelector && $options.toggleSelector(...args))
          })) : vue.createCommentVNode("v-if", true),
          $data.showSelector ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "uni-select__selector",
            style: vue.normalizeStyle($options.getOffsetByPlacement)
          }, [
            vue.createElementVNode("view", {
              class: vue.normalizeClass($props.placement == "bottom" ? "uni-popper__arrow_bottom" : "uni-popper__arrow_top")
            }, null, 2),
            vue.createElementVNode("scroll-view", {
              "scroll-y": "true",
              class: "uni-select__selector-scroll"
            }, [
              $options.slotEmpty && $data.mixinDatacomResData.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "uni-select__selector-empty"
              }, [
                vue.renderSlot(_ctx.$slots, "empty", { empty: $props.emptyTips }, void 0, true)
              ])) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
                $data.mixinDatacomResData.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "uni-select__selector-empty"
                }, [
                  vue.createElementVNode("text", null, vue.toDisplayString($props.emptyTips), 1)
                ])) : vue.createCommentVNode("v-if", true)
              ], 64)),
              $options.slotOption ? (vue.openBlock(true), vue.createElementBlock(vue.Fragment, { key: 2 }, vue.renderList($data.mixinDatacomResData, (itemData, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index,
                  onClick: ($event) => $options.change(itemData)
                }, [
                  vue.renderSlot(_ctx.$slots, "option", {
                    item: itemData,
                    itemSelected: $props.multiple ? $options.getCurrentValues().includes(itemData.value) : $options.getCurrentValues() == itemData.value
                  }, void 0, true)
                ], 8, ["onClick"]);
              }), 128)) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 3 }, [
                !$props.multiple && $data.mixinDatacomResData.length > 0 ? (vue.openBlock(true), vue.createElementBlock(vue.Fragment, { key: 0 }, vue.renderList($data.mixinDatacomResData, (item, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "uni-select__selector-item",
                    key: index,
                    onClick: ($event) => $options.change(item)
                  }, [
                    vue.createElementVNode("text", {
                      class: vue.normalizeClass({ "uni-select__selector__disabled": item.disable })
                    }, vue.toDisplayString($options.formatItemName(item)), 3)
                  ], 8, ["onClick"]);
                }), 128)) : vue.createCommentVNode("v-if", true),
                $props.multiple && $data.mixinDatacomResData.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", { key: 1 }, [
                  vue.createElementVNode("checkbox-group", {
                    onChange: _cache[3] || (_cache[3] = (...args) => $options.checkBoxChange && $options.checkBoxChange(...args))
                  }, [
                    (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($data.mixinDatacomResData, (item, index) => {
                      return vue.openBlock(), vue.createElementBlock("label", {
                        class: "uni-select__selector-item",
                        key: index
                      }, [
                        vue.createElementVNode("checkbox", {
                          value: index + "",
                          checked: $options.getCurrentValues().includes(item.value),
                          disabled: item.disable
                        }, null, 8, ["value", "checked", "disabled"]),
                        vue.createElementVNode("view", {
                          class: vue.normalizeClass({ "uni-select__selector__disabled": item.disable })
                        }, vue.toDisplayString($options.formatItemName(item)), 3)
                      ]);
                    }), 128))
                  ], 32)
                ])) : vue.createCommentVNode("v-if", true)
              ], 64))
            ])
          ], 4)) : vue.createCommentVNode("v-if", true)
        ], 2)
      ], 2)
    ]);
  }
  var __easycom_4 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$4], ["__scopeId", "data-v-558a1c68"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-data-select/uni-data-select.vue"]]);
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
      for (var i2 = 0; i2 < rules.length; i2++) {
        let rule = rules[i2];
        let vt2 = this._getValidateType(rule);
        Object.assign(rule, {
          label: fieldValue.label || `["${fieldKey}"]`
        });
        if (RuleValidatorHelper[vt2]) {
          result = RuleValidatorHelper[vt2](rule, value, message);
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
          result = await this.validateFunction(rule, value, data, allData, vt2);
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
    async validateFunction(rule, value, data, allData, vt2) {
      let result = null;
      try {
        let callbackMessage = null;
        const res = await rule.validateFunction(rule, value, allData || data, (message) => {
          callbackMessage = message;
        });
        if (callbackMessage || typeof res === "string" && res || res === false) {
          result = this._getMessage(rule, callbackMessage || res, vt2);
        }
      } catch (e) {
        result = this._getMessage(rule, e.message, vt2);
      }
      return result;
    }
    _getMessage(rule, message, vt2) {
      return formatMessage(rule, message || rule.errorMessage || this._message[vt2] || message["default"]);
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
      for (let i2 = 0; i2 < range.length; i2++) {
        const item = range[i2];
        if (types.object(item) && item.value !== void 0) {
          list[i2] = item.value;
        } else {
          list[i2] = item;
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
      for (let i2 = 0; i2 < value.length; i2++) {
        const element = value[i2];
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
      const realname = base_name.reduce((a2, b2) => a2 += `#${b2}`, "_formdata_");
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
    for (let i2 in newData) {
      let path = name2arr(i2);
      objSet(formData, path, newData[i2]);
    }
    return formData;
  };
  const name2arr = (name) => {
    let field = name.replace("_formdata_#", "");
    field = field.split("#").map((v2) => isNumber(v2) ? Number(v2) : v2);
    return field;
  };
  const objSet = (object, path, value) => {
    if (typeof object !== "object")
      return object;
    _basePath(path).reduce((o2, k2, i2, _2) => {
      if (i2 === _2.length - 1) {
        o2[k2] = value;
        return null;
      } else if (k2 in o2) {
        return o2[k2];
      } else {
        o2[k2] = /^[0-9]{1,}$/.test(_2[i2 + 1]) ? [] : {};
        return o2[k2];
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
    let val = newPath.reduce((o2, k2) => {
      return (o2 || {})[k2];
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
    for (let i2 = 0; i2 < rules.length; i2++) {
      const ruleData = rules[i2];
      if (ruleData.required) {
        isNoField = true;
        break;
      }
    }
    return isNoField;
  };
  const isEqual = (a2, b2) => {
    if (a2 === b2) {
      return a2 !== 0 || 1 / a2 === 1 / b2;
    }
    if (a2 == null || b2 == null) {
      return a2 === b2;
    }
    var classNameA = toString.call(a2), classNameB = toString.call(b2);
    if (classNameA !== classNameB) {
      return false;
    }
    switch (classNameA) {
      case "[object RegExp]":
      case "[object String]":
        return "" + a2 === "" + b2;
      case "[object Number]":
        if (+a2 !== +a2) {
          return +b2 !== +b2;
        }
        return +a2 === 0 ? 1 / +a2 === 1 / b2 : +a2 === +b2;
      case "[object Date]":
      case "[object Boolean]":
        return +a2 === +b2;
    }
    if (classNameA == "[object Object]") {
      var propsA = Object.getOwnPropertyNames(a2), propsB = Object.getOwnPropertyNames(b2);
      if (propsA.length != propsB.length) {
        return false;
      }
      for (var i2 = 0; i2 < propsA.length; i2++) {
        var propName = propsA[i2];
        if (a2[propName] !== b2[propName]) {
          return false;
        }
      }
      return true;
    }
    if (classNameA == "[object Array]") {
      if (a2.toString() == b2.toString()) {
        return true;
      }
      return false;
    }
  };
  const _sfc_main$7 = {
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
            for (let i2 in this.$refs) {
              const vm = this.$refs[i2];
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
        for (let i2 in this.dataValue) {
          const itemData = this.childrens.find((v2) => v2.name === i2);
          if (itemData) {
            if (this.formData[i2] === void 0) {
              this.formData[i2] = this._getValue(i2, this.dataValue[i2]);
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
        for (let i2 in invalidFields) {
          const item = this.childrens.find((v2) => realName(v2.name) === i2);
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
        for (let i2 in childrens) {
          const child = childrens[i2];
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
          keepitem.forEach((v2) => {
            let vName = realName(v2);
            let value = getDataValue(v2, this.localData);
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
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-forms" }, [
      vue.createElementVNode("form", null, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ])
    ]);
  }
  var __easycom_5 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$3], ["__scopeId", "data-v-5a49926c"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-forms/uni-forms.vue"]]);
  const _sfc_main$6 = {
    __name: "myInfo",
    setup(__props) {
      const $store = useStore();
      const userInfo = vue.computed(() => $store.state.userInfo);
      const avatarUrl = vue.ref(userInfo.value.profilePhoto || "/static/default-avatar.png");
      const formData = vue.reactive({
        passengerPhone: userInfo.value.passengerPhone || "",
        passengerSurname: userInfo.value.passengerSurname || "",
        passengerName: userInfo.value.passengerName || "",
        passengerGender: userInfo.value.passengerGender !== void 0 ? userInfo.value.passengerGender : 0
      });
      const genderOptions = [
        { text: "\u7537", value: 1 },
        { text: "\u5973", value: 2 }
      ];
      async function requestAlbumPermission() {
        return new Promise((resolve) => {
          uni.getSetting({
            success: (res) => {
              if (res.authSetting["scope.album"]) {
                resolve(true);
              } else {
                uni.authorize({
                  scope: "scope.album",
                  success: () => {
                    resolve(true);
                  },
                  fail: () => {
                    resolve(false);
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
      const changeAvatar = () => {
        requestAlbumPermission();
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: (res) => {
            const tempFilePath = res.tempFilePaths[0];
            uni.uploadFile({
              url: "http://8.140.211.132:7073/passenger-user/upload",
              filePath: tempFilePath,
              name: "file",
              header: {
                Authorization: $store.state.token
              },
              success: (uploadRes) => {
                const data = JSON.parse(uploadRes.data);
                formatAppLog("log", "at pages/myInfo.vue:144", data);
                if (data.code == 0) {
                  formatAppLog("log", "at pages/myInfo.vue:146", "\u4E0A\u4F20\u5934\u50CF\u5931\u8D25");
                } else {
                  avatarUrl.value = tempFilePath;
                  uni.showToast({ title: "\u5934\u50CF\u5DF2\u66F4\u65B0", icon: "none" });
                }
              },
              fail: (err) => {
                formatAppLog("log", "at pages/myInfo.vue:155", "\u4E0A\u4F20\u5934\u50CF\u5931\u8D25", err);
              }
            });
          }
        });
      };
      const handleSubmit = async () => {
        if (!formData.passengerSurname || !formData.passengerName) {
          uni.showToast({ title: "\u8BF7\u586B\u5199\u5B8C\u6574\u59D3\u540D", icon: "none" });
          return;
        }
        const updatedInfo = {
          ...userInfo.value,
          passengerSurname: formData.passengerSurname,
          passengerName: formData.passengerName,
          passengerGender: formData.passengerGender,
          profilePhoto: avatarUrl.value !== "/static/default-avatar.png" ? avatarUrl.value : userInfo.value.profilePhoto
        };
        const { error, result } = await ApiPutUserInfo(updatedInfo);
        if (!error) {
          $store.commit("setUserInfo", updatedInfo);
          uni.showToast({
            title: "\u4FDD\u5B58\u6210\u529F",
            icon: "success",
            duration: 1500
          });
        } else {
          uni.showToast({
            title: "\u4FDD\u5B58\u5931\u8D25",
            icon: "error",
            duration: 1500
          });
        }
      };
      return (_ctx, _cache) => {
        const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
        const _component_uni_card = resolveEasycom(vue.resolveDynamicComponent("uni-card"), __easycom_0);
        const _component_uni_easyinput = resolveEasycom(vue.resolveDynamicComponent("uni-easyinput"), __easycom_2$1);
        const _component_uni_forms_item = resolveEasycom(vue.resolveDynamicComponent("uni-forms-item"), __easycom_3);
        const _component_uni_data_select = resolveEasycom(vue.resolveDynamicComponent("uni-data-select"), __easycom_4);
        const _component_uni_forms = resolveEasycom(vue.resolveDynamicComponent("uni-forms"), __easycom_5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "personal-info-page" }, [
          vue.createCommentVNode(" \u9875\u9762\u6807\u9898 "),
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "page-title" }, "\u4E2A\u4EBA\u4FE1\u606F"),
            vue.createElementVNode("text", { class: "page-subtitle" }, "\u5B8C\u5584\u8D44\u6599\uFF0C\u4EAB\u53D7\u66F4\u8D34\u5FC3\u670D\u52A1")
          ]),
          vue.createCommentVNode(" \u5934\u50CF\u5361\u7247 "),
          vue.createVNode(_component_uni_card, {
            "is-full": true,
            border: false,
            class: "avatar-card"
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view", {
                class: "avatar-wrapper",
                onClick: changeAvatar
              }, [
                vue.createElementVNode("image", {
                  class: "avatar",
                  src: avatarUrl.value,
                  mode: "aspectFill"
                }, null, 8, ["src"]),
                vue.createElementVNode("view", { class: "avatar-edit" }, [
                  vue.createVNode(_component_uni_icons, {
                    type: "camera",
                    size: "20",
                    color: "#fff"
                  })
                ])
              ]),
              vue.createElementVNode("text", { class: "avatar-tip" }, "\u70B9\u51FB\u66F4\u6362\u5934\u50CF")
            ]),
            _: 1
          }),
          vue.createCommentVNode(" \u8868\u5355\u5361\u7247 "),
          vue.createVNode(_component_uni_card, {
            "is-full": true,
            border: false,
            class: "form-card"
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_uni_forms, {
                ref: "formRef",
                model: formData,
                "label-width": "80"
              }, {
                default: vue.withCtx(() => [
                  vue.createCommentVNode(" \u624B\u673A\u53F7\uFF08\u53EA\u8BFB\uFF09 "),
                  vue.createVNode(_component_uni_forms_item, { label: "\u624B\u673A\u53F7" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.passengerPhone,
                        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => formData.passengerPhone = $event),
                        disabled: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createCommentVNode(" \u59D3\u6C0F "),
                  vue.createVNode(_component_uni_forms_item, {
                    label: "\u59D3\u6C0F",
                    required: ""
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.passengerSurname,
                        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => formData.passengerSurname = $event),
                        placeholder: "\u8BF7\u8F93\u5165\u59D3",
                        clearable: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createCommentVNode(" \u540D\u5B57 "),
                  vue.createVNode(_component_uni_forms_item, {
                    label: "\u540D\u5B57",
                    required: ""
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_easyinput, {
                        modelValue: formData.passengerName,
                        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => formData.passengerName = $event),
                        placeholder: "\u8BF7\u8F93\u5165\u540D\u5B57",
                        clearable: ""
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createCommentVNode(" \u6027\u522B "),
                  vue.createVNode(_component_uni_forms_item, { label: "\u6027\u522B" }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_uni_data_select, {
                        modelValue: formData.passengerGender,
                        "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => formData.passengerGender = $event),
                        localdata: genderOptions,
                        placeholder: "\u8BF7\u9009\u62E9\u6027\u522B"
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"]),
              vue.createElementVNode("view", { class: "submit-wrapper" }, [
                vue.createElementVNode("button", {
                  class: "submit-btn",
                  onClick: handleSubmit
                }, "\u4FDD\u5B58\u4FEE\u6539")
              ])
            ]),
            _: 1
          })
        ]);
      };
    }
  };
  var PagesMyInfo = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-9a6b9a04"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/myInfo.vue"]]);
  const _sfc_main$5 = {
    __name: "paymentSettings",
    setup(__props) {
      const paymentMethod = vue.ref("alipay");
      const onChange = (event) => {
        paymentMethod.value = event.detail.value;
      };
      const handleSubmit = () => {
        const data = {
          paymentMethod: paymentMethod.value
        };
        formatAppLog("log", "at pages/paymentSettings.vue:30", data);
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
          vue.createElementVNode("view", { class: "form-item" }, [
            vue.createElementVNode("view", { style: { "margin-bottom": "15px" } }, [
              vue.createElementVNode("text", null, "\u9ED8\u8BA4\u652F\u4ED8\u65B9\u5F0F\uFF1A")
            ]),
            vue.createElementVNode("radio-group", { onChange }, [
              vue.createElementVNode("radio", {
                value: "alipay",
                checked: "true"
              }, "\u652F\u4ED8\u5B9D")
            ], 32)
          ]),
          vue.createElementVNode("button", {
            class: "submit-btn",
            onClick: handleSubmit
          }, "\u63D0\u4EA4")
        ]);
      };
    }
  };
  var PagesPaymentSettings = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-215a0216"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/paymentSettings.vue"]]);
  const _sfc_main$4 = {
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
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
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
  var __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$2], ["__scopeId", "data-v-22afc074"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-collapse-item/uni-collapse-item.vue"]]);
  const _sfc_main$3 = {
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
            val.forEach((v2) => {
              if (v2 === vm.nameSync) {
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
  var __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$1], ["__scopeId", "data-v-0cc15fc6"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/node_modules/@dcloudio/uni-ui/lib/uni-collapse/uni-collapse.vue"]]);
  const _sfc_main$2 = {
    __name: "termsAndRules",
    setup(__props) {
      return (_ctx, _cache) => {
        const _component_uni_card = resolveEasycom(vue.resolveDynamicComponent("uni-card"), __easycom_0);
        const _component_uni_collapse_item = resolveEasycom(vue.resolveDynamicComponent("uni-collapse-item"), __easycom_1);
        const _component_uni_collapse = resolveEasycom(vue.resolveDynamicComponent("uni-collapse"), __easycom_2);
        return vue.openBlock(), vue.createElementBlock("view", { class: "agreement-page" }, [
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "scroll-content"
          }, [
            vue.createCommentVNode(" \u5F15\u8A00\u5361\u7247 "),
            vue.createVNode(_component_uni_card, {
              "is-full": true,
              border: false,
              class: "intro-card"
            }, {
              default: vue.withCtx(() => [
                vue.createElementVNode("view", { class: "intro-content" }, [
                  vue.createElementVNode("text", { class: "intro-title" }, "\u6B22\u8FCE\u4F7F\u7528\u8FC5\u5BB6\u51FA\u884C"),
                  vue.createElementVNode("text", { class: "intro-desc" }, "\u8FC5\u5BB6\u51FA\u884C\u4E3A\u60A8\u63D0\u4F9B\u5B89\u5168\u3001\u4FBF\u6377\u3001\u8212\u9002\u7684\u51FA\u884C\u670D\u52A1\u3002\u8BF7\u60A8\u5728\u4F7F\u7528\u672C\u5E73\u53F0\u524D\u4ED4\u7EC6\u9605\u8BFB\u5E76\u5145\u5206\u7406\u89E3\u672C\u534F\u8BAE\u7684\u5168\u90E8\u5185\u5BB9\uFF0C\u7279\u522B\u662F\u52A0\u7C97\u6216\u6807\u7EA2\u7684\u6761\u6B3E\u3002")
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
                      title: "\u4E00\u3001\u7528\u6237\u6CE8\u518C\u4E0E\u8D26\u53F7\u7BA1\u7406",
                      open: ""
                    }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "1.1 \u7528\u6237\u9700\u4F7F\u7528\u672C\u4EBA\u624B\u673A\u53F7\u7801\u8FDB\u884C\u6CE8\u518C\uFF0C\u5E76\u786E\u4FDD\u6240\u63D0\u4F9B\u4FE1\u606F\u7684\u771F\u5B9E\u3001\u51C6\u786E\u3001\u5B8C\u6574\u3002\u5982\u4FE1\u606F\u53D1\u751F\u53D8\u66F4\uFF0C\u5E94\u53CA\u65F6\u66F4\u65B0\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "1.2 \u7528\u6237\u8D26\u53F7\u4EC5\u9650\u672C\u4EBA\u4F7F\u7528\uFF0C\u4E0D\u5F97\u8F6C\u8BA9\u3001\u51FA\u79DF\u6216\u501F\u4E88\u4ED6\u4EBA\u3002\u56E0\u8D26\u53F7\u4FDD\u7BA1\u4E0D\u5584\u5BFC\u81F4\u7684\u635F\u5931\u7531\u7528\u6237\u81EA\u884C\u627F\u62C5\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "1.3 \u7528\u6237\u5E94\u5E74\u6EE118\u5468\u5C81\uFF0C\u5177\u5907\u5B8C\u5168\u6C11\u4E8B\u884C\u4E3A\u80FD\u529B\u3002\u672A\u6EE118\u5468\u5C81\u7684\u7528\u6237\u9700\u5728\u76D1\u62A4\u4EBA\u966A\u540C\u4E0B\u4F7F\u7528\u5E73\u53F0\u670D\u52A1\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "1.4 \u5E73\u53F0\u6709\u6743\u5BF9\u5B58\u5728\u5F02\u5E38\u884C\u4E3A\u7684\u8D26\u53F7\u91C7\u53D6\u9650\u5236\u63AA\u65BD\uFF0C\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\u6682\u505C\u670D\u52A1\u3001\u8981\u6C42\u8EAB\u4EFD\u6838\u9A8C\u7B49\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u4E8C\u3001\u4E58\u8F66\u89C4\u8303\u4E0E\u5B89\u5168\u987B\u77E5" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "2.1 \u4E58\u5BA2\u5E94\u5728\u4E0B\u5355\u65F6\u51C6\u786E\u586B\u5199\u4E0A\u8F66\u5730\u70B9\u548C\u76EE\u7684\u5730\uFF0C\u5E76\u4FDD\u6301\u901A\u8BAF\u7545\u901A\uFF0C\u65B9\u4FBF\u53F8\u673A\u8054\u7CFB\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "2.2 \u4E58\u8F66\u8FC7\u7A0B\u4E2D\uFF0C\u4E58\u5BA2\u5E94\u7CFB\u597D\u5B89\u5168\u5E26\uFF0C\u4E0D\u5F97\u5E72\u6270\u9A7E\u9A76\u5458\u64CD\u4F5C\uFF0C\u4E0D\u5F97\u8981\u6C42\u8D85\u5458\u3001\u8D85\u901F\u6216\u8FDD\u53CD\u4EA4\u901A\u6CD5\u89C4\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "2.3 \u7981\u6B62\u643A\u5E26\u6613\u71C3\u3001\u6613\u7206\u3001\u6709\u6BD2\u7B49\u5371\u9669\u54C1\u4E0A\u8F66\uFF0C\u4E0D\u5F97\u5728\u8F66\u5185\u5438\u70DF\u3001\u996E\u98DF\u6216\u505A\u51FA\u5F71\u54CD\u884C\u8F66\u5B89\u5168\u7684\u884C\u4E3A\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "2.4 \u4E58\u5BA2\u9700\u6309\u7167\u5E73\u53F0\u663E\u793A\u91D1\u989D\u652F\u4ED8\u8F66\u8D39\uFF0C\u4E0D\u5F97\u65E0\u6545\u62D2\u4ED8\u6216\u6076\u610F\u9003\u5355\u3002\u5982\u5BF9\u8D39\u7528\u6709\u5F02\u8BAE\uFF0C\u53EF\u901A\u8FC7\u5BA2\u670D\u6E20\u9053\u89E3\u51B3\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "2.5 \u4E58\u5BA2\u9057\u5931\u7269\u54C1\u65F6\uFF0C\u53EF\u8054\u7CFB\u5E73\u53F0\u5BA2\u670D\u534F\u52A9\u5BFB\u627E\uFF0C\u53F8\u673A\u8FD4\u8FD8\u7269\u54C1\u4EA7\u751F\u7684\u5408\u7406\u8D39\u7528\u7531\u4E58\u5BA2\u627F\u62C5\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u4E09\u3001\u8D39\u7528\u8BF4\u660E\u4E0E\u652F\u4ED8\u89C4\u5219" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "3.1 \u8F66\u8D39\u7531\u8D77\u6B65\u4EF7\u3001\u91CC\u7A0B\u8D39\u3001\u65F6\u957F\u8D39\u53CA\u53EF\u80FD\u7684\u52A8\u6001\u6EA2\u4EF7\u6784\u6210\uFF0C\u5177\u4F53\u6807\u51C6\u4EE5\u8BA2\u5355\u9875\u9762\u5C55\u793A\u4E3A\u51C6\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "3.2 \u4E58\u5BA2\u4E0B\u5355\u540E\uFF0C\u82E5\u53F8\u673A\u5DF2\u63A5\u5355\uFF0C\u4E58\u5BA2\u53D6\u6D88\u8BA2\u5355\u53EF\u80FD\u4EA7\u751F\u53D6\u6D88\u8D39\uFF0C\u5177\u4F53\u89C4\u5219\u8BE6\u89C1\u5E73\u53F0\u516C\u793A\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "3.3 \u5E73\u53F0\u652F\u6301\u5FAE\u4FE1\u3001\u652F\u4ED8\u5B9D\u7B49\u591A\u79CD\u652F\u4ED8\u65B9\u5F0F\u3002\u652F\u4ED8\u6210\u529F\u540E\uFF0C\u8BA2\u5355\u81EA\u52A8\u5B8C\u6210\uFF0C\u4E58\u5BA2\u53EF\u901A\u8FC7\u8BA2\u5355\u8BE6\u60C5\u67E5\u770B\u8D39\u7528\u660E\u7EC6\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "3.4 \u5982\u9047\u652F\u4ED8\u5931\u8D25\u6216\u91CD\u590D\u6263\u6B3E\uFF0C\u8BF7\u53CA\u65F6\u8054\u7CFB\u5E73\u53F0\u5BA2\u670D\u5904\u7406\uFF0C\u5E73\u53F0\u5C06\u5728\u6838\u5B9E\u540E7\u4E2A\u5DE5\u4F5C\u65E5\u5185\u5904\u7406\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u56DB\u3001\u7528\u6237\u6743\u76CA\u4E0E\u6295\u8BC9\u5904\u7406" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "4.1 \u4E58\u5BA2\u6709\u6743\u8981\u6C42\u53F8\u673A\u6309\u7167\u89C4\u5212\u8DEF\u7EBF\u884C\u9A76\uFF0C\u5982\u53F8\u673A\u5B58\u5728\u7ED5\u8DEF\u3001\u52A0\u4EF7\u3001\u6001\u5EA6\u6076\u52A3\u7B49\u884C\u4E3A\uFF0C\u4E58\u5BA2\u53EF\u5411\u5E73\u53F0\u6295\u8BC9\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "4.2 \u6295\u8BC9\u53EF\u901A\u8FC7\u8BA2\u5355\u9875\u9762\u201C\u8054\u7CFB\u5BA2\u670D\u201D\u6216\u62E8\u6253\u5BA2\u670D\u7535\u8BDD\u8FDB\u884C\uFF0C\u5E73\u53F0\u5C06\u572824\u5C0F\u65F6\u5185\u53D7\u7406\uFF0C7\u4E2A\u5DE5\u4F5C\u65E5\u5185\u53CD\u9988\u5904\u7406\u7ED3\u679C\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "4.3 \u5E73\u53F0\u4E3A\u4E58\u5BA2\u63D0\u4F9B\u884C\u7A0B\u5206\u4EAB\u3001\u7D27\u6025\u8054\u7CFB\u4EBA\u3001\u4E00\u952E\u62A5\u8B66\u7B49\u5B89\u5168\u529F\u80FD\uFF0C\u5EFA\u8BAE\u4E58\u5BA2\u5728\u51FA\u884C\u65F6\u4F7F\u7528\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "4.4 \u82E5\u56E0\u5E73\u53F0\u539F\u56E0\u5BFC\u81F4\u4E58\u5BA2\u6743\u76CA\u53D7\u635F\uFF0C\u5E73\u53F0\u5C06\u4F9D\u636E\u76F8\u5173\u6CD5\u5F8B\u6CD5\u89C4\u627F\u62C5\u76F8\u5E94\u8D23\u4EFB\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u4E94\u3001\u9690\u79C1\u653F\u7B56\u4E0E\u6570\u636E\u4FDD\u62A4" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "5.1 \u5E73\u53F0\u6536\u96C6\u7528\u6237\u624B\u673A\u53F7\u3001\u4F4D\u7F6E\u4FE1\u606F\u3001\u8BA2\u5355\u8BB0\u5F55\u7B49\u4EC5\u7528\u4E8E\u63D0\u4F9B\u51FA\u884C\u670D\u52A1\uFF0C\u672A\u7ECF\u7528\u6237\u540C\u610F\u4E0D\u4F1A\u5411\u7B2C\u4E09\u65B9\u63D0\u4F9B\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "5.2 \u4E3A\u4FDD\u969C\u5B89\u5168\uFF0C\u5E73\u53F0\u4F1A\u5BF9\u884C\u7A0B\u5F55\u97F3\u8FDB\u884C\u52A0\u5BC6\u5B58\u50A8\uFF0C\u4EC5\u5728\u5B89\u5168\u4E8B\u4EF6\u5904\u7406\u6216\u6CD5\u5F8B\u9700\u8981\u65F6\u8C03\u53D6\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "5.3 \u7528\u6237\u53EF\u968F\u65F6\u5728\u201C\u8BBE\u7F6E\u201D\u4E2D\u67E5\u770B\u6216\u5220\u9664\u4E2A\u4EBA\u6570\u636E\uFF0C\u6CE8\u9500\u8D26\u53F7\u540E\u5E73\u53F0\u5C06\u4F9D\u6CD5\u5220\u9664\u76F8\u5173\u6570\u636E\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "5.4 \u5E73\u53F0\u91C7\u7528\u884C\u4E1A\u6807\u51C6\u6280\u672F\u4FDD\u62A4\u6570\u636E\u5B89\u5168\uFF0C\u4F46\u65E0\u6CD5\u5B8C\u5168\u6392\u9664\u7B2C\u4E09\u65B9\u653B\u51FB\u98CE\u9669\u3002\u5982\u53D1\u751F\u6570\u636E\u6CC4\u9732\uFF0C\u5C06\u7B2C\u4E00\u65F6\u95F4\u901A\u77E5\u7528\u6237\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u516D\u3001\u514D\u8D23\u6761\u6B3E" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "6.1 \u5E73\u53F0\u4EC5\u4E3A\u4E58\u5BA2\u4E0E\u53F8\u673A\u63D0\u4F9B\u4FE1\u606F\u64AE\u5408\u670D\u52A1\uFF0C\u4E0D\u627F\u62C5\u8FD0\u8F93\u8FC7\u7A0B\u4E2D\u7684\u76F4\u63A5\u8D23\u4EFB\u3002\u56E0\u4EA4\u901A\u4E8B\u6545\u3001\u7B2C\u4E09\u65B9\u4FB5\u6743\u7B49\u9020\u6210\u7684\u635F\u5931\uFF0C\u7531\u8D23\u4EFB\u65B9\u4F9D\u6CD5\u627F\u62C5\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "6.2 \u56E0\u4E0D\u53EF\u6297\u529B\uFF08\u5982\u81EA\u7136\u707E\u5BB3\u3001\u653F\u5E9C\u7BA1\u5236\u3001\u7F51\u7EDC\u6545\u969C\u7B49\uFF09\u5BFC\u81F4\u670D\u52A1\u4E2D\u65AD\u6216\u635F\u5931\u7684\uFF0C\u5E73\u53F0\u4E0D\u627F\u62C5\u8D23\u4EFB\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "6.3 \u7528\u6237\u8FDD\u53CD\u672C\u534F\u8BAE\u7EA6\u5B9A\u5BFC\u81F4\u7684\u4EFB\u4F55\u635F\u5931\uFF0C\u7531\u7528\u6237\u81EA\u884C\u627F\u62C5\u3002")
                        ])
                      ]),
                      _: 1
                    }),
                    vue.createVNode(_component_uni_collapse_item, { title: "\u4E03\u3001\u9644\u5219" }, {
                      default: vue.withCtx(() => [
                        vue.createElementVNode("view", { class: "collapse-content" }, [
                          vue.createElementVNode("text", { class: "content-text" }, "7.1 \u672C\u534F\u8BAE\u81EA\u7528\u6237\u70B9\u51FB\u201C\u540C\u610F\u201D\u6216\u9996\u6B21\u4F7F\u7528\u5E73\u53F0\u670D\u52A1\u65F6\u751F\u6548\uFF0C\u6709\u6548\u671F\u81F3\u534F\u8BAE\u7EC8\u6B62\u6216\u7528\u6237\u6CE8\u9500\u8D26\u53F7\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "7.2 \u5E73\u53F0\u6709\u6743\u6839\u636E\u4E1A\u52A1\u53D1\u5C55\u6216\u6CD5\u5F8B\u6CD5\u89C4\u53D8\u5316\u9002\u65F6\u4FEE\u8BA2\u672C\u534F\u8BAE\uFF0C\u4FEE\u8BA2\u7248\u672C\u5C06\u5728\u5E73\u53F0\u516C\u793A\u3002\u5982\u7528\u6237\u7EE7\u7EED\u4F7F\u7528\u670D\u52A1\uFF0C\u89C6\u4E3A\u540C\u610F\u4FEE\u8BA2\u540E\u7684\u534F\u8BAE\u3002"),
                          vue.createElementVNode("text", { class: "content-text" }, "7.3 \u672C\u534F\u8BAE\u7684\u89E3\u91CA\u6743\u5F52\u8FC5\u5BB6\u51FA\u884C\u5E73\u53F0\u6240\u6709\uFF0C\u5982\u6709\u4E89\u8BAE\uFF0C\u53CC\u65B9\u5E94\u53CB\u597D\u534F\u5546\u89E3\u51B3\uFF1B\u534F\u5546\u4E0D\u6210\u7684\uFF0C\u53EF\u5411\u5E73\u53F0\u6240\u5728\u5730\u6709\u7BA1\u8F96\u6743\u7684\u4EBA\u6C11\u6CD5\u9662\u63D0\u8D77\u8BC9\u8BBC\u3002")
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
            vue.createElementVNode("view", { class: "footer-btn" }, [
              vue.createElementVNode("button", { class: "confirm-btn" }, "\u60A8\u5DF2\u9605\u8BFB\u5E76\u540C\u610F")
            ])
          ])
        ]);
      };
    }
  };
  var PagesTermsAndRules = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-c5f4869a"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/termsAndRules.vue"]]);
  const _sfc_main$1 = {};
  function _sfc_render(_ctx, _cache) {
    const _component_uni_card = resolveEasycom(vue.resolveDynamicComponent("uni-card"), __easycom_0);
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_1$3);
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
  var PagesOpinion = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-645655ae"], ["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/pages/opinion.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/city", PagesCity);
  __definePage("pages/createOrder", PagesCreateOrder);
  __definePage("pages/orderDetail", PagesOrderDetail);
  __definePage("pages/pay", PagesPay);
  __definePage("pages/login", PagesLogin);
  __definePage("pages/account", PagesAccount);
  __definePage("pages/orderInfo", PagesOrderInfo);
  __definePage("pages/my", PagesMy);
  __definePage("pages/myInfo", PagesMyInfo);
  __definePage("pages/paymentSettings", PagesPaymentSettings);
  __definePage("pages/termsAndRules", PagesTermsAndRules);
  __definePage("pages/opinion", PagesOpinion);
  const _sfc_main = {
    __name: "App",
    setup(__props) {
      const $store = useStore();
      onLaunch(() => {
        formatAppLog("log", "at App.vue:9", "App Launch");
        getUserInfo();
      });
      const getUserInfo = async () => {
        const { error, result } = await ApiGetUserInfo();
        if (result != null && !result.hasOwnProperty("code")) {
          $store.commit("setUserInfo", result);
        }
      };
      return () => {
      };
    }
  };
  var App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "C:/zhuomian/\u684C\u9762/\u8FDC\u7A0B\u9879\u76EE/\u524D\u7AEF/passenger/src/App.vue"]]);
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
