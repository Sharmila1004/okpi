package com.laerdal.okpi.auth.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class AssignTeamRequest {
    @NotNull
    private List<Long> memberIds;
}
