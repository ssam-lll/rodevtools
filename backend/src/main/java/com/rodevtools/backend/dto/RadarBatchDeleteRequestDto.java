package com.rodevtools.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record RadarBatchDeleteRequestDto(
    @NotEmpty(message = "universeIds list cannot be empty")
    List<@NotNull @Positive Long> universeIds
) {}
