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
    points: points || [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
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
    /**
     * 렌더링 전용 파생 데이터 getter
     *
     * 핸들러(handler)는 본래 좌표를 소유하지 않고,
     * 부모 도형의 특정 point를 추적하는 역할만 합니다.
     * 이 getter는 drawableObjects 배열을 순회하면서
     * role==="handler" 인 객체를 부모 도형의 points[pointIndex]로
     * 항상 최신화된 좌표를 덮어씁니다.
     *
     * 따라서 Canvas 계층은 이 getter가 반환하는 배열을
     * 그대로 받아 draw 하면 핸들러가 부모 도형을 따라다니는
     * 동작이 자동으로 보장됩니다.
     *
     * @returns {Drawable[]} 렌더링 가능한 도형/핸들러 배열
     *   - line, rect 등 shape 객체는 그대로 반환
     *   - handler 객체는 parentId/pointIndex 기준으로
     *     points[0]이 항상 부모의 최신 좌표로 대체된 shallow copy 반환
     */
    renderables() {
      return this.drawableObjects.map((o) => {
        if (
          o.role === "handler" &&
          o.parentId != null &&
          o.pointIndex != null
        ) {
          const parent = this.getShapeById(o.parentId);
          const p = parent?.points?.[o.pointIndex];
          if (p) {
            // draw 전용 shallow copy
            return { ...o, points: [p] };
          }
        }
        return o;
      });
    },
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
