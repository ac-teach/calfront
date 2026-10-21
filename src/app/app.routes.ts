import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: 'categories',
        loadComponent:() =>
            import(
                './features/categories/pages/category-list/category-list.component'
            ).then((m) => m.CategoryListComponent),
    },
    {
        path:'',
        redirectTo: 'categories',
        pathMatch: 'full',
    },
    {
        path:'**',
        redirectTo:'categories',
    },

];
