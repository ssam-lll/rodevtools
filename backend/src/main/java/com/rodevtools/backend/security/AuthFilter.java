package com.rodevtools.backend.security;

import com.rodevtools.backend.service.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@RequiredArgsConstructor
public class AuthFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final String expectedApiKey;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();

        if (path.startsWith("/auth/")) return true;
        if (path.startsWith("/api/thumbnails")) return true;
        if (path.startsWith("/api/universes") && "GET".equalsIgnoreCase(method)) return true;

        return false;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // Strategy 1: Bearer JWT token
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = tokenService.validateAndGetClaims(token);
                setJwtAuthentication(request, claims);
                filterChain.doFilter(request, response);
                return;
            } catch (JwtException | IllegalArgumentException e) {
                sendUnauthorized(response, "Token inválido o expirado");
                return;
            }
        }

        // Strategy 2: X-API-Key header
        String apiKey = request.getHeader("X-API-Key");
        if (apiKey == null) {
            apiKey = request.getHeader("x-api-key");
        }
        if (apiKey == null) {
            apiKey = request.getHeader("X-API-KEY");
        }

        if (apiKey != null && expectedApiKey != null && !expectedApiKey.isBlank() && timingSafeEquals(apiKey, expectedApiKey)) {
            UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken("SERVICE", null,
                    List.of(new SimpleGrantedAuthority("ROLE_SERVICE")));
            SecurityContextHolder.getContext().setAuthentication(authToken);
            filterChain.doFilter(request, response);
            return;
        }

        // No valid credentials found
        sendUnauthorized(response, "Token o API Key requerida");
    }

    private void setJwtAuthentication(HttpServletRequest request, Claims claims) {
        String userId = claims.getSubject();
        String username = claims.get("username", String.class);
        if (username == null) {
            username = claims.get("email", String.class);
        }
        String role = claims.get("role", String.class);

        request.setAttribute("currentUser", claims);
        request.setAttribute("userId", userId);
        request.setAttribute("username", username);
        request.setAttribute("role", role);

        List<SimpleGrantedAuthority> authorities = List.of(
            new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "USER"))
        );
        UsernamePasswordAuthenticationToken authToken =
            new UsernamePasswordAuthenticationToken(userId, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }

    private boolean timingSafeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(
            a.getBytes(StandardCharsets.UTF_8),
            b.getBytes(StandardCharsets.UTF_8));
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" +
            message.replace("\"", "\\\"").replace("\n", "").replace("\r", "") + "\"}");
    }
}
