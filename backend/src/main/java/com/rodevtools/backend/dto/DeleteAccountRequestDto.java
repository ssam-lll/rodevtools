package com.rodevtools.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequestDto(@NotBlank(message = "Password is required") String password) {}
