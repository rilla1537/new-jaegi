import { useDrawableObjectsStore } from '@/stores/drawable-objects';
/**
 * store에서 선 색상/두께/캡션/조인 등 옵션을 가져와서 사용해야 함
 */

export class DrawMeasurelineState {
    measureline;
    ctx;
    store;
    success = () => { };
    cancel = () => { };

    constructor(ctx) {
        this.ctx = ctx;
        this.store = useDrawableObjectsStore();
    }

    onPointerDown(event) {
        const rect = this.ctx.value.getBoundingClientRect();
        const p1 = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        const p2 = { x: p1.x + 1, y: p1.y };

        const { id } = this.store.addLine({
            points: [p1, p2],
            option: {
                color: "#182ed3ff",
                width: 2,
                cap: "square"
            }
        });

        this.measureline = this.store.getShapeById(id);
        console.log('DrawMeasurelineState onPointerDown', this.measureline);
    }

    onPointerMove(event) {
        if (!this.measureline) return console.warn('DrawMeasurelineState onPointerMove: measureline is null');
        console.log('DrawMeasurelineState onPointerMove');
        const rect = this.ctx.value.getBoundingClientRect();
        const p2 = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        this.measureline.points[1] = p2;
    }

    onPointerUp(event) {
        const shapeId = this.measureline?.id;
        this.measureline = null;
        console.log('DrawMeasureLineState onPointerUp');
        this.success(shapeId);
    }

    onPointerCancel(event) {
        console.log('DrawMeasurelineState onPointerCancel');
    }

}