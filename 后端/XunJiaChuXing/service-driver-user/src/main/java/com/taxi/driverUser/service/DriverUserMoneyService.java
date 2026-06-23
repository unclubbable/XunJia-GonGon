package com.taxi.driverUser.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.api.dto.DriverUserMoney;
import com.taxi.api.result.Result;
import com.taxi.driverUser.mapper.DriverUserMoneyMapper;
import org.bouncycastle.asn1.dvcs.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class DriverUserMoneyService {
    @Autowired
    private DriverUserMoneyMapper driverUserMoneyMapper;

    public Result getMoneyByDriverIdYearMonth(Long driverId, Integer recentlyMonth) {
        //获取用户全部订单金额
        QueryWrapper driverUserMoneyQueryWrapper = new QueryWrapper<DriverUserMoney>()
                .eq("driver_id",driverId);
        List list = driverUserMoneyMapper.selectList(driverUserMoneyQueryWrapper);
        // 当前时间戳
        long now = getTimestamp(0);
        // 前几个月时间戳
        long oneMonthAgo = getTimestamp(recentlyMonth);
        //筛选时间段
        List<DriverUserMoney> collect = list.stream().filter(new Predicate<DriverUserMoney>() {
            @Override
            public boolean test(DriverUserMoney driverUserMoney) {
                long timestamp = getTimestampByYearMonth(Math.toIntExact(driverUserMoney.getYear()), Math.toIntExact(driverUserMoney.getMonth()));
                return timestamp >= oneMonthAgo && timestamp <= now;
            }
        }).sorted(new Comparator<DriverUserMoney>() {
            @Override
            public int compare(DriverUserMoney o1, DriverUserMoney o2) {
                long timestamp1 = getTimestampByYearMonth(Math.toIntExact(o1.getYear()), Math.toIntExact(o1.getMonth()));
                long timestamp2 = getTimestampByYearMonth(Math.toIntExact(o2.getYear()), Math.toIntExact(o2.getMonth()));
                return Long.compare(timestamp1, timestamp2);
            }
        }).toList();

        return Result.ok(collect);
    }
    /**
     * 根据 年、月 获取对应月份1日 00:00:00 的时间戳（毫秒）
     */
    public static long getTimestampByYearMonth(int year, int month) {
        return LocalDate.of(year, month, 1)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
    }
    /**
     * 获取指定月数前的时间戳（毫秒）
     * @param monthsAgo 几个月前，0=当前时间
     */
    public static long getTimestamp(int monthsAgo) {
        return ZonedDateTime.now(ZoneId.systemDefault())
                .minusMonths(monthsAgo)
                .toInstant()
                .toEpochMilli();
    }

    public Result addMoneyByDriverId(Long driverId, Double money) {
        //获取用户当月订单金额
        QueryWrapper driverUserMoneyQueryWrapper = new QueryWrapper<DriverUserMoney>()
                .eq("driver_id",driverId)
                .eq("year", LocalDate.now().getYear())
                .eq("month", LocalDate.now().getMonthValue());
        List<DriverUserMoney> list = driverUserMoneyMapper.selectList(driverUserMoneyQueryWrapper);
        // 判断用户当月订单有无
        if (list.size()<=0){
            //当月订单无
            DriverUserMoney driverUserMoney = new DriverUserMoney();
            driverUserMoney.setDriverId(driverId);
            driverUserMoney.setYear(Long.valueOf(LocalDate.now().getYear()));
            driverUserMoney.setMonth(Long.valueOf(LocalDate.now().getMonthValue()));
            driverUserMoney.setTotalOrderAmount(Double.valueOf(money));
            driverUserMoney.setDriverIncome(money*0.8);
            driverUserMoney.setPlatformCommission(money-money*0.8);
            driverUserMoney.setStatus(0L);
            driverUserMoneyMapper.insert(driverUserMoney);
        }
        else{
            //当月订单有
            DriverUserMoney driverUserMoney = list.get(0);
            driverUserMoney.setTotalOrderAmount(driverUserMoney.getTotalOrderAmount()+money);
            driverUserMoney.setDriverIncome(driverUserMoney.getDriverIncome()+money*0.8);
            driverUserMoney.setPlatformCommission(driverUserMoney.getPlatformCommission()+money-money*0.8);
            driverUserMoneyMapper.updateById(driverUserMoney);
        }
        return Result.ok();
    }

    public Result getMoneyList() {
        return Result.ok(driverUserMoneyMapper.selectList(null));
    }

    public Result putMoneyByDriverId(DriverUserMoney driverUserMoney) {
        return Result.ok(driverUserMoneyMapper.updateById(driverUserMoney));
    }
}
