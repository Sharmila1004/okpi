package com.laerdal.okpi.objective.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI objectiveServiceOpenApi() {
        return new OpenAPI().info(new Info()
                .title("OKPI Objective Service")
                .version("v1")
                .description("Objective and key result management APIs"));
    }
}
