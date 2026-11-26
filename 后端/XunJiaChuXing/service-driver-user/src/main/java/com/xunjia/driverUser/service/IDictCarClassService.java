package com.xunjia.driverUser.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.xunjia.api.dto.DictCarClass;
import com.xunjia.api.result.Result;

public interface IDictCarClassService extends IService<DictCarClass> {

    Result getList(int page, int limit);

    Result getAll();

    Result addOrUpdate(DictCarClass dictCarClass);

    Result removeByIdSafe(Long id);
}
