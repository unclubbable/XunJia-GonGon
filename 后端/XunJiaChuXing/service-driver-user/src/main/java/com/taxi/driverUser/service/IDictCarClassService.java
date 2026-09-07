package com.taxi.driverUser.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.taxi.api.dto.DictCarClass;
import com.taxi.api.result.Result;

public interface IDictCarClassService extends IService<DictCarClass> {

    Result getList(int page, int limit);

    Result getAll();

    Result addOrUpdate(DictCarClass dictCarClass);

    Result removeByIdSafe(Long id);
}
