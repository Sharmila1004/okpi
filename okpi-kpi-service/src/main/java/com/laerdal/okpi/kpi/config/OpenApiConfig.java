package com.laerdal.okpi.kpi.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI kpiServiceOpenApi() {
        return new OpenAPI().info(new Info()
                .title("OKPI KPI Service")
                .version("v1")
                .description("KPI definition and entry management APIs"));
    }
}
