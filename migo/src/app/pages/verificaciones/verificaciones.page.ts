import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { Platform, ModalController } from '@ionic/angular';
import { FixMeLater } from 'angularx-qrcode';
import { TCreatedPdf } from 'pdfmake/build/pdfmake';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Campana } from 'src/app/interfaces/campana';
import { Client } from 'src/app/interfaces/client';
import { IngresoConductorCampana } from 'src/app/interfaces/ingreso-conductor-campana';
import { TallerBrandeo } from 'src/app/interfaces/taller-brandeo';
import { User } from 'src/app/interfaces/user';
import { Vehiculo } from 'src/app/interfaces/vehiculo';
import { CampanaService } from 'src/app/providers/campana.service';
import { ClienteService } from 'src/app/providers/cliente.service';
import { ElegirVehiculoService } from 'src/app/providers/elegir-vehiculo.service';
import { EmpresaImagesService } from 'src/app/providers/empresa-images.service';
import { EmpresaService } from 'src/app/providers/empresa.service';
import { GooglemapsService } from 'src/app/providers/googlemaps.service';
import { IngresoConductorCampanaService } from 'src/app/providers/ingreso-conductor-campana.service';
import { MarcaVehiculoService } from 'src/app/providers/marca-vehiculo.service';
import { ModeloVehiculosService } from 'src/app/providers/modelo-vehiculos.service';
import { SectorService } from 'src/app/providers/sector.service';
import { TallerBrandeoService } from 'src/app/providers/taller-brandeo.service';
import { ToolbarService } from 'src/app/providers/toolbar.service';
import { UsersService } from 'src/app/providers/users.service';
import { VehiculoService } from 'src/app/providers/vehiculo.service';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-verificaciones',
  templateUrl: './verificaciones.page.html',
  styleUrls: ['./verificaciones.page.scss'],
})
export class VerificacionesPage implements OnInit {

  @ViewChild('parent', { read: ElementRef }) private parent!: ElementRef;

  user!: User;
  conductor!: any;
  client!: Client;
  campana!: Campana;
  vehiculo!: Vehiculo;
  marca!: string;
  modelo!: string;

  //
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
    private modeloVehiculoService: ModeloVehiculosService,
    private renderer: Renderer2,

    private toolbarService: ToolbarService,
    private modalController: ModalController,
    private userService: UsersService,
    private clientService: ClienteService,
    private empresaService: EmpresaService,
    private sectorService: SectorService,
    private tallerBService: TallerBrandeoService,
    private empresaImagesService: EmpresaImagesService,
    private googleMapService: GooglemapsService,
  ) { }

  ngOnInit() {
    //QR
    this.user = this.userService.usuarioActivo(),
    this.conductor = this.userService.esChoferOCliente();
    this.ingresarCondService.getIngresos().subscribe((data) => {
      this.ingresos = data;
    });
  }

  mostrarQR(){

  }

  verificaBrandeo(){
  }

  verificaRecorrido(){}


  //QR
  getDatos() {
    if (this.ingresos) {
      let ingresoActual = this.ingresos.find(
        (ingreso) =>
          this.user.id_usuario === ingreso.id_usuario
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
          this.vehiculo.id_vehiculo === ingreso.id_vehiculo
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

}
