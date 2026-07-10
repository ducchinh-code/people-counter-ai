package com.peoplecounter.core.module.auth.dto;

import com.peoplecounter.core.module.auth.User;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRoleRequest {

    @NotNull(message = "Role is required")
    private User.Role role;
}