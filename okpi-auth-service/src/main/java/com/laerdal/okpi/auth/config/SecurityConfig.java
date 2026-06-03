package com.laerdal.okpi.auth.config;

import com.laerdal.okpi.auth.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AndRequestMatcher;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestHeaderRequestMatcher;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final String internalToken;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          @Value("${services.internal.token:okpi-internal-token}") String internalToken) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.internalToken = internalToken;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.disable())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/api/v1/auth/register", "/api/v1/auth/login",
                                "/api/v1/auth/refresh", "/api/v1/auth/logout",
                                "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers(internalNotificationMatcher()).permitAll()
                        .requestMatchers(internalUsersSummaryMatcher()).permitAll()
                        .requestMatchers(internalUsersListMatcher()).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    private AndRequestMatcher internalNotificationMatcher() {
        return new AndRequestMatcher(
                new AntPathRequestMatcher("/api/v1/notifications", HttpMethod.POST.name()),
                new RequestHeaderRequestMatcher("X-OKPI-Internal-Token", internalToken)
        );
    }

    private AndRequestMatcher internalUsersSummaryMatcher() {
        return new AndRequestMatcher(
                new AntPathRequestMatcher("/api/v1/auth/users/summary", HttpMethod.GET.name()),
                new RequestHeaderRequestMatcher("X-OKPI-Internal-Token", internalToken)
        );
    }

    private AndRequestMatcher internalUsersListMatcher() {
        return new AndRequestMatcher(
                new AntPathRequestMatcher("/api/v1/auth/users", HttpMethod.GET.name()),
                new RequestHeaderRequestMatcher("X-OKPI-Internal-Token", internalToken)
        );
    }
}