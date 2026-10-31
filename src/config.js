:root {
  --bg1: #070d18;
  --bg2: #101b2d;
  --bg3: #0c1524;

  --panel: rgba(18, 27, 40, 0.92);
  --panel-strong: rgba(23, 33, 48, 0.96);
  --panel-soft: rgba(255,255,255,0.04);

  --line: rgba(175, 210, 255, 0.12);
  --text: #edf6ff;
  --muted: #a9bbd9;
  --accent: #75d8ff;
  --accent-2: #8f7dff;
  --green: #76efb6;
  --gold: #f6ce7b;
  --danger: #ff8c6a;
  --shadow: rgba(0,0,0,0.42);
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at top, rgba(143,125,255,0.18), transparent 26%),
    linear-gradient(180deg, var(--bg1), var(--bg2));
  color: var(--text);
  font-family: "SF Pro Display", "Segoe UI", Tahoma, sans-serif;
  user-select: none;
  overscroll-behavior: none;
}

body {
  min-height: 100vh;
  padding:
    calc(12px + env(safe-area-inset-top))
    calc(12px + env(safe-area-inset-right))
    calc(12px + env(safe-area-inset-bottom))
    calc(12px + env(safe-area-inset-left));
}

button, input {
  font: inherit;
}

#app {
  width: 100%;
  max-width: 1500px;
  height: calc(100vh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  gap: 14px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 16px 36px var(--shadow);
  backdrop-filter: blur(14px);
}

.left-panel, .right-panel {
  padding: 14px 12px;
  overflow: auto;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 4px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 12px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 900;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #08131e;
  box-shadow: 0 10px 24px rgba(117, 216, 255, 0.4);
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: 0.04em;
}

.brand-copy p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-title {
  margin: 14px 0 12px;
  color: var(--muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 800;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.material-btn {
  background: rgba(255,255,255,0.03);
  color: var(--text);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease;
}

.material-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.18);
}

.material-btn.active {
  border-color: rgba(117,216,255,0.58);
  background: rgba(117,216,255,0.09);
  box-shadow: inset 0 0 0 1px rgba(117,216,255,0.18);
}

.swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: inset 0 0 8px rgba(255,255,255,0.18);
  flex-shrink: 0;
}

.material-name {
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.sim-panel {
  background: rgba(15, 23, 35, 0.9);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 18px 38px var(--shadow);
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px 10px;
  flex-wrap: wrap;
}

.pill {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  border-radius: 999px;
  min-height: 34px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.pill.accent {
  background: linear-gradient(135deg, rgba(117,216,255,0.12), rgba(143,125,255,0.12));
  border-color: rgba(117,216,255,0.42);
}

.main-board {
  position: relative;
  flex: 1;
  min-height: 500px;
  background: rgba(5, 12, 18, 0.95);
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  background: #050c15;
  image-rendering: pixelated;
}

.floating-hud {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}

.hud-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  pointer-events: none;
}

.hud-box {
  min-width: 104px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  background: rgba(10,18,28,0.7);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 18px rgba(0,0,0,0.18);
  font-size: 0.76rem;
  color: var(--muted);
}

.hud-box strong {
  color: var(--text);
  font-size: 0.9rem;
}

.control-box {
  background: rgba(17, 24, 36, 0.92);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 10px 10px 12px;
  margin-top: 10px;
}

.tool-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.tool-btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text);
  border-radius: 12px;
  min-height: 42px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.tool-btn:hover {
  transform: translateY(-1px);
}

.tool-btn.active {
  background: rgba(117,216,255,0.1);
  border-color: rgba(117,216,255,0.56);
  box-shadow: inset 0 0 0 1px rgba(117,216,255,0.18);
}

.slider-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 6px;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
}

.slider-wrap label {
  min-width: 64px;
  color: var(--muted);
  font-size: 0.78rem;
}

input[type="range"] {
  width: 100%;
  accent-color: var(--accent);
}

.tool-panel {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.info-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 12px 12px;
}

.info-card h3 {
  margin: 0 0 8px;
  font-size: 0.92rem;
}

.info-card ul {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.7;
  font-size: 0.82rem;
}

@media (max-width: 980px) {
  #app {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .right-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  #app {
    grid-template-columns: 1fr;
    height: auto;
  }

  .material-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-board {
    min-height: 420px;
  }

  .floating-hud {
    flex-direction: column;
  }

  .hud-row {
    justify-content: space-between;
  }

  .hud-box {
    flex: 1 1 0;
    min-width: 0;
  }
}
