package com.hpe.recipe.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "kubernetes")
public class KubernetesProperties {

    private Map<String, Cluster> clusters;

    // ✅ Getter
    public Map<String, Cluster> getClusters() {
        return clusters;
    }

    // ✅ Setter
    public void setClusters(Map<String, Cluster> clusters) {
        this.clusters = clusters;
    }

    public java.util.List<String> getClusterNames() {
        if (clusters == null || clusters.isEmpty()) {
            return Collections.emptyList();
        }

        return new ArrayList<>(clusters.keySet());
    }

    // Inner class
    public static class Cluster {
        private String context;
        private String namespace;

        // Getter
        public String getContext() {
            return context;
        }

        // Setter
        public void setContext(String context) {
            this.context = context;
        }

        public String getNamespace() {
            return namespace;
        }

        public void setNamespace(String namespace) {
            this.namespace = namespace;
        }
    }
}