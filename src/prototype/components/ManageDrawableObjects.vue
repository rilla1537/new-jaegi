<template>
  <div class="drawables-prototype">
    <h2>{{ title }}</h2>

    <div class="controls">
      <button @click="addRandomLine">라인 추가</button>
      <button @click="addRandomRect">사각형 추가</button>
    </div>

    <div class="main-container">
      <!-- 캔버스 영역 -->
      <div class="canvas-container">
        <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" style="border:1px solid #ccc;"></canvas>
      </div>

      <!-- 도형 리스트 (사이드뷰) -->
      <div class="object-list">
        <div v-for="(obj, index) in store.drawableObjects" :key="obj.id" class="object-item">
          <div class="object-header">
            <h4>{{ obj.name }} ({{ obj.shape }}, id: {{ obj.id }})</h4>
            <div class="actions">
              <button @click="store.layerUp(obj.id); redraw()" :disabled="store.drawableObjects[0]?.id === obj.id">▲</button>
              <button @click="store.layerDown(obj.id); redraw()" :disabled="store.drawableObjects[store.drawableObjects.length - 1]?.id === obj.id">▼</button>
              <button @click="store.drawOnTop(obj.id); redraw()">⬆TOP</button>
              <button @click="store.drawOnBottom(obj.id); redraw()">⬇BOT</button>
              <button class="delete-btn" @click="store.removeObject(obj.id)">x</button>
            </div>
          </div>

          <label>색상:
            <input type="color" v-model="obj.option.color" @input="syncFill(obj); redraw()" />
          </label>
          <label>두께:
            <input type="number" v-model.number="obj.option.width" min="1" max="20" @input="redraw" />
          </label>
          <label>join:
            <select v-model="obj.option.join" @change="redraw">
              <option>round</option>
              <option>bevel</option>
              <option>miter</option>
            </select>
          </label>
          <label>cap:
            <select v-model="obj.option.cap" @change="redraw">
              <option>round</option>
              <option>square</option>
              <option>butt</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDrawableObjectsStore } from "@/stores/drawable-objects";
import { useDrawableRenderer } from "@/composables/useDrawableRenderer"; // watch+redraw+DPR 자동

import { useRoute } from "vue-router";

const route = useRoute();
const title = ref(route.query.title);

const store = useDrawableObjectsStore();
const canvasWidth = ref(600);
const canvasHeight = ref(400);
const canvas = ref(null);

const { redraw } = useDrawableRenderer({
  canvasRef: canvas,
  objectsRef: () => store.drawableObjects,
  dprAware: true,
  clearBeforeDraw: true,
});

// 랜덤 유틸
function randomColor() {
  return "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0");
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 색상 변경 시 배경색을 선 색상과 동일하게 동기화
function syncFill(obj) {
  if (!obj?.option) return;
  if (!obj.option.background) obj.option.background = { color: "", alpha: 1 };
  obj.option.background.color = obj.option.color || "#ffffff";
  if (obj.option.background.alpha == null) obj.option.background.alpha = 1;
}

// 버튼에서 호출하는 함수
function addRandomLine() {
  const color = randomColor();
  store.addLine({
    points: [
      { x: Math.random() * canvasWidth.value, y: Math.random() * canvasHeight.value },
      { x: Math.random() * canvasWidth.value, y: Math.random() * canvasHeight.value },
    ],
    option: {
      width: randomInt(1, 5),
      color,
      background: { color, alpha: 1 }, // 라인도 동일 색의 채움 지정(렌더러에서 무시될 수 있음)
    }
  });
  redraw();
}

function addRandomRect() {
  // 캔버스 중앙 기준으로 랜덤 크기 사각형 생성
  const cx = canvasWidth.value / 2;
  const cy = canvasHeight.value / 2;
  const w = randomInt(50, 150);
  const h = randomInt(50, 150);
  const x1 = cx - w / 2;
  const y1 = cy - h / 2;
  const x2 = cx + w / 2;
  const y2 = cy + h / 2;

  const color = randomColor();

  store.addRect({
    points: [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ],
    option: {
      width: randomInt(1, 5),
      color,                              // 스트로크 색상
      background: { color, alpha: 1 },    // 배경색 동일
      join: "miter",
      cap: "butt",
    }
  });
  redraw();
}
</script>

<style scoped>
.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.main-container {
  display: flex;
  gap: 20px;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.object-list {
  width: 250px;
  max-height: 400px; /* 캔버스 높이에 맞춰 스크롤 */
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 8px;
  background: #fff;
}

.object-item {
  border: 1px solid #ccc;
  padding: 8px;
  margin-bottom: 10px;
  background: #f9f9f9;
}

.object-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.actions button {
  margin-left: 5px;
}

.delete-btn {
  background: transparent;
  border: none;
  color: red;
  font-weight: bold;
  cursor: pointer;
}

label {
  display: block;
  margin: 4px 0;
}
</style>
