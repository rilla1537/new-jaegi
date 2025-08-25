import { watch, onMounted, onBeforeUnmount, nextTick, unref } from "vue";
import { renderDrawables } from "@/services/canvas";
import { useDrawableObjectsStore } from "@/stores/drawable-objects";

/**
 * @param {{
 *  canvasRef: import('vue').Ref<HTMLCanvasElement|null>,
 *  objectsRef: import('vue').Ref<any[]> | (() => any[]),
 *  sizeRef?: import('vue').Ref<{width:number,height:number}|null>, // optional
 *  dprAware?: boolean,
 *  clearBeforeDraw?: boolean,
 * }} params
 */
export function useDrawableRenderer({
  canvasRef,
  objectsRef,
  sizeRef = null,
  dprAware = true,
  clearBeforeDraw = true,
}) {
  let stopWatch = () => {};
  const store = useDrawableObjectsStore();

  function getCtxAndSize() {
    const canvas = unref(canvasRef);
    if (!canvas) return {};
    const ctx = canvas.getContext("2d");
    if (!ctx) return {};

    // sizeRef가 있으면 그 값 사용, 없으면 canvas DOM의 width/height 사용
    const size = unref(sizeRef);
    const cssW = size?.width ?? canvas.clientWidth ?? canvas.width;
    const cssH = size?.height ?? canvas.clientHeight ?? canvas.height;

    if (dprAware) {
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.floor(cssW * dpr);
      const targetH = Math.floor(cssH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      if (canvas.width !== cssW) canvas.width = cssW;
      if (canvas.height !== cssH) canvas.height = cssH;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    return { ctx, cssW, cssH };
  }

  function redraw() {
    const { ctx, cssW, cssH } = getCtxAndSize();
    if (!ctx) return;

    const objects =
      typeof objectsRef === "function" ? objectsRef() : unref(objectsRef);

    // ✅ 핸들러 좌표를 부모 shape의 points에서 동기화
    const syncedObjects = objects.map((o) => {
      if (o.role === "handler" && o.parentId != null && o.pointIndex != null) {
        const parent = store.getShapeById(o.parentId);
        if (parent && parent.points[o.pointIndex]) {
          return {
            ...o,
            points: [parent.points[o.pointIndex]],
          };
        }
      }
      return o;
    });

    renderDrawables(ctx, syncedObjects, {
      clear: clearBeforeDraw,
      width: cssW,
      height: cssH,
    });
  }

  onMounted(() => {
    redraw();
    const sources = [objectsRef];
    if (sizeRef) sources.push(sizeRef);

    stopWatch = watch(
      sources,
      () => nextTick(redraw),
      { deep: true }
    );
  });

  onBeforeUnmount(() => {
    stopWatch?.();
  });

  return { redraw, stop: () => stopWatch?.() };
}
