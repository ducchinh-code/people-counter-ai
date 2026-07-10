package com.peoplecounter.core.module.auth;

import com.peoplecounter.core.module.auth.dto.AuthResponse;
import com.peoplecounter.core.module.auth.dto.LoginRequest;
import com.peoplecounter.core.module.auth.dto.RegisterRequest;
import com.peoplecounter.core.module.auth.dto.UserResponse;
import com.peoplecounter.core.web.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        UserDetails userDetails = userDetailsService
                .loadUserByUsername(request.getUsername());

        String token = jwtTokenProvider.generateToken(userDetails);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow();

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException(
                    "Username already exists: " + request.getUsername()
            );
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)
                .build();

        userRepository.save(user);

        UserDetails userDetails = userDetailsService
                .loadUserByUsername(user.getUsername());

        String token = jwtTokenProvider.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found: " + username
                ));
    }

    public java.util.List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse toggleUser(Long id, String currentUsername) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found: " + id
                ));

        if (user.getUsername().equals(currentUsername)) {
            throw new IllegalArgumentException(
                    "You cannot disable your own account"
            );
        }

        user.setEnabled(!user.getEnabled());
        userRepository.save(user);

        return UserResponse.from(user);
    }

    public UserResponse updateRole(Long id, User.Role role, String currentUsername) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found: " + id
                ));

        if (user.getUsername().equals(currentUsername) && role != User.Role.ADMIN) {
            throw new IllegalArgumentException(
                    "You cannot remove your own ADMIN role"
            );
        }

        user.setRole(role);
        userRepository.save(user);

        return UserResponse.from(user);
    }

    public void deleteUser(Long id, String currentUsername) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found: " + id
                ));

        if (user.getUsername().equals(currentUsername)) {
            throw new IllegalArgumentException(
                    "You cannot delete your own account"
            );
        }

        userRepository.delete(user);
    }
}