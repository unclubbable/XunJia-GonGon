package com.xunjia.driverUser.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.xunjia.api.dto.DriverUserMoney;
import com.xunjia.api.result.Result;
import com.xunjia.driverUser.mapper.DriverUserMoneyMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.function.Predicate;

@Service
public class DriverUserMoneyService {

    /** 司机分成比例 80%，平台抽成 = 总额 − 司机收入，保证加总一致 */
    private static final BigDecimal DRIVER_RATIO = new BigDecimal("0.8");
    private static final int MONEY_SCALE = 2;

    @Autowired
    private DriverUserMoneyMapper driverUserMoneyMapper;

    public Result getMoneyByDriverIdYearMonth(Long driverId, Integer recentlyMonth) {
        QueryWrapper driverUserMoneyQueryWrapper = new QueryWrapper<DriverUserMoney>()
                .eq("driver_id", driverId);
        List list = driverUserMoneyMapper.selectList(driverUserMoneyQueryWrapper);
        long now = getTimestamp(0);
        long oneMonthAgo = getTimestamp(recentlyMonth);
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

    public Result addMoneyByDriverId(Long driverId, BigDecimal money) {
        if (driverId == null || money == null) {
            return Result.fail().message("司机ID和金额不能为空");
        }
        return adjustMoneyByDriverId(driverId, money);
    }

    /**
     * 退款回退司机当月收入（与入账同一 80/20 比例）。
     * amount 传正数表示扣减。
     */
    public Result deductMoneyByDriverId(Long driverId, BigDecimal amount) {
        if (driverId == null || amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return Result.fail().message("扣减金额必须大于0");
        }
        return adjustMoneyByDriverId(driverId, amount.negate());
    }

    private Result adjustMoneyByDriverId(Long driverId, BigDecimal money) {
        BigDecimal orderAmount = money.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal driverIncome = driverShare(orderAmount);
        BigDecimal platformCommission = platformShare(orderAmount, driverIncome);

        QueryWrapper<DriverUserMoney> driverUserMoneyQueryWrapper = new QueryWrapper<DriverUserMoney>()
                .eq("driver_id", driverId)
                .eq("year", LocalDate.now().getYear())
                .eq("month", LocalDate.now().getMonthValue());
        List<DriverUserMoney> list = driverUserMoneyMapper.selectList(driverUserMoneyQueryWrapper);
        if (list == null || list.isEmpty()) {
            DriverUserMoney driverUserMoney = new DriverUserMoney();
            driverUserMoney.setDriverId(driverId);
            driverUserMoney.setYear(Long.valueOf(LocalDate.now().getYear()));
            driverUserMoney.setMonth(Long.valueOf(LocalDate.now().getMonthValue()));
            driverUserMoney.setTotalOrderAmount(orderAmount);
            driverUserMoney.setDriverIncome(driverIncome);
            driverUserMoney.setPlatformCommission(platformCommission);
            driverUserMoney.setStatus(0L);
            driverUserMoneyMapper.insert(driverUserMoney);
        } else {
            DriverUserMoney driverUserMoney = list.get(0);
            driverUserMoney.setTotalOrderAmount(safeAdd(driverUserMoney.getTotalOrderAmount(), orderAmount));
            driverUserMoney.setDriverIncome(safeAdd(driverUserMoney.getDriverIncome(), driverIncome));
            driverUserMoney.setPlatformCommission(safeAdd(driverUserMoney.getPlatformCommission(), platformCommission));
            driverUserMoneyMapper.updateById(driverUserMoney);
        }
        return Result.ok();
    }

    private BigDecimal driverShare(BigDecimal orderAmount) {
        return orderAmount.multiply(DRIVER_RATIO).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    /** 平台抽成 = 总额 − 司机收入，避免 0.8 / 0.2 两边各自舍入导致对不上 */
    private BigDecimal platformShare(BigDecimal orderAmount, BigDecimal driverIncome) {
        return orderAmount.subtract(driverIncome);
    }

    private BigDecimal safeAdd(BigDecimal base, BigDecimal delta) {
        BigDecimal b = base == null ? BigDecimal.ZERO : base;
        return b.add(delta).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public Result getMoneyList() {
        return Result.ok(driverUserMoneyMapper.selectList(null));
    }

    public Result putMoneyByDriverId(DriverUserMoney driverUserMoney) {
        return Result.ok(driverUserMoneyMapper.updateById(driverUserMoney));
    }
}
