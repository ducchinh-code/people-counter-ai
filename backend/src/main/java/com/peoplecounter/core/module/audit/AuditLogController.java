package com.peoplecounter.core.module.audit;

import com.peoplecounter.base.web.BaseResponse;
import com.peoplecounter.core.module.audit.dto.AuditLogResponse;
import com.peoplecounter.core.module.audit.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<BaseResponse<PageResponse<AuditLogResponse>>> search(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<AuditLogResponse> result =
                PageResponse.from(auditLogService.search(username, action, pageable));
        return ResponseEntity.ok(BaseResponse.ok(result));
    }
}