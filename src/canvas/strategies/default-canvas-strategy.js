// default-canvas-strategy.js
import { unref } from "vue";
import { useDrawableObjectsStore } from "@/stores/drawable-objects";

/**
 * 기본 캔버스 전략 (Default Canvas Strategy)
 * - ctx 접근 시 항상 unref(this.ctx) 사용
 * - store 접근, 공통 좌표 변환, success/cancel 콜백 포함
 */
export class DefaultCanvasStrategy {
  /** @type {import('vue').Ref<HTMLElement>|HTMLElement} */
  ctx;
  store;
  finish;
  success = () => {};
  cancel = () => {};

  constructor(ctx) {
    this.ctx = ctx;
    this.store = useDrawableObjectsStore();
  }

  /** DOM element */
  get el() {
    return unref(this.ctx);
  }

  /** bounding rect */
  get rect() {
    return this.el?.getBoundingClientRect?.() ?? { left: 0, top: 0 };
  }

  /** PointerEvent → local 좌표 변환 */
  toLocalPoint(event) {
    const r = this.rect;
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }

  // 공통 훅 — 필요 시 하위 클래스에서 오버라이드
  onEnter() {}
  onExit() {}
  onPointerDown(_e) {}
  onPointerMove(_e) {}
  onPointerUp(_e) {}
  onPointerCancel(_e) {
    this.cancel();
  }
}
