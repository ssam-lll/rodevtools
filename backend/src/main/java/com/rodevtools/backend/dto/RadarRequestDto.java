package com.rodevtools.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RadarRequestDto(
    @NotNull(message = "universeId is required")
    @Positive(message = "universeId must be positive")
    Long universeId
) {}
