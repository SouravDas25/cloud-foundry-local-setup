package com.sap.sample.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class MainController {

    private static final Logger LOGGER = LoggerFactory.getLogger(MainController.class);

    @GetMapping(value = "/hello")
    public String hello() {
        return "hello " + System.currentTimeMillis();
    }

}
