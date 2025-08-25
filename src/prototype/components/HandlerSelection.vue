<template>
  <div class="drawables-prototype">
    <h2>{{ title }}</h2>

    <div class="controls">
      <!-- 그룹 버튼 -->
      <label>도형 선택:</label>
      <button :class="{ active: selectedShape === 'line' }" @click="selectShape('line')">
        라인
      </button>
      <button :class="{ active: selectedShape === 'rect' }" @click="selectShape('rect')">
        사각형
      </button>

      <!-- 핸들러 토글 -->
      <label style="margin-left: 20px;">
        <input type="checkbox" v-model="showHandlers" />
        핸들러 보임
      </label>

      <!-- 핸들러 반지름 -->
      <label style="margin-left: 20px;">
        핸들러 크기:
        <input type="range" min="3" max="20" v-model.number="handlerRadius" />
        {{ handlerRadius }}
      </label>
    </div>

    <div class="main-container">
      <div class="canvas-container">
        <canvas
          ref="canvas"
          :width="canvasWidth"
          :height="canvasHeight"
          style="border:1px solid #ccc;"
          @pointermove="onPointerMove"
          @pointerleave="onPointerLeave"
        ></canvas>
      </div>

      <div class="object-list">
        <div v-for="(obj, index) in store.drawableObjects" :key="obj.id" class="object-item">
          <div class="object-header">
            <h4>{{ obj.name }} ({{ obj.role }}, id: {{ obj.id }})</h4>
          </div>
        </div>
      </div>
    </div>

    <div class="status">
      <p>선택된 핸들러: {{ selectedHandlerId || '없음' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDrawableObjectsStore } from "@/stores/drawable-objects";
import { useDrawableRenderer } from "@/composables/useDrawableRenderer";
import { useHandlerControls } from "@/composables/useHandlerControls"; // ✅ 통합 컴포저블
import { inCircle, onCirclePath } from "@/math";
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

// ✅ 보임/숨김 + 반지름 통합 컨트롤러
const { showHandlers, handlerRadius, safeRedraw } = useHandlerControls(redraw);

const selectedShape = ref(null);
const selectedHandlerId = ref(null);

// 도형 선택
function selectShape(shape) {
  selectedShape.value = shape;
  store.drawableObjects = [];

  const cx = canvasWidth.value / 2;
  const cy = canvasHeight.value / 2;
  const color = "#000000";

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

  // 현재 토글 상태 반영하여 핸들러 재구성 (반지름도 store가 동기화)
  store.makeHandler(showHandlers.value);

  selectedHandlerId.value = null;
  safeRedraw();
}

// 내부: 이전 hover의 두께 원복
function restorePrevHoverWidth() {
  if (!selectedHandlerId.value) return;
  const prev = store.drawableObjects.find((o) => o.id === selectedHandlerId.value);
  if (prev && prev.role === "handler") {
    const base = Number.isFinite(prev.option?._baseWidth) ? prev.option._baseWidth : (prev.option?.width ?? 1);
    prev.option.width = base;
  }
  selectedHandlerId.value = null;
}

// pointermove 로 핸들러 hover 감지 + 두께 가변
function onPointerMove(e) {
  const el = canvas.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

  // 최상단에 가까운 핸들러부터 탐색 (뒤에서 앞으로)
  let hovered = null;
  for (let i = store.drawableObjects.length - 1; i >= 0; i--) {
    const o = store.drawableObjects[i];
    if (o.role !== "handler") continue;
    const r = Number(o.option?.radius ?? handlerRadius.value);
    const w = Number(o.option?.width ?? 1);
    if (inCircle(pos, o.points[0], r) || onCirclePath(pos, o.points[0], r, w)) {
      hovered = o;
      break;
    }
  }

  // 동일 대상이면 스킵
  if (hovered?.id === selectedHandlerId.value) return;

  // 이전 hover 원복
  restorePrevHoverWidth();

  // 새 hover 두께 업
  if (hovered) {
    hovered.option = hovered.option || {};
    if (!Number.isFinite(hovered.option._baseWidth)) {
      hovered.option._baseWidth = Number.isFinite(hovered.option.width) ? hovered.option.width : 1;
    }
    const base = hovered.option._baseWidth;
    hovered.option.width = Math.max(base * 2, base + 1); // 두껍게
    selectedHandlerId.value = hovered.id;
  }

  safeRedraw();
}

function onPointerLeave() {
  // 캔버스 밖으로 나가면 원복
  restorePrevHoverWidth();
  safeRedraw();
}
</script>

<style scoped>
.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.controls button.active {
  background: #007bff;
  color: #fff;
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
.status {
  margin-top: 15px;
  padding: 8px;
  background: #f0f0f0;
}
</style>
