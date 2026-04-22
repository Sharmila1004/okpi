package com.laerdal.okpi.objective.service;

import com.laerdal.okpi.objective.dto.request.CreateObjectiveRequest;
import com.laerdal.okpi.objective.dto.request.UpdateObjectiveRequest;
import com.laerdal.okpi.objective.dto.response.OkrDashboardResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveDetailResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveResponse;
import com.laerdal.okpi.objective.dto.response.PagedResponse;

import java.util.List;

public interface ObjectiveService {
    ObjectiveResponse create(CreateObjectiveRequest request, Long userId, String userRole);
    PagedResponse<ObjectiveResponse> list(int page, int size, String status, Long ownerId, String search);
    List<ObjectiveResponse> getAllForCurrentUser();
    ObjectiveDetailResponse getById(Long objectiveId);
    ObjectiveResponse update(Long objectiveId, UpdateObjectiveRequest request);
    void delete(Long objectiveId);
    OkrDashboardResponse dashboard(Long ownerId);
}
