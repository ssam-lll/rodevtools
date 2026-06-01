package com.rodevtools.backend.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class TokenService {

    @Value("${jwt.secret}")
    private String hmacSecret;

    @Value("${jwt.expirationtime}")
    private Long expirationTimeInMs;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] decodedKey = Base64.getDecoder().decode(hmacSecret);
        this.signingKey = Keys.hmacShaKeyFor(decodedKey);
    }

    public String generateToken(UUID userId, String email, String role) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationTimeInMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString()) // jti — unique token identifier for revocation
                .subject(userId.toString())
                .claims(Map.of(
                        "email", email,
                        "username", email,
                        "role", role
                ))
                .issuedAt(now)
                .expiration(expiration)
                .signWith(signingKey)
                .compact();
    }

    public Claims validateAndGetClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID getUserId(String token) {
        return UUID.fromString(validateAndGetClaims(token).getSubject());
    }

    public String getUsername(String token) {
        String username = validateAndGetClaims(token).get("username", String.class);
        if (username == null) {
            username = validateAndGetClaims(token).get("email", String.class);
        }
        return username;
    }

    public String getRole(String token) {
        return validateAndGetClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            validateAndGetClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
