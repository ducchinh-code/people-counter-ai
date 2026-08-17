package com.peoplecounter.core.module.auth;

import com.peoplecounter.base.web.BaseResponse;
import com.peoplecounter.core.module.audit.AuditAction;
import com.peoplecounter.core.module.audit.AuditLogService;
import com.peoplecounter.core.module.auth.dto.AuthResponse;
import com.peoplecounter.core.module.auth.dto.ChangePasswordRequest;
import com.peoplecounter.core.module.auth.dto.LoginRequest;
import com.peoplecounter.core.module.auth.dto.RegisterRequest;
import com.peoplecounter.core.module.auth.dto.ResetPasswordRequest;
import com.peoplecounter.core.web.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;

    private static final long STREAM_TOKEN_EXPIRATION_MS = 3*60_000;

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<BaseResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String ip = auditLogService.extractIp(httpRequest);
        try {
            AuthResponse response = authService.login(request);
            auditLogService.log(request.getUsername(), AuditAction.LOGIN_SUCCESS, ip);
            return ResponseEntity.ok(BaseResponse.ok("Login successful", response));
        } catch (AuthenticationException e) {
            auditLogService.log(request.getUsername(), AuditAction.LOGIN_FAILED, ip);
            throw e;
        }
    }

    // POST /api/auth/register
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.register(request);
        auditLogService.log(
                userDetails.getUsername(), AuditAction.REGISTER_USER,
                "USER", request.getUsername(), null,
                auditLogService.extractIp(httpRequest)
        );
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
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        var result = authService.toggleUser(id, userDetails.getUsername());
        auditLogService.log(
                userDetails.getUsername(), AuditAction.TOGGLE_USER,
                "USER", String.valueOf(id), "enabled=" + result.getEnabled(),
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity.ok(BaseResponse.ok(result));
    }

    // PUT /api/auth/users/{id}/role
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<com.peoplecounter.core.module.auth.dto.UserResponse>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody com.peoplecounter.core.module.auth.dto.UpdateRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        var result = authService.updateRole(id, request.getRole(), userDetails.getUsername());
        auditLogService.log(
                userDetails.getUsername(), AuditAction.UPDATE_ROLE,
                "USER", String.valueOf(id), "role=" + request.getRole(),
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity.ok(BaseResponse.ok(result));
    }

    // DELETE /api/auth/users/{id}
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<Void>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        authService.deleteUser(id, userDetails.getUsername());
        auditLogService.log(
                userDetails.getUsername(), AuditAction.DELETE_USER,
                "USER", String.valueOf(id), null,
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity.ok(BaseResponse.ok("User deleted", null));
    }

    // GET /api/auth/stream-token
    @GetMapping("/stream-token")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<String>> getStreamToken(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String token = jwtTokenProvider.generateToken(userDetails, STREAM_TOKEN_EXPIRATION_MS);
        return ResponseEntity.ok(BaseResponse.ok(token));
    }

    // PUT /api/auth/change-password
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BaseResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        authService.changePassword(
                userDetails.getUsername(),
                request.getOldPassword(),
                request.getNewPassword()
        );
        auditLogService.log(
                userDetails.getUsername(), AuditAction.CHANGE_PASSWORD,
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity.ok(BaseResponse.ok("Password changed successfully", null));
    }

    // PUT /api/auth/users/{id}/reset-password
    @PutMapping("/users/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<com.peoplecounter.core.module.auth.dto.UserResponse>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        var result = authService.resetPassword(id, request.getNewPassword());
        auditLogService.log(
                userDetails.getUsername(), AuditAction.RESET_PASSWORD,
                "USER", String.valueOf(id), null,
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity.ok(BaseResponse.ok("Password reset successfully", result));
    }
}