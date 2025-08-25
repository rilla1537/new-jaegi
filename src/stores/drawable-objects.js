// stores/drawable-objects.js
import { defineStore } from "pinia";

// id 유틸
function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// 라인
function makeLine({ points, option } = {}) {
  return {
    id: makeId(),
    name: "Line",
    role: "shape",
    shape: "line",
    points: points || [{ x: 0, y: 0 }, { x: 0, y: 0 }],
    option: {
      width: 1,
      color: "#ffffff",
      join: "round",
      cap: "round",
      background: { color: "", alpha: 1 },
      ...option,
    },
  };
}

// 사각형(항상 4점)
function makeRect({ points, option } = {}) {
  let rectPoints;
  if (points && points.length === 2) {
    const [p1, p2] = points;
    rectPoints = [
      { x: p1.x, y: p1.y },
      { x: p2.x, y: p1.y },
      { x: p2.x, y: p2.y },
      { x: p1.x, y: p2.y },
    ];
  } else {
    rectPoints = points || [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
  }
  return {
    id: makeId(),
    name: "Rect",
    role: "shape",
    shape: "rect",
    points: rectPoints,
    option: {
      width: 1,
      color: "#ffffff",
      join: "miter",
      cap: "butt",
      background: { color: "", alpha: 1 },
      ...option,
    },
  };
}

// 핸들러(원)
function makeHandler(point, parentId, index, radius, option = {}) {
  return {
    id: `${parentId}-h${index}`,
    name: "Handler",
    role: "handler",
    shape: "circle",
    points: [point],
    option: {
      width: 1,
      color: "#ff0000",
      radius, // 필수
      background: { color: "", alpha: 0 }, // 테두리만 보이게
      ...option,
    },
  };
}

export const useDrawableObjectsStore = defineStore("drawables", {
  state: () => ({
    drawableObjects: [],
    handlerRadius: 6,     // 전역 핸들러 크기
    showHandlers: false,  // 핸들러 토글 상태(단일 소스)
  }),
  actions: {
    // ===== 도형 =====
    addLine(payload) {
      this.drawableObjects.push(makeLine(payload));
      this._afterShapeMutated();
    },
    addRect(payload) {
      this.drawableObjects.push(makeRect(payload));
      this._afterShapeMutated();
    },
    updateObject(id, payload) {
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx !== -1) {
        this.drawableObjects[idx] = { ...this.drawableObjects[idx], ...payload };
        this._afterShapeMutated();
      }
    },
    removeObject(id) {
      this.drawableObjects = this.drawableObjects.filter((o) => o.id !== id);
      this._afterShapeMutated();
    },

    // ===== 핸들러 =====
    clearHandlers() {
      this.drawableObjects = this.drawableObjects.filter((o) => o.role !== "handler");
    },
    addHandlersForObject(obj) {
      if (!obj?.points) return;
      const r = this.handlerRadius;
      const handlers = obj.points.map((p, idx) => makeHandler(p, obj.id, idx, r));
      this.drawableObjects.push(...handlers);
      this.ensureHandlersOnTop();
    },
    setHandlerRadius(radius) {
      this.handlerRadius = Number(radius) || 0;
      // 존재하는 핸들러 반지름 즉시 반영
      this.drawableObjects = this.drawableObjects.map((o) =>
        o.role === "handler"
          ? { ...o, option: { ...o.option, radius: this.handlerRadius } }
          : o
      );
      this.ensureHandlersOnTop();
    },

    setShowHandlers(show) {
      this.showHandlers = !!show;
      // 현재 대상 shape에 대해 핸들러 추가/삭제
      this.clearHandlers();
      if (this.showHandlers) {
        const target = this.drawableObjects.find(o => o.role === "shape");
        if (target) this.addHandlersForObject(target);
      }
      // 반지름 반영 안전장치
      this.drawableObjects = this.drawableObjects.map((o) =>
        o.role === "handler"
          ? { ...o, option: { ...o.option, radius: this.handlerRadius } }
          : o
      );
      this.ensureHandlersOnTop();
    },

    // ===== 레이어 =====
    ensureHandlersOnTop() {
      const shapes = this.drawableObjects.filter(o => o.role !== "handler");
      const handlers = this.drawableObjects.filter(o => o.role === "handler");
      this.drawableObjects = [...shapes, ...handlers];
    },
    layerUp(id) {
      const obj = this.drawableObjects.find(o => o.id === id);
      if (obj?.role === "handler") return; // 핸들러 레이어 이동 금지
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx !== -1 && idx < this.drawableObjects.length - 1) {
        const arr = this.drawableObjects;
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      }
      this.ensureHandlersOnTop();
    },
    layerDown(id) {
      const obj = this.drawableObjects.find(o => o.id === id);
      if (obj?.role === "handler") return;
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx > 0) {
        const arr = this.drawableObjects;
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      }
      this.ensureHandlersOnTop();
    },
    drawOnTop(id) {
      const obj = this.drawableObjects.find(o => o.id === id);
      if (obj?.role === "handler") return;
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx !== -1) {
        const [x] = this.drawableObjects.splice(idx, 1);
        this.drawableObjects.push(x);
      }
      this.ensureHandlersOnTop();
    },
    drawOnBottom(id) {
      const obj = this.drawableObjects.find(o => o.id === id);
      if (obj?.role === "handler") return;
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx !== -1) {
        const [x] = this.drawableObjects.splice(idx, 1);
        this.drawableObjects.unshift(x);
      }
      this.ensureHandlersOnTop();
    },

    // 내부 훅: shape 변경 시 핸들러 상태 유지
    _afterShapeMutated() {
      // showHandlers가 켜져 있다면 첫 shape에 대해 핸들러 재구성
      if (this.showHandlers) {
        this.clearHandlers();
        const target = this.drawableObjects.find(o => o.role === "shape");
        if (target) this.addHandlersForObject(target);
        // 반지름 동기화
        this.drawableObjects = this.drawableObjects.map((o) =>
          o.role === "handler"
            ? { ...o, option: { ...o.option, radius: this.handlerRadius } }
            : o
        );
      }
      this.ensureHandlersOnTop();
    },
  },
});
