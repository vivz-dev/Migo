import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChoferService } from './chofer.service';
import { ClienteService } from './cliente.service';
import { IngresoConductorCampana } from '../interfaces/ingreso-conductor-campana';
import { Observable } from 'rxjs';
import * as pdfMake from 'pdfmake/build/pdfmake';

@Injectable({
  providedIn: 'root'
})
export class IngresoConductorCampanaService {

  private baseURL =
    'https://migoadvs.pythonanywhere.com/Database/Database/ingresoconductorcampana/';
  private formato = '?format=json';
  public ingresosObtenidos: IngresoConductorCampana[] = [];

  constructor(
    private http: HttpClient,
  ) { }

  getIngresos(): Observable<IngresoConductorCampana[]> {
    var respuesta = this.http.get<IngresoConductorCampana[]>(this.baseURL + this.formato);
    respuesta.forEach((ingresos) => {
      this.ingresosObtenidos = ingresos;
    });
    return respuesta;
  }

  getIngresobyId(id: number): Observable<IngresoConductorCampana> {
    return this.http.get<IngresoConductorCampana>(this.baseURL + id + '/' + this.formato);
  }

  crearIngreso(ingreso: any): Observable<any> {
    return this.http.post(this.baseURL, ingreso);
  }
  

  subirDocumento(id: number, documento: Blob){
    const formData = new FormData();
    const newFile = new File([documento], "");
    formData.append(
      'documento_QR',
      newFile
    );
    return this.http.patch(this.baseURL + id, formData);
  }

}
