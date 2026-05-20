import { useState, useEffect } from 'react';
import T from '../../theme';
import {
  btnPrimary,
  btnDanger,
  btnSecondary,
  cardStyle,
  labelStyle,
} from '../../ui/styles';
import EditRecipeInline from './EditRecipeInline';
import { normalizeRecipeDescription, getEffectiveUpgradePaths } from './utils';

const API_BASE = '/api';

export default function ReleaseCard({ release, onDeploy, cluster, onRefresh, onNotify }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);

  useEffect(() => {
    if (expanded) {
      fetch(`${API_BASE}/helm-releases/${release.version}?cluster=${cluster}`)
        .then((r) => r.json())
        .then(setDetail)
        .catch(() => {});
    }
  }, [expanded, release.version, cluster]);

  const handleDeleteRelease = () => {
    if (!window.confirm(`Delete Helm release ${release.version}? This removes all its recipes.`)) return;
    fetch(`${API_BASE}/helm-releases/${release.version}?cluster=${cluster}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to delete');
        onNotify('Helm release deleted');
        onRefresh();
      })
      .catch((err) => onNotify(err.message, true));
  };

  const handleDeleteRecipe = (recipeVersion) => {
    if (!window.confirm(`Delete recipe ${recipeVersion} from Helm ${release.version}?`)) return;
    fetch(`${API_BASE}/helm-releases/${release.version}/recipes/${recipeVersion}?cluster=${cluster}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to delete');
        onNotify('Recipe deleted');
        setDetail(null);
        onRefresh();
      })
      .catch((err) => onNotify(err.message, true));
  };

  const handleUpdateRecipe = (recipeVersion, updates) => {
    fetch(`${API_BASE}/helm-releases/${release.version}/recipes/${recipeVersion}?cluster=${cluster}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then(async (r) => {
        if (!r.ok) {
          let payload = {};
          try { payload = await r.json(); } catch { payload = {}; }
          throw new Error(payload.error || 'Failed to update');
        }
        return r.json();
      })
      .then(() => {
        onNotify('Recipe updated');
        setDetail(null);
        setEditingRecipe(null);
        onRefresh();
      })
      .catch((err) => onNotify(err.message, true));
  };

  const recipes = detail?.recipes || [];
  const statusColor = release.status === 'deployed' ? T.green
    : release.status === 'failed' || release.status === 'push_failed' ? T.red
    : release.status === 'deploying' ? T.blue
    : T.yellow;

  const handleDeploy = async () => {
    if (!window.confirm(`Deploy Helm release ${release.version}? This will push to Git and trigger Jenkins.`)) return;
    try {
      await onDeploy(release.version);
    } catch (err) {
      onNotify(err.message || 'Deploy failed', true);
    }
  };

  return (
    <div style={{
      ...cardStyle,
      borderLeft: `3px solid ${statusColor}`,
      transition: 'all 0.2s',
    }}>
      {/* Release header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', flex: 1 }}
          onClick={() => setExpanded(!expanded)}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: T.white, fontWeight: 800,
          }}>
            v{release.version}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
              Helm Chart {release.version}
            </div>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>
              {release.releaseName}
              <span style={{
                marginLeft: 10, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                background: `${statusColor}18`, color: statusColor,
              }}>{release.status}</span>
            </div>
          </div>
          <span style={{
            marginLeft: 'auto', fontSize: 18, color: T.textMuted,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}>▼</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
          {release.status !== 'deploying' && (
            <button onClick={handleDeploy} style={{
              ...btnPrimary, padding: '6px 14px', fontSize: 12,
            }}>Deploy</button>
          )}
          {release.status === 'deploying' && (
            <span style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: `${T.blue}18`, color: T.blue, border: `1px solid ${T.blue}44`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: T.blue,
                animation: 'pulse 1s infinite',
              }} />
              Deploying...
              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
            </span>
          )}
          <button onClick={handleDeleteRelease} style={btnDanger}>Delete</button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          {/* Recipes list */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={labelStyle}>Recipes ({recipes.length})</span>
            <span style={{ fontSize: 11, color: T.textMuted }}>
              Add only during release creation
            </span>
          </div>

          {recipes.length === 0 && (
            <div style={{
              padding: '20px', borderRadius: 8, background: T.bgSurface,
              border: `1px dashed ${T.border}`, textAlign: 'center',
              color: T.textMuted, fontSize: 13,
            }}>
              This release has no recipes. Create releases with recipes from the top form.
            </div>
          )}

          {recipes.map((recipe) => (
            (() => {
              const recipeIndex = recipes.findIndex((r) => r.version === recipe.version);
              const effectiveFromPaths = getEffectiveUpgradePaths(recipes, recipe, recipeIndex);
              return (
            <div key={recipe.version} style={{
              background: T.bgSurface, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 16, marginBottom: 10,
            }}>
              {editingRecipe === recipe.version ? (
                <EditRecipeInline
                  recipe={recipe}
                  allRecipes={recipes}
                  onSave={(updates) => handleUpdateRecipe(recipe.version, updates)}
                  onCancel={() => setEditingRecipe(null)}
                />
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.teal }}>
                        Recipe v{recipe.version}
                      </div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{normalizeRecipeDescription(recipe.description, recipe.version)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditingRecipe(recipe.version)}
                        style={{ ...btnSecondary, padding: '4px 12px', fontSize: 11 }}>Edit</button>
                      <button onClick={() => handleDeleteRecipe(recipe.version)}
                        style={{ ...btnDanger, padding: '4px 12px', fontSize: 11 }}>Delete</button>
                    </div>
                  </div>

                  {/* Components grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {Object.entries(recipe.components || {}).map(([name, ver]) => {
                      const fromPaths = effectiveFromPaths;
                      const toPaths = recipes
                        .filter((r, idx) => getEffectiveUpgradePaths(recipes, r, idx).includes(recipe.version))
                        .map((r) => r.version);

                      const prevVers = fromPaths.map((pv) => {
                        const pr = recipes.find((r) => r.version === pv);
                        return pr?.components?.[name];
                      }).filter((v) => v && v !== ver);
                      const uniquePrev = [...new Set(prevVers)];

                      const nextVers = toPaths.map((tv) => {
                        const tr = recipes.find((r) => r.version === tv);
                        return tr?.components?.[name];
                      }).filter((v) => v && v !== ver);
                      const uniqueNext = [...new Set(nextVers)];

                      return (
                        <div key={name} style={{
                          padding: '6px 12px', borderRadius: 6,
                          background: T.bgCard, border: `1px solid ${T.border}`,
                          fontSize: 12,
                        }}>
                          <span style={{ color: T.textMuted, textTransform: 'capitalize' }}>{name}</span>
                          <span style={{ color: T.teal, fontWeight: 600, marginLeft: 6 }}>
                            {uniquePrev.length > 0 && <span style={{ color: T.textMuted, fontWeight: 400 }}>{uniquePrev.join(', ')} → </span>}
                            {ver}
                            {uniqueNext.length > 0 && <span style={{ color: T.textMuted, fontWeight: 400 }}> → {uniqueNext.join(', ')}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Upgrade paths info */}
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {effectiveFromPaths.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: T.textMuted }}>Upgrades from:</span>
                        {effectiveFromPaths.map((p) => (
                          <span key={p} style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: `${T.blue}15`, color: T.blue,
                          }}>v{p}</span>
                        ))}
                      </div>
                    )}
                    {recipes.filter((r, idx) => getEffectiveUpgradePaths(recipes, r, idx).includes(recipe.version)).length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: T.textMuted }}>Upgrades to:</span>
                        {recipes.filter((r, idx) => getEffectiveUpgradePaths(recipes, r, idx).includes(recipe.version)).map((p) => (
                          <span key={p.version} style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: `${T.yellow}15`, color: T.yellow,
                          }}>v{p.version}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
              );
            })()
          ))}
        </div>
      )}
    </div>
  );
}
