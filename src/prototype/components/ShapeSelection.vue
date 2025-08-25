<template>
  <div class="shape-selection-app">
    <h2 class="title">도형 선택 (선분 수직교차 방식)</h2>

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

        <!-- 선 A 옵션 -->
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

      <!-- 선분 B 옵션 -->
      <div class="panel">
        <h3>선분 B (수직 교차)</h3>
        <div class="control-group">
          <label>Scale Factor: {{ scaleFactor }}</label>
          <input type="range" v-model.number="scaleFactor" min="0" max="5" step="0.1" />
        </div>
        <div class="slider-row">
          <div class="control-group">
            <label>두께: {{ lineWidthB }}px</label>
            <input type="number" v-model.number="lineWidthB" :min="1" :max="20" />
            <input type="range" v-model.number="lineWidthB" :min="1" :max="20" />
          </div>
          <div class="control-group">
            <label>색상</label>
            <input type="color" v-model="lineColorB" />
          </div>
        </div>
      </div>

      <!-- 콜리전 옵션 -->
      <div class="panel">
        <h3>콜리전 영역</h3>
        <div class="slider-row">
          <div class="control-group">
            <label>색상</label>
            <input type="color" v-model="rectColor" />
          </div>
          <div class="control-group">
            <label>투명도: {{ rectAlpha }}</label>
            <input type="range" v-model.number="rectAlpha" min="0" max="1" step="0.05" />
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
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { drawLine } from "@/services/canvas";
import { perpendicularSegment, makeBoxCollision, inArea } from "@/math";

// ===== 상태 =====
const canvasWidth = ref(600);
const canvasHeight = ref(400);

const p1 = ref({ x: 100, y: 100 });
const p2 = ref({ x: 300, y: 200 });

const lineWidthA = ref(3);
const lineColorA = ref("#ff0000");

const lineWidthB = ref(2);
const lineColorB = ref("#0066ff");

const scaleFactor = ref(1);

const rectColor = ref("#00cc66");
const rectAlpha = ref(0.3);

const canvasElement = ref(null);

// boxCollision 저장
let boxCollision = null;

// ===== 유틸 =====
function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// ===== 그리기 =====
function redraw(showOverlapText = false) {
  const canvas = canvasElement.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

  // 선분 A
  drawLine(
    canvas,
    p1.value,
    p2.value,
    { lineWidth: lineWidthA.value, lineColor: lineColorA.value }
  );

  // 선분 B 계산
  const [q1, q2] = perpendicularSegment(
    [p1.value.x, p1.value.y],
    [p2.value.x, p2.value.y],
    scaleFactor.value
  );

  // 선분 B 그리기
  drawLine(
    canvas,
    { x: q1[0], y: q1[1] },
    { x: q2[0], y: q2[1] },
    { lineWidth: lineWidthB.value, lineColor: lineColorB.value }
  );

  // ===== 콜리전 영역 계산 (boxCollision) =====
  boxCollision = makeBoxCollision(
    [[p1.value.x, p1.value.y], [p2.value.x, p2.value.y]],
    [q1, q2]
  );

  // 채우기
  ctx.save();
  const [r, g, b] = hexToRgb(rectColor.value);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${rectAlpha.value})`;
  ctx.beginPath();
  ctx.moveTo(boxCollision[0].x, boxCollision[0].y);
  ctx.lineTo(boxCollision[1].x, boxCollision[1].y);
  ctx.lineTo(boxCollision[2].x, boxCollision[2].y);
  ctx.lineTo(boxCollision[3].x, boxCollision[3].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // overlap 텍스트 표시
  if (showOverlapText) {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("overlap!", 20, 30);
    ctx.restore();
  }
}

// ===== 좌표 변화 감시 =====
watch(
  [p1, p2, lineWidthA, lineColorA, lineWidthB, lineColorB, scaleFactor, rectColor, rectAlpha, canvasWidth, canvasHeight],
  () => nextTick(() => redraw(false)),
  { deep: true }
);

// ===== 캔버스 이벤트 =====
onMounted(() => {
  redraw();

  const canvas = canvasElement.value;
  if (!canvas) return;

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const inside = inArea(pos, boxCollision);
    redraw(inside); // overlap 텍스트 갱신
  });
});
</script>

<style scoped>
.shape-selection-app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 20px;
}

.title {
  text-align: center;
  margin: 0;
}

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

.slider-row {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.xy-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(200px, 1fr));
  gap: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 200px;
}

label {
  font-weight: 600;
}

input[type="number"],
input[type="range"],
input[type="color"] {
  width: 100%;
  box-sizing: border-box;
}

.canvas-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

canvas {
  border: 2px solid #d1d5db;
  background: #fafafa;
  border-radius: 8px;
}
</style>
