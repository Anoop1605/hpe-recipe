import { useState } from 'react';
import T from '../../theme';
import {
  inputStyle,
  btnPrimary,
  btnDanger,
  btnSecondary,
  labelStyle,
} from '../../ui/styles';
import { normalizeRecipeDescription, parseUpgradeList } from './utils';

export default function EditRecipeInline({ recipe, allRecipes, onSave, onCancel }) {
  const [description, setDescription] = useState(recipe.description || '');
  const [components, setComponents] = useState(
    Object.entries(recipe.components || {}).map(([name, version]) => ({
      name,
      version,
      upgradeFrom: recipe.componentUpgradeRules?.[name]?.from?.join(', ') || '',
      upgradeTo: recipe.componentUpgradeRules?.[name]?.to?.join(', ') || '',
    }))
  );
  const [upgradePaths, setUpgradePaths] = useState([...(recipe.upgradePaths || [])]);

  const updateComp = (i, field, val) => {
    const next = [...components];
    next[i] = { ...next[i], [field]: val };
    setComponents(next);
  };

  const addComponent = () => setComponents([...components, { name: '', version: '', upgradeFrom: '', upgradeTo: '' }]);
  const removeComponent = (i) => setComponents(components.filter((_, j) => j !== i));

  const toggleUpgrade = (rv) => {
    setUpgradePaths((prev) => prev.includes(rv) ? prev.filter((p) => p !== rv) : [...prev, rv]);
  };

  const handleSave = () => {
    const compMap = {};
    const compRules = {};
    components.forEach((c) => {
      if (c.name.trim() && c.version.trim()) {
        const compName = c.name.trim();
        compMap[compName] = c.version.trim();
        const fromList = parseUpgradeList(c.upgradeFrom);
        const toList = parseUpgradeList(c.upgradeTo);
        if (fromList.length > 0 || toList.length > 0) {
          compRules[compName] = { from: fromList, to: toList };
        }
      }
    });
    onSave({
      description: normalizeRecipeDescription(description, recipe.version),
      components: compMap,
      upgradePaths,
      componentUpgradeRules: compRules,
    });
  };

  const otherRecipes = allRecipes.filter((r) => r.version !== recipe.version);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Description</label>
        <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <label style={{ ...labelStyle, marginBottom: 8 }}>Components</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {components.map((c, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
            gap: 8,
            alignItems: 'center',
          }}>
            <input style={{ ...inputStyle, flex: 1 }} value={c.name}
              onChange={(e) => updateComp(i, 'name', e.target.value)} placeholder="Component" />
            <input style={{ ...inputStyle, flex: 1 }} value={c.version}
              onChange={(e) => updateComp(i, 'version', e.target.value)} placeholder="Version" />
            <input style={{ ...inputStyle, flex: 1 }} value={c.upgradeFrom || ''}
              onChange={(e) => updateComp(i, 'upgradeFrom', e.target.value)} placeholder="Upgradeable from" />
            <input style={{ ...inputStyle, flex: 1 }} value={c.upgradeTo || ''}
              onChange={(e) => updateComp(i, 'upgradeTo', e.target.value)} placeholder="Upgradeable to" />
            <button type="button" onClick={() => removeComponent(i)} style={{ ...btnDanger, padding: '6px 10px' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={addComponent} style={{ ...btnSecondary, alignSelf: 'flex-start', fontSize: 11 }}>
          + Add Component
        </button>
      </div>

      {otherRecipes.length > 0 && (
        <>
          <label style={{ ...labelStyle, marginBottom: 8 }}>Upgrade From</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {otherRecipes.map((r) => (
              <button key={r.version} type="button" onClick={() => toggleUpgrade(r.version)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: upgradePaths.includes(r.version) ? `${T.teal}22` : T.bgCard,
                color: upgradePaths.includes(r.version) ? T.teal : T.textMuted,
                border: `1px solid ${upgradePaths.includes(r.version) ? T.teal : T.border}`,
                cursor: 'pointer',
              }}>v{r.version}</button>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} style={btnPrimary}>Save Changes</button>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}
