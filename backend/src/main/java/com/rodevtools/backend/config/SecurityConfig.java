package com.rodevtools.backend.config;

import com.rodevtools.backend.security.JwtAuthFilter;
import com.rodevtools.backend.security.RateLimitFilter;
import com.rodevtools.backend.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final TokenService tokenService;
    private final RateLimitFilter rateLimitFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter() {
        return new JwtAuthFilter(tokenService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Enable CORS — auto-discovers the CorsConfigurationSource bean from WebConfig
            .cors(org.springframework.security.config.Customizer.withDefaults())

            // Disable CSRF — stateless JWT API, no cookies for auth
            .csrf(AbstractHttpConfigurer::disable)

            // Stateless session — no server-side session
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Security headers
            .headers(headers -> headers
                .contentTypeOptions(contentType -> {}) // X-Content-Type-Options: nosniff
                .frameOptions(frame -> frame.deny())   // X-Frame-Options: DENY
                .referrerPolicy(referrer ->
                    referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )
            )

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public authentication endpoints
                .requestMatchers("/auth/**").permitAll()

                // Public thumbnail proxy
                .requestMatchers("/api/thumbnails", "/api/thumbnails/**").permitAll()

                // Public GET for game listing
                .requestMatchers(HttpMethod.GET, "/api/universes", "/api/universes/**").permitAll()

                // External API (handled by ApiKeyInterceptor)
                .requestMatchers("/api/external/**").permitAll()

                // Everything else requires authentication
                .anyRequest().authenticated()
            )

            // Rate limit filter runs first (reject abusive IPs before any auth logic)
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)

            // Add JWT filter before Spring Security's username/password filter
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
