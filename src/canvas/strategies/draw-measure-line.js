// draw-measure-line.js
import { DefaultCanvasStrategy } from './default-canvas-strategy';

export class DrawMeasurelineState extends DefaultCanvasStrategy {
  measureline = null;

  onPointerDown(event) {
    const p1 = this.toLocalPoint(event);
    const p2 = { x: p1.x + 1, y: p1.y };

    const { id } = this.store.addLine({
      points: [p1, p2],
      option: {
        color: '#182ed3ff',
        width: 2,
        cap: 'square',
      },
    });

    this.measureline = this.store.getShapeById(id);
    console.log('DrawMeasurelineState onPointerDown', this.measureline);
  }

  onPointerMove(event) {
    if (!this.measureline) return console.warn('DrawMeasurelineState onPointerMove: measureline is null');
    const p2 = this.toLocalPoint(event);
    this.measureline.points[1] = p2;
  }

  onPointerUp(_event) {
    const shapeId = this.measureline?.id;
    this.measureline = null;
    console.log('DrawMeasureLineState onPointerUp');
    this.success(shapeId);
  }
}
