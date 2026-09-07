package com.taxi.driverUser.service.impl;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.extern.slf4j.Slf4j;
import com.taxi.api.Client.ServiceMapClient;
import com.taxi.api.Client.ServicePriceClient;
import com.taxi.api.dto.Car;
import com.taxi.api.dto.DicDistrict;
import com.taxi.api.dto.DictCarClass;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.common.constant.DriverCarConstants;
import com.taxi.common.util.UserContext;
import com.taxi.driverUser.mapper.CarMapper;
import com.taxi.driverUser.mapper.DictCarClassMapper;
import com.taxi.driverUser.mapper.DriverCarBindingRelationshipMapper;
import com.taxi.driverUser.service.DriverUserService;
import com.taxi.driverUser.service.IDriverCarBindingRelationshipService;
import com.taxi.driverUser.service.ITicketHelperService;
import com.taxi.driverUser.vo.BindableCarVO;
import com.taxi.driverUser.vo.OperableCitiesResponse;
import com.taxi.driverUser.vo.OperableCityVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TicketHelperServiceImpl implements ITicketHelperService {

    @Autowired
    private DriverUserService driverUserService;
    @Autowired
    private IDriverCarBindingRelationshipService driverCarBindingRelationshipService;
    @Autowired
    private ServicePriceClient servicePriceClient;
    @Autowired
    private ServiceMapClient serviceMapClient;
    @Autowired
    private CarMapper carMapper;
    @Autowired
    private DriverCarBindingRelationshipMapper bindingMapper;
    @Autowired
    private DictCarClassMapper dictCarClassMapper;

    @Override
    public Result listOperableCities() {
        DriverContext ctx = requireDriverContext();
        if (ctx.error != null) {
            return ctx.error;
        }
        List<String> cityCodes = resolveCityCodesByVehicleType(ctx.vehicleType);
        Map<String, String> nameMap = loadDistrictNameMap();
        Map<String, String> typeNameMap = loadVehicleTypeNameMap();
        String currentCity = normalizeCode(ctx.driver.getAddress());

        List<OperableCityVO> items = new ArrayList<>();
        for (String code : cityCodes) {
            OperableCityVO vo = new OperableCityVO();
            vo.setCityCode(code);
            vo.setCityName(nameMap.getOrDefault(code, code));
            boolean isCurrent = StringUtils.hasText(currentCity) && currentCity.equals(code);
            vo.setCurrent(isCurrent);
            vo.setSwitchable(!isCurrent);
            items.add(vo);
        }

        OperableCitiesResponse response = new OperableCitiesResponse();
        response.setVehicleType(ctx.vehicleType);
        response.setVehicleTypeName(typeNameMap.getOrDefault(ctx.vehicleType, ctx.vehicleType));
        response.setCurrentCityCode(currentCity);
        response.setCities(items);
        log.info("可运营城市查询 phone={} vehicleType={} currentCity={} cities={}",
                ctx.driver.getDriverPhone(), ctx.vehicleType, currentCity, cityCodes);
        return Result.ok(response);
    }

    /**
     * 从计价表获取「支持指定车型」的城市编码（去重）。
     * 优先专用接口，失败时回退到 /price-rule/list 解析。
     */
    private List<String> resolveCityCodesByVehicleType(String vehicleType) {
        String type = normalizeCode(vehicleType);
        if (!StringUtils.hasText(type)) {
            return new ArrayList<>();
        }
        try {
            Result result = servicePriceClient.listCitiesByVehicleType(type);
            if (result != null && result.isOk()) {
                List<String> parsed = parseCityCodeList(result.getData());
                if (!parsed.isEmpty()) {
                    return parsed;
                }
            }
        } catch (Exception e) {
            log.warn("调用 price-rule/cities-by-vehicle-type 失败 vehicleType={}", type, e);
        }
        return resolveCityCodesFromRuleListFallback(type);
    }

    private List<String> resolveCityCodesFromRuleListFallback(String vehicleType) {
        try {
            Result result = servicePriceClient.getRulesList(1, 500, null);
            if (result == null || !result.isOk() || result.getData() == null) {
                return new ArrayList<>();
            }
            JSONObject data = JSONUtil.parseObj(result.getData());
            JSONArray items = data.getJSONArray("items");
            if (items == null || items.isEmpty()) {
                return new ArrayList<>();
            }
            Set<String> cityCodes = new HashSet<>();
            for (Object itemObj : items) {
                JSONObject item = JSONUtil.parseObj(itemObj);
                String cityCode = normalizeCode(item.getStr("cityCode"));
                JSONArray rules = item.getJSONArray("rules");
                if (!StringUtils.hasText(cityCode) || rules == null) {
                    continue;
                }
                for (Object ruleObj : rules) {
                    JSONObject rule = JSONUtil.parseObj(ruleObj);
                    if (vehicleType.equals(normalizeCode(rule.getStr("vehicleType")))) {
                        cityCodes.add(cityCode);
                        break;
                    }
                }
            }
            return cityCodes.stream().sorted().collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("回退解析 price-rule/list 失败 vehicleType={}", vehicleType, e);
            return new ArrayList<>();
        }
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.trim();
    }

    private List<String> parseCityCodeList(Object data) {
        if (data == null) {
            return new ArrayList<>();
        }
        if (!(data instanceof List)) {
            return new ArrayList<>();
        }
        List<?> list = (List<?>) data;
        return list.stream()
                .map(item -> item == null ? null : String.valueOf(item).trim())
                .filter(StringUtils::hasText)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public Result listBindableCars() {
        DriverContext ctx = requireDriverContext();
        if (ctx.error != null) {
            return ctx.error;
        }
        String cityCode = ctx.driver.getAddress();
        if (!StringUtils.hasText(cityCode)) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "请先设置运营城市");
        }
        Result typesResult = servicePriceClient.listVehicleTypesByCity(normalizeCode(cityCode));
        List<String> allowedTypeList = parseCityCodeList(typesResult == null ? null : typesResult.getData());
        if (allowedTypeList.isEmpty()) {
            return Result.ok(new ArrayList<>());
        }
        Set<String> allowedTypes = new HashSet<>(allowedTypeList);
        Set<Long> boundCarIds = bindingMapper.selectList(new QueryWrapper<DriverCarBindingRelationship>()
                        .eq("bind_state", DriverCarConstants.DRIVER_CAR_BIND))
                .stream()
                .map(DriverCarBindingRelationship::getCarId)
                .collect(Collectors.toSet());

        LambdaQueryWrapper<Car> carWrapper = new LambdaQueryWrapper<>();
        carWrapper.eq(Car::getAddress, cityCode);
        carWrapper.eq(Car::getState, DriverCarConstants.DRIVER_STATE_VALID);
        carWrapper.in(Car::getVehicleType, allowedTypes);
        if (!boundCarIds.isEmpty()) {
            carWrapper.notIn(Car::getId, boundCarIds);
        }
        carWrapper.orderByAsc(Car::getVehicleNo);
        List<Car> cars = carMapper.selectList(carWrapper);

        Map<String, String> typeNameMap = loadVehicleTypeNameMap();
        List<BindableCarVO> items = new ArrayList<>();
        for (Car car : cars) {
            BindableCarVO vo = new BindableCarVO();
            vo.setId(car.getId());
            vo.setVehicleNo(car.getVehicleNo());
            vo.setVehicleType(car.getVehicleType());
            vo.setVehicleTypeName(typeNameMap.getOrDefault(car.getVehicleType(), car.getVehicleType()));
            vo.setBrand(car.getBrand());
            vo.setModel(car.getModel());
            items.add(vo);
        }
        return Result.ok(items);
    }

    private DriverContext requireDriverContext() {
        DriverContext ctx = new DriverContext();
        String phone = UserContext.getUser().getPhone();
        DriverUser driver = driverUserService.getDriverByPhone(phone);
        if (driver == null) {
            ctx.error = Result.fail(ResultCodeEnum.DRIVER_NOT_EXITST);
            return ctx;
        }
        ctx.driver = driver;
        Result<DriverCarBindingRelationship> bindingResult =
                driverCarBindingRelationshipService.getDriverCarRelationShipByDriverPhone(phone);
        if (bindingResult == null || !bindingResult.isOk() || bindingResult.getData() == null) {
            ctx.error = Result.fail(ResultCodeEnum.PARAM_ERROR, "请先绑定运营车辆后再提交此类工单");
            return ctx;
        }
        Car car = carMapper.selectById(bindingResult.getData().getCarId());
        if (car == null || !StringUtils.hasText(car.getVehicleType())) {
            ctx.error = Result.fail(ResultCodeEnum.CAR_NOT_EXISTS, "绑定车辆信息异常");
            return ctx;
        }
        ctx.vehicleType = car.getVehicleType().trim();
        ctx.boundCarId = car.getId();
        return ctx;
    }

    private Map<String, String> loadDistrictNameMap() {
        Map<String, String> map = new HashMap<>();
        try {
            Result districtResult = serviceMapClient.getDistrictInfo();
            if (districtResult != null && districtResult.isOk() && districtResult.getData() instanceof List) {
                List<?> list = (List<?>) districtResult.getData();
                for (Object item : list) {
                    if (item instanceof DicDistrict) {
                        DicDistrict d = (DicDistrict) item;
                        if (StringUtils.hasText(d.getAddressCode())) {
                            map.put(d.getAddressCode(), d.getAddressName());
                        }
                    } else if (item instanceof Map) {
                        Map<?, ?> row = (Map<?, ?>) item;
                        Object code = row.get("addressCode");
                        Object name = row.get("addressName");
                        if (code != null && StringUtils.hasText(String.valueOf(code))) {
                            map.put(String.valueOf(code), name == null ? String.valueOf(code) : String.valueOf(name));
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // 名称仅用于展示，失败时回退 cityCode
        }
        return map;
    }

    private Map<String, String> loadVehicleTypeNameMap() {
        List<DictCarClass> list = dictCarClassMapper.selectList(new LambdaQueryWrapper<DictCarClass>()
                .eq(DictCarClass::getState, 0));
        Map<String, String> map = new HashMap<>();
        for (DictCarClass item : list) {
            if (StringUtils.hasText(item.getClassCode())) {
                map.put(item.getClassCode(), item.getClassName());
            }
        }
        return map;
    }

    private static class DriverContext {
        private DriverUser driver;
        private String vehicleType;
        private Long boundCarId;
        private Result error;
    }
}
