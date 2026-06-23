package com.taxi.driverUser.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.taxi.api.dto.DriverUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;


@Mapper
public interface DriverUserMapper extends BaseMapper<DriverUser> {
    public Integer selectDriverUserCountByCityCode(@Param("cityCode") String cityCode);
}
