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
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter using Bucket4j.
 * Applies different rate limits based on the endpoint:
 * <ul>
 *   <li>/auth/login — 5 requests per 15 minutes per IP (brute force protection)</li>
 *   <li>/auth/register — 3 requests per hour per IP (spam protection)</li>
 *   <li>/api/thumbnails — 500 requests per minute per IP (proxy abuse protection)</li>
 *   <li>All other /api/ — 60 requests per minute per IP (general protection)</li>
 * </ul>
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    // Separate caches per endpoint category to keep limits independent
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> registerBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> thumbnailBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();
        String clientIp = getClientIp(request);

        Bucket bucket = resolveBucket(path, clientIp);

        if (bucket == null) {
            // No rate limit for this path
            filterChain.doFilter(request, response);
            return;
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP {} on path {}", clientIp, path);
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json;charset=UTF-8");
            response.setHeader("Retry-After", "60");
            response.getWriter().write(
                "{\"error\": \"Too Many Requests\", \"message\": \"Rate limit exceeded. Please try again later.\"}"
            );
        }
    }

    private Bucket resolveBucket(String path, String clientIp) {
        if (path.startsWith("/auth/login")) {
            // 5 requests per 15 minutes — brute force protection
            return loginBuckets.computeIfAbsent(clientIp, k -> createBucket(5, Duration.ofMinutes(15)));
        }

        if (path.startsWith("/auth/register")) {
            // 3 requests per hour — spam protection
            return registerBuckets.computeIfAbsent(clientIp, k -> createBucket(3, Duration.ofHours(1)));
        }

        if (path.startsWith("/api/thumbnails")) {
            // 500 requests per minute — proxy abuse protection
            return thumbnailBuckets.computeIfAbsent(clientIp, k -> createBucket(500, Duration.ofMinutes(1)));
        }

        if (path.startsWith("/api/")) {
            // 60 requests per minute — general protection
            return generalBuckets.computeIfAbsent(clientIp, k -> createBucket(60, Duration.ofMinutes(1)));
        }

        // No rate limit for other paths
        return null;
    }

    private Bucket createBucket(int capacity, Duration refillDuration) {
        return Bucket.builder()
            .addLimit(
                Bandwidth.classic(capacity, Refill.intervally(capacity, refillDuration))
            )
            .build();
    }

    /**
     * Extract client IP, respecting X-Forwarded-For header for proxied requests.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // Take only the first IP (client IP), ignore proxy chain
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
