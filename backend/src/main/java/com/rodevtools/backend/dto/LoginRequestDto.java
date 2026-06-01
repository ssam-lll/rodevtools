package com.rodevtools.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequestDto {

    @NotBlank(message = "Email is required")
    @jakarta.validation.constraints.Email(message = "Email must be a valid email address")
    @Size(max = 50, message = "Email must not exceed 50 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(max = 128, message = "Password must not exceed 128 characters")
    private String password;
}
