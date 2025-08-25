import { createRouter, createWebHistory } from 'vue-router';
import Sitemap from '@/prototype/Sitemap.vue';
import DrawImage from '@/prototype/components/DrawImage.vue';
import Line from '@/prototype/components/Line.vue';
import ShapeSelection from '@/prototype/components/ShapeSelection.vue';
import ShapeSelectionStorke from '@/prototype/components/ShapeSelectionStorke.vue';
import RectSelectionStorke from '@/prototype/components/RectSelectionStorke.vue';
import ManageDrawableObjects from '@/prototype/components/ManageDrawableObjects.vue';
import HandlerView from '@/prototype/components/HandlerView.vue';
import HandlerSelection from '@/prototype/components/HandlerSelection.vue';
import DrawBaseline from '@/prototype/components/Stragtegy_1_DrawBaseline.vue';
import DrawMeasureline from '@/prototype/components/Stragtegy_2_DrawMeasureline.vue';
import Stragtegy_3 from '@/prototype/components/Stragtegy_3.vue';

const routes = [
  {
    path: '/', // 기본 루트는 Sitemap으로
    redirect: '/prototype', // 자동으로 /prototype으로 이동
  },
  {
    path: '/prototype',
    component: Sitemap, // Sitemap이 공통 레이아웃
    children: [
      {
        path: '', // /prototype 기본 페이지
        component: DrawImage, // 원하면 소개 페이지 or default 컴포넌트
      },
      {
        path: 'draw-image',
        name: 'DrawImage',
        component: DrawImage,
      },
      {
        path: 'line',
        name: 'Line',
        component: Line,
      },
      {
        path: 'shape-selection',
        name: 'ShapeSelection',
        component: ShapeSelection,
      },
      {
        path: 'shape-selection-storke',
        name: 'ShapeSelectionStorke',
        component: ShapeSelectionStorke,
      },
      {
        path: 'rect-selection-storke',
        name: 'RectSelectionStorke',
        component: RectSelectionStorke,
      },
      {
        path: 'manage-drawable-objects',
        component: ManageDrawableObjects,
      },
      {
        path: 'handler-view',
        component: HandlerView,
      },
      {
        path: 'handler-selection',
        component: HandlerSelection,
      },
      {
        path: 'draw-baseline',
        component: DrawBaseline,
      },
      {
        path: 'draw-measureline',
        component: DrawMeasureline,
      },
      {
        path: 'strategy3',
        component: Stragtegy_3,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
