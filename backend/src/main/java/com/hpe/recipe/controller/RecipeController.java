package com.hpe.recipe.controller;

import com.hpe.recipe.model.Recipe;
import com.hpe.recipe.service.CatalogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/recipes")
public class RecipeController {

    private final CatalogService catalogService;

    public RecipeController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/{recipeVersion}/components")
    public Map<String, String> getComponents(@PathVariable String recipeVersion) {
        return catalogService.getComponentsByRecipe(recipeVersion);
    }

    @GetMapping("/{recipeVersion}/upgradePaths")
    public List<String> getUpgradePaths(@PathVariable String recipeVersion) {
        return catalogService.getUpgradePaths(recipeVersion);
    }
}
