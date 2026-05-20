package com.hpe.recipe.model;

import java.util.ArrayList;
import java.util.List;

public class ComponentUpgradeRule {

    private List<String> from;
    private List<String> to;

    public ComponentUpgradeRule() {
        this.from = new ArrayList<>();
        this.to = new ArrayList<>();
    }

    public ComponentUpgradeRule(List<String> from, List<String> to) {
        this.from = from != null ? new ArrayList<>(from) : new ArrayList<>();
        this.to = to != null ? new ArrayList<>(to) : new ArrayList<>();
    }

    public List<String> getFrom() { return from; }
    public void setFrom(List<String> from) { this.from = from; }

    public List<String> getTo() { return to; }
    public void setTo(List<String> to) { this.to = to; }
}
