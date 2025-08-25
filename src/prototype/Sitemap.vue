<template>
  <header>
    <h1>프로토타입 메뉴</h1>
    <nav>
      <!-- router-link는 HTML의 a 태그처럼 페이지 이동을 처리합니다. -->
      <router-link to="/prototype/draw-image">이미지 캔버스에 표시</router-link>
      <router-link to="/prototype/line">선 그리기</router-link>
      <router-link to="/prototype/shape-selection" class="deprecated">선분 선택 (선분 수직교차 방식)</router-link>
      <router-link to="/prototype/shape-selection-storke">선분 선택 (선 두께 방식)</router-link>
      <router-link to="/prototype/rect-selection-storke">사각형 선택 (선 두께 방식)</router-link>
      <router-link to="/prototype/manage-drawable-objects?title=도형 추가/삭제 + 레이어 변경">도형 추가/삭제 + 레이어 변경</router-link>
      <router-link to="/prototype/handler-view?title=핸들러 View">핸들러 View</router-link>
      <router-link to="/prototype/handler-selection?title=핸들러 선택">핸들러 선택</router-link>
      <router-link to="/prototype/draw-baseline?title=전략패턴: 기준선 그리기 (1)">전략패턴: 기준선 그리기 (1)</router-link>
      <router-link to="/prototype/draw-measureline?title=전략패턴: 기준선 + 측정선 그리기 (2)">전략패턴: 기준선 + 측정선 그리기(2)</router-link>
      <router-link to="/prototype/strategy3?title=전략패턴: 선 그리고 핸들러 조작 (3)">전략패턴: 선 그리고 핸들러 조작 (3)</router-link>

      <router-view/>
    </nav>
  </header>
</template>

<script setup>
</script>

<style scoped>
header {
  background-color: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  text-align: center;
}

nav {
  margin-top: 10px;
}

nav a {
  margin: 0 15px;
  text-decoration: none;
  color: #42b983;
  font-weight: bold;
}

/* 현재 활성화된 메뉴에 적용될 스타일입니다. */
nav a.router-link-exact-active {
  color: #34495e;
  border-bottom: 2px solid #42b983;
}

nav .deprecated {
  text-decoration: line-through;
}
</style>
