package com.rodevtools.backend.security;

import com.rodevtools.backend.service.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
@RequiredArgsConstructor
public class ApikeyInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;

    @Value("${app.api-key}")
    private String expectedApiKey;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();
        String path = request.getServletPath();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            return true;
        }
        if (path.startsWith("/api/thumbnails")) {
            return true;
        }
        if (path.startsWith("/auth/")) {
            return true;
        }
        if (path.startsWith("/api/universes") && "GET".equalsIgnoreCase(method)) {
            return true;
        }

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (tokenService.isTokenValid(token)) {
                    Claims claims = tokenService.validateAndGetClaims(token);

                    request.setAttribute("currentUser", claims);
                    request.setAttribute("userId", claims.getSubject());

                    String username = claims.get("username", String.class);
                    if (username == null) {
                        username = claims.get("email", String.class);
                    }
                    request.setAttribute("username", username);
                    request.setAttribute("role", claims.get("role", String.class));

                    return true;
                }
            } catch (JwtException | IllegalArgumentException e) {
            }
        }

        String apiKey = request.getHeader("X-API-Key");
        if (apiKey == null) {
            apiKey = request.getHeader("x-api-key");
        }
        if (apiKey == null) {
            apiKey = request.getHeader("X-API-KEY");
        }

        if (apiKey != null && timingSafeEquals(apiKey, expectedApiKey)) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\": \"Acceso denegado. Token o API Key invalida o faltante\"}");
        return false;
    }

    private boolean timingSafeEquals(String a, String b) {
        return MessageDigest.isEqual(
            a.getBytes(StandardCharsets.UTF_8),
            b.getBytes(StandardCharsets.UTF_8)
        );
    }
}
