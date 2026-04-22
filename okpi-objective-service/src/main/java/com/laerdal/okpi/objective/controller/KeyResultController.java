package com.laerdal.okpi.objective.controller;

import com.laerdal.okpi.objective.dto.request.CreateKeyResultRequest;
import com.laerdal.okpi.objective.dto.request.UpdateKeyResultRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.service.KeyResultService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/objectives/{objectiveId}/key-results")
public class KeyResultController {

    private final KeyResultService keyResultService;

    public KeyResultController(KeyResultService keyResultService) {
        this.keyResultService = keyResultService;
    }

    @PostMapping
    public KeyResultResponse create(@PathVariable Long objectiveId,
                                    @Valid @RequestBody CreateKeyResultRequest request) {
        return keyResultService.create(objectiveId, request);
    }

    @GetMapping
    public List<KeyResultResponse> getAll(@PathVariable Long objectiveId) {
        return keyResultService.getByObjectiveId(objectiveId);
    }

    @PutMapping("/{keyResultId}")
    public KeyResultResponse update(@PathVariable Long keyResultId,
                                    @Valid @RequestBody UpdateKeyResultRequest request) {
        return keyResultService.update(keyResultId, request);
    }

    @DeleteMapping("/{keyResultId}")
    public void delete(@PathVariable Long keyResultId) {
        keyResultService.delete(keyResultId);
    }
}