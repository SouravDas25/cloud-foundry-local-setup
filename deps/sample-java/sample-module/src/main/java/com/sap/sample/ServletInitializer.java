package com.sap.sample;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * Servlet Initializer class
 */
//@SuppressWarnings("deprecation")
public class ServletInitializer extends SpringBootServletInitializer {

	private static final Logger LOGGER = LoggerFactory.getLogger(ServletInitializer.class);

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(com.sap.sample.SpringBootApp.class);
	}

}
