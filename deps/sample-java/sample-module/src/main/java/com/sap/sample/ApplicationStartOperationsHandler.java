package com.sap.sample;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class ApplicationStartOperationsHandler {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ApplicationStartOperationsHandler.class);

	public void init() {
		LOGGER.info("Initial Start");
	}
}
