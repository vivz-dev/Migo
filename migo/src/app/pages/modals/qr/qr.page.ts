import { Component, Input, OnInit } from '@angular/core';
import { Campana } from 'src/app/interfaces/campana';
import { Client } from 'src/app/interfaces/client';
import { User } from 'src/app/interfaces/user';
import { QRCodeModule } from 'angularx-qrcode';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { ModalController, Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { ElegirVehiculoService } from 'src/app/providers/elegir-vehiculo.service';
import { Vehiculo } from 'src/app/interfaces/vehiculo';
import { IngresoConductorCampanaService } from 'src/app/providers/ingreso-conductor-campana.service';
import { CampanaService } from 'src/app/providers/campana.service';
import { IngresoConductorCampana } from 'src/app/interfaces/ingreso-conductor-campana';
import { TCreatedPdf } from 'pdfmake/build/pdfmake';
import { CampanaActivaPage } from '../../campana-activa/campana-activa.page';
import { VehiculoService } from 'src/app/providers/vehiculo.service';
import { Router } from '@angular/router';
import { TallerBrandeoService } from 'src/app/providers/taller-brandeo.service';
import { TallerBrandeo } from 'src/app/interfaces/taller-brandeo';
import { Chofer } from 'src/app/interfaces/chofer';
import { ModeloVehiculosService } from 'src/app/providers/modelo-vehiculos.service';
import { MarcaVehiculoService } from 'src/app/providers/marca-vehiculo.service';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-qr',
  templateUrl: './qr.page.html',
  styleUrls: ['./qr.page.scss'],
})
export class QrPage implements OnInit {
  @Input() user!: User;
  @Input() conductor!: any;
  @Input() campana!: Campana;
  @Input() vehiculo!: Vehiculo;
  @Input() marca!: string;
  @Input() modelo!: string;

  nombreMarca = ''
  nombreModelo = ''

  datos = '';
  logoData: any;
  pdfObj!: TCreatedPdf;
  base64Image: any;
  ingresos!: IngresoConductorCampana[];
  talleres: TallerBrandeo[] = [];
  talleresCampana: TallerBrandeo[] = [];

  constructor(
    private plt: Platform,
    private http: HttpClient,
    private fileOpener: FileOpener,
    private vehiculoElegidoService: ElegirVehiculoService,
    private vehiculoService: VehiculoService,
    private modalQR: ModalController,
    private ingresarCondService: IngresoConductorCampanaService,
    private campanaService: CampanaService,
    private router: Router,
    private tallerService: TallerBrandeoService,
    private marcaVehiculoService: MarcaVehiculoService,
    private modeloVehiculoService: ModeloVehiculosService
  ) {}

  crearQR() {
    if (this.datos) return;

    // enlace al documento del formulario registro campana
    this.datos = '//Migo Ads//';
    this.loadLocalAssetToBase64();
    this.crearPDF();

    // tengo que enviar un documento QR
    //
  }

  crearPDF() {
    let logo = { image: this.logoData, width: 50 };

    const docDefinition = {
      watermark: {
        text: 'Migo Ads',
        color: 'yellow',
        opacity: 0.2,
        bold: true,
      },
      content: [
        { text: 'Migo Ads - Orden de Brandeo', style: 'header' },
        { text: 'Generado en: ' + new Date(), style: 'subheader' },
        // { text: '\nTaller ' + this.campana, style: 'header' },
        // { text: 'Direccion del taller', style: 'subheader' },
        { text: '\nDatos de Cliente y Vehiculo', style: 'header' },
        {
          columns: [
            {
              style: 'tableExample',
              table: {
                body: [
                  ['Cliente', ''],
                  ['Nombre', this.conductor.nombre],
                  ['Apellido', this.conductor.apellido],
                  ['Cedula', this.conductor.cedula],
                  ['Fecha de Nacimiento', this.conductor.fecha_nacimiento],
                  ['Telefono', this.conductor.telefono],
                ],
              },
            },
            {
              style: 'tableExample',
              table: {
                body: [
                  ['Vehiculo', ''],
                  ['Placa', this.vehiculo.placa],
                  ['Año', this.vehiculo.anio],
                  ['Marca', this.nombreMarca],
                  ['Modelo', this.nombreModelo],
                  ['Color', this.vehiculo.color_vehiculo],
                  ['Categoria', this.vehiculo.categoria_vehiculo],
                ],
              },
            },
          ],
        },
        // { text: '\nImagenes del Vehiculo\n', style: 'header' },
        { text: '\nInformacion del Brandeo\n', style: 'header' },
        {
          style: 'tableExample',
          table: {
            body: [
              ['Nombre de Campaña', this.campana.nombre_campana],
              ['Nombre del responsable', this.campana.nombre_responsable],
              ['Correo del responsable', this.campana.correo_responsable],
              ['Fecha de inicio', this.campana.fecha_inicio],
              ['Fecha de Fin', this.campana.fecha_fin],
              ['Vehiculos Admisibles', 'Sedan, SUV, Camión, Camioneta, Bus'],
            ],
          },
        },
        { text: '\nBrandeo: ' + this.campana.tipo_brandeo, style: 'header' },
        {
          ul: [
            'Capo',
            'Puerta Conductor',
            'Puerta Pasajero',
            'Puerta Trasera Izquierda',
          ],
        },
      ],
      styles: {
        header: {
          bold: true,
          fontSize: 15,
        },
      },
      defaultStyle: {
        fontSize: 12,
        columnGap: 10,
      },
    };

    this.pdfObj = pdfMake.createPdf(docDefinition);
    // this.pdfObj.download();
    this.pdfObj.getBlob((result: Blob) => {

      let ingresoActual = this.ingresos.find(
        (ingreso) =>
          this.campana.id_campana === ingreso.id_campana &&
          this.user.id_usuario === ingreso.id_usuario &&
          this.vehiculo.id_vehiculo === ingreso.id_vehiculo
      );
      if (ingresoActual) {
        this.ingresarCondService
          .subirDocumento(ingresoActual.id!, result, this.vehiculo.placa, this.conductor.cedula )
          .subscribe((ingreso: any) => {
            const rutaBase = 'https://migoadvs.pythonanywhere.com/documentos/'
            const rutaDocumento = ingresoActual!.id + '_' + this.vehiculo.placa + '_' + this.conductor.cedula +'.pdf'
            const rutaCompleta = rutaBase + rutaDocumento;
            this.datos = rutaCompleta;
          });
      }
    });
  }

  loadLocalAssetToBase64() {
    this.http
      .get('../../../../assets/images/migo_logo.png', { responseType: 'blob' })
      .subscribe((res) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.logoData = reader.result;
        };
        reader.readAsDataURL(res);
      });
  }

  aceptar() {
    this.modalQR.dismiss();
    this.router.navigate(['/solicitudes']);
  }

  ngOnInit() {
    this.ingresarCondService.getIngresos().subscribe((data) => {
      this.ingresos = data;
    });

    this.marcaVehiculoService.getMarcabyId(Number(this.marca)).subscribe((marca)=>{
      this.nombreMarca = marca.nombre;
    });
    this.modeloVehiculoService.getModelobyId(Number(this.modelo)).subscribe((modelo)=>{
      this.nombreModelo = modelo.nombre});

    this.tallerService.getTalleres().subscribe((data) => {
      this.talleres = data;
      this.campana.id_talleres.forEach((idTaller) => {
        const tallerEncontrado = this.talleres.find(
          (taller) => taller.id_taller === idTaller
        )!;
        this.talleresCampana.push(tallerEncontrado);
      });
    });
  }
}
