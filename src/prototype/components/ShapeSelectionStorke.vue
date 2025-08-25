<template>
  <div class="shape-selection-app">
    <h2 class="title">선분 선택 (선 두께 방식)</h2>

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

      <!-- 선분 A -->
      <div class="panel">
        <h3>선분 A (p1 → p2)</h3>
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
        </div>

        <!-- 옵션 -->
        <div class="slider-row">
          <div class="control-group">
            <label>두께: {{ lineWidthA }}px</label>
            <input type="number" v-model.number="lineWidthA" :min="1" :max="20" />
            <input type="range" v-model.number="lineWidthA" :min="1" :max="20" />
          </div>
          <div class="control-group">
            <label>색상</label>
            <input type="color" v-model="lineColorA" />
          </div>
        </div>
      </div>

      <!-- 선택 영역 옵션 -->
      <div class="panel">
        <h3>선택 영역 (두께)</h3>
        <div class="slider-row">
          <div class="control-group">
            <label>Factor: {{ factor }}</label>
            <input type="range" v-model.number="factor" min="0.5" max="3" step="0.1" />
          </div>
          <div class="control-group">
            <label>색상</label>
            <input type="color" v-model="selectColor" />
          </div>
          <div class="control-group">
            <label>투명도: {{ selectAlpha }}</label>
            <input type="range" v-model.number="selectAlpha" min="0" max="1" step="0.05" />
          </div>
        </div>
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
import { drawLine } from "@/services/canvas";
import { onPath } from "@/math";

// ===== 상태 =====
const canvasWidth = ref(600);
const canvasHeight = ref(400);

const p1 = ref({ x: 100, y: 100 });
const p2 = ref({ x: 300, y: 200 });

const lineWidthA = ref(3);
const lineColorA = ref("#ff0000");

const factor = ref(1);
const selectColor = ref("#00cc66");
const selectAlpha = ref(0.3);

const canvasElement = ref(null);

// ===== 유틸 =====
function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// ===== 그리기 =====
function redraw(showText = false) {
  const canvas = canvasElement.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

  // 선분 A
  drawLine(
    ctx,
    p1.value,
    p2.value,
    { width: lineWidthA.value, color: lineColorA.value }
  );

  // 선택 영역(시각화): A와 동일한 위치·길이, 두께 = lineWidthA * factor
  const thickness = lineWidthA.value * factor.value;
  const [r, g, b] = hexToRgb(selectColor.value);
  ctx.save();
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${selectAlpha.value})`;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p1.value.x, p1.value.y);
  ctx.lineTo(p2.value.x, p2.value.y);
  ctx.stroke();
  ctx.restore();

  if (showText) {
    ctx.save();
    ctx.fillStyle = "red";
    ctx.font = "20px sans-serif";
    ctx.fillText("OVERLAP!", 20, 30);
    ctx.restore();
  }
}

function onPointerMove(e) {
  const rect = canvasElement.value.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const thickness = lineWidthA.value * factor.value;

  // ★ onPath 적용: points는 닫힌 경로로 취급(두 점도 허용)
  const points = [p1.value, p2.value];
  const inside = onPath(pos, points, thickness);

  redraw(inside);
}

watch(
  [p1, p2, lineWidthA, lineColorA, factor, selectColor, selectAlpha, canvasWidth, canvasHeight],
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
</style>
