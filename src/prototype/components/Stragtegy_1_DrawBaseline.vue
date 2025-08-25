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

const drawBaseline = new DrawBaseLineState(canvas);

// 🎯 포인터 이벤트 핸들러 (내용은 직접 작성)
function onPointerDown(e) {
  // TODO: pointerdown 로직
  drawBaseline.onPointerDown(e);
}
function onPointerMove(e) {
  // TODO: pointermove 로직
  drawBaseline.onPointerMove(e);
}
function onPointerUp(e) {
  // TODO: pointerup 로직
  drawBaseline.onPointerUp(e);
}
function onPointerCancel(e) {
  // TODO: pointercancel 로직
  drawBaseline.onPointerCancel(e);
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
