package com.taxi.driverUser.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.taxi.api.dto.Car;
import com.taxi.api.dto.DictCarClass;
import com.taxi.api.result.Result;
import com.taxi.driverUser.mapper.CarMapper;
import com.taxi.driverUser.mapper.DictCarClassMapper;
import com.taxi.driverUser.service.IDictCarClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DictCarClassServiceImpl extends ServiceImpl<DictCarClassMapper, DictCarClass>
        implements IDictCarClassService {

    @Autowired
    private CarMapper carMapper;

    @Override
    public Result getList(int page, int limit) {
        Page<DictCarClass> pageObj = new Page<>(page, limit);
        LambdaQueryWrapper<DictCarClass> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(DictCarClass::getSortOrder).orderByAsc(DictCarClass::getId);
        Page<DictCarClass> result = baseMapper.selectPage(pageObj, wrapper);
        Map<String, Object> data = new HashMap<>();
        data.put("items", result.getRecords());
        data.put("total", result.getTotal());
        return Result.ok(data);
    }

    @Override
    public Result getAll() {
        LambdaQueryWrapper<DictCarClass> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DictCarClass::getState, 0)
                .orderByAsc(DictCarClass::getSortOrder)
                .orderByAsc(DictCarClass::getId);
        List<DictCarClass> list = baseMapper.selectList(wrapper);
        return Result.ok(list);
    }

    @Override
    public Result addOrUpdate(DictCarClass dictCarClass) {
        if (dictCarClass == null
                || StringUtils.isBlank(dictCarClass.getClassCode())
                || StringUtils.isBlank(dictCarClass.getClassName())) {
            return Result.fail().message("类型编码和名称不能为空");
        }
        String classCode = dictCarClass.getClassCode().trim();
        dictCarClass.setClassCode(classCode);
        dictCarClass.setClassName(dictCarClass.getClassName().trim());
        if (dictCarClass.getSortOrder() == null) {
            dictCarClass.setSortOrder(0);
        }
        if (dictCarClass.getState() == null) {
            dictCarClass.setState(0);
        }

        if (dictCarClass.getId() != null) {
            DictCarClass existing = baseMapper.selectById(dictCarClass.getId());
            if (existing == null) {
                return Result.fail().message("车辆类型不存在，无法更新");
            }
            // 编码不允许修改，避免已落库车辆/计价规则失效
            dictCarClass.setClassCode(existing.getClassCode());
            baseMapper.updateById(dictCarClass);
            return Result.ok();
        }

        Long count = baseMapper.selectCount(new LambdaQueryWrapper<DictCarClass>()
                .eq(DictCarClass::getClassCode, classCode));
        if (count != null && count > 0) {
            return Result.fail().message("类型编码已存在");
        }
        baseMapper.insert(dictCarClass);
        return Result.ok();
    }

    @Override
    public Result removeByIdSafe(Long id) {
        DictCarClass existing = baseMapper.selectById(id);
        if (existing == null) {
            return Result.fail().message("车辆类型不存在");
        }
        Long used = carMapper.selectCount(new LambdaQueryWrapper<Car>()
                .eq(Car::getVehicleType, existing.getClassCode()));
        if (used != null && used > 0) {
            return Result.fail().message(
                    "车辆类型「" + existing.getClassName() + "」已被 " + used
                            + " 辆车引用，无法删除。可改为「失效」，或先调整相关车辆的类型后再删");
        }
        baseMapper.deleteById(id);
        return Result.ok();
    }
}
