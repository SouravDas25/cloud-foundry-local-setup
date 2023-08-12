package com.sap.sample.config;

import com.sap.cloud.security.xsuaa.XsuaaCredentials;
import com.sap.cloud.security.xsuaa.XsuaaServiceConfigurationCustom;
import com.sap.cloud.security.xsuaa.extractor.AuthoritiesExtractor;
import com.sap.cloud.security.xsuaa.extractor.LocalAuthoritiesExtractor;
import com.sap.cloud.security.xsuaa.token.TokenAuthenticationConverter;
import com.sap.cloud.security.xsuaa.token.authentication.XsuaaJwtDecoderBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Configuration
@EnableWebSecurity(debug = false)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
	private final Logger logger = LoggerFactory.getLogger(WebSecurityConfig.class);

	@Override
	public void configure(HttpSecurity http) throws Exception {

		// @formatter:off
		http.sessionManagement()
				// session is created by approuter
				.sessionCreationPolicy(SessionCreationPolicy.NEVER)
				.and()
				// demand authentication
				.anonymous().and()
				// demand specific scopes depending on intended request
				.authorizeRequests()
//				// enable OAuth2 checks
////				.antMatchers("/").hasAuthority("Callback")
////				.antMatchers(GET, "/").permitAll()
////				.antMatchers(GET, "/test").permitAll()
////				.antMatchers(PUT, "/callback/v1.0/tenants*//**").permitAll()
////				.antMatchers(GET, "/callback/v1.0/dependencies*//**").permitAll()
////				.antMatchers(DELETE, "/callback/v1.0/tenants*//**").permitAll()
				.antMatchers("/*").authenticated()
//				.anyRequest().permitAll() //deny
				.and()
				.oauth2ResourceServer()
				.jwt()
				.jwtAuthenticationConverter(getJwtAuthoritiesConverter());
	}

	@Value("${vcap.services.sample-uaa.credentials.clientid}")
	String clientId;

	@Value("${vcap.services.sample-uaa.credentials.clientsecret}")
	String clientSecret;

	@Value("${vcap.services.sample-uaa.credentials.url}")
	String url;

	@Value("${vcap.services.sample-uaa.credentials.xsappname}")
	String xsappname;

	@Value("${vcap.services.sample-uaa.credentials.uaadomain}")
	String uaadomain;

	@Value("${vcap.services.sample-uaa.credentials.verificationkey}")
	String verificationkey;

	@Bean
	@Qualifier(value = "application")
	public XsuaaCredentials applicationCredentials() {
		XsuaaCredentials xsuaaApp = new XsuaaCredentials();
		xsuaaApp.setClientId(clientId);
		xsuaaApp.setClientSecret(clientSecret);
		xsuaaApp.setUrl(url);
		xsuaaApp.setXsAppName(xsappname);
		xsuaaApp.setUaaDomain(uaadomain);
		xsuaaApp.setVerificationKey(verificationkey);
		return xsuaaApp; // primary Xsuaa service binding, e.g. application
	}

	@Bean
	public JwtDecoder getJwtDecoder() {
		XsuaaServiceConfigurationCustom xsuaaServiceConfigurationCustom = new XsuaaServiceConfigurationCustom(applicationCredentials());
//		XsuaaAudienceValidator customAudienceValidator = new XsuaaAudienceValidator(xsuaaServiceConfigurationCustom);
//		customAudienceValidator.configureAnotherXsuaaInstance(customBrokerXsuaaConfig().getAppId(), customBrokerXsuaaConfig().getClientId());
		return new XsuaaJwtDecoderBuilder(xsuaaServiceConfigurationCustom).build();
	}

	@Bean
	TokenAuthenticationConverter getJwtAuthoritiesConverter() {
		LocalAuthoritiesExtractor extractor = new LocalAuthoritiesExtractor(xsappname);
		AuthoritiesExtractor combinedExtractor =
				jwt -> {
					Collection<GrantedAuthority> authorities1 = extractor.getAuthorities(jwt);
					List<GrantedAuthority> combinedAuthorities = new ArrayList<>(authorities1);
					logger.debug("combinedAuthorities: " + combinedAuthorities);
					return combinedAuthorities;
				};
		return new TokenAuthenticationConverter(combinedExtractor);
	}
}
