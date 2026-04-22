package com.laerdal.okpi.objective.controller;

import com.laerdal.okpi.objective.dto.request.CreateObjectiveRequest;
import com.laerdal.okpi.objective.dto.request.UpdateObjectiveRequest;
import com.laerdal.okpi.objective.dto.response.ObjectiveDetailResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveResponse;
import com.laerdal.okpi.objective.dto.response.OkrDashboardResponse;
import com.laerdal.okpi.objective.dto.response.PagedResponse;
import com.laerdal.okpi.objective.service.ObjectiveService;
import com.laerdal.okpi.objective.security.RequestContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/v1/objectives")
@RequiredArgsConstructor
@Tag(name = "Objectives", description = "OKR Objective management APIs")
public class ObjectiveController {

    private final ObjectiveService objectiveService;
    private final RequestContext requestContext;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new objective")
    public ObjectiveResponse create(@Valid @RequestBody CreateObjectiveRequest request) {
        Long userId = requestContext.getUserId();
        String userRole = requestContext.getUserRole();
        return objectiveService.create(request, userId, userRole);
    }

    @GetMapping
    @Operation(summary = "List objectives with pagination and filtering")
    public PagedResponse<ObjectiveResponse> list(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size,
                                                 @RequestParam(required = false) String status,
                                                 @RequestParam(required = false) Long ownerId,
                                                 @RequestParam(required = false) String search) {
        return objectiveService.list(page, size, status, ownerId, search);
    }

    @GetMapping("/{objectiveId}")
    @Operation(summary = "Get objective details with key results")
    public ObjectiveDetailResponse getById(@PathVariable Long objectiveId) {
        return objectiveService.getById(objectiveId);
    }

    @PutMapping("/{objectiveId}")
    public ObjectiveResponse update(@PathVariable Long objectiveId,
                                    @Valid @RequestBody UpdateObjectiveRequest request) {
        return objectiveService.update(objectiveId, request);
    }

    @DeleteMapping("/{objectiveId}")
    public void delete(@PathVariable Long objectiveId) {
        objectiveService.delete(objectiveId);
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Aggregated OKR dashboard summary")
    public OkrDashboardResponse dashboard(@RequestParam(required = false) Long ownerId) {
        return objectiveService.dashboard(ownerId);
    }
}
