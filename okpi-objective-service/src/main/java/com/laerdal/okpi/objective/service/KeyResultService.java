package com.laerdal.okpi.objective.service;

import com.laerdal.okpi.objective.dto.request.CreateKeyResultRequest;
import com.laerdal.okpi.objective.dto.request.UpdateKeyResultRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;

import java.util.List;

public interface KeyResultService {
    KeyResultResponse create(Long objectiveId, CreateKeyResultRequest request);
    List<KeyResultResponse> getByObjectiveId(Long objectiveId);
    KeyResultResponse update(Long keyResultId, UpdateKeyResultRequest request);
    void delete(Long keyResultId);
}
