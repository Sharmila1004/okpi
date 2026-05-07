package com.laerdal.okpi.objective.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laerdal.okpi.objective.dto.request.CreateObjectiveRequest;
import com.laerdal.okpi.objective.dto.request.UpdateObjectiveRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveDetailResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveResponse;
import com.laerdal.okpi.objective.dto.response.OkrDashboardResponse;
import com.laerdal.okpi.objective.dto.response.PagedResponse;
import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.enums.MetricType;
import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import com.laerdal.okpi.objective.security.RequestContext;
import com.laerdal.okpi.objective.service.ObjectiveService;
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

@WebMvcTest(ObjectiveController.class)
@AutoConfigureMockMvc(addFilters = false)
class ObjectiveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.boot.test.mock.mockito.MockBean
    private ObjectiveService objectiveService;

    @org.springframework.boot.test.mock.mockito.MockBean
    private RequestContext requestContext;

    @Test
    void createReturnsCreatedObjective() throws Exception {
        CreateObjectiveRequest request = createRequest();
        ObjectiveResponse response = objectiveResponse(21L, "Grow Revenue", ObjectiveStatus.ON_TRACK);
        when(requestContext.getUserId()).thenReturn(42L);
        when(requestContext.getUserRole()).thenReturn("MEMBER");
        when(objectiveService.create(eq(request), eq(42L), eq("MEMBER"))).thenReturn(response);

        mockMvc.perform(post("/api/v1/objectives")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(21))
                .andExpect(jsonPath("$.title").value("Grow Revenue"))
                .andExpect(jsonPath("$.status").value("ON_TRACK"));

        verify(objectiveService).create(eq(request), eq(42L), eq("MEMBER"));
    }

    @Test
    void listReturnsPagedObjectives() throws Exception {
        PagedResponse<ObjectiveResponse> response = pagedObjectives();
        when(objectiveService.list(1, 10, "ON_TRACK", 7L, "growth")).thenReturn(response);

        mockMvc.perform(get("/api/v1/objectives")
                        .param("page", "1")
                        .param("size", "10")
                        .param("status", "ON_TRACK")
                        .param("ownerId", "7")
                        .param("search", "growth"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Grow Revenue"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(objectiveService).list(1, 10, "ON_TRACK", 7L, "growth");
    }

    @Test
    void getByIdReturnsObjectiveDetails() throws Exception {
        ObjectiveDetailResponse response = objectiveDetailResponse();
        when(objectiveService.getById(21L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/objectives/21"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.objective.title").value("Grow Revenue"))
                .andExpect(jsonPath("$.keyResults[0].title").value("Expand pipeline"));

        verify(objectiveService).getById(21L);
    }

    @Test
    void updateReturnsUpdatedObjective() throws Exception {
        UpdateObjectiveRequest request = updateRequest();
        ObjectiveResponse response = objectiveResponse(21L, "Grow Revenue Fast", ObjectiveStatus.AT_RISK);
        when(objectiveService.update(eq(21L), eq(request))).thenReturn(response);

        mockMvc.perform(put("/api/v1/objectives/21")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Grow Revenue Fast"))
                .andExpect(jsonPath("$.status").value("AT_RISK"));

        verify(objectiveService).update(eq(21L), eq(request));
    }

    @Test
    void deleteReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/v1/objectives/21"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        verify(objectiveService).delete(21L);
    }

    @Test
    void dashboardReturnsAggregatedSummary() throws Exception {
        OkrDashboardResponse response = dashboardResponse();
        when(objectiveService.dashboard(7L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/objectives/dashboard")
                        .param("ownerId", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.objectiveCount").value(2))
                .andExpect(jsonPath("$.keyResultCount").value(5))
                .andExpect(jsonPath("$.objectives[0].title").value("Grow Revenue"));

        verify(objectiveService).dashboard(7L);
    }

    private static CreateObjectiveRequest createRequest() {
        CreateObjectiveRequest request = new CreateObjectiveRequest();
        request.setTitle("Grow Revenue");
        request.setDescription("Increase recurring revenue");
        request.setStartDate(futureStartDate());
        request.setEndDate(futureEndDate());
        return request;
    }

    private static UpdateObjectiveRequest updateRequest() {
        UpdateObjectiveRequest request = new UpdateObjectiveRequest();
        request.setTitle("Grow Revenue Fast");
        request.setDescription("Increase recurring revenue faster");
        request.setStatus(ObjectiveStatus.AT_RISK);
        request.setStartDate(futureStartDate());
        request.setEndDate(futureEndDate());
        return request;
    }

    private static ObjectiveResponse objectiveResponse(Long id, String title, ObjectiveStatus status) {
        return ObjectiveResponse.builder()
                .id(id)
                .title(title)
                .description("Increase recurring revenue")
                .status(status)
                .startDate(futureStartDate())
                .endDate(futureEndDate())
                .progressPercentage(new BigDecimal("63.5"))
                .build();
    }

    private static PagedResponse<ObjectiveResponse> pagedObjectives() {
        return PagedResponse.<ObjectiveResponse>builder()
                .content(List.of(objectiveResponse(21L, "Grow Revenue", ObjectiveStatus.ON_TRACK)))
                .page(1)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();
    }

    private static ObjectiveDetailResponse objectiveDetailResponse() {
        return ObjectiveDetailResponse.builder()
                .objective(objectiveResponse(21L, "Grow Revenue", ObjectiveStatus.ON_TRACK))
                .keyResults(List.of(
                        keyResultResponse(31L, 21L, "Expand pipeline", MetricType.NUMBER, KeyResultStatus.ON_TRACK),
                        keyResultResponse(32L, 21L, "Close renewals", MetricType.PERCENTAGE, KeyResultStatus.NOT_STARTED)))
                .build();
    }

    private static OkrDashboardResponse dashboardResponse() {
        return OkrDashboardResponse.builder()
                .objectiveCount(2)
                .keyResultCount(5)
                .objectives(List.of(
                        objectiveResponse(21L, "Grow Revenue", ObjectiveStatus.ON_TRACK),
                        objectiveResponse(22L, "Improve Retention", ObjectiveStatus.DRAFT)))
                .build();
    }

    private static LocalDate futureStartDate() {
        return LocalDate.now().plusDays(1);
    }

    private static LocalDate futureEndDate() {
        return LocalDate.now().plusMonths(8);
    }

    private static KeyResultResponse keyResultResponse(Long id,
                                                       Long objectiveId,
                                                       String title,
                                                       MetricType metricType,
                                                       KeyResultStatus status) {
        return KeyResultResponse.builder()
                .id(id)
                .objectiveId(objectiveId)
                .title(title)
                .description("Key result description")
                .metricType(metricType)
                .startValue(new BigDecimal("10"))
                .currentValue(new BigDecimal("25"))
                .targetValue(new BigDecimal("50"))
                .status(status)
                .build();
    }
}
