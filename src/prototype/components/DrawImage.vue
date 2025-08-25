<template>
  <div class="image-canvas-app">
    <!-- 제목 -->
    <h2 class="title">이미지 캔버스에 표시</h2>

    <!-- 컨트롤 영역 -->
    <div class="controls">
      <button @click="triggerFileInput">이미지 선택</button>
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleImageUpload" 
        accept="image/*" 
        style="display: none;"
      >

      <!-- 슬라이더 그룹을 가로 배치 -->
      <div class="slider-group">
        <div class="control-group">
          <label for="width">너비: {{ canvasWidth }}px</label>
          <input type="number" id="width" v-model.number="canvasWidth" min="100" max="1000">
          <input type="range" v-model.number="canvasWidth" min="100" max="1000">
        </div>

        <div class="control-group">
          <label for="height">높이: {{ canvasHeight }}px</label>
          <input type="number" id="height" v-model.number="canvasHeight" min="100" max="1000">
          <input type="range" v-model.number="canvasHeight" min="100" max="1000">
        </div>
      </div>
    </div>

    <!-- 캔버스 영역 -->
    <div class="canvas-container">
      <canvas 
        ref="canvasElement" 
        :width="canvasWidth" 
        :height="canvasHeight"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import { drawImageWithAspectRatio } from '@/services/canvas';

const canvasWidth = ref(500);
const canvasHeight = ref(300);

const canvasElement = ref(null);
const fileInput = ref(null);
let currentImage = null;

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      drawImageWithAspectRatio(canvasElement.value, currentImage);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

watch([canvasWidth, canvasHeight], () => {
  nextTick(() => {
    drawImageWithAspectRatio(canvasElement.value, currentImage);
  });
});

onMounted(() => {
  drawImageWithAspectRatio(canvasElement.value, null);
});
</script>

<style scoped>
.image-canvas-app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
}

.title {
  text-align: center;
  margin-bottom: 10px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 80%;
  align-items: center;
}

.slider-group {
  display: flex;
  gap: 40px;
  justify-content: center;
  width: 100%;
}

.control-group {
  display: flex;
  flex-direction: column;
  width: 200px;
}

label {
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="number"],
input[type="range"] {
  width: 100%;
  box-sizing: border-box;
}

.canvas-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

canvas {
  border: 2px solid #ccc;
  background-color: #f0f0f0;
}

button {
  padding: 10px;
  border: none;
  background-color: #42b983;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #36a374;
}
</style>
