import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialPagosPageRoutingModule } from './historial-pagos-routing.module';

import { HistorialPagosPage } from './historial-pagos.page';
import { AdsComponent } from '../components/ads/ads.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialPagosPageRoutingModule,
    AdsComponent,
  ],
  declarations: [HistorialPagosPage]
})
export class HistorialPagosPageModule {}
