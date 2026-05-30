package com.hpe.recipe.controller;

import com.hpe.recipe.config.KubernetesProperties;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/kubernetes")
public class KubernetesController {

    private final KubernetesProperties kubernetesProperties;

    public KubernetesController(KubernetesProperties kubernetesProperties) {
        this.kubernetesProperties = kubernetesProperties;
    }

    @GetMapping("/clusters")
    public List<Map<String, String>> getClusters() {
        if (kubernetesProperties.getClusters() == null || kubernetesProperties.getClusters().isEmpty()) {
            return List.of();
        }

        return kubernetesProperties.getClusters().entrySet().stream()
                .map(entry -> {
                    Map<String, String> cluster = new LinkedHashMap<>();
                    cluster.put("name", entry.getKey());
                    if (entry.getValue().getContext() != null) {
                        cluster.put("context", entry.getValue().getContext());
                    }
                    if (entry.getValue().getNamespace() != null) {
                        cluster.put("namespace", entry.getValue().getNamespace());
                    }
                    return cluster;
                })
                .toList();
    }
}