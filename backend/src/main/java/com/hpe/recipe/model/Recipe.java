package com.hpe.recipe.model;

import java.util.List;
import java.util.Map;

public class Recipe {

    private String version;
    private String description;
    private Map<String, String> components;
    private List<String> upgradePaths;

    public Recipe() {}

    public Recipe(String version, String description, Map<String, String> components, List<String> upgradePaths) {
        this.version = version;
        this.description = description;
        this.components = components;
        this.upgradePaths = upgradePaths;
    }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Map<String, String> getComponents() { return components; }
    public void setComponents(Map<String, String> components) { this.components = components; }

    public List<String> getUpgradePaths() { return upgradePaths; }
    public void setUpgradePaths(List<String> upgradePaths) { this.upgradePaths = upgradePaths; }
}
