<template>
  <div class="shape-selection-app">
    <h2 class="title">사각형 선택 (선 두께 방식)</h2>

    <!-- 컨트롤 -->
    <div class="controls">
      <!-- 캔버스 크기 -->
      <div class="panel">
        <h3>캔버스 크기</h3>
        <div class="slider-row">
          <div class="control-group">
            <label>너비: {{ canvasWidth }}px</label>
            <input type="number" v-model.number="canvasWidth" :min="200" :max="2000" />
            <input type="range" v-model.number="canvasWidth" :min="200" :max="2000" />
          </div>
          <div class="control-group">
            <label>높이: {{ canvasHeight }}px</label>
            <input type="number" v-model.number="canvasHeight" :min="200" :max="2000" />
            <input type="range" v-model.number="canvasHeight" :min="200" :max="2000" />
          </div>
        </div>
      </div>

      <!-- 사각형 좌표 -->
      <div class="panel">
        <h3>사각형 (p1 → p2 → p3 → p4)</h3>
        <div class="xy-groups">
          <div class="control-group">
            <label>p1.x: {{ p1.x }}</label>
            <input type="number" v-model.number="p1.x" :min="0" :max="canvasWidth" />
            <input type="range" v-model.number="p1.x" :min="0" :max="canvasWidth" />
          </div>
          <div class="control-group">
            <label>p1.y: {{ p1.y }}</label>
            <input type="number" v-model.number="p1.y" :min="0" :max="canvasHeight" />
            <input type="range" v-model.number="p1.y" :min="0" :max="canvasHeight" />
          </div>

          <div class="control-group">
            <label>p2.x: {{ p2.x }}</label>
            <input type="number" v-model.number="p2.x" :min="0" :max="canvasWidth" />
            <input type="range" v-model.number="p2.x" :min="0" :max="canvasWidth" />
          </div>
          <div class="control-group">
            <label>p2.y: {{ p2.y }}</label>
            <input type="number" v-model.number="p2.y" :min="0" :max="canvasHeight" />
            <input type="range" v-model.number="p2.y" :min="0" :max="canvasHeight" />
          </div>

          <div class="control-group">
            <label>p3.x: {{ p3.x }}</label>
            <input type="number" v-model.number="p3.x" :min="0" :max="canvasWidth" />
            <input type="range" v-model.number="p3.x" :min="0" :max="canvasWidth" />
          </div>
          <div class="control-group">
            <label>p3.y: {{ p3.y }}</label>
            <input type="number" v-model.number="p3.y" :min="0" :max="canvasHeight" />
            <input type="range" v-model.number="p3.y" :min="0" :max="canvasHeight" />
          </div>

          <div class="control-group">
            <label>p4.x: {{ p4.x }}</label>
            <input type="number" v-model.number="p4.x" :min="0" :max="canvasWidth" />
            <input type="range" v-model.number="p4.x" :min="0" :max="canvasWidth" />
          </div>
          <div class="control-group">
            <label>p4.y: {{ p4.y }}</label>
            <input type="number" v-model.number="p4.y" :min="0" :max="canvasHeight" />
            <input type="range" v-model.number="p4.y" :min="0" :max="canvasHeight" />
          </div>
        </div>

        <!-- 스트로크 옵션 -->
        <div class="slider-row">
          <div class="control-group">
            <label>테두리 두께: {{ lineWidth }}px</label>
            <input type="number" v-model.number="lineWidth" :min="1" :max="40" />
            <input type="range" v-model.number="lineWidth" :min="1" :max="40" />
          </div>
          <div class="control-group">
            <label>테두리 색상</label>
            <input type="color" v-model="lineColor" />
          </div>
        </div>
      </div>

      <!-- 선택(히트) 두께 옵션 -->
      <div class="panel">
        <h3>선택 영역 (테두리 두께 · %)</h3>
        <div class="slider-row">
          <div class="control-group">
            <label>Factor: {{ factor }}</label>
            <input type="range" v-model.number="factor" min="0.5" max="3" step="0.1" />
          </div>
          <div class="control-group">
            <label>시각화 색상</label>
            <input type="color" v-model="selectColor" />
          </div>
          <div class="control-group">
            <label>시각화 투명도: {{ selectAlpha }}</label>
            <input type="range" v-model.number="selectAlpha" min="0" max="1" step="0.05" />
          </div>
        </div>
        <p class="hint">factor = 1 → 테두리와 동일 두께, 0.5 → 절반, 2 → 두 배</p>
      </div>
    </div>

    <!-- 캔버스 -->
    <div class="canvas-container">
      <canvas
        ref="canvasElement"
        :width="canvasWidth"
        :height="canvasHeight"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
        @pointermove="onPointerMove"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { onPath } from "@/math"; // ★ 도형 테두리 히트 판정 (닫힌 경로 고정)

// ===== 상태 =====
const canvasWidth = ref(640);
const canvasHeight = ref(380);

// 기본 사각형 좌표(시계 방향)
const p1 = ref({ x: 120, y: 100 });
const p2 = ref({ x: 420, y: 100 });
const p3 = ref({ x: 420, y: 260 });
const p4 = ref({ x: 120, y: 260 });

const lineWidth = ref(6);
const lineColor = ref("#e53935");

const factor = ref(1);
const selectColor = ref("#1e88e5");
const selectAlpha = ref(0.25);

const canvasElement = ref(null);

// ===== 유틸 =====
function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function drawPolygon(ctx, points, strokeColor, strokeWidth) {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ===== 그리기 =====
function redraw(showText = false) {
  const canvas = canvasElement.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

  const points = [p1.value, p2.value, p3.value, p4.value];

  // 1) 사각형 테두리(원래 두께)
  drawPolygon(ctx, points, lineColor.value, lineWidth.value);

  // 2) 선택 영역(시각화): 같은 경로에 더 굵은 스트로크
  const thickness = lineWidth.value * factor.value;
  const [r, g, b] = hexToRgb(selectColor.value);
  drawPolygon(ctx, points, `rgba(${r}, ${g}, ${b}, ${selectAlpha.value})`, thickness);

  if (showText) {
    ctx.save();
    ctx.fillStyle = "#2e7d32";
    ctx.font = "bold 20px ui-sans-serif, system-ui, -apple-system";
    ctx.fillText("OVERLAP!", 18, 28);
    ctx.restore();
  }
}

function onPointerMove(e) {
  const rect = canvasElement.value.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const points = [p1.value, p2.value, p3.value, p4.value];
  const thickness = lineWidth.value * factor.value;

  const hit = onPath(pos, points, thickness); // ★ 닫힌 경로 테두리 위 판정
  redraw(hit);
}

watch(
  [p1, p2, p3, p4, lineWidth, lineColor, factor, selectColor, selectAlpha, canvasWidth, canvasHeight],
  () => nextTick(() => redraw(false)),
  { deep: true }
);

onMounted(() => redraw());
</script>

<style scoped>
.shape-selection-app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 20px;
}
.title { text-align: center; margin: 0; }
.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(1000px, 92vw);
}
.panel {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  background: #fff;
}
.slider-row { display: flex; gap: 40px; flex-wrap: wrap; }
.xy-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(200px, 1fr));
  gap: 20px;
}
.control-group { display: flex; flex-direction: column; gap: 6px; width: 200px; }
label { font-weight: 600; }
input[type="number"], input[type="range"], input[type="color"] {
  width: 100%; box-sizing: border-box;
}
.canvas-container { display: flex; justify-content: center; width: 100%; }
canvas {
  border: 2px solid #d1d5db;
  background: #fafafa;
  border-radius: 8px;
}
.hint { color: #6b7280; font-size: 12px; margin-top: 6px; }
</style>
