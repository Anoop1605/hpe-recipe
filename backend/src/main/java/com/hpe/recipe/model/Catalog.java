package com.hpe.recipe.model;

import java.util.List;

public class Catalog {

    private String version;
    private String name;
    private List<Recipe> recipes;

    public Catalog() {}

    public Catalog(String version, String name, List<Recipe> recipes) {
        this.version = version;
        this.name = name;
        this.recipes = recipes;
    }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Recipe> getRecipes() { return recipes; }
    public void setRecipes(List<Recipe> recipes) { this.recipes = recipes; }
}
