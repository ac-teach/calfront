import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'calendar',
    renderMode: RenderMode.Client, // Impide que Node.js intente renderizar FullCalendar
  },
  {
    path: '**',
    renderMode: RenderMode.Client, // Opcional: mantiene toda la app en CSR sin apagar server.ts
  },
];
