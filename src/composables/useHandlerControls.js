// composables/useHandlerControls.js
import { computed } from "vue";
import { useDrawableObjectsStore } from "@/stores/drawable-objects";

/**
 * 핸들러 보임/숨김 + 반지름 제어 통합 composable
 * - showHandlers: v-model로 바로 사용
 * - handlerRadius: v-model로 바로 사용
 * - toggleHandlers(): 보임/숨김 토글
 * - setRadius(v): 반지름 지정
 * - safeRedraw(): 레이어 정렬 + 리렌더
 *
 * 요구사항: store에 아래 API가 있어야 함
 *  - state: showHandlers, handlerRadius
 *  - actions: makeHandler(boolean), setHandlerRadius(number), ensureHandlersOnTop()
 */
export function useHandlerControls(redraw) {
  const store = useDrawableObjectsStore();

  const safeRedraw = () => {
    store.ensureHandlersOnTop();
    if (typeof redraw === "function") redraw();
  };

  const showHandlers = computed({
    get: () => store.showHandlers,
    set: (v) => {
      store.makeHandler(!!v);
      safeRedraw();
    },
  });

  const handlerRadius = computed({
    get: () => store.handlerRadius,
    set: (v) => {
      store.setHandlerRadius(Number(v));
      safeRedraw();
    },
  });

  const toggleHandlers = () => {
    store.makeHandler(!store.showHandlers);
    safeRedraw();
  };

  const setRadius = (v) => {
    store.setHandlerRadius(Number(v));
    safeRedraw();
  };

  return {
    // v-model 바로 연결
    showHandlers,
    handlerRadius,
    // 메서드
    toggleHandlers,
    setRadius,
    safeRedraw,
  };
}
