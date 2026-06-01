package com.rodevtools.backend.service;

import com.rodevtools.backend.dto.AuthResponseDto;
import com.rodevtools.backend.dto.LoginRequestDto;
import com.rodevtools.backend.dto.RegisterRequestDto;
import com.rodevtools.backend.model.User;
import com.rodevtools.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;

    public AuthResponseDto register(RegisterRequestDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(hashedPassword);
        // Salt is embedded within BCrypt hash — separate salt field no longer needed
        user.setSalt("BCRYPT");
        user.setRole("USER");

        userRepository.save(user);

        String token = tokenService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponseDto(token, user.getEmail(), user.getRole());
    }

    public AuthResponseDto login(LoginRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = tokenService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponseDto(token, user.getEmail(), user.getRole());
    }
}
