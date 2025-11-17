package com.utilityzone.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtils jwtUtils;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            // Explicitly disable HTTP Basic and form login to avoid browser basic-auth popups
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception
                // Return JSON on 401 instead of Basic challenge header which triggers browser popup
                .authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"message\":\"Please login to continue\",\"status\":401}");
                })
                // Return JSON on 403 (forbidden)
                .accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"message\":\"You do not have permission to perform this action.\",\"status\":403}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/auth/account").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/auth/profile").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/auth/profile/email").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/auth/profile/password").authenticated()
                .requestMatchers(
                    "/api/auth/**",
                    "/h2-console/**",
                    "/games/falling-ball/**",
                    "/api/currency/**",
                    "/api/timezone/**",
                    "/api/converter/**",
                    "/api/qr/**",
                    "/api/greeting/**",
                    // Public Canva templates
                    "/api/canva-templates",
                    "/api/canva-templates/mockups/**",
                    "/api/canva-templates/pdfs/**",
                    // Expose Actuator endpoints
                    "/api/actuator/**",
                    "/actuator/**",
                    "/api/ebooks",
                    "/api/ebooks/newsletter/**",
                    "/api/blogs",
                    "/api/blogs/{id}"
                ).permitAll()
                // Protected blog management endpoints
                .requestMatchers(
                    "/api/blogs/*/edit",
                    "/api/blogs/*/delete",
                    "/api/blogs/create"
                ).authenticated()
                // Allow GET for blog endpoints
                .requestMatchers(HttpMethod.GET, "/api/blogs/**").permitAll()
                // Allow GET for articles endpoints publicly
                .requestMatchers(HttpMethod.GET, "/api/articles/**").permitAll()
                // Require authentication for POST, PUT, DELETE on blog endpoints
                .requestMatchers(HttpMethod.POST, "/api/blogs/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/blogs/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/blogs/**").authenticated()
                // Article endpoints
                .requestMatchers(HttpMethod.GET, "/api/articles/drafts/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/articles/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/articles/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/articles/**").hasRole("ADMIN")
                // Ebooks admin endpoints
                .requestMatchers(HttpMethod.POST, "/api/admin/ebooks/**").hasRole("ADMIN")
                // All other endpoints are public
                .anyRequest().permitAll()
            )
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .addFilterBefore(authTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthTokenFilter authTokenFilter() {
        return new AuthTokenFilter(jwtUtils, userDetailsService);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("http://localhost:5173");
        configuration.addAllowedOrigin("https://utilityzone.in");
        configuration.addAllowedOrigin("https://www.utilityzone.in");
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @SuppressWarnings("deprecation")
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setPasswordEncoder(passwordEncoder());
        provider.setUserDetailsService(userDetailsService);
        // Expose UsernameNotFoundException instead of converting to BadCredentialsException
        // so we can return a clearer message to the client on /api/auth/signin
        provider.setHideUserNotFoundExceptions(false);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}