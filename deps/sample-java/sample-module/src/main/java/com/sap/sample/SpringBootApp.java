package com.sap.sample;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration;
import org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.AsyncConfigurerSupport;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import java.util.concurrent.Executor;

/**
 * Spring Boot main application class.
 */

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class,
        DataSourceTransactionManagerAutoConfiguration.class, LiquibaseAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class, JpaRepositoriesAutoConfiguration.class})
@EnableAsync
@EnableScheduling
@ComponentScan("com.sap.*")
public class SpringBootApp extends AsyncConfigurerSupport {

    private static final Logger LOGGER = LoggerFactory.getLogger(SpringBootApp.class);

    /**
     * Spring Boot Main Method
     *
     * @param args
     */

    @Bean
    @Primary
    public RestTemplate rest(RestTemplateBuilder builder) {
        return builder.build();
    }

    public static void main(String[] args) {
        SpringApplication.run(SpringBootApp.class, args);
    }

    @Bean(initMethod = "init")
    public ApplicationStartOperationsHandler actionsOnApplicationStartHandler() {
        return new ApplicationStartOperationsHandler();
    }

}
