package com.laerdal.okpi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class OkpiApplication {

    public static void main(String[] args) {
        SpringApplication.run(OkpiApplication.class, args);
    }
}
