import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = '/api';

const T = {
  teal: '#01a982', tealDark: '#007a5e', tealLight: '#e6f9f4',
  bg: '#0d1117', bgCard: '#161b22', bgSurface: '#1c2333',
  border: '#30363d', text: '#e6edf3', textMuted: '#8b949e',
  textDim: '#484f58', white: '#ffffff', red: '#f85149',
  yellow: '#d29922', blue: '#58a6ff', green: '#3fb950',
  purple: '#bc8cff',
};

const COMP_THEMES = {
  spark:   { bg: '#1a2744', border: '#58a6ff', icon: '⚡', color: '#79c0ff' },
  kafka:   { bg: '#2a1f1a', border: '#d29922', icon: '📨', color: '#e3b341' },
  airflow: { bg: '#1a2a2a', border: '#3fb950', icon: '🌊', color: '#56d364' },
  hbase:   { bg: '#2a1a2a', border: '#bc8cff', icon: '🗄️', color: '#d2a8ff' },
};

const fallbackTheme = { bg: '#2a2a1a', border: '#d29922', icon: '📦', color: '#e3b341' };

function getCompTheme(name) {
  return COMP_THEMES[name.toLowerCase()] || fallbackTheme;
}

const btnSecondary = {
  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  background: T.bgSurface, color: T.textMuted, border: `1px solid ${T.border}`,
  cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
};

// ============================================================================
// Catalog Page
// ============================================================================
export default function CatalogPage() {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCatalog, setExpandedCatalog] = useState(null);
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/catalogs`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => { setCatalogs(Array.isArray(data) ? data : []); setError(null); })
      .catch(() => setError('Failed to load catalogs. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const toggleCatalog = (version) => {
    setExpandedCatalog(prev => prev === version ? null : version);
    setExpandedRecipe(null);
  };

  const toggleRecipe = (version) => {
    setExpandedRecipe(prev => prev === version ? null : version);
  };

  return (
    <div style={{
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      minHeight: '100vh', background: T.bg, color: T.text,
    }}>
      {/* Header */}
      <header style={{
        background: T.bgCard, borderBottom: `1px solid ${T.border}`,
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: T.white, fontWeight: 800,
          }}>H</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>
              Software Catalogs
            </h1>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
              Browse available catalogs and recipe versions
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/" style={btnSecondary}>← Visualizer</Link>
          <Link to="/manage" style={btnSecondary}>+ Manage</Link>
        </div>
      </header>

      {/* Stats Overview */}
      {!loading && !error && (
        <div style={{
          display: 'flex', gap: 12, padding: '12px 24px',
          background: T.bgCard, borderBottom: `1px solid ${T.border}`,
        }}>
          {[
            { label: 'Catalogs', value: catalogs.length, color: T.teal },
            { label: 'Total Recipes', value: catalogs.reduce((s, c) => s + (c.recipes?.length || 0), 0), color: T.blue },
            { label: 'Components Tracked', value: Object.keys(COMP_THEMES).length, color: T.purple },
          ].map((s) => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 8,
              background: T.bgSurface, border: `1px solid ${T.border}`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 12, color: T.textMuted }}>{s.label}:</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
        {/* Error */}
        {error && (
          <div style={{
            background: `${T.red}15`, color: T.red, padding: '14px 20px',
            borderRadius: 10, fontSize: 14, marginBottom: 20,
            border: `1px solid ${T.red}33`,
          }}>⚠️ {error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: T.textMuted }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: `3px solid ${T.border}`, borderTopColor: T.teal,
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            Loading catalogs...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Catalog Cards */}
        {!loading && catalogs.map((catalog) => {
          const isExpanded = expandedCatalog === catalog.version;
          const recipeCount = catalog.recipes?.length || 0;

          return (
            <div key={catalog.version} style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 12, marginBottom: 16, overflow: 'hidden',
              borderLeft: `3px solid ${T.teal}`,
              transition: 'all 0.2s ease',
            }}>
              {/* Catalog Header */}
              <div
                onClick={() => toggleCatalog(catalog.version)}
                style={{
                  padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `linear-gradient(135deg, ${T.teal}22, ${T.tealDark}22)`,
                    border: `1px solid ${T.teal}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>📦</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
                      {catalog.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: `${T.teal}15`, color: T.teal,
                        border: `1px solid ${T.teal}33`,
                      }}>{catalog.version}</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 18, color: T.textMuted,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}>▼</span>
              </div>

              {/* Expanded Recipes */}
              {isExpanded && (
                <div style={{
                  borderTop: `1px solid ${T.border}`,
                  padding: '16px 20px',
                }}>
                  {(catalog.recipes || []).map((recipe, ri) => {
                    const isRecipeExpanded = expandedRecipe === recipe.version;
                    const comps = recipe.components ? Object.entries(recipe.components) : [];
                    const paths = recipe.upgradePaths || [];

                    return (
                      <div key={recipe.version} style={{
                        background: T.bgSurface, border: `1px solid ${T.border}`,
                        borderRadius: 10, marginBottom: ri < (catalog.recipes.length - 1) ? 12 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                      }}>
                        {/* Recipe Header */}
                        <div
                          onClick={() => toggleRecipe(recipe.version)}
                          style={{
                            padding: '14px 18px', cursor: 'pointer',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: T.bgCard,
                              border: `1px solid ${T.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14,
                            }}>📋</span>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: T.teal }}>
                                Recipe v{recipe.version}
                              </div>
                              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>
                                {recipe.description}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                              background: `${T.blue}15`, color: T.blue,
                            }}>{comps.length} components</span>
                            {paths.length > 0 && (
                              <span style={{
                                padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                background: `${T.yellow}15`, color: T.yellow,
                              }}>{paths.length} upgrade path{paths.length !== 1 ? 's' : ''}</span>
                            )}
                            <span style={{
                              fontSize: 14, color: T.textMuted,
                              transform: isRecipeExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.25s ease',
                            }}>▼</span>
                          </div>
                        </div>

                        {/* Recipe Detail */}
                        {isRecipeExpanded && (
                          <div style={{
                            borderTop: `1px solid ${T.border}`,
                            padding: '16px 18px',
                          }}>
                            {/* Components Table */}
                            <div style={{
                              fontSize: 12, fontWeight: 600, color: T.text,
                              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
                            }}>
                              Components
                            </div>
                            <div style={{
                              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                              gap: 8, marginBottom: 16,
                            }}>
                              {comps.map(([name, ver]) => {
                                const theme = getCompTheme(name);
                                return (
                                  <div key={name} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: theme.bg, border: `1px solid ${theme.border}33`,
                                    borderRadius: 8, padding: '10px 14px',
                                    borderLeft: `3px solid ${theme.border}`,
                                    transition: 'transform 0.15s ease',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 15 }}>{theme.icon}</span>
                                      <span style={{
                                        fontSize: 13, fontWeight: 500, color: T.text,
                                        textTransform: 'capitalize',
                                      }}>{name}</span>
                                    </div>
                                    <span style={{
                                      fontSize: 12, fontWeight: 700, color: theme.color,
                                      background: `${theme.bg}`, padding: '2px 10px', borderRadius: 4,
                                      border: `1px solid ${theme.border}44`,
                                    }}>v{ver}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Upgrade Paths */}
                            {paths.length > 0 && (
                              <>
                                <div style={{
                                  fontSize: 12, fontWeight: 600, color: T.text,
                                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
                                }}>
                                  Upgrade Paths
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  {paths.map((p) => (
                                    <div key={p} style={{
                                      display: 'flex', alignItems: 'center', gap: 8,
                                      background: T.bgCard, border: `1px solid ${T.border}`,
                                      borderRadius: 8, padding: '8px 14px', fontSize: 13,
                                    }}>
                                      <span style={{
                                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                                        background: `${T.blue}12`, color: T.blue,
                                      }}>v{p}</span>
                                      <span style={{ color: T.teal, fontSize: 16, fontWeight: 700 }}>→</span>
                                      <span style={{
                                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                                        background: `${T.teal}12`, color: T.teal,
                                      }}>v{recipe.version}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {paths.length === 0 && (
                              <div style={{
                                padding: '10px 14px', borderRadius: 8,
                                background: T.bgCard, border: `1px solid ${T.border}`,
                                fontSize: 12, color: T.textMuted, textAlign: 'center',
                              }}>Base version — no upgrade paths</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {!loading && catalogs.length === 0 && !error && (
          <div style={{
            background: T.bgCard, border: `1px dashed ${T.border}`,
            borderRadius: 12, padding: 40, textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>No catalogs found</div>
            <div style={{ fontSize: 13, color: T.textMuted }}>Catalogs will appear here once they are configured.</div>
          </div>
        )}
      </div>
    </div>
  );
}
