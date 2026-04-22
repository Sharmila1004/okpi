package com.laerdal.okpi.objective.service.impl;

import com.laerdal.okpi.objective.dto.request.CreateKeyResultRequest;
import com.laerdal.okpi.objective.dto.request.UpdateKeyResultRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.entity.KeyResult;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.exception.AccessDeniedException;
import com.laerdal.okpi.objective.exception.ResourceNotFoundException;
import com.laerdal.okpi.objective.mapper.KeyResultMapper;
import com.laerdal.okpi.objective.repository.KeyResultRepository;
import com.laerdal.okpi.objective.repository.ObjectiveRepository;
import com.laerdal.okpi.objective.security.RequestContext;
import com.laerdal.okpi.objective.service.KeyResultService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class KeyResultServiceImpl implements KeyResultService {

    private final KeyResultRepository keyResultRepository;
    private final ObjectiveRepository objectiveRepository;
    private final KeyResultMapper keyResultMapper;
    private final RequestContext requestContext;

    public KeyResultServiceImpl(KeyResultRepository keyResultRepository,
                                ObjectiveRepository objectiveRepository,
                                KeyResultMapper keyResultMapper,
                                RequestContext requestContext) {
        this.keyResultRepository = keyResultRepository;
        this.objectiveRepository = objectiveRepository;
        this.keyResultMapper = keyResultMapper;
        this.requestContext = requestContext;
    }

    @Override
    @Transactional
    public KeyResultResponse create(Long objectiveId, CreateKeyResultRequest request) {
        Objective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        requireOwnerOrAdmin(objective);

        KeyResult keyResult = KeyResult.builder()
                .objective(objective)
                .title(request.getTitle())
                .description(request.getDescription())
                .metricType(request.getMetricType())
                .startValue(request.getStartValue())
                .currentValue(request.getStartValue())
                .targetValue(request.getTargetValue())
                .status(KeyResultStatus.NOT_STARTED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        KeyResult saved = keyResultRepository.save(keyResult);
        recalculateObjectiveProgress(objective);
        return keyResultMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KeyResultResponse> getByObjectiveId(Long objectiveId) {
        return keyResultRepository.findAllByObjective_Id(objectiveId).stream()
                .map(keyResultMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public KeyResultResponse update(Long keyResultId, UpdateKeyResultRequest request) {
        requireAuthenticated();
        KeyResult keyResult = keyResultRepository.findById(keyResultId)
                .orElseThrow(() -> new ResourceNotFoundException("Key result not found"));

        if (request.getTitle() != null) {
            keyResult.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            keyResult.setDescription(request.getDescription());
        }
        if (request.getCurrentValue() != null) {
            keyResult.setCurrentValue(request.getCurrentValue());
        }
        if (request.getTargetValue() != null) {
            keyResult.setTargetValue(request.getTargetValue());
        }
        if (request.getStatus() != null) {
            keyResult.setStatus(request.getStatus());
        }
        keyResult.setUpdatedAt(Instant.now());
        KeyResult saved = keyResultRepository.save(keyResult);
        recalculateObjectiveProgress(saved.getObjective());
        return keyResultMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long keyResultId) {
        KeyResult keyResult = keyResultRepository.findById(keyResultId)
                .orElseThrow(() -> new ResourceNotFoundException("Key result not found"));
        requireOwnerOrAdmin(keyResult.getObjective());
        Objective objective = keyResult.getObjective();
        keyResultRepository.delete(keyResult);
        recalculateObjectiveProgress(objective);
    }

    private void requireAuthenticated() {
        if (requestContext.getUserId() == null || requestContext.getUserRole() == null) {
            throw new AccessDeniedException("Missing authentication headers");
        }
    }

    private void requireOwnerOrAdmin(Objective objective) {
        requireAuthenticated();
        if ("ADMIN".equals(requestContext.getUserRole())) {
            return;
        }
        if (!requestContext.getUserId().equals(objective.getOwnerId())) {
            throw new AccessDeniedException("Only the owner or admin can modify this objective");
        }
    }

    private void recalculateObjectiveProgress(Objective objective) {
        List<KeyResult> keyResults = keyResultRepository.findAllByObjective_Id(objective.getId());
        objective.setProgressPercentage(calculateObjectiveProgressPercentage(keyResults));
        objectiveRepository.save(objective);
    }

    private BigDecimal calculateObjectiveProgressPercentage(List<KeyResult> keyResults) {
        if (keyResults.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal sum = BigDecimal.ZERO;
        for (KeyResult kr : keyResults) {
            BigDecimal start = kr.getStartValue() == null ? BigDecimal.ZERO : kr.getStartValue();
            BigDecimal current = kr.getCurrentValue() == null ? BigDecimal.ZERO : kr.getCurrentValue();
            BigDecimal target = kr.getTargetValue() == null ? BigDecimal.ZERO : kr.getTargetValue();

            BigDecimal denom = target.subtract(start);
            BigDecimal ratio;
            if (denom.compareTo(BigDecimal.ZERO) == 0) {
                ratio = current.compareTo(target) >= 0 ? BigDecimal.ONE : BigDecimal.ZERO;
            } else {
                ratio = current.subtract(start)
                        .divide(denom, 6, java.math.RoundingMode.HALF_UP);
            }

            if (ratio.compareTo(BigDecimal.ZERO) < 0) {
                ratio = BigDecimal.ZERO;
            }
            if (ratio.compareTo(BigDecimal.ONE) > 0) {
                ratio = BigDecimal.ONE;
            }
            sum = sum.add(ratio);
        }

        BigDecimal avg = sum.divide(BigDecimal.valueOf(keyResults.size()), 6, java.math.RoundingMode.HALF_UP);
        return avg.multiply(BigDecimal.valueOf(100)).setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
