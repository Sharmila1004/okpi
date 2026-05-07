package com.laerdal.okpi.kpi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laerdal.okpi.kpi.dto.request.CreateKpiRequest;
import com.laerdal.okpi.kpi.dto.request.UpdateKpiRequest;
import com.laerdal.okpi.kpi.dto.response.KpiDetailResponse;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.dto.response.KpiResponse;
import com.laerdal.okpi.kpi.enums.KpiFrequency;
import com.laerdal.okpi.kpi.service.KpiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KpiController.class)
@AutoConfigureMockMvc(addFilters = false)
class KpiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.boot.test.mock.mockito.MockBean
    private KpiService kpiService;

    @Test
    void createReturnsCreatedKpi() throws Exception {
        CreateKpiRequest request = createRequest();
        KpiResponse response = kpiResponse(11L, "Revenue", "Monthly revenue", "USD", KpiFrequency.MONTHLY);
        when(kpiService.create(eq(request))).thenReturn(response);

        mockMvc.perform(post("/api/v1/kpis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.name").value("Revenue"))
                .andExpect(jsonPath("$.frequency").value("MONTHLY"));

        verify(kpiService).create(eq(request));
    }

    @Test
    void getAllReturnsCurrentUserKpis() throws Exception {
        when(kpiService.getAllForCurrentUser()).thenReturn(List.of(
                kpiResponse(11L, "Revenue", "Monthly revenue", "USD", KpiFrequency.MONTHLY),
                kpiResponse(12L, "NPS", "Net promoter score", "pts", KpiFrequency.QUARTERLY)
        ));

        mockMvc.perform(get("/api/v1/kpis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Revenue"))
                .andExpect(jsonPath("$[1].frequency").value("QUARTERLY"));

        verify(kpiService).getAllForCurrentUser();
    }

    @Test
    void getByIdReturnsKpiDetails() throws Exception {
        KpiDetailResponse response = kpiDetailResponse();
        when(kpiService.getById(11L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/kpis/11"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpi.name").value("Revenue"))
                .andExpect(jsonPath("$.entries[0].note").value("Initial baseline"));

        verify(kpiService).getById(11L);
    }

    @Test
    void updateReturnsUpdatedKpi() throws Exception {
        UpdateKpiRequest request = updateRequest();
        KpiResponse response = kpiResponse(11L, "Revenue Updated", "Updated revenue", "USD", KpiFrequency.WEEKLY);
        when(kpiService.update(eq(11L), eq(request))).thenReturn(response);

        mockMvc.perform(put("/api/v1/kpis/11")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Revenue Updated"))
                .andExpect(jsonPath("$.frequency").value("WEEKLY"));

        verify(kpiService).update(eq(11L), eq(request));
    }

    @Test
    void deleteReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/v1/kpis/11"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        verify(kpiService).delete(11L);
    }

    private static CreateKpiRequest createRequest() {
        CreateKpiRequest request = new CreateKpiRequest();
        request.setName("Revenue");
        request.setDescription("Monthly revenue");
        request.setUnit("USD");
        request.setFrequency(KpiFrequency.MONTHLY);
        return request;
    }

    private static UpdateKpiRequest updateRequest() {
        UpdateKpiRequest request = new UpdateKpiRequest();
        request.setName("Revenue Updated");
        request.setDescription("Updated revenue");
        request.setUnit("USD");
        request.setFrequency(KpiFrequency.WEEKLY);
        return request;
    }

    private static KpiResponse kpiResponse(Long id, String name, String description, String unit, KpiFrequency frequency) {
        return KpiResponse.builder()
                .id(id)
                .name(name)
                .description(description)
                .unit(unit)
                .frequency(frequency)
                .build();
    }

    private static KpiDetailResponse kpiDetailResponse() {
        return KpiDetailResponse.builder()
                .kpi(kpiResponse(11L, "Revenue", "Monthly revenue", "USD", KpiFrequency.MONTHLY))
                .entries(List.of(KpiEntryResponse.builder()
                        .id(101L)
                        .kpiDefinitionId(11L)
                .value(new BigDecimal("9200.50"))
                        .recordedAt(LocalDate.of(2026, 4, 28))
                        .note("Initial baseline")
                        .build()))
                .build();
    }
}
