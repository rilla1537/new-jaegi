import { ref, computed } from "vue";

export function useCanvasWorld2D() {
  const objects = ref({});
  const rulerCm = ref(5);
  const pointSize = ref(8);
  const lineThickness = ref(2);
  const canvasSize = ref({ width: 0, height: 0 });

  // ✅ 2. 새로운 라인 객체를 추가하는 함수를 새로 만듭니다.
  function addLine(type, startPos) {
    const newId = type; // 'ruler' 또는 'target'
    const color = type === "ruler" ? "deepskyblue" : "tomato";

    if (objects.value[newId]) {
      // 이미 해당 타입의 객체가 있으면 추가하지 않음
      console.warn(`${newId} object already exists.`);
      return;
    }

    objects.value[newId] = {
      type: "line",
      isRuler: type === "ruler",
      isMeasurable: type === "target",
      color: color,
      // 시작점과 끝점을 동일하게 설정하여 생성 시작
      points: { p1: { ...startPos }, p2: { ...startPos } },
    };
    return newId; // 생성된 객체의 ID 반환
  }

  // ✅ 아래 함수를 새로 추가하세요.
  // 이 함수는 오프셋 계산 없이 점의 위치를 newPosition으로 바로 설정합니다.
  function updateLineEndPoint(objectId, pointId, newPosition) {
    const object = objects.value[objectId];
    if (object && object.points[pointId]) {
      object.points[pointId].x = newPosition.x;
      object.points[pointId].y = newPosition.y;
    }
  }

  const getPixelDistance = (p1, p2) => {
    if (!p1 || !p2) return 0;
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  };

  const getLabelPosition = (p1, p2, offset = 30) => {
    if (!p1 || !p2 || canvasSize.value.width === 0) return { x: -999, y: -999 };
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return { x: midX, y: midY };
    let nx = -dy / length;
    let ny = dx / length;
    let finalX = midX + nx * offset;
    let finalY = midY + ny * offset;
    const labelWidth = 80;
    const labelHeight = 30;
    if (
      finalX < labelWidth / 2 ||
      finalX > canvasSize.value.width - labelWidth / 2 ||
      finalY < labelHeight / 2 ||
      finalY > canvasSize.value.height - labelHeight / 2
    ) {
      finalX = midX - nx * offset;
      finalY = midY - ny * offset;
    }
    return { x: finalX, y: finalY };
  };

  const getHandlerPositions = (points, offset = 10) => {
    const { p1, p2 } = points;
    if (!p1 || !p2) return {};
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return { p1, p2 };
    const nx = dx / length;
    const ny = dy / length;
    const h1 = {
      x: p1.x - nx * offset,
      y: p1.y - ny * offset,
    };
    const h2 = {
      x: p2.x + nx * offset,
      y: p2.y + ny * offset,
    };
    return { p1: h1, p2: h2 };
  };

  const objectsWithDetails = computed(() => {
    const newObjects = {};
    for (const id in objects.value) {
      const originalObject = objects.value[id];
      const detailedObject = { ...originalObject };
      if (detailedObject.type === "line") {
        const { p1, p2 } = detailedObject.points;
        detailedObject.pxDistance = getPixelDistance(p1, p2);
        detailedObject.labelPosition = getLabelPosition(p1, p2);
        detailedObject.handlerPositions = getHandlerPositions(
          detailedObject.points,
          pointSize.value * 1.2
        );
      }
      newObjects[id] = detailedObject;
    }
    return newObjects;
  });

  const rulerObject = computed(() =>
    Object.values(objectsWithDetails.value).find((obj) => obj.isRuler)
  );
  const targetObject = computed(() =>
    Object.values(objectsWithDetails.value).find((obj) => obj.isMeasurable)
  );

  const scale = computed(() => {
    const ruler = rulerObject.value;
    if (!ruler || ruler.pxDistance === 0 || !rulerCm.value) return 0;
    return ruler.pxDistance / rulerCm.value;
  });

  const targetLengthCm = computed(() => {
    const target = targetObject.value;
    if (scale.value === 0 || !target) return "0.00";
    return (target.pxDistance / scale.value).toFixed(2);
  });

  function movePoint(objectId, pointId, newPosition) {
    const object = objects.value[objectId];
    if (object && object.points[pointId]) {
      // (수정) 시각적 오프셋과 동일한 값으로 보정해야 합니다.
      const handlerOffset = pointSize.value * 1.2;
      const { p1, p2 } = object.points;
      let partnerPoint = pointId === "p1" ? p2 : p1;
      const dx = newPosition.x - partnerPoint.x;
      const dy = newPosition.y - partnerPoint.y;
      const length = Math.hypot(dx, dy);
      if (length > handlerOffset) {
        const nx = dx / length;
        const ny = dy / length;
        object.points[pointId].x = newPosition.x - nx * handlerOffset;
        object.points[pointId].y = newPosition.y - ny * handlerOffset;
      }
    }
  }

  function setCanvasSize(width, height) {
    canvasSize.value.width = width;
    canvasSize.value.height = height;
  }

  const viewTransform = ref({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
  });

  return {
    objects: objectsWithDetails,
    rulerCm,
    pointSize,
    lineThickness,
    addLine,
    updateLineEndPoint,
    scale,
    targetLengthCm,
    movePoint,
    setCanvasSize,
    viewTransform,
  };
}
