import { useDrawableObjectsStore } from '@/stores/drawable-objects';
import { unref } from 'vue';
/**
 * store에서 선 색상/두께/캡션/조인 등 옵션을 가져와서 사용해야 함
 */

export class DrawBaseLineState {
    baseline;
    ctx;
    store;
    finish;
    success = () => {};
    cancel = () => {};

    constructor(ctx) {
        this.ctx = ctx;
        this.store = useDrawableObjectsStore();
    }

    onPointerDown(event) {
        const rect = unref(this.ctx).getBoundingClientRect();
        const p1 = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        const p2 = { x: p1.x + 1, y: p1.y };
        
        const { id } = this.store.addLine({
            points: [p1, p2],
            option: {
                color: "#df1414ff",
                width: 2,
                cap: "round"
            }
        });

        this.baseline = this.store.getShapeById(id);
        console.log('DrawBaseLineState onPointerDown', this.baseline);
    }

    onPointerMove(event) {
        if (!this.baseline) return console.warn('DrawBaseLineState onPointerMove: baseline is null');
        console.log('DrawBaseLineState onPointerMove');
        const rect = this.ctx.value.getBoundingClientRect();
        const p2 = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        this.baseline.points[1] = p2;
    }

    onPointerUp(event) {
        const shapeId = this.baseline?.id;
        this.baseline = null;
        console.log('DrawBaseLineState onPointerUp', 'shapeId', shapeId);
        this.success(shapeId);
    }

    onPointerCancel(event) {
        console.log('DrawBaseLineState onPointerCancel');
        this.cancel();
    }

}