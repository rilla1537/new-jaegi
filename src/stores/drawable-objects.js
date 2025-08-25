// stores/drawable-objects.js
import { defineStore } from "pinia";

// id 유틸
function uuid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// 라인
function makeLine({ points, option } = {}) {
  return {
    id: uuid(),
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
    id: uuid(),
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
    points: [point], // 실제 좌표는 parent shape의 points[index]를 그대로 씀
    parentId,
    pointIndex: index,
    option: {
      width: 1,
      color: "#ff0000",
      radius,
      background: { color: "", alpha: 0 },
      ...option,
    },
  };
}

export const useDrawableObjectsStore = defineStore("drawables", {
  state: () => ({
    drawableObjects: [],
    handlerRadius: 6,
    handlerTargetId: null, // ✅ 현재 핸들러가 붙는 도형 id
  }),
  getters: {
    getShapeById: (state) => (id) =>
      state.drawableObjects.find((o) => o.id === id),
  },
  actions: {
    // ===== 도형 =====
    addLine(payload) {
      const line = makeLine(payload);
      this.drawableObjects.push(line);
      this._afterShapeMutated();
      return line;
    },
    addRect(payload) {
      const rect = makeRect(payload);
      this.drawableObjects.push(rect);
      this._afterShapeMutated();
      return rect;
    },
    updateObject(id, payload) {
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx !== -1) {
        this.drawableObjects[idx] = {
          ...this.drawableObjects[idx],
          ...payload,
        };
        this._afterShapeMutated();
      }
    },
    removeObject(id) {
      this.drawableObjects = this.drawableObjects.filter((o) => o.id !== id);
      this._afterShapeMutated();
    },

    // ===== 핸들러 =====
    clearHandlers() {
      this.drawableObjects = this.drawableObjects.filter(
        (o) => o.role !== "handler"
      );
    },
    addHandlersForObject(obj) {
      if (!obj?.points) return [];
      const r = this.handlerRadius;
      const handlers = obj.points.map((p, idx) =>
        makeHandler(p, obj.id, idx, r)
      );
      this.drawableObjects.push(...handlers);
      this.ensureHandlersOnTop();
      return handlers;
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

    /**
     * ✅ id 기반 핸들러 표시
     */
    makeHandler(id) {
      this.handlerTargetId = id ?? null;

      // 기존 핸들러 제거
      this.clearHandlers();

      if (!this.handlerTargetId) return;

      const target = this.getShapeById(this.handlerTargetId);
      let handlers = null;
      if (target && target.role === "shape") {
        handlers = this.addHandlersForObject(target);
        this.drawableObjects = this.drawableObjects.map((o) =>
          o.role === "handler"
            ? { ...o, option: { ...o.option, radius: this.handlerRadius } }
            : o
        );
      }

      this.ensureHandlersOnTop();
      return handlers;
    },

    // ===== 레이어 =====
    ensureHandlersOnTop() {
      const shapes = this.drawableObjects.filter((o) => o.role !== "handler");
      const handlers = this.drawableObjects.filter((o) => o.role === "handler");
      this.drawableObjects = [...shapes, ...handlers];
    },
    layerUp(id) {
      const obj = this.drawableObjects.find((o) => o.id === id);
      if (obj?.role === "handler") return;
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx !== -1 && idx < this.drawableObjects.length - 1) {
        const arr = this.drawableObjects;
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      }
      this.ensureHandlersOnTop();
    },
    layerDown(id) {
      const obj = this.drawableObjects.find((o) => o.id === id);
      if (obj?.role === "handler") return;
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx > 0) {
        const arr = this.drawableObjects;
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      }
      this.ensureHandlersOnTop();
    },
    drawOnTop(id) {
      const obj = this.drawableObjects.find((o) => o.id === id);
      if (obj?.role === "handler") return;
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx !== -1) {
        const [x] = this.drawableObjects.splice(idx, 1);
        this.drawableObjects.push(x);
      }
      this.ensureHandlersOnTop();
    },
    drawOnBottom(id) {
      const obj = this.drawableObjects.find((o) => o.id === id);
      if (obj?.role === "handler") return;
      const idx = this.drawableObjects.findIndex((o) => o.id === id);
      if (idx !== -1) {
        const [x] = this.drawableObjects.splice(idx, 1);
        this.drawableObjects.unshift(x);
      }
      this.ensureHandlersOnTop();
    },

    // ===== 내부 훅 =====
    _afterShapeMutated() {
      if (!this.handlerTargetId) {
        this.ensureHandlersOnTop();
        return;
      }

      this.clearHandlers();
      const target = this.getShapeById(this.handlerTargetId);
      if (target && target.role === "shape") {
        this.addHandlersForObject(target);
        this.drawableObjects = this.drawableObjects.map((o) =>
          o.role === "handler"
            ? { ...o, option: { ...o.option, radius: this.handlerRadius } }
            : o
        );
      } else {
        this.handlerTargetId = null;
      }

      this.ensureHandlersOnTop();
    },
  },
});
