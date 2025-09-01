// control-handler.js
import { DefaultCanvasStrategy } from './default-canvas-strategy';

export class ControlHandlerState extends DefaultCanvasStrategy {
  shape = null;
  targetPointIndex = null;

  onEnter() {
    console.log('ControlHandlerState onEnter', this.shape);
    if (this.shape?.id) {
      this.store.makeHandler(this.shape.id);
    }
  }

  onPointerDown(_event) {
    console.log('ControlHandlerState onPointerDown nothing to do');
  }

  onPointerMove(event) {
    if (!this.shape || this.targetPointIndex == null) return;
    const p = this.toLocalPoint(event);
    this.shape.points[this.targetPointIndex] = p;
  }

  onPointerUp(_event) {
    const shapeId = this.shape?.id;
    console.log('ControlHandlerState onPointerUp');
    this.success(shapeId);
  }

  onPointerCancel(_event) {
    console.log('ControlHandlerState onPointerCancel');
    this.cancel();
  }
}
