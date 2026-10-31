import { MATERIALS, MATERIAL_ORDER } from './config.js';

export function buildMaterialList(container, activeMaterial, onSelect) {
  container.innerHTML = '';

  MATERIAL_ORDER.forEach((key) => {
    const material = MATERIALS[key];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `material-btn ${activeMaterial === key ? 'active' : ''}`;
    button.innerHTML = `
      <span class="swatch" style="background:${material.color};"></span>
      <span class="material-name">${material.name}</span>
    `;
    button.addEventListener('click', () => onSelect(key));
    container.appendChild(button);
  });
}

export function bindToolButtons(onChange) {
  document.querySelectorAll('.tool-btn[data-mode]').forEach((button) => {
    button.addEventListener('click', () => onChange(button.dataset.mode));
  });
}

export function updateToolLabel(toolMode) {
  const label = document.getElementById('toolModeLabel');
  if (label) label.textContent = toolMode.charAt(0).toUpperCase() + toolMode.slice(1);

  document.querySelectorAll('.tool-btn[data-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === toolMode);
  });
}

export function updateBrushLabel(value) {
  const label = document.getElementById('brushSizeLabel');
  if (label) label.textContent = String(value);
}

export function updateMaterialName(name) {
  const label = document.getElementById('selectedMaterialName');
  if (label) label.textContent = name;
}

export function updateCellsCount(count) {
  const label = document.getElementById('cellCount');
  if (label) label.textContent = count.toLocaleString();
}
