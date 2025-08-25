<template>
  <div class="drawables-prototype">
    <h2>{{ title }}</h2>

    <ul>
      <li>핸들러는 항상 레이어 최상단 노출</li>
      <li>핸들러 레이어 순서 변경 불가</li>
    </ul>

    <div class="controls">
      <!-- 그룹 버튼 -->
      <label>도형 선택:</label>
      <button :class="{ active: selectedShape === 'line' }" @click="selectShape('line')">라인</button>
      <button :class="{ active: selectedShape === 'rect' }" @click="selectShape('rect')">사각형</button>

      <!-- 핸들러 토글 -->
      <label style="margin-left: 20px;">
        <input type="checkbox" v-model="showHandlers" />
        핸들러 보임
      </label>

      <!-- 핸들러 크기 슬라이더 -->
      <div class="handler-size">
        <label for="handlerRadius">핸들러 크기: {{ handlerRadius }}</label>
        <input
          id="handlerRadius"
          type="range"
          min="2"
          max="20"
          step="1"
          v-model.number="handlerRadius"
        />
      </div>
    </div>

    <div class="main-container">
      <!-- 캔버스 영역 -->
      <div class="canvas-container">
        <canvas
          ref="canvas"
          :width="canvasWidth"
          :height="canvasHeight"
          style="border:1px solid #ccc; width: 100%; height: 100%; max-width: 600px; max-height: 400px;"
        ></canvas>
      </div>

      <!-- 도형 리스트 (사이드뷰) -->
      <div class="object-list">
        <div
          v-for="(obj, index) in store.drawableObjects"
          :key="obj.id"
          class="object-item"
        >
          <div class="object-header">
            <h4>{{ obj.name }} ({{ obj.shape }}, id: {{ obj.id }})</h4>
            <div class="actions">
              <!-- 핸들러는 레이어 이동 불가 -->
              <template v-if="obj.role !== 'handler'">
                <button
                  @click="store.layerUp(obj.id); safeRedraw()"
                  :disabled="store.drawableObjects[0]?.id === obj.id"
                >▲</button>
                <button
                  @click="store.layerDown(obj.id); safeRedraw()"
                  :disabled="store.drawableObjects[store.drawableObjects.length - 1]?.id === obj.id"
                >▼</button>
                <button @click="store.drawOnTop(obj.id); safeRedraw()">⬆TOP</button>
                <button @click="store.drawOnBottom(obj.id); safeRedraw()">⬇BOT</button>
              </template>
              <button class="delete-btn" @click="store.removeObject(obj.id); safeRedraw()">x</button>
            </div>
          </div>

          <!-- 모든 도형 동일하게 옵션 UI -->
          <label>색상:
            <input type="color" v-model="obj.option.color" @input="syncFill(obj); safeRedraw()" />
          </label>
          <label>두께:
            <input type="number" v-model.number="obj.option.width" min="1" max="20" @input="safeRedraw" />
          </label>
          <label>join:
            <select v-model="obj.option.join" @change="safeRedraw">
              <option>round</option>
              <option>bevel</option>
              <option>miter</option>
            </select>
          </label>
          <label>cap:
            <select v-model="obj.option.cap" @change="safeRedraw">
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
import { useRoute } from "vue-router";
import { useDrawableObjectsStore } from "@/stores/drawable-objects";
import { useDrawableRenderer } from "@/composables/useDrawableRenderer";
import { useHandlerControls } from "@/composables/useHandlerControls"; // ⭐ 통합 컴포저블

const route = useRoute();
const title = ref(route.query.title ?? "Drawables Prototype");

const store = useDrawableObjectsStore();

// 캔버스 크기 (CSS로도 제어, DPR-aware)
const canvasWidth = ref(600);
const canvasHeight = ref(400);
const canvas = ref(null);

const { redraw } = useDrawableRenderer({
  canvasRef: canvas,
  objectsRef: () => store.drawableObjects,
  dprAware: true,
  clearBeforeDraw: true,
});

// ⭐ 핸들러 보임/숨김 + 반지름 통합 컨트롤 (v-model 바로 사용 가능)
const { showHandlers, handlerRadius, safeRedraw } = useHandlerControls(redraw);

// 선택된 도형
const selectedShape = ref(null);

// 도형 선택 버튼
function selectShape(shape) {
  selectedShape.value = shape;

  // 기존 도형 + 핸들러 제거
  store.drawableObjects = [];

  const cx = canvasWidth.value / 2;
  const cy = canvasHeight.value / 2;
  const color = randomColor();

  if (shape === "line") {
    store.addLine({
      points: [
        { x: cx - 50, y: cy },
        { x: cx + 50, y: cy },
      ],
      option: { width: 3, color },
    });
  } else if (shape === "rect") {
    store.addRect({
      points: [
        { x: cx - 40, y: cy - 30 },
        { x: cx + 40, y: cy + 30 },
      ],
      option: { width: 3, color },
    });
  }

  // 토글 상태를 반영하여 핸들러 재구성(스토어가 처리)
  store.setShowHandlers(store.showHandlers);
  safeRedraw();
}

// 유틸
function randomColor() {
  return "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0");
}
function syncFill(obj) {
  if (!obj?.option) return;
  if (!obj.option.background) obj.option.background = { color: "", alpha: 1 };
  obj.option.background.color = obj.option.color || "#ffffff";
}
</script>

<style scoped>
ul {
  background-color: #eee;
  text-align: left;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.controls button.active {
  background: #007bff;
  color: #fff;
}

.handler-size {
  display: flex;
  align-items: center;
  gap: 8px;
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
  /* 렌더러에서 DPR-aware로 실제 픽셀 조정하므로 CSS 크기만 지정 */
  min-width: 600px;
  min-height: 400px;
}

.object-list {
  width: 250px;
  max-height: 400px;
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
