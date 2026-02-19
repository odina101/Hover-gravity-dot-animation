(() => {
  const canvas = document.getElementById('dotCanvas');
  const ctx = canvas.getContext('2d');
  const content = document.getElementById('content');

  let W, H;
  let dots = [];
  let isHovering = false;
  let boxRect = { x: 0, y: 0, w: 0, h: 0 };
  let currentShape = 'box';

  const DOT_COUNT = 800;
  const DOT_RADIUS = 1;
  const BOX_PADDING = 40;
  const INFLUENCE_RADIUS = 220;
  const ACTIVE_COLOR = '#4a7dff';
  const IDLE_COLOR = '#000000';

  const GRAVITY = 0.15;
  const FRICTION = 0.95;
  const RESPAWN_CHANCE = 0.001;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    updateBoxRect();
  }

  function updateBoxRect() {
    const rect = content.getBoundingClientRect();
    boxRect.x = rect.left - BOX_PADDING;
    boxRect.y = rect.top - BOX_PADDING;
    boxRect.w = rect.width + BOX_PADDING * 2;
    boxRect.h = rect.height + BOX_PADDING * 2;
  }

  function randomPointInInfluenceZone() {
    const side = Math.floor(Math.random() * 4);
    const offset = INFLUENCE_RADIUS * (0.3 + Math.random() * 0.7);
    const bx = boxRect.x, by = boxRect.y;
    const bw = boxRect.w, bh = boxRect.h;
    switch (side) {
      case 0: return { x: bx + Math.random() * bw, y: by - offset };
      case 1: return { x: bx + Math.random() * bw, y: by + bh + offset };
      case 2: return { x: bx - offset, y: by + Math.random() * bh };
      case 3: return { x: bx + bw + offset, y: by + Math.random() * bh };
    }
  }

  function createDots() {
    dots = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      dots.push({
        x, y,
        originX: x,
        originY: y,
        vx: 0,
        vy: 0,
        opacity: 1,
        fading: false,
      });
    }
  }

  // ─── Shape functions ───
  // Each returns the nearest point on the shape's perimeter

  const shapes = {

    box(px, py) {
      const bx = boxRect.x, by = boxRect.y;
      const br = bx + boxRect.w, bb = by + boxRect.h;

      let cx = Math.max(bx, Math.min(px, br));
      let cy = Math.max(by, Math.min(py, bb));

      if (cx !== bx && cx !== br && cy !== by && cy !== bb) {
        const dL = Math.abs(px - bx), dR = Math.abs(px - br);
        const dT = Math.abs(py - by), dB = Math.abs(py - bb);
        const m = Math.min(dL, dR, dT, dB);
        if (m === dL) cx = bx;
        else if (m === dR) cx = br;
        else if (m === dT) cy = by;
        else cy = bb;
      }
      return { x: cx, y: cy };
    },

    heart(px, py) {
      const cx = boxRect.x + boxRect.w / 2;
      const cy = boxRect.y + boxRect.h / 2;
      const scale = Math.min(boxRect.w, boxRect.h) * 0.48;

      let bestX = cx, bestY = cy, bestDist = Infinity;
      for (let i = 0; i < 200; i++) {
        const t = (i / 200) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const sx = cx + (hx / 17) * scale;
        const sy = cy + (hy / 17) * scale;
        const dx = px - sx, dy = py - sy;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestX = sx;
          bestY = sy;
        }
      }
      return { x: bestX, y: bestY };
    },

    circle(px, py) {
      const cx = boxRect.x + boxRect.w / 2;
      const cy = boxRect.y + boxRect.h / 2;
      const r = Math.min(boxRect.w, boxRect.h) * 0.48;
      const angle = Math.atan2(py - cy, px - cx);
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    },

    star(px, py) {
      const cx = boxRect.x + boxRect.w / 2;
      const cy = boxRect.y + boxRect.h / 2;
      const outerR = Math.min(boxRect.w, boxRect.h) * 0.48;
      const innerR = outerR * 0.4;
      const points = 5;

      let bestX = cx, bestY = cy, bestDist = Infinity;
      const total = points * 2;
      for (let i = 0; i < total; i++) {
        const a1 = (i / total) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 1) / total) * Math.PI * 2 - Math.PI / 2;
        const r1 = i % 2 === 0 ? outerR : innerR;
        const r2 = (i + 1) % 2 === 0 ? outerR : innerR;
        const x1 = cx + Math.cos(a1) * r1, y1 = cy + Math.sin(a1) * r1;
        const x2 = cx + Math.cos(a2) * r2, y2 = cy + Math.sin(a2) * r2;

        const pt = nearestPointOnSegment(px, py, x1, y1, x2, y2);
        const dx = px - pt.x, dy = py - pt.y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestX = pt.x;
          bestY = pt.y;
        }
      }
      return { x: bestX, y: bestY };
    },

    diamond(px, py) {
      const cx = boxRect.x + boxRect.w / 2;
      const cy = boxRect.y + boxRect.h / 2;
      const hw = boxRect.w * 0.45;
      const hh = boxRect.h * 0.48;

      const verts = [
        { x: cx, y: cy - hh },
        { x: cx + hw, y: cy },
        { x: cx, y: cy + hh },
        { x: cx - hw, y: cy },
      ];

      let bestX = cx, bestY = cy, bestDist = Infinity;
      for (let i = 0; i < 4; i++) {
        const v1 = verts[i], v2 = verts[(i + 1) % 4];
        const pt = nearestPointOnSegment(px, py, v1.x, v1.y, v2.x, v2.y);
        const dx = px - pt.x, dy = py - pt.y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestX = pt.x;
          bestY = pt.y;
        }
      }
      return { x: bestX, y: bestY };
    },
  };

  function nearestPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return { x: x1, y: y1 };
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return { x: x1 + t * dx, y: y1 + t * dy };
  }

  function nearestPointOnShape(px, py) {
    return shapes[currentShape](px, py);
  }

  function distToShape(px, py) {
    const p = nearestPointOnShape(px, py);
    const dx = px - p.x, dy = py - p.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function pointInBox(px, py) {
    return px >= boxRect.x && px <= boxRect.x + boxRect.w &&
           py >= boxRect.y && py <= boxRect.y + boxRect.h;
  }

  function update() {
    updateBoxRect();

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const originDist = distToShape(d.originX, d.originY);

      if (isHovering && originDist < INFLUENCE_RADIUS) {

        if (d.fading) {
          d.opacity -= 0.015;
          if (d.opacity <= 0) {
            d.fading = false;
            d.opacity = 0;
            const spawn = randomPointInInfluenceZone();
            d.x = spawn.x;
            d.y = spawn.y;
            d.vx = 0;
            d.vy = 0;
          }
          continue;
        }

        if (d.opacity < 1) {
          d.opacity = Math.min(1, d.opacity + 0.03);
        }

        const target = nearestPointOnShape(d.x, d.y);
        const dx = target.x - d.x;
        const dy = target.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
          const force = GRAVITY / dist;
          d.vx += dx * force;
          d.vy += dy * force;
        }

        d.vx *= FRICTION;
        d.vy *= FRICTION;
        d.x += d.vx;
        d.y += d.vy;

        if (dist < 5 && !d.fading && Math.random() < RESPAWN_CHANCE) {
          d.fading = true;
        }

      } else if (!isHovering) {
        d.vx = 0;
        d.vy = 0;
        d.fading = false;
        d.opacity = 1;
        d.x += (d.originX - d.x) * 0.03;
        d.y += (d.originY - d.y) * 0.03;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const moved = Math.abs(d.x - d.originX) + Math.abs(d.y - d.originY);
      const isActive = moved >= 3;

      ctx.beginPath();
      ctx.fillStyle = isActive ? ACTIVE_COLOR : IDLE_COLOR;
      ctx.globalAlpha = isActive ? d.opacity * 0.85 : 0.3;
      ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
  }

  // Shape switcher
  function setShape(name) {
    if (shapes[name]) {
      currentShape = name;
      document.querySelectorAll('.shape-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.shape === name);
      });
    }
  }

  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setShape(btn.dataset.shape);
    });
  });

  document.addEventListener('mousemove', (e) => {
    isHovering = pointInBox(e.clientX, e.clientY);
  });

  document.addEventListener('mouseleave', () => {
    isHovering = false;
  });

  window.addEventListener('resize', () => {
    resize();
    createDots();
  });

  resize();
  createDots();
  animate();
})();
