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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final TokenService tokenService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();

        if (path.startsWith("/auth/")) {
            return true;
        }

        if (path.startsWith("/api/thumbnails")) {
            return true;
        }

        if (path.startsWith("/api/universes") && "GET".equalsIgnoreCase(method)) {
            return true;
        }

        if (path.startsWith("/api/external/")) {
            return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorized(response, "Token requerido");
            return;
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = tokenService.validateAndGetClaims(token);

            String userId = claims.getSubject();
            String username = claims.get("username", String.class);
            if (username == null) {
                username = claims.get("email", String.class);
            }
            String role = claims.get("role", String.class);

            request.setAttribute("userId", userId);
            request.setAttribute("username", username);
            request.setAttribute("role", role);

            List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "USER"))
            );
            UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authToken);

            filterChain.doFilter(request, response);
        } catch (JwtException | IllegalArgumentException e) {
            sendUnauthorized(response, "Token inválido o expirado");
        }
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" +
            message.replace("\"", "\\\"").replace("\n", "").replace("\r", "") + "\"}");
    }
}
