package com.peoplecounter.core.module.audit;

import com.peoplecounter.core.module.audit.dto.AuditLogResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, AuditAction action, String targetType,
                    String targetId, String detail, String ipAddress) {
        try {
            AuditLog entry = new AuditLog();
            entry.setUsername(username);
            entry.setAction(action.name());
            entry.setTargetType(targetType);
            entry.setTargetId(targetId == null ? null : String.valueOf(targetId));
            entry.setDetail(detail);
            entry.setIpAddress(ipAddress);
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to write audit log (action={}, username={}): {}",
                    action, username, e.getMessage());
        }
    }

    public void log(String username, AuditAction action, String ipAddress) {
        log(username, action, null, null, null, ipAddress);
    }

    public String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public Page<AuditLogResponse> search(String username, String action, Pageable pageable) {
        return auditLogRepository
                .search(blankToNull(username), blankToNull(action), pageable)
                .map(AuditLogResponse::from);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}