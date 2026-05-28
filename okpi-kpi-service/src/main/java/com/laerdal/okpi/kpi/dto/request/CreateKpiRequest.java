package com.laerdal.okpi.kpi.dto.request;

import com.laerdal.okpi.kpi.enums.KpiFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateKpiRequest {

    @NotBlank
    private String name;

    private String description;

    private String unit;

    @NotNull
    private KpiFrequency frequency;

    private List<Long> assigneeIds;
}