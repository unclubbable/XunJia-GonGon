package com.taxi.ticket.service;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.taxi.api.Client.ServiceAiClient;
import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServiceOrderClient;
import com.taxi.api.Client.ServicePassengerUserClient;
import com.taxi.api.Client.ServicePriceClient;
import com.taxi.api.constant.TicketConstants;
import com.taxi.api.dto.Car;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.dto.OrderInfo;
import com.taxi.api.dto.OrderRefund;
import com.taxi.api.dto.PassengerUser;
import com.taxi.api.dto.Ticket;
import com.taxi.api.dto.TicketMessage;
import com.taxi.api.exception.BusinessException;
import com.taxi.api.request.AlipayRefundRequest;
import com.taxi.api.request.TicketAiAssistRequest;
import com.taxi.api.request.TicketAiChatRequest;
import com.taxi.api.request.TicketCreateRequest;
import com.taxi.api.request.TicketMessageRequest;
import com.taxi.api.request.TicketProcessRequest;
import com.taxi.api.request.TicketRefundCreateRequest;
import com.taxi.api.request.TicketRefundExecuteRequest;
import com.taxi.api.request.TicketRefundRejectRequest;
import com.taxi.api.response.AlipayRefundResponse;
import com.taxi.api.response.TicketAiAssistVO;
import com.taxi.api.response.TicketAiChatVO;
import com.taxi.api.response.TicketDetailVO;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.common.ThreadLoad.TokenResult;
import com.taxi.common.constant.DriverCarConstants;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.OrderConstants;
import com.taxi.common.util.UserContext;
import com.taxi.ticket.mapper.OrderRefundMapper;
import com.taxi.ticket.mapper.TicketMapper;
import com.taxi.ticket.mapper.TicketMessageMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
public class TicketService {

    @Autowired
    private TicketMapper ticketMapper;
    @Autowired
    private TicketMessageMapper ticketMessageMapper;
    @Autowired
    private OrderRefundMapper orderRefundMapper;
    @Autowired
    private ServiceOrderClient serviceOrderClient;
    @Autowired
    private ServicePassengerUserClient servicePassengerUserClient;
    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;
    @Autowired
    private ServicePriceClient servicePriceClient;
    @Autowired
    private ServiceAiClient serviceAiClient;

    @Transactional(rollbackFor = Exception.class)
    public Result<Ticket> create(TicketCreateRequest request) {
        TokenResult user = requireLoginUser();
        int source = resolveSource(user.getIdentity());
        String category = request.getCategory().trim().toUpperCase();
        validateCategory(source, category);

        if (TicketConstants.ORDER_REQUIRED_CATEGORIES.contains(category) && request.getOrderId() == null) {
            throw new BusinessException(ResultCodeEnum.TICKET_ORDER_REQUIRED);
        }

        Ticket ticket = new Ticket();
        ticket.setSource(source);
        ticket.setCategory(category);
        ticket.setContent(request.getContent().trim());
        ticket.setPriority(request.getPriority() == null ? 2 : request.getPriority());
        ticket.setStatus(TicketConstants.STATUS_OPEN);
        ticket.setVersion(0);
        ticket.setOrderId(request.getOrderId());
        ticket.setRequestPayload(normalizePayload(request.getRequestPayload()));

        String title = StringUtils.hasText(request.getTitle())
                ? request.getTitle().trim()
                : TicketConstants.CATEGORY_TITLE.getOrDefault(category, "工单反馈");
        ticket.setTitle(title);

        if (source == TicketConstants.SOURCE_PASSENGER) {
            fillPassenger(ticket, user.getPhone());
        } else {
            fillDriver(ticket, user.getPhone());
            validateDriverPayload(category, ticket.getRequestPayload(), ticket);
        }

        if (request.getOrderId() != null) {
            validateOrderOwnership(request.getOrderId(), source, ticket);
            assertNoActiveDuplicate(source, category, request.getOrderId(),
                    ticket.getPassengerId(), ticket.getDriverId());
        } else {
            assertNoActiveDuplicate(source, category, null,
                    ticket.getPassengerId(), ticket.getDriverId());
        }

        // 先占位单号，插入后再按 id 生成正式单号
        ticket.setTicketNo("TMP" + System.currentTimeMillis());
        ticketMapper.insert(ticket);
        String ticketNo = buildBizNo("T", ticket.getId());
        ticket.setTicketNo(ticketNo);
        ticketMapper.updateById(ticket);

        insertSystemMessage(ticket.getId(), "工单已创建，等待受理。单号：" + ticketNo);
        log.info("工单创建成功 ticketId={} ticketNo={} source={} category={}",
                ticket.getId(), ticketNo, source, category);
        return Result.ok(ticketMapper.selectById(ticket.getId()));
    }

    public Result<Map<String, Object>> myList(int page, int limit, String status) {
        TokenResult user = requireLoginUser();
        int source = resolveSource(user.getIdentity());
        LambdaQueryWrapper<Ticket> qw = new LambdaQueryWrapper<>();
        qw.eq(Ticket::getSource, source);
        if (source == TicketConstants.SOURCE_PASSENGER) {
            qw.eq(Ticket::getPassengerPhone, user.getPhone());
        } else {
            qw.eq(Ticket::getDriverPhone, user.getPhone());
        }
        if (StringUtils.hasText(status)) {
            qw.eq(Ticket::getStatus, status.trim());
        }
        qw.orderByDesc(Ticket::getGmtCreate);
        return pageTickets(page, limit, qw);
    }

    public Result<Map<String, Object>> adminList(int page, int limit, Integer source, String category,
                                                 String status, String phone, Long orderId) {
        LambdaQueryWrapper<Ticket> qw = new LambdaQueryWrapper<>();
        if (source != null) {
            qw.eq(Ticket::getSource, source);
        }
        if (StringUtils.hasText(category)) {
            qw.eq(Ticket::getCategory, category.trim().toUpperCase());
        }
        if (StringUtils.hasText(status)) {
            qw.eq(Ticket::getStatus, status.trim());
        }
        if (orderId != null) {
            qw.eq(Ticket::getOrderId, orderId);
        }
        if (StringUtils.hasText(phone)) {
            String p = phone.trim();
            qw.and(w -> w.like(Ticket::getPassengerPhone, p).or().like(Ticket::getDriverPhone, p));
        }
        qw.orderByDesc(Ticket::getGmtCreate);
        return pageTickets(page, limit, qw);
    }

    public Result<TicketDetailVO> detail(Long ticketId, boolean adminView) {
        Ticket ticket = requireTicket(ticketId);
        if (!adminView) {
            assertOwner(ticket);
        }
        return Result.ok(buildDetail(ticket));
    }

    @Transactional(rollbackFor = Exception.class)
    public Result cancel(Long ticketId) {
        Ticket ticket = requireTicket(ticketId);
        assertOwner(ticket);
        if (!TicketConstants.STATUS_OPEN.equals(ticket.getStatus())) {
            throw new BusinessException(ResultCodeEnum.TICKET_STATUS_ERROR, "仅待受理工单可撤销");
        }
        ticket.setStatus(TicketConstants.STATUS_CANCELLED);
        updateTicketOptimistic(ticket);
        insertSystemMessage(ticketId, "用户已撤销工单");
        return Result.ok();
    }

    @Transactional(rollbackFor = Exception.class)
    public Result appendMessage(TicketMessageRequest request) {
        Ticket ticket = requireTicket(request.getTicketId());
        assertOwner(ticket);
        if (!TicketConstants.ACTIVE_STATUSES.contains(ticket.getStatus())) {
            throw new BusinessException(ResultCodeEnum.TICKET_STATUS_ERROR, "工单已结束，无法补充说明");
        }
        TokenResult user = requireLoginUser();
        int senderType = resolveSource(user.getIdentity());
        insertUserMessage(ticket.getId(), senderType, null, user.getPhone(), request.getContent().trim());
        if (TicketConstants.STATUS_PENDING_USER.equals(ticket.getStatus())) {
            ticket.setStatus(TicketConstants.STATUS_IN_PROGRESS);
            updateTicketOptimistic(ticket);
        }
        return Result.ok();
    }

    @Transactional(rollbackFor = Exception.class)
    public Result accept(TicketProcessRequest request) {
        Ticket ticket = requireTicket(request.getTicketId());
        if (!TicketConstants.STATUS_OPEN.equals(ticket.getStatus())) {
            throw new BusinessException(ResultCodeEnum.TICKET_STATUS_ERROR, "仅待受理工单可领取");
        }
        applyVersion(ticket, request.getVersion());
        ticket.setStatus(TicketConstants.STATUS_IN_PROGRESS);
        ticket.setAssigneeId(request.getAssigneeId());
        ticket.setAssigneeName(request.getAssigneeName());
        updateTicketOptimistic(ticket);
        String name = StringUtils.hasText(request.getAssigneeName()) ? request.getAssigneeName() : "运营";
        insertSystemMessage(ticket.getId(), "工单已由 " + name + " 受理");
        return Result.ok(ticketMapper.selectById(ticket.getId()));
    }

    @Transactional(rollbackFor = Exception.class)
    public Result reply(TicketMessageRequest request) {
        Ticket ticket = requireTicket(request.getTicketId());
        if (!TicketConstants.ACTIVE_STATUSES.contains(ticket.getStatus())
                && !TicketConstants.STATUS_OPEN.equals(ticket.getStatus())) {
            throw new BusinessException(ResultCodeEnum.TICKET_STATUS_ERROR);
        }
        if (TicketConstants.STATUS_OPEN.equals(ticket.getStatus())) {
            ticket.setStatus(TicketConstants.STATUS_IN_PROGRESS);
            if (request.getAssigneeId() != null) {
                ticket.setAssigneeId(request.getAssigneeId());
            }
            if (StringUtils.hasText(request.getAssigneeName())) {
                ticket.setAssigneeName(request.getAssigneeName());
            }
            updateTicketOptimistic(ticket);
        }
        String source = StringUtils.hasText(request.getContentSource())
                ? request.getContentSource() : TicketConstants.CONTENT_SOURCE_HUMAN;
        TicketMessage msg = new TicketMessage();
        msg.setTicketId(ticket.getId());
        msg.setSenderType(TicketConstants.SENDER_ADMIN);
        msg.setSenderId(request.getAssigneeId() == null ? null : request.getAssigneeId().longValue());
        msg.setSenderName(StringUtils.hasText(request.getAssigneeName()) ? request.getAssigneeName() : "运营");
        msg.setContent(request.getContent().trim());
        msg.setMsgType(TicketConstants.MSG_TEXT);
        msg.setContentSource(source);
        ticketMessageMapper.insert(msg);

        if (Boolean.TRUE.equals(request.getWaitUser())
                && TicketConstants.STATUS_IN_PROGRESS.equals(ticket.getStatus())) {
            Ticket latest = requireTicket(ticket.getId());
            latest.setStatus(TicketConstants.STATUS_PENDING_USER);
            updateTicketOptimistic(latest);
        }
        return Result.ok();
    }

    @Transactional(rollbackFor = Exception.class)
    public Result resolve(TicketProcessRequest request) {
        Ticket ticket = requireTicket(request.getTicketId());
        assertProcessable(ticket);
        applyVersion(ticket, request.getVersion());
        ticket.setStatus(TicketConstants.STATUS_RESOLVED);
        ticket.setResultSummary(request.getResultSummary());
        fillAssigneeIfPresent(ticket, request);
        updateTicketOptimistic(ticket);
        insertSystemMessage(ticket.getId(), "工单已解决"
                + (StringUtils.hasText(request.getResultSummary()) ? "：" + request.getResultSummary() : ""));
        return Result.ok(ticketMapper.selectById(ticket.getId()));
    }

    @Transactional(rollbackFor = Exception.class)
    public Result reject(TicketProcessRequest request) {
        Ticket ticket = requireTicket(request.getTicketId());
        assertProcessable(ticket);
        if (!StringUtils.hasText(request.getRejectReason())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "驳回原因不能为空");
        }
        applyVersion(ticket, request.getVersion());
        ticket.setStatus(TicketConstants.STATUS_REJECTED);
        ticket.setRejectReason(request.getRejectReason().trim());
        fillAssigneeIfPresent(ticket, request);
        updateTicketOptimistic(ticket);
        insertSystemMessage(ticket.getId(), "工单已驳回：" + request.getRejectReason().trim());
        return Result.ok(ticketMapper.selectById(ticket.getId()));
    }

    /** 通过并执行；失败直接返回，不做分布式回滚 */
    @Transactional(rollbackFor = Exception.class)
    public Result approveAndExecute(TicketProcessRequest request) {
        Ticket ticket = requireTicket(request.getTicketId());
        assertProcessable(ticket);
        String category = ticket.getCategory();
        if (!TicketConstants.EXECUTABLE_DRIVER_CATEGORIES.contains(category)) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "该工单类型不支持通过并执行");
        }
        if (ticket.getSource() != TicketConstants.SOURCE_DRIVER || ticket.getDriverId() == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "非司机资料变更工单");
        }
        applyVersion(ticket, request.getVersion());
        if (TicketConstants.CAT_BIND_VEHICLE.equals(category)) {
            executeDriverBindVehicle(ticket);
        } else {
            executeDriverChange(ticket);
        }
        ticket.setStatus(TicketConstants.STATUS_RESOLVED);
        ticket.setResultSummary(StringUtils.hasText(request.getResultSummary())
                ? request.getResultSummary() : "申请已通过并执行");
        fillAssigneeIfPresent(ticket, request);
        updateTicketOptimistic(ticket);
        insertSystemMessage(ticket.getId(), "申请已通过并执行：" + ticket.getResultSummary());
        return Result.ok(ticketMapper.selectById(ticket.getId()));
    }

    @Transactional(rollbackFor = Exception.class)
    public Result createRefund(TicketRefundCreateRequest request) {
        Ticket ticket = requireTicket(request.getTicketId());
        if (ticket.getOrderId() == null) {
            throw new BusinessException(ResultCodeEnum.TICKET_ORDER_REQUIRED, "退款必须关联订单工单");
        }
        if (TicketConstants.STATUS_CANCELLED.equals(ticket.getStatus())
                || TicketConstants.STATUS_REJECTED.equals(ticket.getStatus())) {
            throw new BusinessException(ResultCodeEnum.TICKET_STATUS_ERROR, "当前工单状态不可退款");
        }

        Long openCount = orderRefundMapper.selectCount(new LambdaQueryWrapper<OrderRefund>()
                .eq(OrderRefund::getOrderId, ticket.getOrderId())
                .in(OrderRefund::getStatus, TicketConstants.REFUND_OPEN_STATUSES));
        if (openCount != null && openCount > 0) {
            throw new BusinessException(ResultCodeEnum.TICKET_REFUND_EXISTS);
        }

        Result<OrderInfo> orderResult = serviceOrderClient.detail(ticket.getOrderId());
        if (orderResult == null || !orderResult.isOk() || orderResult.getData() == null) {
            throw new BusinessException(ResultCodeEnum.ORDER_NOT_EXISTS);
        }
        OrderInfo order = orderResult.getData();
        if (!Objects.equals(order.getOrderStatus(), OrderConstants.SUCCESS_PAY)) {
            throw new BusinessException(ResultCodeEnum.TICKET_REFUND_ORDER_STATUS_ERROR);
        }

        BigDecimal orderPrice = order.getPrice() == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(order.getPrice()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal amount = request.getRefundAmount().setScale(2, RoundingMode.HALF_UP);
        if (amount.compareTo(BigDecimal.ZERO) <= 0 || amount.compareTo(orderPrice) > 0) {
            throw new BusinessException(ResultCodeEnum.TICKET_REFUND_AMOUNT_ERROR);
        }

        // 登记后待执行
        OrderRefund refund = new OrderRefund();
        refund.setTicketId(ticket.getId());
        refund.setOrderId(order.getId());
        refund.setPayOrderId(order.getPayOrderId());
        refund.setPassengerId(order.getPassengerId());
        refund.setPassengerPhone(order.getPassengerPhone());
        refund.setDriverId(order.getDriverId());
        refund.setOrderPrice(orderPrice);
        refund.setRefundAmount(amount);
        refund.setReasonCode(StringUtils.hasText(request.getReasonCode()) ? request.getReasonCode() : ticket.getCategory());
        refund.setReasonText(request.getReasonText());
        refund.setRemark(request.getRemark());
        refund.setOperatorId(request.getOperatorId());
        refund.setOperatorName(request.getOperatorName());
        // 登记后待执行（approveDirectly 字段已废弃，忽略）
        refund.setStatus(TicketConstants.REFUND_PENDING);
        refund.setDriverSettled(0);
        refund.setRefundNo("TMP" + System.currentTimeMillis());
        orderRefundMapper.insert(refund);
        refund.setRefundNo(buildBizNo("R", refund.getId()));
        orderRefundMapper.updateById(refund);

        ticket.setRefundId(refund.getId());
        updateTicketOptimistic(ticket);
        insertSystemMessage(ticket.getId(), "已登记退款单 " + refund.getRefundNo()
                + "，金额 ¥" + amount + "，待在退款页执行");

        syncOrderRefundStatus(order, amount, orderPrice, refund.getStatus());
        return Result.ok(orderRefundMapper.selectById(refund.getId()));
    }

    /** 退款：支付宝成功后先落库再扣司机账，防止回滚丢状态 */
    public Result executeRefund(TicketRefundExecuteRequest request) {
        OrderRefund refund = requireRefund(request.getRefundId());
        if (TicketConstants.REFUND_REFUNDED.equals(refund.getStatus())
                && (refund.getDriverSettled() == null || refund.getDriverSettled() == 0)) {
            settleDriverIncome(refund);
            orderRefundMapper.updateById(refund);
            insertSystemMessage(refund.getTicketId(), "退款单 " + refund.getRefundNo() + " 已补扣司机收入");
            return Result.ok(orderRefundMapper.selectById(refund.getId()));
        }
        if (TicketConstants.REFUND_REFUNDED.equals(refund.getStatus())) {
            return Result.ok(refund);
        }
        if (!TicketConstants.REFUND_EXECUTABLE_STATUSES.contains(refund.getStatus())) {
            throw new BusinessException(ResultCodeEnum.TICKET_STATUS_ERROR,
                    "当前退款单状态不可执行：" + refund.getStatus());
        }

        String channel = request.getChannel() == null ? "" : request.getChannel().trim().toUpperCase();
        if (!TicketConstants.REFUND_CHANNEL_MANUAL.equals(channel)
                && !TicketConstants.REFUND_CHANNEL_ALIPAY.equals(channel)) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "退款渠道仅支持 MANUAL / ALIPAY");
        }

        if (StringUtils.hasText(request.getRemark())) {
            refund.setRemark(request.getRemark().trim());
        }
        if (request.getOperatorId() != null) {
            refund.setOperatorId(request.getOperatorId());
        }
        if (StringUtils.hasText(request.getOperatorName())) {
            refund.setOperatorName(request.getOperatorName().trim());
        }

        Result<OrderInfo> orderResult = serviceOrderClient.detail(refund.getOrderId());
        if (orderResult == null || !orderResult.isOk() || orderResult.getData() == null) {
            throw new BusinessException(ResultCodeEnum.ORDER_NOT_EXISTS);
        }
        OrderInfo order = orderResult.getData();

        if (TicketConstants.REFUND_CHANNEL_MANUAL.equals(channel)) {
            refund.setRefundChannel(TicketConstants.REFUND_CHANNEL_MANUAL);
            if (StringUtils.hasText(request.getVoucherNo())) {
                refund.setVoucherNo(request.getVoucherNo().trim());
            }
            markRefunded(refund, order, null);
            insertSystemMessage(refund.getTicketId(), "退款单 " + refund.getRefundNo()
                    + " 已手动确认退款 ¥" + refund.getRefundAmount()
                    + (StringUtils.hasText(refund.getVoucherNo()) ? "，凭证 " + refund.getVoucherNo() : ""));
            return Result.ok(orderRefundMapper.selectById(refund.getId()));
        }

        if (!StringUtils.hasText(refund.getPayOrderId())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "订单无支付宝交易号，请改用手动退款");
        }
        refund.setRefundChannel(TicketConstants.REFUND_CHANNEL_ALIPAY);
        refund.setStatus(TicketConstants.REFUND_REFUNDING);
        orderRefundMapper.updateById(refund);
        syncOrderRefundStatus(order, refund.getRefundAmount(), refund.getOrderPrice(), TicketConstants.REFUND_REFUNDING);

        AlipayRefundRequest alipayReq = new AlipayRefundRequest();
        alipayReq.setTradeNo(refund.getPayOrderId());
        alipayReq.setOutRequestNo(refund.getRefundNo());
        alipayReq.setRefundAmount(refund.getRefundAmount().setScale(2, RoundingMode.HALF_UP).toPlainString());
        alipayReq.setRefundReason(StringUtils.hasText(refund.getReasonText())
                ? refund.getReasonText() : "工单退款");

        Result<AlipayRefundResponse> alipayResult;
        try {
            alipayResult = serviceOrderClient.alipayRefund(alipayReq);
        } catch (Exception e) {
            log.error("调用支付宝退款异常 refundId={}", refund.getId(), e);
            refund.setStatus(TicketConstants.REFUND_FAILED);
            orderRefundMapper.updateById(refund);
            syncOrderRefundStatus(order, refund.getRefundAmount(), refund.getOrderPrice(), TicketConstants.REFUND_FAILED);
            insertSystemMessage(refund.getTicketId(), "支付宝退款调用异常：" + e.getMessage());
            throw new BusinessException(ResultCodeEnum.TICKET_EXECUTE_CHANGE_ERROR, "支付宝退款调用异常");
        }

        AlipayRefundResponse alipayData = alipayResult == null ? null : alipayResult.getData();
        boolean ok = alipayResult != null && alipayResult.isOk()
                && alipayData != null && Boolean.TRUE.equals(alipayData.getSuccess());
        if (!ok) {
            String msg = alipayData != null && StringUtils.hasText(alipayData.getMessage())
                    ? alipayData.getMessage()
                    : (alipayResult == null ? "支付服务无响应" : alipayResult.getMessage());
            refund.setStatus(TicketConstants.REFUND_FAILED);
            orderRefundMapper.updateById(refund);
            syncOrderRefundStatus(order, refund.getRefundAmount(), refund.getOrderPrice(), TicketConstants.REFUND_FAILED);
            insertSystemMessage(refund.getTicketId(), "支付宝退款失败：" + msg);
            throw new BusinessException(ResultCodeEnum.TICKET_EXECUTE_CHANGE_ERROR, "支付宝退款失败：" + msg);
        }

        String alipayNo = StringUtils.hasText(alipayData.getTradeNo())
                ? alipayData.getTradeNo() : refund.getPayOrderId();
        markRefunded(refund, order, alipayNo);
        insertSystemMessage(refund.getTicketId(), "退款单 " + refund.getRefundNo()
                + " 支付宝退款成功 ¥" + refund.getRefundAmount());
        return Result.ok(orderRefundMapper.selectById(refund.getId()));
    }

    @Transactional(rollbackFor = Exception.class)
    public Result rejectRefund(TicketRefundRejectRequest request) {
        OrderRefund refund = requireRefund(request.getRefundId());
        if (!TicketConstants.REFUND_REJECTABLE_STATUSES.contains(refund.getStatus())) {
            throw new BusinessException(ResultCodeEnum.TICKET_STATUS_ERROR,
                    "当前退款单状态不可驳回：" + refund.getStatus());
        }
        refund.setStatus(TicketConstants.REFUND_REJECTED);
        if (request.getOperatorId() != null) {
            refund.setOperatorId(request.getOperatorId());
        }
        if (StringUtils.hasText(request.getOperatorName())) {
            refund.setOperatorName(request.getOperatorName().trim());
        }
        String reason = request.getReason().trim();
        refund.setRemark(StringUtils.hasText(refund.getRemark())
                ? refund.getRemark() + " | 驳回：" + reason
                : "驳回：" + reason);
        orderRefundMapper.updateById(refund);

        Result<OrderInfo> orderResult = serviceOrderClient.detail(refund.getOrderId());
        if (orderResult != null && orderResult.isOk() && orderResult.getData() != null) {
            syncOrderRefundStatus(orderResult.getData(), refund.getRefundAmount(),
                    refund.getOrderPrice(), TicketConstants.REFUND_REJECTED);
        }
        insertSystemMessage(refund.getTicketId(), "退款单 " + refund.getRefundNo() + " 已驳回：" + reason);
        return Result.ok(orderRefundMapper.selectById(refund.getId()));
    }

    public Result<Map<String, Object>> refundList(int page, int limit, String status, Long orderId) {
        Page<OrderRefund> pageObj = new Page<>(page, limit);
        LambdaQueryWrapper<OrderRefund> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) {
            qw.eq(OrderRefund::getStatus, status.trim());
        }
        if (orderId != null) {
            qw.eq(OrderRefund::getOrderId, orderId);
        }
        qw.orderByDesc(OrderRefund::getGmtCreate);
        IPage<OrderRefund> iPage = orderRefundMapper.selectPage(pageObj, qw);
        Map<String, Object> data = new HashMap<>();
        data.put("items", iPage.getRecords());
        data.put("total", iPage.getTotal());
        return Result.ok(data);
    }

    public Result<OrderRefund> refundDetail(Long refundId) {
        return Result.ok(requireRefund(refundId));
    }

    /** 走 service-ai → Python */
    public Result<TicketAiAssistVO> aiAssist(TicketAiAssistRequest request) {
        if (request == null || request.getTicketId() == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "ticketId 不能为空");
        }
        requireTicket(request.getTicketId());
        try {
            return serviceAiClient.ticketAssist(request);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("aiAssist feign failed: {}", ex.getMessage());
            throw new BusinessException(ResultCodeEnum.AI_AGENT_UNAVAILABLE, "AI服务调用失败，请确认 service-ai / Python 已启动");
        }
    }

    public Result<TicketAiChatVO> aiChat(TicketAiChatRequest request) {
        if (request == null || !StringUtils.hasText(request.getQuestion())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "question 不能为空");
        }
        if (request.getTicketId() != null) {
            requireTicket(request.getTicketId());
        }
        try {
            return serviceAiClient.ticketChat(request);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("aiChat feign failed: {}", ex.getMessage());
            throw new BusinessException(ResultCodeEnum.AI_AGENT_UNAVAILABLE, "AI问答调用失败，请确认 service-ai / Python 已启动");
        }
    }

    /** AI 草稿回写 */
    @Transactional(rollbackFor = Exception.class)
    public Result saveAiDraft(Long ticketId, String aiSummary, String aiSuggestionJson) {
        Ticket ticket = requireTicket(ticketId);
        if (StringUtils.hasText(aiSummary)) {
            ticket.setAiSummary(aiSummary.trim());
        }
        if (StringUtils.hasText(aiSuggestionJson)) {
            ticket.setAiSuggestionJson(aiSuggestionJson.trim());
        }
        ticket.setGmtModified(new Date());
        ticketMapper.updateById(ticket);
        return Result.ok();
    }

    // ----------------- helpers -----------------

    private Result<Map<String, Object>> pageTickets(int page, int limit, LambdaQueryWrapper<Ticket> qw) {
        Page<Ticket> pageObj = new Page<>(Math.max(page, 1), Math.max(limit, 1));
        IPage<Ticket> iPage = ticketMapper.selectPage(pageObj, qw);
        Map<String, Object> data = new HashMap<>();
        data.put("items", iPage.getRecords());
        data.put("total", iPage.getTotal());
        return Result.ok(data);
    }

    private TicketDetailVO buildDetail(Ticket ticket) {
        TicketDetailVO vo = new TicketDetailVO();
        vo.setTicket(ticket);
        List<TicketMessage> messages = ticketMessageMapper.selectList(new LambdaQueryWrapper<TicketMessage>()
                .eq(TicketMessage::getTicketId, ticket.getId())
                .orderByAsc(TicketMessage::getId));
        vo.setMessages(messages);
        if (ticket.getRefundId() != null) {
            vo.setRefund(orderRefundMapper.selectById(ticket.getRefundId()));
        }
        return vo;
    }

    private void fillPassenger(Ticket ticket, String phone) {
        Result<PassengerUser> result = servicePassengerUserClient.getUserByPhone(phone);
        if (result == null || !result.isOk() || result.getData() == null) {
            throw new BusinessException(ResultCodeEnum.USER_NOT_EXISTS, "乘客信息不存在");
        }
        PassengerUser passenger = result.getData();
        ticket.setPassengerId(passenger.getId());
        ticket.setPassengerPhone(passenger.getPassengerPhone());
    }

    private void fillDriver(Ticket ticket, String phone) {
        Result listResult = serviceDriverUserClient.getDriverUserList(1, 1, null, phone, null);
        if (listResult == null || !listResult.isOk() || listResult.getData() == null) {
            throw new BusinessException(ResultCodeEnum.DRIVER_NOT_EXITST);
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) listResult.getData();
        Object items = data.get("items");
        if (!(items instanceof List) || ((List<?>) items).isEmpty()) {
            throw new BusinessException(ResultCodeEnum.DRIVER_NOT_EXITST);
        }
        Object first = ((List<?>) items).get(0);
        DriverUser driverUser = JSONUtil.toBean(JSONUtil.parseObj(first), DriverUser.class);
        if (driverUser.getId() == null) {
            throw new BusinessException(ResultCodeEnum.DRIVER_NOT_EXITST);
        }
        ticket.setDriverId(driverUser.getId());
        ticket.setDriverPhone(StringUtils.hasText(driverUser.getDriverPhone()) ? driverUser.getDriverPhone() : phone);
    }

    private void validateOrderOwnership(Long orderId, int source, Ticket ticket) {
        Result<OrderInfo> orderResult = serviceOrderClient.detail(orderId);
        if (orderResult == null || !orderResult.isOk() || orderResult.getData() == null) {
            throw new BusinessException(ResultCodeEnum.ORDER_NOT_EXISTS);
        }
        OrderInfo order = orderResult.getData();
        if (source == TicketConstants.SOURCE_PASSENGER) {
            if (!Objects.equals(order.getPassengerPhone(), ticket.getPassengerPhone())
                    && !Objects.equals(order.getPassengerId(), ticket.getPassengerId())) {
                throw new BusinessException(ResultCodeEnum.TICKET_ORDER_MISMATCH);
            }
        } else {
            if (!Objects.equals(order.getDriverPhone(), ticket.getDriverPhone())
                    && !Objects.equals(order.getDriverId(), ticket.getDriverId())) {
                throw new BusinessException(ResultCodeEnum.TICKET_ORDER_MISMATCH);
            }
        }
    }

    private void assertNoActiveDuplicate(int source, String category, Long orderId,
                                         Long passengerId, Long driverId) {
        LambdaQueryWrapper<Ticket> qw = new LambdaQueryWrapper<>();
        qw.eq(Ticket::getSource, source)
                .eq(Ticket::getCategory, category)
                .in(Ticket::getStatus, TicketConstants.ACTIVE_STATUSES);
        if (orderId != null) {
            qw.eq(Ticket::getOrderId, orderId);
        } else if (source == TicketConstants.SOURCE_PASSENGER) {
            qw.eq(Ticket::getPassengerId, passengerId).isNull(Ticket::getOrderId);
        } else {
            qw.eq(Ticket::getDriverId, driverId).isNull(Ticket::getOrderId);
        }
        Long count = ticketMapper.selectCount(qw);
        if (count != null && count > 0) {
            throw new BusinessException(ResultCodeEnum.TICKET_DUPLICATE);
        }
    }

    private void validateCategory(int source, String category) {
        boolean ok = source == TicketConstants.SOURCE_PASSENGER
                ? TicketConstants.PASSENGER_CATEGORIES.contains(category)
                : TicketConstants.DRIVER_CATEGORIES.contains(category);
        if (!ok) {
            throw new BusinessException(ResultCodeEnum.TICKET_CATEGORY_INVALID);
        }
    }

    private void validateDriverPayload(String category, String payload, Ticket ticket) {
        if (TicketConstants.CAT_CHANGE_CITY.equals(category)) {
            JSONObject obj = parsePayload(payload);
            String target = obj.getStr("targetAddress");
            if (!StringUtils.hasText(target)) {
                throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "改城市须提供 targetAddress");
            }
            String vehicleType = requireBoundVehicleType(ticket.getDriverId());
            Result<Boolean> exists = servicePriceClient.ifPriceExists(target.trim(), vehicleType);
            if (exists == null || !exists.isOk() || !Boolean.TRUE.equals(exists.getData())) {
                throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED,
                        "目标城市未配置当前绑定车型的计价规则，无法切换");
            }
        }
        if (TicketConstants.CAT_CHANGE_PROFILE.equals(category)) {
            JSONObject obj = parsePayload(payload);
            if (obj.isEmpty()) {
                throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "改资料须提供至少一项变更");
            }
            if (obj.keySet().stream().noneMatch(k -> StringUtils.hasText(obj.getStr(k)))) {
                throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "改资料须提供至少一项变更");
            }
        }
        if (TicketConstants.CAT_BIND_VEHICLE.equals(category)) {
            JSONObject obj = parsePayload(payload);
            Long targetCarId = obj.getLong("targetCarId");
            if (targetCarId == null) {
                throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "绑定/换绑车辆须提供 targetCarId");
            }
            assertCarBindable(ticket.getDriverId(), targetCarId);
        }
    }

    private String requireBoundVehicleType(Long driverId) {
        Result<DriverCarBindingRelationship> bindingResult = serviceDriverUserClient.getBindingByDriverId(driverId);
        if (bindingResult == null || !bindingResult.isOk() || bindingResult.getData() == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先绑定运营车辆");
        }
        Result<Car> carResult = serviceDriverUserClient.getCar(bindingResult.getData().getCarId());
        if (carResult == null || !carResult.isOk() || carResult.getData() == null
                || !StringUtils.hasText(carResult.getData().getVehicleType())) {
            throw new BusinessException(ResultCodeEnum.CAR_NOT_EXISTS, "绑定车辆信息异常");
        }
        return carResult.getData().getVehicleType();
    }

    private void assertCarBindable(Long driverId, Long targetCarId) {
        Result<DriverUser> driverResult = serviceDriverUserClient.getDriverInfo(driverId);
        if (driverResult == null || !driverResult.isOk() || driverResult.getData() == null) {
            throw new BusinessException(ResultCodeEnum.DRIVER_NOT_EXITST);
        }
        String cityCode = driverResult.getData().getAddress();
        if (!StringUtils.hasText(cityCode)) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "司机运营城市未设置");
        }
        Result<Car> carResult = serviceDriverUserClient.getCar(targetCarId);
        if (carResult == null || !carResult.isOk() || carResult.getData() == null) {
            throw new BusinessException(ResultCodeEnum.CAR_NOT_EXISTS);
        }
        Car car = carResult.getData();
        if (!cityCode.equals(car.getAddress())) {
            throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "目标车辆不在当前运营区域");
        }
        if (car.getState() != null && car.getState() != DriverCarConstants.DRIVER_STATE_VALID) {
            throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "目标车辆状态无效");
        }
        Result<Boolean> priceExists = servicePriceClient.ifPriceExists(cityCode, car.getVehicleType());
        if (priceExists == null || !priceExists.isOk() || !Boolean.TRUE.equals(priceExists.getData())) {
            throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "目标车辆车型在当前城市无计价规则");
        }
        Result<DriverCarBindingRelationship> bindingResult = serviceDriverUserClient.getBindingByDriverId(driverId);
        if (bindingResult != null && bindingResult.isOk() && bindingResult.getData() != null
                && targetCarId.equals(bindingResult.getData().getCarId())) {
            throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "目标车辆已是当前绑定车辆");
        }
        Result<DriverCarBindingRelationship> carBinding = serviceDriverUserClient.getBindingByCarId(targetCarId);
        if (carBinding != null && carBinding.isOk() && carBinding.getData() != null) {
            throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "目标车辆已被其他司机绑定");
        }
    }

    private void executeDriverChange(Ticket ticket) {
        Result<DriverUser> driverResult = serviceDriverUserClient.getDriverInfo(ticket.getDriverId());
        if (driverResult == null || !driverResult.isOk() || driverResult.getData() == null) {
            throw new BusinessException(ResultCodeEnum.DRIVER_NOT_EXITST);
        }
        DriverUser driver = driverResult.getData();
        JSONObject payload = parsePayload(ticket.getRequestPayload());
        if (TicketConstants.CAT_CHANGE_CITY.equals(ticket.getCategory())) {
            String target = payload.getStr("targetAddress");
            if (!StringUtils.hasText(target)) {
                throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "缺少 targetAddress");
            }
            driver.setAddress(target.trim());
        } else if (TicketConstants.CAT_CHANGE_PROFILE.equals(ticket.getCategory())) {
            applyProfilePayload(driver, payload);
        } else {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的司机变更类型");
        }
        Result updateResult = serviceDriverUserClient.addOrUpdateDriverUser(driver);
        if (updateResult == null || !updateResult.isOk()) {
            String msg = updateResult == null ? "司机服务无响应" : updateResult.getMessage();
            throw new BusinessException(ResultCodeEnum.TICKET_EXECUTE_CHANGE_ERROR, msg);
        }
    }

    private void applyProfilePayload(DriverUser driver, JSONObject payload) {
        if (payload.containsKey("driverSurname") && StringUtils.hasText(payload.getStr("driverSurname"))) {
            driver.setDriverSurname(payload.getStr("driverSurname").trim());
        }
        if (payload.containsKey("driverName") && StringUtils.hasText(payload.getStr("driverName"))) {
            driver.setDriverName(payload.getStr("driverName").trim());
        }
        if (payload.containsKey("driverContactAddress") && StringUtils.hasText(payload.getStr("driverContactAddress"))) {
            driver.setDriverContactAddress(payload.getStr("driverContactAddress").trim());
        }
        if (payload.containsKey("driverGender") && payload.get("driverGender") != null) {
            driver.setDriverGender(payload.getInt("driverGender"));
        }
        if (payload.containsKey("driverNation") && StringUtils.hasText(payload.getStr("driverNation"))) {
            driver.setDriverNation(payload.getStr("driverNation").trim());
        }
        if (payload.containsKey("driverBirthday") && StringUtils.hasText(payload.getStr("driverBirthday"))) {
            try {
                driver.setDriverBirthday(LocalDate.parse(payload.getStr("driverBirthday").trim()));
            } catch (DateTimeParseException e) {
                throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED,
                        "出生日期格式错误，请使用 yyyy-MM-dd");
            }
        }
    }

    private void executeDriverBindVehicle(Ticket ticket) {
        JSONObject payload = parsePayload(ticket.getRequestPayload());
        Long targetCarId = payload.getLong("targetCarId");
        if (targetCarId == null) {
            throw new BusinessException(ResultCodeEnum.TICKET_PAYLOAD_REQUIRED, "缺少 targetCarId");
        }
        assertCarBindable(ticket.getDriverId(), targetCarId);

        Result<DriverCarBindingRelationship> bindingResult =
                serviceDriverUserClient.getBindingByDriverId(ticket.getDriverId());
        if (bindingResult != null && bindingResult.isOk() && bindingResult.getData() != null) {
            DriverCarBindingRelationship current = bindingResult.getData();
            if (!targetCarId.equals(current.getCarId())) {
                DriverCarBindingRelationship unbindReq = new DriverCarBindingRelationship();
                unbindReq.setDriverId(ticket.getDriverId());
                unbindReq.setCarId(current.getCarId());
                Result unbindResult = serviceDriverUserClient.unbind(unbindReq);
                if (unbindResult == null || !unbindResult.isOk()) {
                    String msg = unbindResult == null ? "司机服务无响应" : unbindResult.getMessage();
                    throw new BusinessException(ResultCodeEnum.TICKET_EXECUTE_CHANGE_ERROR, "解绑原车辆失败：" + msg);
                }
            }
        }

        DriverCarBindingRelationship bindReq = new DriverCarBindingRelationship();
        bindReq.setDriverId(ticket.getDriverId());
        bindReq.setCarId(targetCarId);
        Result bindResult = serviceDriverUserClient.bind(bindReq);
        if (bindResult == null || !bindResult.isOk()) {
            String msg = bindResult == null ? "司机服务无响应" : bindResult.getMessage();
            throw new BusinessException(ResultCodeEnum.TICKET_EXECUTE_CHANGE_ERROR, "绑定车辆失败：" + msg);
        }
    }

    private void syncOrderRefundStatus(OrderInfo order, BigDecimal refundAmount, BigDecimal orderPrice, String refundStatus) {
        OrderInfo patch = new OrderInfo();
        patch.setId(order.getId());
        if (TicketConstants.REFUND_PENDING.equals(refundStatus)
                || TicketConstants.REFUND_APPROVED.equals(refundStatus)
                || TicketConstants.REFUND_REFUNDING.equals(refundStatus)
                || TicketConstants.REFUND_FAILED.equals(refundStatus)) {
            patch.setRefundStatus(TicketConstants.ORDER_REFUND_PROCESSING);
        } else if (TicketConstants.REFUND_REFUNDED.equals(refundStatus)) {
            BigDecimal price = orderPrice == null ? BigDecimal.ZERO : orderPrice;
            BigDecimal amount = refundAmount == null ? BigDecimal.ZERO : refundAmount;
            if (amount.compareTo(price) >= 0) {
                patch.setRefundStatus(TicketConstants.ORDER_REFUND_FULL);
            } else {
                patch.setRefundStatus(TicketConstants.ORDER_REFUND_PARTIAL);
            }
        } else if (TicketConstants.REFUND_REJECTED.equals(refundStatus)) {
            Long refundedCount = orderRefundMapper.selectCount(new LambdaQueryWrapper<OrderRefund>()
                    .eq(OrderRefund::getOrderId, order.getId())
                    .eq(OrderRefund::getStatus, TicketConstants.REFUND_REFUNDED));
            if (refundedCount != null && refundedCount > 0) {
                return;
            }
            patch.setRefundStatus(TicketConstants.ORDER_REFUND_NONE);
        } else {
            return;
        }
        try {
            Result update = serviceOrderClient.updateOrder(patch);
            if (update == null || !update.isOk()) {
                log.warn("同步订单 refund_status 失败 orderId={} msg={}",
                        order.getId(), update == null ? "null" : update.getMessage());
            }
        } catch (Exception e) {
            log.warn("同步订单 refund_status 异常 orderId={}", order.getId(), e);
        }
    }

    private OrderRefund requireRefund(Long refundId) {
        if (refundId == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "退款单ID不能为空");
        }
        OrderRefund refund = orderRefundMapper.selectById(refundId);
        if (refund == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "退款单不存在");
        }
        return refund;
    }

    private void markRefunded(OrderRefund refund, OrderInfo order, String alipayRefundNo) {
        refund.setStatus(TicketConstants.REFUND_REFUNDED);
        refund.setRefundedAt(new Date());
        if (StringUtils.hasText(alipayRefundNo)) {
            refund.setAlipayRefundNo(alipayRefundNo);
        }
        // 先落成功态，再扣司机账（失败可再次执行补扣）
        if (refund.getDriverSettled() == null) {
            refund.setDriverSettled(0);
        }
        orderRefundMapper.updateById(refund);
        syncOrderRefundStatus(order, refund.getRefundAmount(), refund.getOrderPrice(), TicketConstants.REFUND_REFUNDED);
        settleDriverIncome(refund);
        orderRefundMapper.updateById(refund);
    }

    private void settleDriverIncome(OrderRefund refund) {
        if (refund.getDriverSettled() != null && refund.getDriverSettled() == 1) {
            return;
        }
        if (refund.getDriverId() == null || refund.getRefundAmount() == null) {
            refund.setDriverSettled(1);
            return;
        }
        double amount = refund.getRefundAmount().doubleValue();
        Result settle = serviceDriverUserClient.deductMoneyByDriverId(refund.getDriverId(), amount);
        if (settle == null || !settle.isOk()) {
            String msg = settle == null ? "司机服务无响应" : settle.getMessage();
            throw new BusinessException(ResultCodeEnum.TICKET_EXECUTE_CHANGE_ERROR,
                    "退款账务回退司机收入失败：" + msg);
        }
        refund.setDriverSettled(1);
    }

    private JSONObject parsePayload(String payload) {
        if (!StringUtils.hasText(payload)) {
            return new JSONObject();
        }
        try {
            return JSONUtil.parseObj(payload);
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "requestPayload 不是合法 JSON");
        }
    }

    private String normalizePayload(String payload) {
        if (!StringUtils.hasText(payload)) {
            return null;
        }
        // 校验合法 JSON
        parsePayload(payload);
        return payload.trim();
    }

    private TokenResult requireLoginUser() {
        TokenResult user = UserContext.getUser();
        if (user == null || !StringUtils.hasText(user.getPhone()) || !StringUtils.hasText(user.getIdentity())) {
            throw new BusinessException(ResultCodeEnum.TOKEN_ERROR, "未登录或登录已失效");
        }
        return user;
    }

    private int resolveSource(String identity) {
        if (IdentityConstant.PASSENGER_IDENTITY.equals(identity.trim())) {
            return TicketConstants.SOURCE_PASSENGER;
        }
        if (IdentityConstant.DRIVER_IDENTITY.equals(identity.trim())) {
            return TicketConstants.SOURCE_DRIVER;
        }
        throw new BusinessException(ResultCodeEnum.TOKEN_IDENTITY_MISMATCH, "仅乘客或司机可提交工单");
    }

    private Ticket requireTicket(Long ticketId) {
        if (ticketId == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "工单ID不能为空");
        }
        Ticket ticket = ticketMapper.selectById(ticketId);
        if (ticket == null) {
            throw new BusinessException(ResultCodeEnum.TICKET_NOT_EXISTS);
        }
        return ticket;
    }

    private void assertOwner(Ticket ticket) {
        TokenResult user = requireLoginUser();
        int source = resolveSource(user.getIdentity());
        if (source == TicketConstants.SOURCE_PASSENGER) {
            if (!Objects.equals(user.getPhone(), ticket.getPassengerPhone())) {
                throw new BusinessException(ResultCodeEnum.TICKET_NO_PERMISSION);
            }
        } else {
            if (!Objects.equals(user.getPhone(), ticket.getDriverPhone())) {
                throw new BusinessException(ResultCodeEnum.TICKET_NO_PERMISSION);
            }
        }
    }

    private void assertProcessable(Ticket ticket) {
        if (!TicketConstants.STATUS_OPEN.equals(ticket.getStatus())
                && !TicketConstants.STATUS_IN_PROGRESS.equals(ticket.getStatus())
                && !TicketConstants.STATUS_PENDING_USER.equals(ticket.getStatus())) {
            throw new BusinessException(ResultCodeEnum.TICKET_STATUS_ERROR);
        }
    }

    private void applyVersion(Ticket ticket, Integer version) {
        if (version != null) {
            ticket.setVersion(version);
        }
    }

    private void fillAssigneeIfPresent(Ticket ticket, TicketProcessRequest request) {
        if (request.getAssigneeId() != null) {
            ticket.setAssigneeId(request.getAssigneeId());
        }
        if (StringUtils.hasText(request.getAssigneeName())) {
            ticket.setAssigneeName(request.getAssigneeName());
        }
    }

    private void updateTicketOptimistic(Ticket ticket) {
        int rows = ticketMapper.updateById(ticket);
        if (rows == 0) {
            throw new BusinessException(ResultCodeEnum.TICKET_CONFLICT);
        }
    }

    private void insertSystemMessage(Long ticketId, String content) {
        TicketMessage msg = new TicketMessage();
        msg.setTicketId(ticketId);
        msg.setSenderType(TicketConstants.SENDER_SYSTEM);
        msg.setSenderName("系统");
        msg.setContent(content);
        msg.setMsgType(TicketConstants.MSG_EVENT);
        msg.setContentSource(TicketConstants.CONTENT_SOURCE_HUMAN);
        ticketMessageMapper.insert(msg);
    }

    private void insertUserMessage(Long ticketId, int senderType, Long senderId, String senderName, String content) {
        TicketMessage msg = new TicketMessage();
        msg.setTicketId(ticketId);
        msg.setSenderType(senderType);
        msg.setSenderId(senderId);
        msg.setSenderName(senderName);
        msg.setContent(content);
        msg.setMsgType(TicketConstants.MSG_TEXT);
        msg.setContentSource(TicketConstants.CONTENT_SOURCE_HUMAN);
        ticketMessageMapper.insert(msg);
    }

    private String buildBizNo(String prefix, Long id) {
        String day = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return prefix + day + String.format("%08d", id);
    }
}
