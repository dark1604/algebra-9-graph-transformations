(function (global) {
  "use strict";

  const BASE_FUNCTIONS = {
    x2: {
      id: "x2",
      label: "x²",
      eval: (x) => x * x,
      sampleX: [-2, -1, 0, 1, 2],
      formatCore: (arg) => (arg === "x" ? "x²" : `(${arg})²`),
    },
    sqrt: {
      id: "sqrt",
      label: "√x",
      eval: (x) => (x >= -1e-9 ? Math.sqrt(Math.max(0, x)) : NaN),
      sampleX: [0, 1, 4, 9],
      formatCore: (arg) => (arg === "x" ? "√x" : `√(${arg})`),
    },
    abs: {
      id: "abs",
      label: "|x|",
      eval: (x) => Math.abs(x),
      sampleX: [-3, -2, 0, 2, 3],
      formatCore: (arg) => `|${arg}|`,
    },
    inv: {
      id: "inv",
      label: "k₀ / x",
      eval: (x, state) => (Math.abs(x) < 1e-6 ? NaN : state.invK / x),
      sampleX: (state) => {
        const k0 = Math.abs(state.invK);
        if (k0 === 6) return [-6, -3, -2, -1, 1, 2, 3, 6];
        if (k0 === 4) return [-4, -2, -1, 1, 2, 4];
        return [-2, -1, 1, 2];
      },
      formatCore: (arg, state) =>
        arg === "x" ? `${formatNum(state.invK)} / x` : `${formatNum(state.invK)} / (${arg})`,
    },
    x3: {
      id: "x3",
      label: "x³",
      eval: (x) => x * x * x,
      sampleX: [-2, -1, 0, 1, 2],
      formatCore: (arg) => (arg === "x" ? "x³" : `(${arg})³`),
    },
    lin: {
      id: "lin",
      label: "0,5x − 2",
      eval: (x) => 0.5 * x - 2,
      sampleX: [-2, 0, 2, 4, 6],
      formatCore: (arg) => (arg === "x" ? "0,5x − 2" : `0,5(${arg}) − 2`),
    },
    x2m4: {
      id: "x2m4",
      label: "x² − 4",
      eval: (x) => x * x - 4,
      sampleX: [-3, -2, 0, 2, 3],
      formatCore: (arg) => (arg === "x" ? "x² − 4" : `(${arg})² − 4`),
    },
  };

  const PRESETS = {
    ex1_down: { fn: "sqrt", h: 0, k: 1, v: -2, reflect: false, outerAbs: false },
    ex1_up: { fn: "sqrt", h: 0, k: 1, v: 3, reflect: false, outerAbs: false },
    ex2: { fn: "x2", h: 2, k: 1, v: 0, reflect: false, outerAbs: false },
    ex3: { fn: "x2", h: -1, k: 1, v: 0, reflect: false, outerAbs: false },
    ex4: { fn: "sqrt", h: 0, k: 1, v: 0, reflect: true, outerAbs: false },
    ex5_comp: { fn: "abs", h: 0, k: 0.5, v: 0, reflect: false, outerAbs: false },
    ex5_stretch: { fn: "abs", h: 0, k: 2, v: 0, reflect: false, outerAbs: false },
    ex6: { fn: "abs", h: 2, k: 1, v: 3, reflect: false, outerAbs: false },
    ex7: { fn: "sqrt", h: 0, k: 2, v: 0, reflect: true, outerAbs: false },
    ex8: { fn: "lin", h: 0, k: 1, v: 0, reflect: false, outerAbs: true },
    task10_4: { fn: "x3", h: 1, k: 1, v: 2, reflect: false, outerAbs: false },
    task10_7: { fn: "sqrt", h: -1, k: 1, v: -3, reflect: false, outerAbs: false },
    task10_8: { fn: "x2", h: 3, k: 1, v: 1, reflect: false, outerAbs: false },
    task10_12: { fn: "x2", h: -1, k: 2, v: 3, reflect: true, outerAbs: false },
    task10_15: {
      fn: "sqrt",
      h: -2,
      k: 1,
      v: 0,
      reflect: false,
      outerAbs: false,
      showSecondary: true,
    },
    task10_19: {
      fn: "inv",
      invK: 6,
      h: 2,
      k: 1,
      v: 1,
      reflect: false,
      outerAbs: false,
    },
    task10_21: {
      fn: "x2m4",
      h: 0,
      k: 1,
      v: 0,
      reflect: false,
      outerAbs: true,
      showLineA: true,
      paramA: 2,
    },
  };

  function formatNum(num) {
    const rounded = Math.round(num * 1000) / 1000;
    return String(rounded).replace(".", ",");
  }

  function evaluateAtStep(x, state, step) {
    const base = BASE_FUNCTIONS[state.fn];
    if (!base) return NaN;
    const shiftedArg = step >= 1 ? x - state.h : x;
    let y = base.eval(shiftedArg, state);
    if (!Number.isFinite(y)) return NaN;

    if (step >= 2) {
      y *= state.k;
      if (state.reflect) y = -y;
    }
    if (step >= 3) {
      y += state.v;
    }
    if (step >= 4 && state.outerAbs) {
      y = Math.abs(y);
    }
    return y;
  }

  function buildFormula(state, step) {
    const base = BASE_FUNCTIONS[state.fn];
    const h = step >= 1 ? state.h : 0;
    const k = step >= 2 ? state.k : 1;
    const reflect = step >= 2 ? state.reflect : false;
    const v = step >= 3 ? state.v : 0;
    const outerAbs = step >= 4 ? state.outerAbs : false;

    let arg = "x";
    if (h > 0) arg = `x − ${formatNum(h)}`;
    else if (h < 0) arg = `x + ${formatNum(-h)}`;

    let expr = base.formatCore(arg, state);

    const hasScale = Math.abs(k - 1) > 1e-9;
    const hasPrefix = reflect || hasScale;
    if (hasPrefix) {
      const sign = reflect ? "−" : "";
      const kStr = hasScale ? formatNum(k) : "";
      if (state.fn === "lin" || state.fn === "x2m4") {
        expr = `${sign}${kStr}(${expr})`;
      } else if (state.fn === "inv" && hasScale) {
        expr = `${sign}${kStr} · (${expr})`;
      } else if (state.fn === "inv" && reflect) {
        expr = `−(${expr})`;
      } else {
        expr = `${sign}${kStr}${expr}`;
      }
    }

    if (v > 0) expr += ` + ${formatNum(v)}`;
    else if (v < 0) expr += ` − ${formatNum(-v)}`;

    if (outerAbs) {
      expr = `|${expr}|`;
    }
    return `y = ${expr}`;
  }

  function buildExplanationSteps(state) {
    const steps = [];
    steps.push({
      step: 0,
      text: `Базовий графік: ${buildFormula(state, 0)}.`,
    });

    if (state.h !== 0) {
      const dir = state.h > 0 ? "праворуч" : "ліворуч";
      steps.push({
        step: 1,
        text: `Горизонтальний зсув уздовж осі x на ${formatNum(Math.abs(state.h))} од. ${dir}.`,
      });
    } else {
      steps.push({
        step: 1,
        text: "Горизонтальний зсув відсутній (m = 0).",
      });
    }

    const scaleParts = [];
    if (state.k > 1) {
      scaleParts.push(`розтяг від осі x у ${formatNum(state.k)} рази`);
    } else if (state.k < 1) {
      scaleParts.push(`стиск до осі x в ${formatNum(1 / state.k)} рази`);
    }
    if (state.reflect) {
      scaleParts.push("симетрія відносно осі x (знак «−»)");
    }
    steps.push({
      step: 2,
      text:
        scaleParts.length > 0
          ? `Масштабування та симетрія: ${scaleParts.join(" + ")}.`
          : "Розтягу, стиску та симетрії відносно осі x немає (k = 1).",
    });

    if (state.v !== 0) {
      const dirY = state.v > 0 ? "угору" : "униз";
      steps.push({
        step: 3,
        text: `Вертикальний зсув уздовж осі y на ${formatNum(Math.abs(state.v))} од. ${dirY}.`,
      });
    } else {
      steps.push({
        step: 3,
        text: "Вертикальний зсув відсутній (n = 0).",
      });
    }

    if (state.outerAbs) {
      steps.push({
        step: 4,
        text: "Модуль |f(…)|: частину графіка нижче осі x симетрично відображаємо вгору відносно осі x.",
      });
    } else {
      steps.push({
        step: 4,
        text: "Побудова завершена.",
      });
    }

    return steps;
  }

  function getSamplePoints(state, step) {
    const base = BASE_FUNCTIONS[state.fn];
    const xs = typeof base.sampleX === "function" ? base.sampleX(state) : base.sampleX;
    return xs.map((x0) => {
      const y0 = base.eval(x0, state);
      const xPrime = step >= 1 ? x0 + state.h : x0;
      const yPrime = evaluateAtStep(xPrime, state, step);
      return { x0, y0, xPrime, yPrime };
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      BASE_FUNCTIONS,
      PRESETS,
      formatNum,
      evaluateAtStep,
      buildFormula,
      buildExplanationSteps,
      getSamplePoints,
    };
  }

  if (typeof document === "undefined") {
    return;
  }

  const state = {
    fn: "x2",
    invK: 4,
    h: 0,
    k: 1,
    v: 0,
    reflect: false,
    outerAbs: false,
    step: 4,
    showBase: true,
    showIntermediate: true,
    showVectors: true,
    showSecondary: false,
    showLineA: false,
    paramA: 2,
    zoom: 42,
    panX: 0,
    panY: 0,
  };

  const els = {
    presetSelect: document.getElementById("presetSelect"),
    resetBtn: document.getElementById("resetBtn"),
    baseButtons: document.getElementById("baseButtons"),
    invParamRow: document.getElementById("invParamRow"),
    invKSlider: document.getElementById("invKSlider"),
    invKVal: document.getElementById("invKVal"),
    hSlider: document.getElementById("hSlider"),
    hVal: document.getElementById("hVal"),
    kSlider: document.getElementById("kSlider"),
    kVal: document.getElementById("kVal"),
    vSlider: document.getElementById("vSlider"),
    vVal: document.getElementById("vVal"),
    reflectCheck: document.getElementById("reflectCheck"),
    outerAbsCheck: document.getElementById("outerAbsCheck"),
    paramARow: document.getElementById("paramARow"),
    paramASlider: document.getElementById("paramASlider"),
    paramAVal: document.getElementById("paramAVal"),
    showLineACheck: document.getElementById("showLineACheck"),
    prevStepBtn: document.getElementById("prevStepBtn"),
    nextStepBtn: document.getElementById("nextStepBtn"),
    stepBadge: document.getElementById("stepBadge"),
    stepPills: document.getElementById("stepPills"),
    showBaseCheck: document.getElementById("showBaseCheck"),
    showIntermediateCheck: document.getElementById("showIntermediateCheck"),
    showVectorsCheck: document.getElementById("showVectorsCheck"),
    showSecondaryCheck: document.getElementById("showSecondaryCheck"),
    legendSecondary: document.getElementById("legendSecondary"),
    legendLineA: document.getElementById("legendLineA"),
    formulaDisplay: document.getElementById("formulaDisplay"),
    zoomOutBtn: document.getElementById("zoomOutBtn"),
    zoomInBtn: document.getElementById("zoomInBtn"),
    zoomLabel: document.getElementById("zoomLabel"),
    centerBtn: document.getElementById("centerBtn"),
    canvas: document.getElementById("graphCanvas"),
    cursorCoords: document.getElementById("cursorCoords"),
    stepsList: document.getElementById("stepsList"),
    axisNote: document.getElementById("axisNote"),
    pointsTableBody: document.querySelector("#pointsTable tbody"),
  };

  const ctx = els.canvas.getContext("2d");

  function syncUIFromState() {
    document.querySelectorAll("#baseButtons .chip").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.fn === state.fn);
    });
    els.invParamRow.classList.toggle("hidden", state.fn !== "inv");
    els.invKSlider.value = state.invK;
    els.invKVal.textContent = formatNum(state.invK);

    els.hSlider.value = state.h;
    els.hVal.textContent = formatNum(state.h);
    els.kSlider.value = state.k;
    els.kVal.textContent = formatNum(state.k);
    els.vSlider.value = state.v;
    els.vVal.textContent = formatNum(state.v);

    els.reflectCheck.checked = state.reflect;
    els.outerAbsCheck.checked = state.outerAbs;

    els.paramARow.classList.toggle("hidden", !state.outerAbs && state.fn !== "x2m4");
    els.paramASlider.value = state.paramA;
    els.paramAVal.textContent = formatNum(state.paramA);
    els.showLineACheck.checked = state.showLineA;

    els.showBaseCheck.checked = state.showBase;
    els.showIntermediateCheck.checked = state.showIntermediate;
    els.showVectorsCheck.checked = state.showVectors;
    els.showSecondaryCheck.checked = state.showSecondary;

    els.legendSecondary.classList.toggle("hidden", !state.showSecondary);
    els.legendLineA.classList.toggle("hidden", !state.showLineA);

    document.querySelectorAll("#stepPills .step-pill").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.step) === state.step);
    });
    const stepNames = [
      "Крок 0: База",
      "Крок 1: Зсув Ox",
      "Крок 2: k та −",
      "Крок 3: Зсув Oy",
      "Крок 4: Фінал",
    ];
    els.stepBadge.textContent = stepNames[state.step];
    els.zoomLabel.textContent = `${Math.round((state.zoom / 42) * 100)}%`;

    els.formulaDisplay.textContent = buildFormula(state, state.step);

    const steps = buildExplanationSteps(state);
    els.stepsList.innerHTML = steps
      .map(
        (s) =>
          `<li class="${s.step === state.step ? "active-step" : ""}">${s.text}</li>`
      )
      .join("");

    els.axisNote.textContent =
      state.h !== 0 || state.v !== 0
        ? `Зауваження з підручника (с. 92–93): замість перенесення графіка можна перенести осі координат у протилежному напрямку (вісь y на ${formatNum(Math.abs(state.h))} ${state.h >= 0 ? "ліворуч" : "праворуч"}, вісь x на ${formatNum(Math.abs(state.v))} ${state.v >= 0 ? "униз" : "угору"}).`
        : "Зауваження з підручника: рухаючи повзунки m та n, зверніть увагу на стрілки перенесення опорних точок.";

    const pts = getSamplePoints(state, state.step);
    els.pointsTableBody.innerHTML = pts
      .map((p) => {
        const y0Str = Number.isFinite(p.y0) ? formatNum(p.y0) : "—";
        const yPStr = Number.isFinite(p.yPrime) ? formatNum(p.yPrime) : "—";
        return `<tr>
          <td>${formatNum(p.x0)}</td>
          <td>${y0Str}</td>
          <td>→</td>
          <td>${formatNum(p.xPrime)}</td>
          <td><strong>${yPStr}</strong></td>
        </tr>`;
      })
      .join("");
  }

  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    els.canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    els.canvas.height = Math.max(300, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function worldToScreen(wx, wy, width, height) {
    const cx = width / 2 + state.panX;
    const cy = height / 2 + state.panY;
    return {
      sx: cx + wx * state.zoom,
      sy: cy - wy * state.zoom,
    };
  }

  function screenToWorld(sx, sy, width, height) {
    const cx = width / 2 + state.panX;
    const cy = height / 2 + state.panY;
    return {
      wx: (sx - cx) / state.zoom,
      wy: (cy - sy) / state.zoom,
    };
  }

  function drawGrid(width, height) {
    const cx = width / 2 + state.panX;
    const cy = height / 2 + state.panY;
    const stepPx = state.zoom;

    ctx.clearRect(0, 0, width, height);

    const xMin = Math.floor(-cx / stepPx) - 1;
    const xMax = Math.ceil((width - cx) / stepPx) + 1;
    const yMin = Math.floor(-(height - cy) / stepPx) - 1;
    const yMax = Math.ceil(cy / stepPx) + 1;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e8edf5";
    ctx.beginPath();
    for (let gx = xMin; gx <= xMax; gx++) {
      const px = cx + gx * stepPx;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    for (let gy = yMin; gy <= yMax; gy++) {
      const py = cy - gy * stepPx;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "bold 13px Segoe UI, sans-serif";
    ctx.fillText("x", width - 16, cy - 8);
    ctx.fillText("y", cx + 10, 16);

    ctx.font = "11px Segoe UI, sans-serif";
    ctx.fillStyle = "#64748b";
    const labelStep = stepPx < 24 ? 2 : 1;
    for (let gx = xMin; gx <= xMax; gx += labelStep) {
      if (gx === 0) continue;
      const px = cx + gx * stepPx;
      ctx.fillText(String(gx), px - 4, cy + 14);
    }
    for (let gy = yMin; gy <= yMax; gy += labelStep) {
      if (gy === 0) continue;
      const py = cy - gy * stepPx;
      ctx.fillText(String(gy), cx + 6, py + 4);
    }
    ctx.fillText("0", cx + 5, cy + 14);
  }

  function plotCurve(evalFn, width, height, options) {
    const { color, lineWidth, dashed, domainStartX } = options;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [7, 5] : []);
    ctx.beginPath();

    let penDown = false;
    let prevSy = null;
    const samples = Math.max(400, Math.floor(width));

    for (let i = 0; i <= samples; i++) {
      const sx = (i / samples) * width;
      const { wx } = screenToWorld(sx, 0, width, height);
      const wy = evalFn(wx);

      if (!Number.isFinite(wy) || Math.abs(wy) > 1000) {
        penDown = false;
        prevSy = null;
        continue;
      }

      const { sy } = worldToScreen(wx, wy, width, height);
      if (prevSy !== null && Math.abs(sy - prevSy) > height * 0.8) {
        penDown = false;
      }

      if (!penDown) {
        if (domainStartX !== undefined && Math.abs(wx - domainStartX) < 0.25) {
          const edgeY = evalFn(domainStartX);
          if (Number.isFinite(edgeY)) {
            const edgeScreen = worldToScreen(domainStartX, edgeY, width, height);
            ctx.moveTo(edgeScreen.sx, edgeScreen.sy);
            ctx.lineTo(sx, sy);
            penDown = true;
            prevSy = sy;
            continue;
          }
        }
        ctx.moveTo(sx, sy);
        penDown = true;
      } else {
        ctx.lineTo(sx, sy);
      }
      prevSy = sy;
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawAsymptotes(width, height) {
    if (state.fn !== "inv") return;
    const hx = state.step >= 1 ? state.h : 0;
    const vy = state.step >= 3 ? state.v : 0;
    const { sx } = worldToScreen(hx, 0, width, height);
    const { sy } = worldToScreen(0, vy, width, height);

    ctx.save();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
    ctx.stroke();
    ctx.restore();
  }

  function drawArrow(x1, y1, x2, y2, color) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 6) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(dy, dx);
    const head = 7;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const rect = els.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    drawGrid(width, height);
    drawAsymptotes(width, height);

    if (state.showBase && state.step > 0) {
      plotCurve((x) => evaluateAtStep(x, state, 0), width, height, {
        color: "#94a3b8",
        lineWidth: 2,
        dashed: true,
        domainStartX: state.fn === "sqrt" ? 0 : undefined,
      });
    }

    if (state.showIntermediate && state.step > 1) {
      const midStep = state.step - 1;
      plotCurve((x) => evaluateAtStep(x, state, midStep), width, height, {
        color: "#f59e0b",
        lineWidth: 2,
        dashed: false,
        domainStartX: state.fn === "sqrt" ? (midStep >= 1 ? state.h : 0) : undefined,
      });
    }

    plotCurve((x) => evaluateAtStep(x, state, state.step), width, height, {
      color: "#2563eb",
      lineWidth: 3.2,
      dashed: false,
      domainStartX: state.fn === "sqrt" ? (state.step >= 1 ? state.h : 0) : undefined,
    });

    if (state.showSecondary) {
      plotCurve((x) => (Math.abs(x) < 1e-6 ? NaN : 4 / x), width, height, {
        color: "#dc2626",
        lineWidth: 2.4,
        dashed: false,
      });
    }

    if (state.showLineA) {
      plotCurve(() => state.paramA, width, height, {
        color: "#7c3aed",
        lineWidth: 2,
        dashed: true,
      });
    }

    const pts = getSamplePoints(state, state.step);
    pts.forEach((p) => {
      if (!Number.isFinite(p.y0) || !Number.isFinite(p.yPrime)) return;
      const start = worldToScreen(p.x0, p.y0, width, height);
      const end = worldToScreen(p.xPrime, p.yPrime, width, height);

      if (state.showBase && state.step > 0) {
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(start.sx, start.sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (state.showVectors && state.step > 0) {
        drawArrow(start.sx, start.sy, end.sx, end.sy, "#10b981");
      }

      ctx.fillStyle = "#1d4ed8";
      ctx.beginPath();
      ctx.arc(end.sx, end.sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  function applyPreset(key) {
    if (!PRESETS[key]) return;
    const p = PRESETS[key];
    state.fn = p.fn;
    state.invK = p.invK ?? 4;
    state.h = p.h;
    state.k = p.k;
    state.v = p.v;
    state.reflect = p.reflect;
    state.outerAbs = p.outerAbs;
    state.showSecondary = Boolean(p.showSecondary);
    state.showLineA = Boolean(p.showLineA);
    if (p.paramA !== undefined) state.paramA = p.paramA;
    state.step = 4;
    syncUIFromState();
    draw();
  }

  function markCustom() {
    els.presetSelect.value = "custom";
  }

  els.presetSelect.addEventListener("change", (e) => {
    if (e.target.value !== "custom") applyPreset(e.target.value);
  });

  els.resetBtn.addEventListener("click", () => {
    els.presetSelect.value = "custom";
    Object.assign(state, {
      fn: "x2",
      invK: 4,
      h: 0,
      k: 1,
      v: 0,
      reflect: false,
      outerAbs: false,
      step: 4,
      showSecondary: false,
      showLineA: false,
      panX: 0,
      panY: 0,
      zoom: 42,
    });
    syncUIFromState();
    draw();
  });

  els.baseButtons.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.fn = btn.dataset.fn;
    markCustom();
    syncUIFromState();
    draw();
  });

  els.invKSlider.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    state.invK = val === 0 ? (state.invK > 0 ? -1 : 1) : val;
    markCustom();
    syncUIFromState();
    draw();
  });

  els.hSlider.addEventListener("input", (e) => {
    state.h = Number(e.target.value);
    markCustom();
    syncUIFromState();
    draw();
  });

  els.kSlider.addEventListener("input", (e) => {
    state.k = Number(e.target.value);
    markCustom();
    syncUIFromState();
    draw();
  });

  els.vSlider.addEventListener("input", (e) => {
    state.v = Number(e.target.value);
    markCustom();
    syncUIFromState();
    draw();
  });

  els.reflectCheck.addEventListener("change", (e) => {
    state.reflect = e.target.checked;
    markCustom();
    syncUIFromState();
    draw();
  });

  els.outerAbsCheck.addEventListener("change", (e) => {
    state.outerAbs = e.target.checked;
    markCustom();
    syncUIFromState();
    draw();
  });

  els.paramASlider.addEventListener("input", (e) => {
    state.paramA = Number(e.target.value);
    syncUIFromState();
    draw();
  });

  els.showLineACheck.addEventListener("change", (e) => {
    state.showLineA = e.target.checked;
    syncUIFromState();
    draw();
  });

  els.prevStepBtn.addEventListener("click", () => {
    state.step = Math.max(0, state.step - 1);
    syncUIFromState();
    draw();
  });

  els.nextStepBtn.addEventListener("click", () => {
    state.step = Math.min(4, state.step + 1);
    syncUIFromState();
    draw();
  });

  els.stepPills.addEventListener("click", (e) => {
    const btn = e.target.closest(".step-pill");
    if (!btn) return;
    state.step = Number(btn.dataset.step);
    syncUIFromState();
    draw();
  });

  els.showBaseCheck.addEventListener("change", (e) => {
    state.showBase = e.target.checked;
    draw();
  });

  els.showIntermediateCheck.addEventListener("change", (e) => {
    state.showIntermediate = e.target.checked;
    draw();
  });

  els.showVectorsCheck.addEventListener("change", (e) => {
    state.showVectors = e.target.checked;
    draw();
  });

  els.showSecondaryCheck.addEventListener("change", (e) => {
    state.showSecondary = e.target.checked;
    syncUIFromState();
    draw();
  });

  els.zoomInBtn.addEventListener("click", () => {
    state.zoom = Math.min(100, state.zoom + 6);
    syncUIFromState();
    draw();
  });

  els.zoomOutBtn.addEventListener("click", () => {
    state.zoom = Math.max(18, state.zoom - 6);
    syncUIFromState();
    draw();
  });

  els.centerBtn.addEventListener("click", () => {
    state.panX = 0;
    state.panY = 0;
    state.zoom = 42;
    syncUIFromState();
    draw();
  });

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  els.canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStart = { x: e.clientX - state.panX, y: e.clientY - state.panY };
  });

  window.addEventListener("mousemove", (e) => {
    const rect = els.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    if (sx >= 0 && sy >= 0 && sx <= rect.width && sy <= rect.height) {
      const { wx, wy } = screenToWorld(sx, sy, rect.width, rect.height);
      els.cursorCoords.textContent = `x: ${wx.toFixed(1)}, y: ${wy.toFixed(1)}`;
    }
    if (isDragging) {
      state.panX = e.clientX - dragStart.x;
      state.panY = e.clientY - dragStart.y;
      draw();
    }
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  els.canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 4 : -4;
      state.zoom = Math.max(18, Math.min(100, state.zoom + delta));
      syncUIFromState();
      draw();
    },
    { passive: false }
  );

  window.addEventListener("resize", resizeCanvas);

  syncUIFromState();
  resizeCanvas();
})(typeof window !== "undefined" ? window : globalThis);
