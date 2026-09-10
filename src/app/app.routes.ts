import { Routes, provideRouter, withComponentInputBinding } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard · StockControl',
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./pages/products/products.component').then((m) => m.ProductsComponent),
    title: 'Productos · StockControl',
  },
  {
    path: 'productos/nuevo',
    loadComponent: () =>
      import('./pages/product-form/product-form.component').then((m) => m.ProductFormComponent),
    title: 'Nuevo producto · StockControl',
  },
  {
    path: 'productos/editar/:id',
    loadComponent: () =>
      import('./pages/product-form/product-form.component').then((m) => m.ProductFormComponent),
    title: 'Editar producto · StockControl',
  },
  {
    path: 'movimientos',
    loadComponent: () =>
      import('./pages/movements/movements.component').then((m) => m.MovementsComponent),
    title: 'Movimientos · StockControl',
  },
  {
    path: 'proveedores',
    loadComponent: () =>
      import('./pages/suppliers/suppliers.component').then((m) => m.SuppliersComponent),
    title: 'Proveedores · StockControl',
  },
  {
    path: 'informes',
    loadComponent: () =>
      import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
    title: 'Informes · StockControl',
  },
];

export const appRouter = provideRouter(routes, withComponentInputBinding());
