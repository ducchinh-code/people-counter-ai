package com.peoplecounter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PeopleCounterApplication {

    public static void main(String[] args) {
        SpringApplication.run(PeopleCounterApplication.class, args);
    }
}
