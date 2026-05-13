package com.hpe.recipe.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import io.fabric8.kubernetes.client.Config;
import io.fabric8.kubernetes.client.ConfigBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import jakarta.annotation.PostConstruct;

@Component
@ConfigurationProperties(prefix = "app.kubernetes")
public class ClusterClientRegistry {

    // This map will automatically bind to the YAML structure above
    private Map<String, ClusterConfig> clusters = new HashMap<>();

    // This holds the actual live Fabric8 clients
    private final Map<String, KubernetesClient> activeClients = new HashMap<>();

    @PostConstruct
    public void initializeClients() {
        clusters.forEach((environment, config) -> {
            Config k8sConfig = new ConfigBuilder()
                    .withMasterUrl(config.getMasterUrl())
                    .withOauthToken(config.getToken())
                    .withNamespace(config.getNamespace())
                    .withTrustCerts(true) // Crucial for local Minikube testing
                    .build();

            activeClients.put(environment, new KubernetesClientBuilder().withConfig(k8sConfig).build());
        });
    }

    public Map<String, KubernetesClient> getActiveClients() {
        return activeClients;
    }

    // Getters/Setters for the YAML binding
    public Map<String, ClusterConfig> getClusters() {
        return clusters;
    }

    public void setClusters(Map<String, ClusterConfig> clusters) {
        this.clusters = clusters;
    }

    public static class ClusterConfig {
        private String masterUrl;
        private String token;
        private String namespace;
        // Getters and Setters...

        public String getMasterUrl() {
            return masterUrl;
        }

        public String getToken() {
            return token;
        }

        public String getNamespace() {
            return namespace;
        }

        public void setMasterUrl(String masterUrl) {
            this.masterUrl = masterUrl;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public void setNamespace(String namespace) {
            this.namespace = namespace;
        }

    }
}