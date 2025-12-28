package com.utilityzone.config;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.apache.catalina.connector.Connector;

@Configuration
public class TomcatForceConfig {

    @Bean
    public TomcatServletWebServerFactory tomcatFactory() {
        return new TomcatServletWebServerFactory() {
            @Override
            protected void customizeConnector(Connector connector) {
                connector.setMaxPostSize(-1);      // UNLIMITED
                    connector.setProperty("maxSwallowSize", "-1");   // UNLIMITED
                System.out.println("✅ Tomcat upload limits DISABLED");
            }
        };
    }
}
