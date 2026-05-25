package com.laerdal.okpi.objective.service;

import com.laerdal.okpi.objective.dto.request.UpdateKeyResultRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.entity.KeyResult;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.enums.MetricType;
import com.laerdal.okpi.objective.mapper.KeyResultMapper;
import com.laerdal.okpi.objective.repository.KeyResultRepository;
import com.laerdal.okpi.objective.repository.ObjectiveRepository;
import com.laerdal.okpi.objective.security.RequestContext;
import com.laerdal.okpi.objective.service.impl.KeyResultServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KeyResultServiceImplTest {

    @Mock
    private KeyResultRepository keyResultRepository;

    @Mock
    private ObjectiveRepository objectiveRepository;

    @Mock
    private KeyResultMapper keyResultMapper;

    @Mock
    private RequestContext requestContext;

    @InjectMocks
    private KeyResultServiceImpl keyResultService;

    @Test
    void updateTracksTheCurrentUserAsUpdater() {
        Objective objective = Objective.builder()
                .id(11L)
                .ownerId(7L)
                .title("Grow revenue")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(1))
                .status(com.laerdal.okpi.objective.enums.ObjectiveStatus.ON_TRACK)
                .build();
        KeyResult keyResult = KeyResult.builder()
                .id(21L)
                .objective(objective)
                .title("Increase pipeline")
                .metricType(MetricType.NUMBER)
                .startValue(new BigDecimal("10"))
                .currentValue(new BigDecimal("20"))
                .targetValue(new BigDecimal("50"))
                .status(KeyResultStatus.ON_TRACK)
                .updatedAt(Instant.parse("2026-04-28T10:15:30Z"))
                .build();

        UpdateKeyResultRequest request = new UpdateKeyResultRequest();
        request.setCurrentValue(new BigDecimal("25"));
        request.setStatus(KeyResultStatus.AT_RISK);

        when(requestContext.getUserId()).thenReturn(99L);
        when(requestContext.getUserRole()).thenReturn("ADMIN");
        when(keyResultRepository.findById(21L)).thenReturn(Optional.of(keyResult));
        when(keyResultRepository.save(any(KeyResult.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(keyResultRepository.findAllByObjective_Id(11L)).thenReturn(java.util.List.of(keyResult));
        when(keyResultMapper.toResponse(any(KeyResult.class))).thenAnswer(invocation ->
                KeyResultResponse.builder()
                        .id(((KeyResult) invocation.getArgument(0)).getId())
                        .objectiveId(((KeyResult) invocation.getArgument(0)).getObjective().getId())
                        .updatedByUserId(((KeyResult) invocation.getArgument(0)).getUpdatedByUserId())
                        .build()
        );

        KeyResultResponse response = keyResultService.update(21L, request);

        ArgumentCaptor<KeyResult> captor = ArgumentCaptor.forClass(KeyResult.class);
        org.mockito.Mockito.verify(keyResultRepository).save(captor.capture());

        assertThat(captor.getValue().getUpdatedByUserId()).isEqualTo(99L);
        assertThat(response.getUpdatedByUserId()).isEqualTo(99L);
    }
}
