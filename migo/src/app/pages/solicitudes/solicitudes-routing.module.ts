import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SolicitudesPage } from './solicitudes.page';
import { CampanaActivaPage } from '../campana-activa/campana-activa.page';

const routes: Routes = [
  {
    path: '',
    component: SolicitudesPage
  },
  {
    path: 'campana-activa',
    component: CampanaActivaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SolicitudesPageRoutingModule {}
