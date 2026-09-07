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
        if (driverId == null || money == null) {
            return Result.fail().message("司机ID和金额不能为空");
        }
        return adjustMoneyByDriverId(driverId, money);
    }

    /**
     * 退款回退司机当月收入（与入账同一 80/20 比例）。
     * amount 传正数表示扣减。
     */
    public Result deductMoneyByDriverId(Long driverId, Double amount) {
        if (driverId == null || amount == null || amount <= 0) {
            return Result.fail().message("扣减金额必须大于0");
        }
        return adjustMoneyByDriverId(driverId, -amount);
    }

    private Result adjustMoneyByDriverId(Long driverId, Double money) {
        QueryWrapper<DriverUserMoney> driverUserMoneyQueryWrapper = new QueryWrapper<DriverUserMoney>()
                .eq("driver_id", driverId)
                .eq("year", LocalDate.now().getYear())
                .eq("month", LocalDate.now().getMonthValue());
        List<DriverUserMoney> list = driverUserMoneyMapper.selectList(driverUserMoneyQueryWrapper);
        if (list == null || list.isEmpty()) {
            if (money < 0) {
                // 当月无账本时仍落一笔负向记录，保证可追溯
                DriverUserMoney driverUserMoney = new DriverUserMoney();
                driverUserMoney.setDriverId(driverId);
                driverUserMoney.setYear(Long.valueOf(LocalDate.now().getYear()));
                driverUserMoney.setMonth(Long.valueOf(LocalDate.now().getMonthValue()));
                driverUserMoney.setTotalOrderAmount(money);
                driverUserMoney.setDriverIncome(money * 0.8);
                driverUserMoney.setPlatformCommission(money - money * 0.8);
                driverUserMoney.setStatus(0L);
                driverUserMoneyMapper.insert(driverUserMoney);
                return Result.ok();
            }
            DriverUserMoney driverUserMoney = new DriverUserMoney();
            driverUserMoney.setDriverId(driverId);
            driverUserMoney.setYear(Long.valueOf(LocalDate.now().getYear()));
            driverUserMoney.setMonth(Long.valueOf(LocalDate.now().getMonthValue()));
            driverUserMoney.setTotalOrderAmount(money);
            driverUserMoney.setDriverIncome(money * 0.8);
            driverUserMoney.setPlatformCommission(money - money * 0.8);
            driverUserMoney.setStatus(0L);
            driverUserMoneyMapper.insert(driverUserMoney);
        } else {
            DriverUserMoney driverUserMoney = list.get(0);
            driverUserMoney.setTotalOrderAmount(safeAdd(driverUserMoney.getTotalOrderAmount(), money));
            driverUserMoney.setDriverIncome(safeAdd(driverUserMoney.getDriverIncome(), money * 0.8));
            driverUserMoney.setPlatformCommission(safeAdd(driverUserMoney.getPlatformCommission(), money - money * 0.8));
            driverUserMoneyMapper.updateById(driverUserMoney);
        }
        return Result.ok();
    }

    private double safeAdd(Double base, double delta) {
        double b = base == null ? 0D : base;
        return b + delta;
    }

    public Result getMoneyList() {
        return Result.ok(driverUserMoneyMapper.selectList(null));
    }

    public Result putMoneyByDriverId(DriverUserMoney driverUserMoney) {
        return Result.ok(driverUserMoneyMapper.updateById(driverUserMoney));
    }
}
