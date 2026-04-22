package com.laerdal.okpi.objective.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OkrDashboardResponse {
    private long objectiveCount;
    private long keyResultCount;
    private List<ObjectiveResponse> objectives;
}
