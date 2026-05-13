package com.hpe.recipe.service;

import com.hpe.recipe.model.Catalog;
import com.hpe.recipe.model.Recipe;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CatalogService {

    private final List<Catalog> catalogs;

    public CatalogService() {
        this.catalogs = buildSampleCatalogs();
    }

    public List<Catalog> getAllCatalogs() {
        return catalogs;
    }

    public List<Recipe> getRecipesByCatalog(String catalogVersion) {
        return catalogs.stream()
                .filter(c -> c.getVersion().equals(catalogVersion))
                .findFirst()
                .map(Catalog::getRecipes)
                .orElse(Collections.emptyList());
    }

    public Map<String, String> getComponentsByRecipe(String recipeVersion) {
        return catalogs.stream()
                .flatMap(c -> c.getRecipes().stream())
                .filter(r -> r.getVersion().equals(recipeVersion))
                .findFirst()
                .map(Recipe::getComponents)
                .orElse(Collections.emptyMap());
    }

    public List<String> getUpgradePaths(String recipeVersion) {
        return catalogs.stream()
                .flatMap(c -> c.getRecipes().stream())
                .filter(r -> r.getVersion().equals(recipeVersion))
                .findFirst()
                .map(Recipe::getUpgradePaths)
                .orElse(Collections.emptyList());
    }

    private List<Catalog> buildSampleCatalogs() {
        Recipe r141 = new Recipe("1.4.1", "HPE Ezmeral Runtime 1.4.1",
                Map.of("spark", "3.3.1", "kafka", "3.4.0", "airflow", "2.6.3", "hbase", "2.5.5"),
                List.of("1.4.0", "1.3.2"));

        Recipe r140 = new Recipe("1.4.0", "HPE Ezmeral Runtime 1.4.0",
                Map.of("spark", "3.3.0", "kafka", "3.3.2", "airflow", "2.5.3", "hbase", "2.5.4"),
                List.of("1.3.2", "1.3.1"));

        Recipe r132 = new Recipe("1.3.2", "HPE Ezmeral Runtime 1.3.2",
                Map.of("spark", "3.2.1", "kafka", "3.2.3", "airflow", "2.4.3", "hbase", "2.4.9"),
                List.of("1.3.1", "1.3.0"));

        Catalog catalog164 = new Catalog("v0.0.164", "Production Catalog", List.of(r141, r140, r132));

        Recipe r131 = new Recipe("1.3.1", "HPE Ezmeral Runtime 1.3.1",
                Map.of("spark", "3.2.0", "kafka", "3.2.1", "airflow", "2.4.1", "hbase", "2.4.8"),
                List.of("1.3.0"));

        Recipe r130 = new Recipe("1.3.0", "HPE Ezmeral Runtime 1.3.0",
                Map.of("spark", "3.1.2", "kafka", "3.1.0", "airflow", "2.3.0", "hbase", "2.4.6"),
                List.of());

        Catalog catalog163 = new Catalog("v0.0.163", "Staging Catalog", List.of(r131, r130));

        return List.of(catalog164, catalog163);
    }
}
