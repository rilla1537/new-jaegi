// draw-base-line.js
import { DefaultCanvasStrategy } from './default-canvas-strategy';

export class DrawBaseLineState extends DefaultCanvasStrategy {
  baseline = null;

  onPointerDown(event) {
    const p1 = this.toLocalPoint(event);
    const p2 = { x: p1.x + 1, y: p1.y };

    const { id } = this.store.addLine({
      points: [p1, p2],
      option: {
        color: '#df1414ff',
        width: 2,
        cap: 'round',
      },
    });

    this.baseline = this.store.getShapeById(id);
    console.log('DrawBaseLineState onPointerDown', this.baseline);
  }

  onPointerMove(event) {
    if (!this.baseline) return console.warn('DrawBaseLineState onPointerMove: baseline is null');
    const p2 = this.toLocalPoint(event);
    this.baseline.points[1] = p2;
  }

  onPointerUp(_event) {
    const shapeId = this.baseline?.id;
    this.baseline = null;
    console.log('DrawBaseLineState onPointerUp', 'shapeId', shapeId);
    this.success(shapeId);
  }
}
