/**
 * 선분 a(p1, p2)의 중점을 지나는
 * 수직 교차 선분 b를 계산하는 함수.
 *
 * @param {Array} p1 - 선분 a의 시작점 [x1, y1]
 * @param {Array} p2 - 선분 a의 끝점 [x2, y2]
 * @param {number} factor - b의 길이를 조절하는 비율 (1 = a와 동일, 0.5 = 절반, 2 = 두 배)
 * @returns {Array} [q1, q2] - 선분 b의 양 끝점 좌표
 *
 * 사용 예시:
 *   perpendicularSegment([0,0], [4,0], 1);   // a와 같은 길이
 *   perpendicularSegment([0,0], [4,0], 0.5); // a 길이의 절반
 */
export function perpendicularSegment(p1, p2, factor = 1) {
  // 점 p1, p2 좌표 분해
  const [x1, y1] = p1;
  const [x2, y2] = p2;

  // 벡터 a = (dx, dy) → 선분 a의 방향
  const dx = x2 - x1;
  const dy = y2 - y1;

  // 선분 a의 길이
  const lengthA = Math.sqrt(dx * dx + dy * dy);

  // 선분 a의 중점 (b가 교차할 지점)
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // a에 수직인 단위 벡터 n = (-dy, dx) / |a|
  // → 90도 회전 후 길이 1로 정규화
  const nx = -dy / lengthA;
  const ny = dx / lengthA;

  // 선분 b의 길이 = a의 길이 × factor
  const lengthB = lengthA * factor;

  // 선분 b의 반 길이
  const halfB = lengthB / 2;

  // b의 두 끝점 계산: 중점 m 기준으로 수직 방향으로 ±halfB만큼 이동
  const q1 = [mx - nx * halfB, my - ny * halfB];
  const q2 = [mx + nx * halfB, my + ny * halfB];

  // 결과: 선분 b의 두 끝점
  return [q1, q2];
}

// 두 선분(line1=[p1,p2], line2=[q1,q2])로 사각형 충돌 영역을 생성
// line2는 p1~p2의 중점을 지나는 수직 교차선(길이는 상관없음)이라고 가정
export function makeBoxCollision(line1, line2) {
  const [p1Arr, p2Arr] = line1; // [[x1,y1],[x2,y2]]
  const [q1Arr, q2Arr] = line2; // [[qx1,qy1],[qx2,qy2]]

  const p1 = { x: p1Arr[0], y: p1Arr[1] };
  const p2 = { x: p2Arr[0], y: p2Arr[1] };

  // 수직 교차선의 방향 벡터 (q1->q2)
  const bx = q2Arr[0] - q1Arr[0];
  const by = q2Arr[1] - q1Arr[1];
  const lenB = Math.hypot(bx, by);
  if (lenB === 0) {
    // 교차선 길이가 0이면 사각형을 만들 수 없음 → 선분 A 위로 납작한 박스 반환
    return [p1, p2, { ...p2 }, { ...p1 }];
  }

  const nx = bx / lenB;
  const ny = by / lenB;
  const halfB = lenB / 2;

  const p1Top     = { x: p1.x + nx * halfB, y: p1.y + ny * halfB };
  const p2Top     = { x: p2.x + nx * halfB, y: p2.y + ny * halfB };
  const p2Bottom  = { x: p2.x - nx * halfB, y: p2.y - ny * halfB };
  const p1Bottom  = { x: p1.x - nx * halfB, y: p1.y - ny * halfB };

  // 시계/반시계 순서로 닫힌 사각형 반환
  return [p1Top, p2Top, p2Bottom, p1Bottom];
}

/**
 * 점이 사각형(boxCollision) 내부에 있는지 확인
 *
 * @param {Object} pos - {x, y} 검사할 점
 * @param {Array} boxCollision - [v1, v2, v3, v4] 사각형 꼭짓점
 * @returns {boolean}
 */
export function inArea(pos, boxCollision) {
  const { x, y } = pos;
  const [v1, v2, v3, v4] = boxCollision;

  function area(a, b, c) {
    return Math.abs(
      (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2
    );
  }

  const A = area(v1, v2, v3) + area(v1, v3, v4);
  const A1 = area(pos, v1, v2);
  const A2 = area(pos, v2, v3);
  const A3 = area(pos, v3, v4);
  const A4 = area(pos, v4, v1);

  return Math.abs((A1 + A2 + A3 + A4) - A) < 0.01; // 오차 허용
}

/**
 * 점 pos가 닫힌 경로(points)의 "선(테두리)" 위에 있는지 검사
 * thickness: 선 두께 허용 폭(px)
 *
 * @param {{x:number,y:number}} pos
 * @param {Array<{x:number,y:number}>} points  // 닫힌 경로 (마지막-첫번째 자동 연결)
 * @param {number} thickness
 * @returns {boolean}
 */
export function onPath(pos, points, thickness) {
  if (!points || points.length < 2 || !Number.isFinite(thickness)) return false;

  const half = thickness / 2;
  const n = points.length;

  // 닫힌 경로: 모든 i에 대해 (i) ~ (i+1)%n 선분 검사
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const d = _distPointToSegment(pos, a, b);
    if (d <= half) return true;
  }
  return false;
}

// 원(핸들러) 내부 클릭 판정
export function inCircle(pos, center, radius) {
  const dx = pos.x - center.x;
  const dy = pos.y - center.y;
  return dx * dx + dy * dy <= radius * radius;
}

// 원(핸들러) 테두리 클릭 판정
export function onCirclePath(pos, center, radius, thickness) {
  const dx = pos.x - center.x;
  const dy = pos.y - center.y;
  const d = Math.hypot(dx, dy);
  const half = thickness / 2;
  return d >= radius - half && d <= radius + half;
}

// 내부 헬퍼
function _distPointToSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;

  const abLen2 = abx * abx + aby * aby;
  if (abLen2 === 0) {
    // 선분 길이 0일 때: 점-점 거리
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  let t = (apx * abx + apy * aby) / abLen2; // 투영 파라미터
  t = Math.max(0, Math.min(1, t));          // 선분 범위로 클램프

  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  return Math.hypot(p.x - cx, p.y - cy);
}
