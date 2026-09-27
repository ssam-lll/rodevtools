package com.rodevtools.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final Cache<String, Bucket> loginBuckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(30))
            .maximumSize(10_000)
            .build();
    private final Cache<String, Bucket> registerBuckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofHours(2))
            .maximumSize(10_000)
            .build();
    private final Cache<String, Bucket> thumbnailBuckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(5))
            .maximumSize(20_000)
            .build();
    private final Cache<String, Bucket> generalBuckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(10))
            .maximumSize(20_000)
            .build();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();
        String clientIp = getClientIp(request);

        Bucket bucket = resolveBucket(path, clientIp);

        if (bucket == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP {} on path {}", clientIp, path);
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.setHeader("Retry-After", "60");
            response.getWriter().write(
                "{\"error\": \"Too Many Requests\", \"message\": \"Rate limit exceeded. Please try again later.\"}"
            );
        }
    }

    private Bucket resolveBucket(String path, String clientIp) {
        if (path.startsWith("/auth/login")) {
            return loginBuckets.get(clientIp, k -> createBucket(5, Duration.ofMinutes(15)));
        }

        if (path.startsWith("/auth/register")) {
            return registerBuckets.get(clientIp, k -> createBucket(3, Duration.ofHours(1)));
        }

        if (path.startsWith("/api/thumbnails")) {
            return thumbnailBuckets.get(clientIp, k -> createBucket(500, Duration.ofMinutes(1)));
        }

        if (path.startsWith("/api/")) {
            return generalBuckets.get(clientIp, k -> createBucket(60, Duration.ofMinutes(1)));
        }

        return null;
    }

    private Bucket createBucket(int capacity, Duration refillDuration) {
        return Bucket.builder()
            .addLimit(
                Bandwidth.classic(capacity, Refill.intervally(capacity, refillDuration))
            )
            .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
