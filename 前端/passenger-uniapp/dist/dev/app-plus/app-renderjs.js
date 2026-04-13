var __renderjsModules={};

__renderjsModules["31c7d03c"] = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/@amap/amap-jsapi-loader/dist/index.js
  var require_dist = __commonJS({
    "node_modules/@amap/amap-jsapi-loader/dist/index.js"(exports, module) {
      "use strict";
      (function(m, p) {
        "object" === typeof exports && "undefined" !== typeof module ? module.exports = p() : "function" === typeof define && define.amd ? define(p) : (m = m || self, m.AMapLoader = p());
      })(exports, function() {
        function m(a) {
          var b2 = [];
          a.AMapUI && b2.push(p(a.AMapUI));
          a.Loca && b2.push(r(a.Loca));
          return Promise.all(b2);
        }
        function p(a) {
          return new Promise(function(h, c) {
            var f = [];
            if (a.plugins)
              for (var e = 0; e < a.plugins.length; e += 1)
                -1 == d.AMapUI.plugins.indexOf(a.plugins[e]) && f.push(a.plugins[e]);
            if (g.AMapUI === b.failed)
              c("\u524D\u6B21\u8BF7\u6C42 AMapUI \u5931\u8D25");
            else if (g.AMapUI === b.notload) {
              g.AMapUI = b.loading;
              d.AMapUI.version = a.version || d.AMapUI.version;
              e = d.AMapUI.version;
              var l = document.body || document.head, k = document.createElement("script");
              k.type = "text/javascript";
              k.src = "https://webapi.amap.com/ui/" + e + "/main.js";
              k.onerror = function(a2) {
                g.AMapUI = b.failed;
                c("\u8BF7\u6C42 AMapUI \u5931\u8D25");
              };
              k.onload = function() {
                g.AMapUI = b.loaded;
                if (f.length)
                  window.AMapUI.loadUI(f, function() {
                    for (var a2 = 0, b2 = f.length; a2 < b2; a2++) {
                      var c2 = f[a2].split("/").slice(-1)[0];
                      window.AMapUI[c2] = arguments[a2];
                    }
                    for (h(); n.AMapUI.length; )
                      n.AMapUI.splice(0, 1)[0]();
                  });
                else
                  for (h(); n.AMapUI.length; )
                    n.AMapUI.splice(0, 1)[0]();
              };
              l.appendChild(k);
            } else
              g.AMapUI === b.loaded ? a.version && a.version !== d.AMapUI.version ? c("\u4E0D\u5141\u8BB8\u591A\u4E2A\u7248\u672C AMapUI \u6DF7\u7528") : f.length ? window.AMapUI.loadUI(f, function() {
                for (var a2 = 0, b2 = f.length; a2 < b2; a2++) {
                  var c2 = f[a2].split("/").slice(-1)[0];
                  window.AMapUI[c2] = arguments[a2];
                }
                h();
              }) : h() : a.version && a.version !== d.AMapUI.version ? c("\u4E0D\u5141\u8BB8\u591A\u4E2A\u7248\u672C AMapUI \u6DF7\u7528") : n.AMapUI.push(function(a2) {
                a2 ? c(a2) : f.length ? window.AMapUI.loadUI(f, function() {
                  for (var a3 = 0, b2 = f.length; a3 < b2; a3++) {
                    var c2 = f[a3].split("/").slice(-1)[0];
                    window.AMapUI[c2] = arguments[a3];
                  }
                  h();
                }) : h();
              });
          });
        }
        function r(a) {
          return new Promise(function(h, c) {
            if (g.Loca === b.failed)
              c("\u524D\u6B21\u8BF7\u6C42 Loca \u5931\u8D25");
            else if (g.Loca === b.notload) {
              g.Loca = b.loading;
              d.Loca.version = a.version || d.Loca.version;
              var f = d.Loca.version, e = d.AMap.version.startsWith("2"), l = f.startsWith("2");
              if (e && !l || !e && l)
                c("JSAPI \u4E0E Loca \u7248\u672C\u4E0D\u5BF9\u5E94\uFF01\uFF01");
              else {
                e = d.key;
                l = document.body || document.head;
                var k = document.createElement("script");
                k.type = "text/javascript";
                k.src = "https://webapi.amap.com/loca?v=" + f + "&key=" + e;
                k.onerror = function(a2) {
                  g.Loca = b.failed;
                  c("\u8BF7\u6C42 AMapUI \u5931\u8D25");
                };
                k.onload = function() {
                  g.Loca = b.loaded;
                  for (h(); n.Loca.length; )
                    n.Loca.splice(0, 1)[0]();
                };
                l.appendChild(k);
              }
            } else
              g.Loca === b.loaded ? a.version && a.version !== d.Loca.version ? c("\u4E0D\u5141\u8BB8\u591A\u4E2A\u7248\u672C Loca \u6DF7\u7528") : h() : a.version && a.version !== d.Loca.version ? c("\u4E0D\u5141\u8BB8\u591A\u4E2A\u7248\u672C Loca \u6DF7\u7528") : n.Loca.push(function(a2) {
                a2 ? c(a2) : c();
              });
          });
        }
        if (!window)
          throw Error("AMap JSAPI can only be used in Browser.");
        var b;
        (function(a) {
          a.notload = "notload";
          a.loading = "loading";
          a.loaded = "loaded";
          a.failed = "failed";
        })(b || (b = {}));
        var d = { key: "", AMap: { version: "1.4.15", plugins: [] }, AMapUI: { version: "1.1", plugins: [] }, Loca: { version: "1.3.2" } }, g = { AMap: b.notload, AMapUI: b.notload, Loca: b.notload }, n = { AMap: [], AMapUI: [], Loca: [] }, q = [], t = function(a) {
          "function" == typeof a && (g.AMap === b.loaded ? a(window.AMap) : q.push(a));
        };
        return { load: function(a) {
          return new Promise(function(h, c) {
            if (g.AMap == b.failed)
              c("");
            else if (g.AMap == b.notload) {
              var f = a.key, e = a.version, l = a.plugins;
              f ? (window.AMap && "lbs.amap.com" !== location.host && c("\u7981\u6B62\u591A\u79CDAPI\u52A0\u8F7D\u65B9\u5F0F\u6DF7\u7528"), d.key = f, d.AMap.version = e || d.AMap.version, d.AMap.plugins = l || d.AMap.plugins, g.AMap = b.loading, e = document.body || document.head, window.___onAPILoaded = function(d2) {
                delete window.___onAPILoaded;
                if (d2)
                  g.AMap = b.failed, c(d2);
                else
                  for (g.AMap = b.loaded, m(a).then(function() {
                    h(window.AMap);
                  })["catch"](c); q.length; )
                    q.splice(0, 1)[0]();
              }, l = document.createElement("script"), l.type = "text/javascript", l.src = "https://webapi.amap.com/maps?callback=___onAPILoaded&v=" + d.AMap.version + "&key=" + f + "&plugin=" + d.AMap.plugins.join(","), l.onerror = function(a2) {
                g.AMap = b.failed;
                c(a2);
              }, e.appendChild(l)) : c("\u8BF7\u586B\u5199key");
            } else if (g.AMap == b.loaded)
              if (a.key && a.key !== d.key)
                c("\u591A\u4E2A\u4E0D\u4E00\u81F4\u7684 key");
              else if (a.version && a.version !== d.AMap.version)
                c("\u4E0D\u5141\u8BB8\u591A\u4E2A\u7248\u672C JSAPI \u6DF7\u7528");
              else {
                f = [];
                if (a.plugins)
                  for (e = 0; e < a.plugins.length; e += 1)
                    -1 == d.AMap.plugins.indexOf(a.plugins[e]) && f.push(a.plugins[e]);
                if (f.length)
                  window.AMap.plugin(f, function() {
                    m(a).then(function() {
                      h(window.AMap);
                    })["catch"](c);
                  });
                else
                  m(a).then(function() {
                    h(window.AMap);
                  })["catch"](c);
              }
            else if (a.key && a.key !== d.key)
              c("\u591A\u4E2A\u4E0D\u4E00\u81F4\u7684 key");
            else if (a.version && a.version !== d.AMap.version)
              c("\u4E0D\u5141\u8BB8\u591A\u4E2A\u7248\u672C JSAPI \u6DF7\u7528");
            else {
              var k = [];
              if (a.plugins)
                for (e = 0; e < a.plugins.length; e += 1)
                  -1 == d.AMap.plugins.indexOf(a.plugins[e]) && k.push(a.plugins[e]);
              t(function() {
                if (k.length)
                  window.AMap.plugin(k, function() {
                    m(a).then(function() {
                      h(window.AMap);
                    })["catch"](c);
                  });
                else
                  m(a).then(function() {
                    h(window.AMap);
                  })["catch"](c);
              });
            }
          });
        }, reset: function() {
          delete window.AMap;
          delete window.AMapUI;
          delete window.Loca;
          d = { key: "", AMap: { version: "1.4.15", plugins: [] }, AMapUI: { version: "1.1", plugins: [] }, Loca: { version: "1.3.2" } };
          g = {
            AMap: b.notload,
            AMapUI: b.notload,
            Loca: b.notload
          };
          n = { AMap: [], AMapUI: [], Loca: [] };
        } };
      });
    }
  });

  // <stdin>
  var stdin_exports = {};
  __export(stdin_exports, {
    default: () => stdin_default
  });
  var import_amap_jsapi_loader = __toESM(require_dist());

  // src/config/gdMapConf.js
  var gdMapConf_default = {
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

  // <stdin>
  window._AMapSecurityConfig = {
    securityJsCode: gdMapConf_default.securityJsCode
  };
  window.speed = 1;
  var AMap = null;
  var map = null;
  var driving = null;
  var driverMarker = null;
  var currentLocationMarker = null;
  var currentLocationCircle = null;
  var stdin_default = {
    data() {
      return {};
    },
    mounted() {
      import_amap_jsapi_loader.default.load({
        "key": gdMapConf_default.key,
        "version": "2.0",
        "plugins": ["AMap.Driving", "AMap.PlaceSearch", "AMap.AutoComplete", "AMap.Geolocation", "AMap.MoveAnimation"],
        "AMapUI": {
          "version": "1.1",
          "plugins": ["overlay/SimpleMarker"]
        },
        "Loca": {
          "version": "2.0"
        }
      }).then((Amap) => {
        AMap = Amap;
        map = new AMap.Map("map-container", {
          resizeEnable: true,
          zoom: 13
        });
      }).catch((e) => {
        __f__("error", "at component/BMap.vue:90", e);
      });
    },
    methods: {
      receiveEvent(newParams, oldValue, ownerVm, vm) {
        let { name, args } = newParams || {};
        switch (name) {
          case "setLocation":
            this.setInitLocation(args[0]);
            break;
          case "search":
            this.mapSearch(newParams.city, ...args);
            break;
          case "driving":
            this.mapDriving(...args);
            break;
          case "markerDepDestPosition":
            this.mapMarkerDepDestPosition(...args);
            break;
          case "driverUpdatePosition":
            this.mapDriverUpdatePosition(...args);
            break;
          case "clearDriving":
            this.mapClearDriving(...args);
            break;
          case "updateLocationMarker":
            this.updateLocationMarker(...args);
            break;
        }
      },
      getLocation(defaultLng, defaultLat) {
        if (AMap === void 0 || AMap === null || map === void 0 || map === null) {
          setTimeout(() => {
            this.getLocation(defaultLng, defaultLat);
          }, 500);
          return false;
        } else {
          AMap.plugin(["AMap.Geolocation"], function() {
            var geolocation = new AMap.Geolocation({
              enableHighAccuracy: true,
              timeout: 1e4,
              maximumAge: 0,
              convert: true,
              showButton: true,
              buttonPosition: "RT",
              buttonOffset: new AMap.Pixel(10, 20),
              showMarker: true,
              showCircle: true,
              panToLocation: true,
              zoomToAccuracy: true,
              useNative: true,
              extensions: "all"
            });
            map.addControl(geolocation);
            geolocation.getCurrentPosition(function(status, result) {
              if (status == "complete") {
                onComplete(result);
              } else {
                onError(result);
              }
            });
            function onComplete(data) {
              __f__("log", "at component/BMap.vue:161", JSON.stringify(data));
              const lnglat = [data.position.getLng(), data.position.getLat()];
              map.setCenter(lnglat);
            }
            function onError(data) {
              __f__("log", "at component/BMap.vue:167", "\u5B9A\u4F4D\u5931\u8D25");
              map.setCenter([defaultLng, defaultLat]);
            }
          });
        }
      },
      setInitLocation(location2) {
        if (map === null || map === void 0) {
          setTimeout(() => {
            this.setInitLocation(location2);
          }, 500);
          return false;
        }
        if (currentLocationMarker) {
          map.remove(currentLocationMarker);
          currentLocationMarker = null;
        }
        if (currentLocationCircle) {
          map.remove(currentLocationCircle);
          currentLocationCircle = null;
        }
        if (location2.locationRes) {
          const marker = new AMap.Marker({
            position: location2.center,
            icon: new AMap.Icon({
              image: "https://a.amap.com/jsapi/static/image/plugin/point.png",
              size: new AMap.Size(20, 20),
              imageSize: new AMap.Size(20, 20)
            }),
            offset: new AMap.Pixel(-10, -10)
          });
          const circle = new AMap.Circle({
            center: location2.center,
            radius: location2.accuracy,
            strokeColor: "#0055ff",
            strokeWeight: 1,
            strokeOpacity: 0.5,
            fillColor: "#1791fc",
            fillOpacity: 0.2
          });
          marker.setMap(map);
          circle.setMap(map);
          currentLocationMarker = marker;
          currentLocationCircle = circle;
          map.setFitView([marker, circle]);
        } else {
          map.setZoom(13);
          map.setCenter(location2.center);
        }
      },
      updateLocationMarker(location2) {
        if (!map) {
          setTimeout(() => {
            this.updateLocationMarker(location2);
          }, 500);
          return;
        }
        if (currentLocationMarker) {
          map.remove(currentLocationMarker);
          currentLocationMarker = null;
        }
        if (currentLocationCircle) {
          map.remove(currentLocationCircle);
          currentLocationCircle = null;
        }
        if (location2 && location2.center && location2.center.length === 2) {
          const marker = new AMap.Marker({
            position: location2.center,
            icon: new AMap.Icon({
              image: "https://a.amap.com/jsapi/static/image/plugin/point.png",
              size: new AMap.Size(20, 20),
              imageSize: new AMap.Size(20, 20)
            }),
            offset: new AMap.Pixel(-10, -10)
          });
          marker.setMap(map);
          currentLocationMarker = marker;
          if (location2.accuracy && typeof location2.accuracy === "number") {
            const circle = new AMap.Circle({
              center: location2.center,
              radius: location2.accuracy,
              strokeColor: "#0055ff",
              strokeWeight: 1,
              strokeOpacity: 0.5,
              fillColor: "#1791fc",
              fillOpacity: 0.2
            });
            circle.setMap(map);
            currentLocationCircle = circle;
          }
        }
      },
      mapSearch(city, str, cb) {
        AMap.plugin(["AMap.PlaceSearch"], () => {
          var placeSearch = new AMap.PlaceSearch({
            pageSize: 5,
            pageIndex: 1,
            city: city.cityCode || city.citycode,
            citylimit: true
          });
          placeSearch.search(str, (status, result) => {
            if (result.info === "OK") {
              this.$ownerInstance.callMethod("searchResult", result.poiList);
            }
          });
        });
      },
      mapClearDriving() {
        if (driving) {
          driving.clear();
        }
      },
      mapDriving(startLngLat, endLngLat, driverLon = null, driverLat = null) {
        if (!AMap || !map) {
          setTimeout(() => {
            this.mapDriving(startLngLat, endLngLat, driverLon, driverLat);
          }, 500);
          return false;
        }
        if (driving) {
          driving.clear();
        } else {
          driving = new AMap.Driving({ map });
        }
        driving.search(new AMap.LngLat(...startLngLat), new AMap.LngLat(...endLngLat));
        if (driverLon == null || driverLat == null) {
          return;
        }
        if (driverMarker) {
          map.remove(driverMarker);
        }
        driverMarker = new AMap.Marker({
          map,
          position: [driverLon, driverLat],
          icon: new AMap.Icon({
            image: "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png",
            size: new AMap.Size(15, 30),
            imageSize: new AMap.Size(15, 30)
          }),
          offset: new AMap.Pixel(-7.5, -15),
          autoRotation: true
        });
      },
      mapDriverUpdatePosition(newDriverLon, newDriverLat) {
        if (driverMarker) {
          driverMarker.moveTo([newDriverLon, newDriverLat], {
            duration: 5e3,
            delay: 0,
            autoRotation: true
          });
        } else {
          driverMarker = new AMap.Marker({
            map,
            position: [newDriverLon, newDriverLat],
            icon: new AMap.Icon({
              image: "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png",
              size: new AMap.Size(15, 30),
              imageSize: new AMap.Size(15, 30)
            }),
            offset: new AMap.Pixel(-7.5, -15),
            autoRotation: true
          });
        }
        map.setZoom(18);
        map.setCenter([newDriverLon, newDriverLat]);
      },
      mapMarkerDepDestPosition(dep, dest) {
        if (!AMap || !map) {
          setTimeout(() => {
            this.mapMarkerDepDestPosition(dep, dest);
          }, 500);
          return false;
        }
        const depMarker = new AMap.Marker({
          map,
          position: dep,
          icon: new AMap.Icon({
            image: "https://a.amap.com/jsapi/static/image/plugin/marker/start.png",
            size: new AMap.Size(25, 30),
            imageSize: new AMap.Size(25, 30)
          }),
          offset: new AMap.Pixel(-12.5, -15)
        });
        const destMarker = new AMap.Marker({
          map,
          position: dest,
          icon: new AMap.Icon({
            image: "https://a.amap.com/jsapi/static/image/plugin/marker/end.png",
            size: new AMap.Size(25, 30),
            imageSize: new AMap.Size(25, 30)
          }),
          offset: new AMap.Pixel(-12.5, -15)
        });
        map.setFitView([depMarker, destMarker]);
      }
    }
  };
  return __toCommonJS(stdin_exports);
})();
