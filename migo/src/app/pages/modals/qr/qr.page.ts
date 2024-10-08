import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Campana } from 'src/app/interfaces/campana';
import { User } from 'src/app/interfaces/user';
import { FixMeLater } from 'angularx-qrcode';
import { ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Vehiculo } from 'src/app/interfaces/vehiculo';
import { IngresoConductorCampanaService } from 'src/app/providers/ingreso-conductor-campana.service';
import { IngresoConductorCampana } from 'src/app/interfaces/ingreso-conductor-campana';
import { TCreatedPdf } from 'pdfmake/build/pdfmake';
import { Router } from '@angular/router';
import { TallerBrandeoService } from 'src/app/providers/taller-brandeo.service';
import { TallerBrandeo } from 'src/app/interfaces/taller-brandeo';
import { ModeloVehiculosService } from 'src/app/providers/modelo-vehiculos.service';
import { MarcaVehiculoService } from 'src/app/providers/marca-vehiculo.service';
import { FormularioAplicacion } from 'src/app/interfaces/formulario-aplicacion';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-qr',
  templateUrl: './qr.page.html',
  styleUrls: ['./qr.page.scss'],
})
export class QrPage implements OnInit {
  @ViewChild('parent', { read: ElementRef }) private parent!: ElementRef;

  @Input() user!: User;
  @Input() conductor!: any;
  @Input() campana!: Campana;
  @Input() vehiculo!: Vehiculo;
  @Input() marca!: string;
  @Input() modelo!: string;
  @Input() solicitud!: FormularioAplicacion;

  nombreMarca = '';
  nombreModelo = '';

  datos = '';
  logoData: any;
  pdfObj!: TCreatedPdf;
  base64Image: any;
  ingresos!: IngresoConductorCampana[];
  talleres: TallerBrandeo[] = [];
  talleresCampana: TallerBrandeo[] = [];

  /* ruta para peticiones a las imagenes de vehiculos del server */
  imgRuta = 'https://migoadvs.pythonanywhere.com/vehiculos/';

  /* Propiedades del QR */
  imageSrc = 'https://migoadvs.pythonanywhere.com/vehiculos/migoQR.png';
  imageHeight = 50;
  imageWidth = 150;

  constructor(
    private http: HttpClient,
    private modalQR: ModalController,
    private ingresarCondService: IngresoConductorCampanaService,
    private router: Router,
    private tallerService: TallerBrandeoService,
    private marcaVehiculoService: MarcaVehiculoService,
    private modeloVehiculoService: ModeloVehiculosService
  ) {}

  async crearPDF() {
    let logo = { image: this.logoData, width: 50 };

    const docDefinition = {
      watermark: {
        text: 'Migo Ads',
        color: '#12bcbe',
        opacity: 0.2,
        bold: true,
      },
      content: [
        { text: 'Migo Ads - Orden de Brandeo', style: 'header' },
        { text: 'Generado en: ' + new Date(), style: 'subheader' },
        // { text: '\nTaller ' + this.campana, style: 'header' },
        // { text: 'Direccion del taller', style: 'subheader' },
        { text: '\nDatos de Cliente y Vehículo', style: 'header' },
        {
          columns: [
            {
              style: 'tableExample',
              table: {
                body: [
                  ['Cliente', ''],
                  ['Nombre', this.conductor.nombre],
                  ['Apellido', this.conductor.apellido],
                  ['Cédula', this.conductor.cedula],
                  ['Fecha de Nacimiento', this.conductor.fecha_nacimiento],
                  ['Teléfono', this.conductor.telefono],
                ],
              },
            },
            {
              style: 'tableExample',
              table: {
                body: [
                  ['Vehículo', ''],
                  ['Placa', this.vehiculo.placa],
                  ['Año', this.vehiculo.anio],
                  ['Marca', this.nombreMarca],
                  ['Modelo', this.nombreModelo],
                  ['Color', this.vehiculo.color_vehiculo],
                  ['Categoría', this.vehiculo.categoria_vehiculo],
                ],
              },
            },
          ],
        },
        { text: '\nInformación del Brandeo\n', style: 'header' },
        {
          style: 'tableExample',
          table: {
            body: [
              ['Nombre de Campaña', this.campana.nombre_campana],
              ['Nombre del responsable', this.campana.nombre_responsable],
              ['Correo del responsable', this.campana.correo_responsable],
              ['Fecha de inicio', this.campana.fecha_inicio],
              ['Fecha de Fin', this.campana.fecha_fin],
              [
                'Vehículos Admisibles',
                {
                  ul: [
                    this.campana.bus_admisible?'Bus':'',
                    this.campana.camion_admisible?'Camión':'',
                    this.campana.camioneta_admisible? 'Camioneta':'',
                    this.campana.sedan_admisible? 'Sedán': '',
                    this.campana.suv_admisible?'SUV': ''
                  ],
                },
              ],
            ],
          },
        },
        {
          text: '\nTipo de Brandeo: ' + this.campana.tipo_brandeo,
          style: 'header',
        },
        { text: 'Partes del carro a brandear:', style: 'header' },
        {
          ul: [
            this.solicitud.carroceria_capo ? 'Capó' : '',
            this.solicitud.carroceria_techo ? 'Techo' : '',
            this.solicitud.puerta_conductor ? 'Puerta Conductor' : '',
            this.solicitud.puerta_maletero ? 'Puerta Maletero' : '',
            this.solicitud.puerta_pasajero ? 'Puerta Pasajero' : '',
            this.solicitud.puerta_trasera_der ? 'Puerta Trasera Izquierda' : '',
            this.solicitud.puerta_trasera_iz ? 'Puerta Trasera Izquierda' : '',
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
          this.vehiculo.id_vehiculo === ingreso.id_vehiculo &&
          this.solicitud.id_formulario === ingreso.id_formulario_registro
      );
      if (ingresoActual && this.parent) {
        //obtener la imagen del QR
        const blobIMG = this.saveAsImage(this.parent.nativeElement);

        if (blobIMG) {
          this.ingresarCondService
            .subirDocumentos(
              ingresoActual.id!,
              result,
              blobIMG,
              this.vehiculo.placa,
              this.conductor.cedula
            )
            .subscribe((ingreso: any) => {
              console.log(ingreso);
              // this.renderer.setStyle(this.parent.nativeElement, 'display', 'flex');
            });
        } else {
          console.log(
            'no hay imagen y no se puede hacer o parent',
            ingresoActual,
            this.parent
          );
        }
      }
    });
  }

  getDatos() {
    if (this.ingresos) {
      let ingresoActual = this.ingresos.find(
        (ingreso) =>
          this.campana.id_campana === ingreso.id_campana &&
          this.user.id_usuario === ingreso.id_usuario &&
          this.vehiculo.id_vehiculo === ingreso.id_vehiculo &&
          this.solicitud.id_formulario === ingreso.id_formulario_registro
      );

      if (ingresoActual) {
        const rutaBase = 'https://migoadvs.pythonanywhere.com/documentos/';
        const rutaDocumento =
          ingresoActual!.id +
          '_' +
          this.vehiculo.placa +
          '_' +
          this.conductor.cedula +
          '.pdf';
        const rutaCompleta = rutaBase + rutaDocumento;
        this.datos = rutaCompleta;
        return rutaCompleta;
      } else {
        console.log('no hay ingreso actual');
      }
    }
    return 'El usuario no ha ingresado el vehículo';
  }

  onChange(url: any) {
    try {
      //crear una imagen QR
      let ingresoActual = this.ingresos.find(
        (ingreso) =>
          this.campana.id_campana === ingreso.id_campana &&
          this.user.id_usuario === ingreso.id_usuario &&
          this.vehiculo.id_vehiculo === ingreso.id_vehiculo &&
          this.solicitud.id_formulario === ingreso.id_formulario_registro 
      );

      const valores = Object.values(ingresoActual!);
      const docQR = valores[3];
      const imagenQR = valores[4];

      if (docQR && imagenQR) {
        console.log('ya hay una imagen y un docQR');
      } else {
        this.crearPDF();
      }
    } catch (error) {}
  }

  saveAsImage(parent: FixMeLater) {
    let blob;

    let parentElement = null;
    // fetches base 64 data from canvas
    parentElement = parent.querySelector('canvas').toDataURL('image/png');
    if (parentElement) {
      // converts base 64 encoded image to blobData
      let blobData = this.convertBase64ToBlob(parentElement);
      // saves as image
      blob = new Blob([blobData], { type: 'image/png' });
    }

    return blob;
  }

  private convertBase64ToBlob(Base64Image: string) {
    // split into two parts
    const parts = Base64Image.split(';base64,');
    // hold the content type
    const imageType = parts[0].split(':')[1];
    // decode base64 string
    const decodedData = window.atob(parts[1]);
    // create unit8array of size same as row data length
    const uInt8Array = new Uint8Array(decodedData.length);
    // insert all character code into uint8array
    for (let i = 0; i < decodedData.length; ++i) {
      uInt8Array[i] = decodedData.charCodeAt(i);
    }
    // return blob image after conversion
    return new Blob([uInt8Array], { type: imageType });
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

    this.marcaVehiculoService
      .getMarcabyId(Number(this.marca))
      .subscribe((marca) => {
        this.nombreMarca = marca.nombre;
      });
    this.modeloVehiculoService
      .getModelobyId(Number(this.modelo))
      .subscribe((modelo) => {
        this.nombreModelo = modelo.nombre;
      });

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
