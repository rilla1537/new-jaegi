/**
 * 이미지를 캔버스에 비율을 유지하며 중앙에 그립니다.
 * @param {HTMLCanvasElement} canvas - 그림을 그릴 캔버스 DOM 요소
 * @param {HTMLImageElement | null} img - 그릴 이미지 객체. null이면 캔버스를 지웁니다.
 */
export function drawImageWithAspectRatio(canvas, img) {
  if (!canvas) {
    console.error("Canvas element is not provided.");
    return;
  }

  const ctx = canvas.getContext("2d");
  const canvasW = canvas.width;
  const canvasH = canvas.height;

  // 1. 캔버스 초기화
  ctx.clearRect(0, 0, canvasW, canvasH);

  // 2. 이미지가 없으면 여기서 종료 (캔버스만 깨끗하게 지워짐)
  if (!img) return;

  // 3. 이미지 비율 계산
  const hRatio = canvasW / img.width;
  const vRatio = canvasH / img.height;
  const ratio = Math.min(hRatio, vRatio); // 이미지가 잘리지 않도록 작은 비율을 선택

  const newWidth = img.width * ratio;
  const newHeight = img.height * ratio;

  // 4. 이미지를 중앙에 배치하기 위한 좌표 계산
  const x = (canvasW - newWidth) / 2;
  const y = (canvasH - newHeight) / 2;

  // 5. 캔버스에 이미지 그리기
  ctx.drawImage(img, x, y, newWidth, newHeight);
}

// services/canvas.js (또는 ts)
// 기존 drawPolygon을 이 구현으로 교체

/**
 * 다각형 그리기 (fill + stroke)
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x:number,y:number}>} points
 * @param {Object} opt
 * @param {string} [opt.color="#000"]        // stroke 색
 * @param {number} [opt.width=1]            // stroke 두께
 * @param {string} [opt.join="round"]       // lineJoin
 * @param {string} [opt.cap="round"]        // lineCap
 * @param {{color?:string, alpha?:number}} [opt.background] // 채움 옵션
 */
export function drawPolygon(ctx, points, opt = {}) {
  if (!ctx || !points || points.length < 2) return;

  const {
    color = "#000",
    width = 1,
    join = "round",
    cap = "round",
    background, // { color?: string, alpha?: number }
  } = opt;

  ctx.save();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineJoin = join;
  ctx.lineCap = cap;

  // path 생성
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();

  // ----- fill (배경) -----
  if (background && background.color) {
    ctx.save();
    const alpha = typeof background.alpha === "number" ? background.alpha : 1;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha * prevAlpha; // 기존 값과 곱해 반영
    ctx.fillStyle = background.color;    // '#rrggbb' 그대로 가능
    ctx.fill();
    ctx.globalAlpha = prevAlpha;
    ctx.restore();
  }

  // ----- stroke (테두리) -----
  ctx.stroke();
  ctx.restore();
}

// drawLine은 그냥 헬퍼로 제공
export function drawLine(ctx, p1, p2, opt = {}) {
  drawPolygon(ctx, [p1, p2], opt);
}

// radius 사용 + 테두리만
export function drawCircle(ctx, center, defaultRadius = 6, opt = {}) {
  if (!ctx || !center) return;
  const r = Number(opt.radius ?? defaultRadius);
  const stroke = opt.color ?? "#ff0000";
  const width = opt.width ?? 1;
  const fill = opt.background?.color ?? "";
  const alpha = Number.isFinite(opt.background?.alpha) ? opt.background.alpha : 0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, r, 0, Math.PI * 2);

  // 반투명/투명 채움
  if (fill && alpha > 0) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * alpha;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalAlpha = prev;
  }

  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}

export function renderDrawables(ctx, objects, opt = {}) {
  if (!ctx) return;
  const { clear = true, width, height } = opt;

  if (clear) {
    const w = width ?? ctx.canvas.width;
    const h = height ?? ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
  }

  for (const obj of objects ?? []) {
    if (obj?.visible === false) continue;

    const opt = obj.option ?? {};
    if (obj.role === "handler" && obj.shape === "circle") {
      // ✅ 핸들러 전용 원
      drawCircle(ctx, obj.points[0], 5, opt);
    } else if (obj.shape === "line" && obj.points.length >= 2) {
      drawLine(ctx, obj.points[0], obj.points[1], opt);
    } else if (obj.shape === "rect" && obj.points.length >= 4) {
      // ✅ 사각형은 이제 points가 4개짜리로 들어옴
      drawPolygon(ctx, obj.points, opt);
    }
  }
}
