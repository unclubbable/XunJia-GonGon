package com.taxi.passengerUser.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.taxi.common.config.AliOssProperties;
import com.taxi.common.util.Osspush;
import com.taxi.passengerUser.mapper.PassengerUserMapper;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.api.dto.PassengerUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;


@Service
public class UserService {
    @Autowired
    private Osspush osspush;
    @Resource
    private PassengerUserMapper passengerUserMapper;

    public Result loginOrResult(String passengerPhone) {
        //根据手机号查询用户信息
        QueryWrapper<PassengerUser> wrapper = new QueryWrapper<>();
        wrapper.eq("passenger_phone",passengerPhone);
        PassengerUser user= passengerUserMapper.selectOne(wrapper);

        //判断用户信息是否存在
        if(!ObjectUtils.isEmpty(user)){
            return Result.ok(user);
        }

        //如果不存在，插入用户信息
        PassengerUser psUser = new PassengerUser();
        psUser.setPassengerPhone(passengerPhone);
        psUser.setPassengerName("无忧用户");
        psUser.setState(0);
        psUser.setPassengerGender(0);
        passengerUserMapper.insert(psUser);
        return Result.ok(psUser);
    }

    public Result<PassengerUser> getPassengerInfoById(Long passengerId) {
        PassengerUser passengerUser = passengerUserMapper.selectById(passengerId);
        return Result.ok(passengerUser);
    }

    public Result getUserByPhone(String passengerPhone) {
        QueryWrapper<PassengerUser> wrapper = new QueryWrapper<>();
        wrapper.eq("passenger_phone",passengerPhone);
        PassengerUser user= passengerUserMapper.selectOne(wrapper);
        //判断用户信息是否存在
        if(ObjectUtils.isEmpty(user)){
            ResultCodeEnum loginAuth = ResultCodeEnum.USER_NOT_EXISTS;
            return Result.fail().code(loginAuth.getCode()).message(loginAuth.getMessage());
        }
        return Result.ok(user);
    }

    public Result getUserList(int page,int limit, String phone){
        Page<PassengerUser> pageObj = new Page<>(page, limit);

        // 创建LambdaQueryWrapper
        LambdaQueryWrapper<PassengerUser> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(PassengerUser::getState,0);

        // 如果phone不为空，添加到查询条件
        if (StringUtils.isNotEmpty(phone)) {
            queryWrapper.eq(PassengerUser::getPassengerPhone, phone);
        }

        IPage<PassengerUser> iPage = passengerUserMapper.selectPage(pageObj,queryWrapper);
        Map<String, Object> data = new HashMap<>();
        data.put("items", iPage.getRecords());
        data.put("total", iPage.getTotal());
        return Result.ok(data);
    }

    public Result updateUser(PassengerUser passengerUser) {
        try {
            passengerUserMapper.updateById(passengerUser);
        } catch (Exception e) {
            return Result.fail().message("更新用户信息失败");
        }
        return Result.ok();
    }

    public Result upload(MultipartFile file) {
        String url = null;
        try {
            url = osspush.push(file, "passemger");
        } catch (Exception e) {
            return Result.fail();
        }
        return Result.ok(url);
    }
}
