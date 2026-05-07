package com.laerdal.okpi.kpi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laerdal.okpi.kpi.dto.request.CreateKpiEntryRequest;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.service.KpiEntryService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KpiEntryController.class)
@AutoConfigureMockMvc(addFilters = false)
class KpiEntryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.boot.test.mock.mockito.MockBean
    private KpiEntryService kpiEntryService;

    @Test
    void createReturnsCreatedEntry() throws Exception {
        CreateKpiEntryRequest request = createRequest();
        KpiEntryResponse response = entryResponse(101L, 11L, new BigDecimal("9200.50"), "Initial baseline");
        when(kpiEntryService.create(eq(11L), eq(request))).thenReturn(response);

        mockMvc.perform(post("/api/v1/kpis/11/entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.kpiDefinitionId").value(11))
                .andExpect(jsonPath("$.note").value("Initial baseline"));

        verify(kpiEntryService).create(eq(11L), eq(request));
    }

    @Test
    void getAllReturnsEntriesForKpi() throws Exception {
        when(kpiEntryService.getByKpiId(11L)).thenReturn(List.of(
                entryResponse(101L, 11L, new BigDecimal("9200.50"), "Initial baseline"),
                entryResponse(102L, 11L, new BigDecimal("9488.25"), "Second month")
        ));

        mockMvc.perform(get("/api/v1/kpis/11/entries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].value").value(9200.50))
                .andExpect(jsonPath("$[1].note").value("Second month"));

        verify(kpiEntryService).getByKpiId(11L);
    }

    @Test
    void deleteReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/v1/kpis/11/entries/101"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        verify(kpiEntryService).delete(101L);
    }

    private static CreateKpiEntryRequest createRequest() {
        CreateKpiEntryRequest request = new CreateKpiEntryRequest();
        request.setValue(new BigDecimal("9200.50"));
        request.setRecordedAt(LocalDate.of(2026, 4, 28));
        request.setNote("Initial baseline");
        return request;
    }

    private static KpiEntryResponse entryResponse(Long id, Long kpiDefinitionId, BigDecimal value, String note) {
        return KpiEntryResponse.builder()
                .id(id)
                .kpiDefinitionId(kpiDefinitionId)
                .value(value)
                .recordedAt(LocalDate.of(2026, 4, 28))
                .note(note)
                .build();
    }
}
