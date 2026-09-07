package com.taxi.api.request;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class TicketProcessRequest {

    @NotNull(message = "工单ID不能为空")
    private Long ticketId;

    private String resultSummary;

    private String rejectReason;

    private Integer assigneeId;

    private String assigneeName;

    /** 乐观锁版本，可选；不传则仅按 id 更新（仍建议传） */
    private Integer version;
}
