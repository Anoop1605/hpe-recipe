package com.hpe.recipe.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator;
import com.hpe.recipe.model.HelmRelease;

@Service
public class GitOpsService {

    private static final Logger log = LoggerFactory.getLogger(GitOpsService.class);

    // Configured Jackson for YAML generation
    private final ObjectMapper yamlMapper;

    @Value("${gitops.repo-url}")
    private String repoUrl;

    @Value("${gitops.local-path}")
    private String localPath;

    @Value("${gitops.branch}")
    private String branch;

    @Value("${gitops.username}")
    private String username;

    @Value("${gitops.token:}")
    private String token;

    @Value("${gitops.values-dir}")
    private String valuesDir;

    public GitOpsService() {
        // Disable the "---" document start marker for cleaner Helm YAML
        YAMLFactory yamlFactory = new YAMLFactory()
                .disable(YAMLGenerator.Feature.WRITE_DOC_START_MARKER);
        this.yamlMapper = new ObjectMapper(yamlFactory);
    }

    /**
     * Generate a Helm values YAML file from a HelmRelease and push it to GitHub.
     * Also updates Chart.yaml version so Jenkins picks up the right version.
     */
    public synchronized void generateAndPush(HelmRelease release) throws Exception {
        File repoDir = new File(localPath);

        log.info("Starting GitOps push for release v{}", release.getVersion());

        if (token == null || token.isBlank()) {
            throw new IllegalStateException(
                    "GITOPS_TOKEN is not set. Please check your .env file or environment variables.");
        }

        Git git = getOrCloneRepo(repoDir);

        try {
            // 1. Pull latest to avoid stale branch errors
            git.pull()
                    .setCredentialsProvider(getCredentials())
                    .setRemoteBranchName(branch)
                    .call();

            // 2. Generate values file using Jackson
            String valuesFileName = "values-v" + release.getVersion() + ".yaml";
            File valuesFile = new File(repoDir, valuesDir + "/" + valuesFileName);

            // Wrap the release in a "recipeData" root node to match Helm expectations
            Map<String, Object> rootNode = new HashMap<>();
            rootNode.put("recipeData", release);

            valuesFile.getParentFile().mkdirs();
            yamlMapper.writeValue(valuesFile, rootNode);
            log.info("Generated values file: {}", valuesFile.getPath());

            // 3. Update Chart.yaml version
            File chartFile = new File(repoDir, valuesDir + "/Chart.yaml");
            updateChartVersion(chartFile, release.getVersion());

            // 4. Stage, commit, push
            git.add().addFilepattern(valuesDir + "/" + valuesFileName).call();
            git.add().addFilepattern(valuesDir + "/Chart.yaml").call();

            git.commit()
                    .setMessage("Release v" + release.getVersion() + ": update recipe values\n\n"
                            + "Recipes: " + (release.getRecipes() != null ? release.getRecipes().size() : 0)
                            + " recipe(s)\n"
                            + "Triggered from Recipe Detection UI")
                    .setAuthor("Recipe Detection", "recipe-detection@hpe.com")
                    .call();

            git.push()
                    .setCredentialsProvider(getCredentials())
                    .call();

            log.info("GitOps push successful for version {}", release.getVersion());

        } finally {
            git.close();
        }
    }

    private Git getOrCloneRepo(File repoDir) throws GitAPIException {
        if (repoDir.exists() && new File(repoDir, ".git").exists()) {
            try {
                return Git.open(repoDir);
            } catch (IOException e) {
                log.warn("Corrupted local repo detected. Deleting and re-cloning...");
                deleteDirectory(repoDir);
            }
        }

        log.info("Cloning repository from {}", repoUrl);
        return Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(repoDir)
                .setBranch(branch)
                .setCredentialsProvider(getCredentials())
                .call();
    }

    private UsernamePasswordCredentialsProvider getCredentials() {
        return new UsernamePasswordCredentialsProvider(username, token);
    }

    private void updateChartVersion(File chartFile, String version) throws IOException {
        String content = Files.readString(chartFile.toPath());
        content = content.replaceAll("version:\\s*.+", "version: " + version);
        content = content.replaceAll("appVersion:\\s*.+", "appVersion: \"" + version + "\"");
        Files.writeString(chartFile.toPath(), content);
        log.info("Updated Chart.yaml to version {}", version);
    }

    private void deleteDirectory(File dir) {
        if (dir.isDirectory()) {
            File[] children = dir.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteDirectory(child);
                }
            }
        }
        dir.delete();
    }
}