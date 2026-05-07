package com.laerdal.okpi.objective.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laerdal.okpi.objective.dto.request.CreateKeyResultRequest;
import com.laerdal.okpi.objective.dto.request.UpdateKeyResultRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.enums.MetricType;
import com.laerdal.okpi.objective.service.KeyResultService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
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

@WebMvcTest(KeyResultController.class)
@AutoConfigureMockMvc(addFilters = false)
class KeyResultControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.boot.test.mock.mockito.MockBean
    private KeyResultService keyResultService;

    @Test
    void createReturnsCreatedKeyResult() throws Exception {
        CreateKeyResultRequest request = createRequest();
        KeyResultResponse response = keyResultResponse(31L, 21L, "Expand pipeline", KeyResultStatus.ON_TRACK);
        when(keyResultService.create(eq(21L), eq(request))).thenReturn(response);

        mockMvc.perform(post("/api/v1/objectives/21/key-results")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(31))
                .andExpect(jsonPath("$.objectiveId").value(21))
                .andExpect(jsonPath("$.status").value("ON_TRACK"));

        verify(keyResultService).create(eq(21L), eq(request));
    }

    @Test
    void createRejectsInvalidMetricType() throws Exception {
        String invalidPayload = """
                {
                  "title": "Increase MRR by 20%",
                  "description": "Monthly recurring revenue growth target",
                  "metricType": "KPI",
                  "startValue": 5,
                  "targetValue": 20
                }
                """;

        mockMvc.perform(post("/api/v1/objectives/21/key-results")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Invalid value 'KPI' for field 'metricType'. Allowed values: NUMBER, PERCENTAGE, CURRENCY, BOOLEAN"));
    }

    @Test
    void getAllReturnsKeyResultsForObjective() throws Exception {
        when(keyResultService.getByObjectiveId(21L)).thenReturn(List.of(
                keyResultResponse(31L, 21L, "Expand pipeline", KeyResultStatus.ON_TRACK),
                keyResultResponse(32L, 21L, "Close renewals", KeyResultStatus.NOT_STARTED)
        ));

        mockMvc.perform(get("/api/v1/objectives/21/key-results"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Expand pipeline"))
                .andExpect(jsonPath("$[1].status").value("NOT_STARTED"));

        verify(keyResultService).getByObjectiveId(21L);
    }

    @Test
    void updateReturnsUpdatedKeyResult() throws Exception {
        UpdateKeyResultRequest request = updateRequest();
        KeyResultResponse response = keyResultResponse(31L, 21L, "Expand pipeline faster", KeyResultStatus.AT_RISK);
        when(keyResultService.update(eq(31L), eq(request))).thenReturn(response);

        mockMvc.perform(put("/api/v1/objectives/21/key-results/31")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Expand pipeline faster"))
                .andExpect(jsonPath("$.status").value("AT_RISK"));

        verify(keyResultService).update(eq(31L), eq(request));
    }

    @Test
    void deleteReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/v1/objectives/21/key-results/31"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        verify(keyResultService).delete(31L);
    }

    private static CreateKeyResultRequest createRequest() {
        CreateKeyResultRequest request = new CreateKeyResultRequest();
        request.setTitle("Expand pipeline");
        request.setDescription("Increase qualified opportunities");
        request.setMetricType(MetricType.NUMBER);
        request.setStartValue(new BigDecimal("10"));
        request.setTargetValue(new BigDecimal("50"));
        return request;
    }

    private static UpdateKeyResultRequest updateRequest() {
        UpdateKeyResultRequest request = new UpdateKeyResultRequest();
        request.setTitle("Expand pipeline faster");
        request.setDescription("Increase qualified opportunities sooner");
        request.setCurrentValue(new BigDecimal("25"));
        request.setTargetValue(new BigDecimal("50"));
        request.setStatus(KeyResultStatus.AT_RISK);
        return request;
    }

    private static KeyResultResponse keyResultResponse(Long id,
                                                       Long objectiveId,
                                                       String title,
                                                       KeyResultStatus status) {
        return KeyResultResponse.builder()
                .id(id)
                .objectiveId(objectiveId)
                .title(title)
                .description("Key result description")
                .metricType(MetricType.NUMBER)
                .startValue(new BigDecimal("10"))
                .currentValue(new BigDecimal("25"))
                .targetValue(new BigDecimal("50"))
                .status(status)
                .build();
    }
}
