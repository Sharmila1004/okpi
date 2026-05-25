package com.laerdal.okpi.objective.controller;

import com.laerdal.okpi.objective.dto.request.CreateKeyResultRequest;
import com.laerdal.okpi.objective.dto.request.UpdateKeyResultRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.service.KeyResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Key Results", description = "OKR key result management APIs")
@SecurityRequirement(name = "bearerAuth")
public class KeyResultController {

    private final KeyResultService keyResultService;

    public KeyResultController(KeyResultService keyResultService) {
        this.keyResultService = keyResultService;
    }

    @PostMapping
    @Operation(summary = "Create a key result")
    public KeyResultResponse create(@PathVariable("objectiveId") Long objectiveId,
                                    @Valid @RequestBody CreateKeyResultRequest request) {
        return keyResultService.create(objectiveId, request);
    }

    @GetMapping
    @Operation(summary = "List key results for an objective")
    public List<KeyResultResponse> getAll(@PathVariable("objectiveId") Long objectiveId) {
        return keyResultService.getByObjectiveId(objectiveId);
    }

    @PutMapping("/{keyResultId}")
    @Operation(summary = "Update a key result")
    public KeyResultResponse update(@PathVariable("keyResultId") Long keyResultId,
                                    @Valid @RequestBody UpdateKeyResultRequest request) {
        return keyResultService.update(keyResultId, request);
    }

    @DeleteMapping("/{keyResultId}")
    @Operation(summary = "Delete a key result")
    public void delete(@PathVariable("keyResultId") Long keyResultId) {
        keyResultService.delete(keyResultId);
    }
}
