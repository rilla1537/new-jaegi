<!-- DrawablesPrototypeBare.vue -->
<template>
  <div class="drawables-prototype">
    <h2>{{ title }}</h2>

    <div class="controls">
      <button @click="initCanvas">초기화</button>
    </div>

    <div class="main-container">
      <!-- 캔버스 영역 -->
      <div class="canvas-container">
        <canvas
          ref="canvas"
          :width="canvasWidth"
          :height="canvasHeight"
          class="canvas"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerCancel"
        ></canvas>
      </div>

      <!-- 도형 리스트 (사이드뷰) -->
      <div class="object-list">
        <div
          v-for="obj in store.drawableObjects"
          :key="obj.id"
          class="object-item"
        >
          <div class="object-header">
            <h4>{{ obj.name }} ({{ obj.shape }}, id: {{ obj.id }})</h4>
            <div class="actions">
              <button
                @click="
                  store.removeObject(obj.id);
                  redraw();
                "
              >
                x
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useDrawableObjectsStore } from "@/stores/drawable-objects";
import { useDrawableRenderer } from "@/composables/useDrawableRenderer";
import { DrawBaseLineState } from "@/canvas/strategies/draw-base-line";
import { DrawMeasurelineState } from "@/canvas/strategies/draw-measure-line";
import { ControlHandlerState } from "@/canvas/strategies/control-handler";

const route = useRoute();
const title = ref(route.query.title ?? "Drawables Prototype (Bare)");

const canvasWidth = ref(600);
const canvasHeight = ref(400);
const canvas = ref(null);

const store = useDrawableObjectsStore();

// ✅ 렌더러는 "그리기만" — 핸들러 좌표 동기화는 store.renderables에서 처리
const { redraw, stop } = useDrawableRenderer({
  canvasRef: canvas,
  objectsRef: () => store.renderables,
  dprAware: true,
  clearBeforeDraw: true,
});

// 초기화 버튼
function initCanvas() {
  store.drawableObjects = [];
  redraw();
}

// ✅ 상태를 ref로 관리
const canvasState = ref(null);

// 상태 인스턴스들
const drawBaselineState = new DrawBaseLineState(canvas);
const drawMeasurelineState = new DrawMeasurelineState(canvas);
const controlHandlerState = new ControlHandlerState(canvas);

// ✅ 당신이 쓰던 success 콜백 유지 (컨트롤 상태로 전환)
drawBaselineState.success = (shapeId) => {
  console.log("DrawBaseLineState success:", shapeId);
  const shape = store.getShapeById(shapeId);
  console.log('shape 결과', shape);
  controlHandlerState.shape = shape; // 반응형 연결(부모 도형 바뀌면 핸들러도 따라감)
  // 필요시 핸들러 타깃 포인트를 지정:
  // controlHandlerState.targetPointIndex = shape?.points?.length ? shape.points.length - 1 : 0;

  // 상태 전환 → watch에서 onEnter 자동 호출
  canvasState.value = controlHandlerState;
};
drawBaselineState.cancel = () => {
  console.log("DrawBaseLineState cancel");
};

drawMeasurelineState.success = (shapeId) => {
  console.log("DrawMeasurelineState success:", shapeId);
};

// ✅ 상태 변경 시마다 onEnter 실행 + 즉시 재렌더
watch(canvasState, (ns /*, os */) => {
  // os?.onExit?.();  // 필요하면 onExit 훅 사용
  ns?.onEnter?.();
  nextTick(redraw);
});

// 상태 전환 헬퍼 (툴바 등에서 호출)
function setState(kind) {
  switch (kind) {
    case "base":
      canvasState.value = drawBaselineState;
      break;
    case "measure":
      canvasState.value = drawMeasurelineState;
      break;
    case "control":
      canvasState.value = controlHandlerState;
      break;
  }
}

// 포인터 이벤트는 항상 ref 경유
const onPointerDown = (e) => canvasState.value?.onPointerDown?.(e);
const onPointerMove = (e) => canvasState.value?.onPointerMove?.(e);
const onPointerUp = (e) => canvasState.value?.onPointerUp?.(e);
const onPointerCancel = (e) => canvasState.value?.onPointerCancel?.(e);

// 초기 상태는 baseline으로
onMounted(() => {
  redraw();
  setState("base");
});
</script>

<style scoped>
.drawables-prototype {
  text-align: left;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
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
  min-width: 600px;
  min-height: 400px;
}

.canvas {
  border: 1px solid #ccc;
  width: 100%;
  height: 100%;
  max-width: 600px;
  max-height: 400px;
  background: #fff;
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
</style>
