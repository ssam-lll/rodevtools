package com.rodevtools.backend.controller;

import com.rodevtools.backend.dto.AuthResponseDto;
import com.rodevtools.backend.dto.ChangePasswordRequestDto;
import com.rodevtools.backend.dto.DeleteAccountRequestDto;
import com.rodevtools.backend.dto.LoginRequestDto;
import com.rodevtools.backend.dto.RegisterRequestDto;
import com.rodevtools.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
        AuthResponseDto response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/account")
    public ResponseEntity<Map<String, String>> deleteAccount(@RequestAttribute("userId") String userIdStr,
                                                             @Valid @RequestBody DeleteAccountRequestDto request) {
        authService.deleteAccount(UUID.fromString(userIdStr), request.password());
        return ResponseEntity.ok(Map.of("message", "Account and radar data deleted successfully"));
    }

    @PatchMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestAttribute("userId") String userIdStr,
                                                              @Valid @RequestBody ChangePasswordRequestDto request) {
        authService.changePassword(UUID.fromString(userIdStr), request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
