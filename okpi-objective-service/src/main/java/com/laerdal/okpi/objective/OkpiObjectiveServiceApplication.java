package com.laerdal.okpi.objective;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class OkpiObjectiveServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OkpiObjectiveServiceApplication.class, args);
    }
}