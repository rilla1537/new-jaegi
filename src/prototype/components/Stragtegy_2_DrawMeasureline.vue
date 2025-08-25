<!-- DrawablesPrototypeBare.vue -->
<template>
  <div class="drawables-prototype">
    <h2>{{ title }}</h2>

    <div class="controls">
      <button @click="initCanvas">초기화</button>
      <button @click="toggleState">상태 토글</button>
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
              <button @click="store.removeObject(obj.id); redraw()">x</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useDrawableObjectsStore } from "@/stores/drawable-objects";
import { useDrawableRenderer } from "@/composables/useDrawableRenderer";
import { DrawBaseLineState } from "@/services/states/draw-base-line";
import { DrawMeasurelineState } from "@/services/states/draw-measure-line"; 

const route = useRoute();
const title = ref(route.query.title ?? "Drawables Prototype (Bare)");

const canvasWidth = ref(600);
const canvasHeight = ref(400);
const canvas = ref(null);

const store = useDrawableObjectsStore();
const { redraw } = useDrawableRenderer({
  canvasRef: canvas,
  objectsRef: () => store.drawableObjects,
  dprAware: true,
  clearBeforeDraw: true,
});

function initCanvas() {
  store.drawableObjects = [];
  // TODO: 초기화 동작 채우기
  redraw();
}

const drawBaselineState = new DrawBaseLineState(canvas);
drawBaselineState.success = (shapeId) => {
  console.log("DrawBaseLineState success:", shapeId);
  toggleState();
}
drawBaselineState.cancel = () => {
  console.log("DrawBaseLineState cancel");
}

const drawMeasurelineState = new DrawMeasurelineState(canvas);
drawMeasurelineState.success = (shapeId) => {
  console.log("DrawMeasurelineState success:", shapeId);
  toggleState();
}

const states = [drawBaselineState, drawMeasurelineState];
let toggle = false;
let canvasState = states[0]; // 기본 상태를 drawBaseline으로 설정

function toggleState() {
  toggle = !toggle;
  canvasState = toggle ? states[1] : states[0];
  console.log("현재 상태:", canvasState.constructor.name);
}

// 🎯 포인터 이벤트 핸들러 (내용은 직접 작성)
function onPointerDown(e) {
  // TODO: pointerdown 로직
  canvasState.onPointerDown(e);
}
function onPointerMove(e) {
  // TODO: pointermove 로직
  canvasState.onPointerMove(e);
}
function onPointerUp(e) {
  // TODO: pointerup 로직
  canvasState.onPointerUp(e);
}
function onPointerCancel(e) {
  // TODO: pointercancel 로직
  canvasState.onPointerCancel(e);
}

onMounted(() => {
  redraw();
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
