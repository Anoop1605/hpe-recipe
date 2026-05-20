package com.hpe.recipe.service;

import com.hpe.recipe.model.Catalog;
import com.hpe.recipe.model.HelmRelease;
import com.hpe.recipe.model.Recipe;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CatalogService {

    private final HelmReleaseService helmReleaseService;

    public CatalogService(HelmReleaseService helmReleaseService) {
        this.helmReleaseService = helmReleaseService;
    }

    public List<Catalog> getAllCatalogs(String cluster) {
        return helmReleaseService.getAllHelmReleases(cluster).stream()
                .map(r -> new Catalog(r.getVersion(), r.getReleaseName(), r.getRecipes()))
                .collect(Collectors.toList());
    }

    public List<Recipe> getRecipesByCatalog(String cluster, String catalogVersion) {
        return helmReleaseService.getAllHelmReleases(cluster).stream()
                .filter(c -> c.getVersion().equals(catalogVersion))
                .findFirst()
                .map(HelmRelease::getRecipes)
                .orElse(Collections.emptyList());
    }

    public Map<String, String> getComponentsByRecipe(String recipeVersion) {
        return Collections.emptyMap();
    }

    public List<String> getUpgradePaths(String recipeVersion) {
        return Collections.emptyList();
    }
}
