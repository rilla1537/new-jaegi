import { useDrawableObjectsStore } from '@/stores/drawable-objects';
/**
 * store에서 선 색상/두께/캡션/조인 등 옵션을 가져와서 사용해야 함
 */

export class ControlHandlerState {
    shape;
    targetPointIndex;
    ctx;
    store;
    finish;
    success = () => { };
    cancel = () => { };

    constructor(ctx) {
        this.ctx = ctx;
        this.store = useDrawableObjectsStore();
    }

    onEnter() {
        console.log('ControlHandlerState onEnter', this.shape);
        this.store.makeHandler(this.shape.id);
    }

    onPointerDown(event) {
        console.log('ControlHandlerState onPointerDown nothing to do');
    }

    onPointerMove(event) {
        if (!this.shape || !this.targetPointIndex) return;
        console.log('ControlHandlerState onPointerMove');
        const rect = this.ctx.value.getBoundingClientRect();
        const p1 = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        this.shape.points[this.targetPointIndex] = p1;
    }

    onPointerUp(event) {
        const shapeId = this.baseline?.id;
        this.baseline = null;
        console.log('DrawBaseLineState onPointerUp');
        this.success(shapeId);
    }

    onPointerCancel(event) {
        console.log('DrawBaseLineState onPointerCancel');
        this.cancel();
    }

}