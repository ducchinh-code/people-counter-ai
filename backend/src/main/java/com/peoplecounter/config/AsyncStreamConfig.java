package com.peoplecounter.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Mặc định, khi không có TaskExecutor nào được cấu hình, Spring MVC dùng
 * SimpleAsyncTaskExecutor cho các response kiểu StreamingResponseBody
 * (dùng ở StreamController cho MJPEG) — executor này tạo MỘT THREAD HỆ ĐIỀU
 * HÀNH MỚI cho MỖI connection, không giới hạn số lượng, sống suốt vòng đời
 * connection (có thể là vô hạn với MJPEG).
 *
 * Khi người dùng zoom/tắt-mở camera liên tục hoặc chuyển trang khiến nhiều
 * camera unmount/remount cùng lúc, số connection mở/đóng dồn dập có thể tạo
 * ra rất nhiều thread trong thời gian ngắn, gây áp lực CPU/GC cho JVM và làm
 * chậm luôn cả các request khác (WebSocket, API bình thường) — góp phần gây
 * hiện tượng "mất kết nối" hàng loạt sau khi thao tác nhiều.
 *
 * Cấu hình 1 thread pool có giới hạn (bounded) riêng cho async request giúp
 * ràng buộc mức tài nguyên tối đa, tránh việc 1 lượng lớn client thao tác
 * dồn dập làm sập cả server.
 */
@Slf4j
@Configuration
public class AsyncStreamConfig implements WebMvcConfigurer {

    private static final int CORE_POOL_SIZE = 20;
    private static final int MAX_POOL_SIZE = 100;
    private static final int QUEUE_CAPACITY = 50;

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(CORE_POOL_SIZE);
        executor.setMaxPoolSize(MAX_POOL_SIZE);
        executor.setQueueCapacity(QUEUE_CAPACITY);
        executor.setThreadNamePrefix("mjpeg-stream-");
        executor.initialize();

        log.info(
                "AsyncStreamConfig: bounded task executor cho MVC async — core={}, max={}, queue={}",
                CORE_POOL_SIZE, MAX_POOL_SIZE, QUEUE_CAPACITY
        );

        configurer.setTaskExecutor(executor);
    }
}
