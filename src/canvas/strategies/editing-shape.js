// editing-shape.js
import { DefaultCanvasStrategy } from './default-canvas-strategy';
import { inCircle } from '@/math';

/**
 * EditingShapeState
 * - pointerdown 시 핸들러 hit 감지
 * - 감지되면 success(payload)로 상위 로직(3.vue)에게 전달
 * - 여기서는 store 상태를 직접 수정하지 않음
 */
export class EditingShapeState extends DefaultCanvasStrategy {
  onPointerDown(event) {
    const p = this.toLocalPoint(event);

    // store.ensureHandlersOnTop() 덕분에 핸들러는 항상 위 레이어
    const handlers = this.store.renderables.filter(o => o.role === 'handler');
    for (let i = handlers.length - 1; i >= 0; i--) {
      const h = handlers[i];
      const center = h.points?.[0];
      const radius = Number(h?.option?.radius ?? this.store.handlerRadius);

      if (!center || !Number.isFinite(radius)) continue;

      // ✅ hit 테스트: inCircle 로만
      if (inCircle(p, center, radius)) {
        this.success({
          type: 'handler-hit',
          handlerId: h.id,
          parentId: h.parentId,
          pointIndex: h.pointIndex,
        });
        return;
      }
    }

    // 핸들러를 못 찾으면 아무 일도 안 함
  }
}
