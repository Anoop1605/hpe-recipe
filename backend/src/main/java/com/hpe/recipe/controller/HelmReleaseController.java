package com.hpe.recipe.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hpe.recipe.config.ReleaseWebSocketHandler;
import com.hpe.recipe.model.HelmRelease;
import com.hpe.recipe.model.Recipe;
import com.hpe.recipe.service.GitOpsService;
import com.hpe.recipe.service.HelmReleaseService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/helm-releases")
public class HelmReleaseController {

    private final HelmReleaseService helmReleaseService;
    private final ReleaseWebSocketHandler wsHandler;
    private final GitOpsService gitOpsService;

    public HelmReleaseController(HelmReleaseService helmReleaseService,
            ReleaseWebSocketHandler wsHandler,
            GitOpsService gitOpsService) {
        this.helmReleaseService = helmReleaseService;
        this.wsHandler = wsHandler;
        this.gitOpsService = gitOpsService;
    }

    @GetMapping
    public List<HelmRelease> getAllHelmReleases() {
        return helmReleaseService.getAllHelmReleases();
    }

    @GetMapping("/{version}")
    public ResponseEntity<HelmRelease> getHelmRelease(@PathVariable String version) {
        HelmRelease release = helmReleaseService.getHelmRelease(version);
        if (release == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(release);
    }

    @PostMapping
    public ResponseEntity<HelmRelease> createHelmRelease(@RequestBody HelmRelease release) {
        HelmRelease created = helmReleaseService.createHelmRelease(release);
        if (created == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        wsHandler.broadcast("release_created", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{version}")
    public ResponseEntity<HelmRelease> updateHelmRelease(@PathVariable String version,
            @RequestBody HelmRelease release) {
        HelmRelease updated = helmReleaseService.updateHelmRelease(version, release);
        if (updated == null)
            return ResponseEntity.notFound().build();
        wsHandler.broadcast("release_updated", updated);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{version}/status")
    public ResponseEntity<HelmRelease> updateStatus(@PathVariable String version,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isEmpty())
            return ResponseEntity.badRequest().build();
        HelmRelease release = helmReleaseService.getHelmRelease(version);
        if (release == null)
            return ResponseEntity.notFound().build();
        release.setStatus(status);
        wsHandler.broadcast("status_changed", Map.of("version", version, "status", status));
        return ResponseEntity.ok(release);
    }

    @PostMapping("/{version}/deploy")
    public ResponseEntity<?> deployRelease(@PathVariable String version) {
        HelmRelease release = helmReleaseService.getHelmRelease(version);
        if (release == null)
            return ResponseEntity.notFound().build();
        if (release.getRecipes() == null || release.getRecipes().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cannot deploy a release with no recipes"));
        }

        // Set status to deploying
        release.setStatus("deploying");
        wsHandler.broadcast("status_changed", Map.of("version", version, "status", "deploying"));

        try {
            gitOpsService.generateAndPush(release);
            return ResponseEntity.ok(Map.of(
                    "message", "Pushed to Git. Jenkins will deploy shortly.",
                    "version", version));
        } catch (Exception e) {
            release.setStatus("push_failed");
            wsHandler.broadcast("status_changed", Map.of("version", version, "status", "push_failed"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Git push failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{version}")
    public ResponseEntity<Void> deleteHelmRelease(@PathVariable String version) {
        boolean deleted = helmReleaseService.deleteHelmRelease(version);
        if (!deleted)
            return ResponseEntity.notFound().build();
        wsHandler.broadcast("release_deleted", Map.of("version", version));
        return ResponseEntity.noContent().build();
    }

    // Recipe CRUD within a helm release
    @GetMapping("/{version}/recipes")
    public List<Recipe> getRecipes(@PathVariable String version) {
        return helmReleaseService.getRecipesByHelmVersion(version);
    }

    @PostMapping("/{version}/recipes")
    public ResponseEntity<Recipe> addRecipe(@PathVariable String version,
            @RequestBody Recipe recipe) {
        Recipe added = helmReleaseService.addRecipeToRelease(version, recipe);
        if (added == null)
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        wsHandler.broadcast("recipe_added", Map.of("helmVersion", version, "recipe", added));
        return ResponseEntity.status(HttpStatus.CREATED).body(added);
    }

    @PutMapping("/{version}/recipes/{recipeVersion}")
    public ResponseEntity<Recipe> updateRecipe(@PathVariable String version,
            @PathVariable String recipeVersion,
            @RequestBody Recipe recipe) {
        Recipe updated = helmReleaseService.updateRecipeInRelease(version, recipeVersion, recipe);
        if (updated == null)
            return ResponseEntity.notFound().build();
        wsHandler.broadcast("recipe_updated", Map.of("helmVersion", version, "recipe", updated));
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{version}/recipes/{recipeVersion}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable String version,
            @PathVariable String recipeVersion) {
        boolean deleted = helmReleaseService.deleteRecipeFromRelease(version, recipeVersion);
        if (!deleted)
            return ResponseEntity.notFound().build();
        wsHandler.broadcast("recipe_deleted", Map.of("helmVersion", version, "recipeVersion", recipeVersion));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{version}/recipes/{recipeVersion}/components")
    public Map<String, String> getComponents(@PathVariable String version,
            @PathVariable String recipeVersion) {
        return helmReleaseService.getComponentsByRecipe(version, recipeVersion);
    }

    @GetMapping("/{version}/recipes/{recipeVersion}/upgradePaths")
    public List<String> getUpgradePaths(@PathVariable String version,
            @PathVariable String recipeVersion) {
        return helmReleaseService.getUpgradePaths(version, recipeVersion);
    }

    @GetMapping("/compare")
    public Map<String, Object> compareHelmVersions(@RequestParam String from,
            @RequestParam String to) {
        return helmReleaseService.getUpgradePathsBetweenHelmVersions(from, to);
    }
}
