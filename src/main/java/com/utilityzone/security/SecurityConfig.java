package com.utilityzone.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Autowired
    private JwtUtils jwtUtils;

    @Bean
    public JwtAuthenticationFilter authenticationJwtTokenFilter() {
        return new JwtAuthenticationFilter(jwtUtils, userDetailsService);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Disable CSRF and frame options for H2 Console
        http.csrf().disable()
            .headers().frameOptions().disable()
            .and()
            // Enable CORS
            .cors()
            .and()
            // Configure session management
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            // Configure exception handling
            .exceptionHandling()
            .authenticationEntryPoint(unauthorizedHandler)
            .and()
            // Configure authorization
            .authorizeHttpRequests()
            // H2 Console access
            .requestMatchers(new AntPathRequestMatcher("/h2-console/**")).permitAll()
            // Public endpoints
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/currency/**").permitAll()
            .requestMatchers("/api/timezone/**").permitAll()
            .requestMatchers("/api/qrcode/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/blogs/**").permitAll()
            // File converter endpoints (explicitly permit all HTTP methods)
            .requestMatchers(HttpMethod.GET, "/api/converter/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/converter/**").permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/api/converter/**").permitAll()
            // Protected endpoints
            .requestMatchers(HttpMethod.POST, "/api/blogs/**").authenticated()
            .requestMatchers(HttpMethod.PUT, "/api/blogs/**").authenticated()
            .requestMatchers(HttpMethod.DELETE, "/api/blogs/**").authenticated()
            .anyRequest().authenticated();

        http.authenticationProvider(authenticationProvider())
            .addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
