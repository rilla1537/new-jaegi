<template>
  <div class="image-canvas-app">
    <!-- 제목 -->
    <h2 class="title">이미지 + 좌표 선 도구</h2>

    <!-- 컨트롤 영역 -->
    <div class="controls">
      <!-- 파일 업로드 -->
      <div class="row">
        <button @click="triggerFileInput">이미지 선택</button>
        <input
          type="file"
          ref="fileInput"
          @change="handleImageUpload"
          accept="image/*"
          style="display: none"
        />
        <span class="hint"
          >이미지는 선택 사항입니다. 없으면 선만 표시돼요.</span
        >
      </div>

      <!-- 캔버스 크기 -->
      <div class="panel">
        <h3>캔버스 크기</h3>
        <div class="slider-row">
          <div class="control-group">
            <label for="width">너비: {{ canvasWidth }}px</label>
            <input
              type="number"
              id="width"
              v-model.number="canvasWidth"
              :min="100"
              :max="2000"
            />
            <input
              type="range"
              v-model.number="canvasWidth"
              :min="100"
              :max="2000"
            />
          </div>
          <div class="control-group">
            <label for="height">높이: {{ canvasHeight }}px</label>
            <input
              type="number"
              id="height"
              v-model.number="canvasHeight"
              :min="100"
              :max="2000"
            />
            <input
              type="range"
              v-model.number="canvasHeight"
              :min="100"
              :max="2000"
            />
          </div>
        </div>
      </div>

      <!-- 좌표: 2묶음 (시작 / 끝) -->
      <div class="panel">
        <h3>좌표 설정 (캔버스 내부 좌표)</h3>

        <div class="xy-groups">
          <!-- 시작 좌표 -->
          <div class="xy-group">
            <h4>시작 좌표</h4>
            <div class="control-group">
              <label for="startX">X: {{ startX }}</label>
              <input
                type="number"
                id="startX"
                v-model.number="startX"
                :min="0"
                :max="canvasWidth"
              />
              <input
                type="range"
                v-model.number="startX"
                :min="0"
                :max="canvasWidth"
              />
            </div>
            <div class="control-group">
              <label for="startY">Y: {{ startY }}</label>
              <input
                type="number"
                id="startY"
                v-model.number="startY"
                :min="0"
                :max="canvasHeight"
              />
              <input
                type="range"
                v-model.number="startY"
                :min="0"
                :max="canvasHeight"
              />
            </div>
          </div>

          <!-- 끝 좌표 -->
          <div class="xy-group">
            <h4>끝 좌표</h4>
            <div class="control-group">
              <label for="endX">X: {{ endX }}</label>
              <input
                type="number"
                id="endX"
                v-model.number="endX"
                :min="0"
                :max="canvasWidth"
              />
              <input
                type="range"
                v-model.number="endX"
                :min="0"
                :max="canvasWidth"
              />
            </div>
            <div class="control-group">
              <label for="endY">Y: {{ endY }}</label>
              <input
                type="number"
                id="endY"
                v-model.number="endY"
                :min="0"
                :max="canvasHeight"
              />
              <input
                type="range"
                v-model.number="endY"
                :min="0"
                :max="canvasHeight"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 선 옵션 -->
      <div class="panel">
        <h3>선 옵션</h3>
        <div class="slider-row">
          <div class="control-group">
            <label for="lineWidth">두께: {{ lineWidth }}px</label>
            <input
              type="number"
              id="lineWidth"
              v-model.number="lineWidth"
              :min="1"
              :max="50"
            />
            <input type="range" v-model.number="lineWidth" :min="1" :max="50" />
          </div>
          <div class="control-group">
            <label for="lineColor">색상</label>
            <input type="color" id="lineColor" v-model="lineColor" />
          </div>
        </div>
      </div>
    </div>

    <!-- 캔버스 영역 -->
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
import { ref, watch, nextTick, onMounted } from "vue";
import { drawLine } from "@/canvas";

// ===== 상태 =====
const canvasWidth = ref(600);
const canvasHeight = ref(360);

const startX = ref(50);
const startY = ref(50);
const endX = ref(300);
const endY = ref(150);

const lineWidth = ref(4);
const lineColor = ref("#ff3366");

const canvasElement = ref(null);
const fileInput = ref(null);
let currentImage = null; // 배경 이미지 (선택)

// ===== 파일 업로드 =====
const triggerFileInput = () => fileInput.value?.click();

const handleImageUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      redraw();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// ===== 유틸: 값 클램프 =====
function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

// 캔버스 크기 바뀌면 좌표도 보정
watch([canvasWidth, canvasHeight], () => {
  startX.value = clamp(startX.value, 0, canvasWidth.value);
  endX.value = clamp(endX.value, 0, canvasWidth.value);
  startY.value = clamp(startY.value, 0, canvasHeight.value);
  endY.value = clamp(endY.value, 0, canvasHeight.value);
  nextTick(redraw);
});

// 좌표/옵션 값이 바뀌면 다시 그리기 (좌표도 clamp)
watch([startX, startY, endX, endY, lineWidth, lineColor], () => {
  startX.value = clamp(startX.value, 0, canvasWidth.value);
  endX.value = clamp(endX.value, 0, canvasWidth.value);
  startY.value = clamp(startY.value, 0, canvasHeight.value);
  endY.value = clamp(endY.value, 0, canvasHeight.value);
  redraw();
});

// ===== 그리기 로직 =====
function redraw() {
  const canvas = canvasElement.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // HiDPI(레티나) 보정
  const dpr = window.devicePixelRatio || 1;
  if (
    canvas.width !== canvasWidth.value ||
    canvas.height !== canvasHeight.value
  ) {
    // 이미 :width/:height로 설정되므로 여기선 스타일만 유지
  }
  // 내부 픽셀 스케일 조정
  if (dpr !== 1) {
    // 현재 width/height는 논리 px. 내부 버퍼를 dpr배로 키워 선이 또렷해지도록 처리
    // 단, 스타일 크기는 그대로 유지
    const cssW = canvasWidth.value;
    const cssH = canvasHeight.value;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 이후 좌표는 논리 px 기준으로 사용 가능
  } else {
    // dpr 1인 경우 기본 리셋
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    canvas.width = canvasWidth.value;
    canvas.height = canvasHeight.value;
  }

  // 배경 클리어
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

  // 배경 이미지가 있으면 "contain" 방식으로 중앙 배치
  if (currentImage) {
    const { drawW, drawH, offsetX, offsetY } = computeContainFit(
      currentImage.width,
      currentImage.height,
      canvasWidth.value,
      canvasHeight.value
    );
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(currentImage, offsetX, offsetY, drawW, drawH);
  } else {
    // 이미지 없을 때 배경
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  }

  // 선 그리기
  drawLine(
    ctx,
    { x: startX.value, y: startY.value },
    { x: endX.value, y: endY.value },
    { width: lineWidth.value, color: lineColor.value }
  );

  // 시각 보조: 점 위치 마커
  drawPoint(ctx, startX.value, startY.value, "#2db55d");
  drawPoint(ctx, endX.value, endY.value, "#0070f3");
}

function drawPoint(ctx, x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** 이미지 contain 맞춤 계산 */
function computeContainFit(imgW, imgH, boxW, boxH) {
  const imgRatio = imgW / imgH;
  const boxRatio = boxW / boxH;
  let drawW, drawH;
  if (imgRatio > boxRatio) {
    drawW = boxW;
    drawH = Math.round(drawW / imgRatio);
  } else {
    drawH = boxH;
    drawW = Math.round(drawH * imgRatio);
  }
  const offsetX = Math.round((boxW - drawW) / 2);
  const offsetY = Math.round((boxH - drawH) / 2);
  return { drawW, drawH, offsetX, offsetY };
}

onMounted(() => {
  redraw();
});
</script>

<style scoped>
.image-canvas-app {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
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

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint {
  color: #6b7280;
  font-size: 12px;
}

.slider-row {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.xy-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 32px;
}

.xy-group h4 {
  margin: 0 0 8px 0;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 260px;
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

button {
  padding: 10px 14px;
  border: 0;
  background-color: #42b983;
  color: #fff;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}
button:hover {
  background-color: #36a374;
}

.canvas-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

canvas {
  border: 2px solid #d1d5db;
  background: #f9fafb;
  border-radius: 8px;
}
</style>
