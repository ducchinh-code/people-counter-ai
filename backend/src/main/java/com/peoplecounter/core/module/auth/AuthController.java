package com.peoplecounter.core.module.auth;

import com.peoplecounter.base.web.BaseResponse;
import com.peoplecounter.core.module.auth.dto.AuthResponse;
import com.peoplecounter.core.module.auth.dto.LoginRequest;
import com.peoplecounter.core.module.auth.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<BaseResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(BaseResponse.ok("Login successful", response));
    }

    // POST /api/auth/register
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(
                BaseResponse.ok("User registered successfully", response)
        );
    }

    // GET /api/auth/me
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<User>> me(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(BaseResponse.ok(user));
    }

    // GET /api/auth/users
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<java.util.List<com.peoplecounter.core.module.auth.dto.UserResponse>>> listUsers() {
        return ResponseEntity.ok(BaseResponse.ok(authService.listUsers()));
    }

    // PATCH /api/auth/users/{id}/toggle
    @PatchMapping("/users/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<com.peoplecounter.core.module.auth.dto.UserResponse>> toggleUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        var result = authService.toggleUser(id, userDetails.getUsername());
        return ResponseEntity.ok(BaseResponse.ok(result));
    }

    // PUT /api/auth/users/{id}/role
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<com.peoplecounter.core.module.auth.dto.UserResponse>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody com.peoplecounter.core.module.auth.dto.UpdateRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        var result = authService.updateRole(id, request.getRole(), userDetails.getUsername());
        return ResponseEntity.ok(BaseResponse.ok(result));
    }

    // DELETE /api/auth/users/{id}
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<Void>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        authService.deleteUser(id, userDetails.getUsername());
        return ResponseEntity.ok(BaseResponse.ok("User deleted", null));
    }
}