package com.taxi.passengerUser.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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
import java.util.regex.Pattern;


@Service
public class UserService {
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    @Autowired
    private Osspush osspush;
    @Resource
    private PassengerUserMapper passengerUserMapper;

    public Result loginOrResult(String passengerPhone) {
        if (StringUtils.isBlank(passengerPhone) || !PHONE_PATTERN.matcher(passengerPhone).matches()) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "手机号格式不正确");
        }
        QueryWrapper<PassengerUser> wrapper = new QueryWrapper<>();
        wrapper.eq("passenger_phone",passengerPhone);
        PassengerUser user= passengerUserMapper.selectOne(wrapper);

        if(!ObjectUtils.isEmpty(user)){
            return Result.ok(user);
        }

        PassengerUser psUser = new PassengerUser();
        psUser.setPassengerPhone(passengerPhone);
        psUser.setPassengerName("无忧用户");
        psUser.setState(0);
        psUser.setPassengerGender(0);
        passengerUserMapper.insert(psUser);
        return Result.ok(psUser);
    }

    public Result<PassengerUser> getPassengerInfoById(Long passengerId) {
        if (passengerId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "乘客ID不能为空");
        }
        PassengerUser passengerUser = passengerUserMapper.selectById(passengerId);
        if (passengerUser == null) {
            return Result.fail(ResultCodeEnum.USER_NOT_EXISTS);
        }
        return Result.ok(passengerUser);
    }

    public Result getUserByPhone(String passengerPhone) {
        if (StringUtils.isBlank(passengerPhone)) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "手机号不能为空");
        }
        QueryWrapper<PassengerUser> wrapper = new QueryWrapper<>();
        wrapper.eq("passenger_phone",passengerPhone);
        PassengerUser user= passengerUserMapper.selectOne(wrapper);
        if(ObjectUtils.isEmpty(user)){
            return Result.fail(ResultCodeEnum.USER_NOT_EXISTS);
        }
        return Result.ok(user);
    }

    public Result getUserList(int page,int limit, String phone){
        Page<PassengerUser> pageObj = new Page<>(page, limit);

        LambdaQueryWrapper<PassengerUser> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(PassengerUser::getState,0);

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
        if (passengerUser == null || passengerUser.getId() == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "用户ID不能为空");
        }
        PassengerUser existing = passengerUserMapper.selectById(passengerUser.getId());
        if (existing == null) {
            return Result.fail(ResultCodeEnum.USER_NOT_EXISTS);
        }
        try {
            passengerUserMapper.updateById(passengerUser);
        } catch (Exception e) {
            return Result.fail(ResultCodeEnum.UPDATE_USER_ERROR);
        }
        return Result.ok();
    }

    public Result upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "请选择要上传的文件");
        }
        try {
            String url = osspush.push(file, "passemger");
            return Result.ok(url);
        } catch (Exception e) {
            return Result.fail(ResultCodeEnum.UPLOAD_ERROR);
        }
    }
}
