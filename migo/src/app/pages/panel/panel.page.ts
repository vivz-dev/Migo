import { Component, OnInit } from '@angular/core';
import { ToolbarService } from 'src/app/providers/toolbar.service';
import { SectorService } from 'src/app/providers/sector.service';
import { Sector } from 'src/app/interfaces/sector';
import { RecorridoRealizado } from 'src/app/interfaces/recorrido-realizado';
import { RecorridoRealizadoService } from 'src/app/providers/recorrido-realizado.service';
import { UsersService } from 'src/app/providers/users.service';
import { Router } from '@angular/router';
import { CiudadService } from 'src/app/providers/ciudad.service';
import { Ciudad } from 'src/app/interfaces/ciudad';
import { GooglemapsService } from 'src/app/providers/googlemaps.service';
import { CampanaService } from 'src/app/providers/campana.service';
import { Campana } from 'src/app/interfaces/campana';
import { Ubicacion } from 'src/app/interfaces/ubicacion';
import { Location } from '@angular/common';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.page.html',
  styleUrls: ['./panel.page.scss'],
})
export class PanelPage implements OnInit {
  // map!: GoogleMap;
  // @ViewChild('mapaPanel') mapRef!: ElementRef<HTMLElement>;
  // polygonId?: string;
  modalController: any;
  clientService: any;

  sectores: Sector[] = [];
  sector?: Sector;

  map!: google.maps.Map;

  source!: google.maps.LatLngLiteral;
  destination!: google.maps.LatLngLiteral;

  ds!: google.maps.DirectionsService;
  dr!: google.maps.DirectionsRenderer;

  //
  horarioInicio = '';
  horarioFin = '';
  distanciaHoy = 1;
  dineroHoy = 1;
  numeroCampanas = 0;

  //
  dias = 0;
  horas = 0;
  minutos = 0;

  //
  hayRecorridos: boolean = false;

  //recorridos
  recorridosHoy: RecorridoRealizado[] = [];
  recorridosUsuario: RecorridoRealizado[] = [];

  //campanas
  // objectCampanas: Observable<Campana[]> = [];
  campanasUsuario: Campana[] = [];
  idCampanasUsuario: number[] = [];

  //cobros
  cobro = 0;

  constructor(
    private toolbarService: ToolbarService,
    private sectorService: SectorService,
    private recorridoService: RecorridoRealizadoService,
    private userService: UsersService,
    private router: Router,
    private ciudadService: CiudadService,
    private googleMapService: GooglemapsService,
    private campanaService: CampanaService,
    private location: Location
  ) {}

  ngOnInit() {
    //aqui nada
    this.toolbarService.setTexto('PANEL DE CONTROL');
  }

  ionViewWillEnter() {
    try {
      this.toolbarService.setTexto('PANEL DE CONTROL');
      this.generarDatos();
    } catch (error) {
      console.log(error);
    }
  }

  ionViewWillLeave() {
    this.resetDatos();
  }

  resetDatos() {
    this.recorridosHoy = [];
    this.recorridosUsuario = [];
    this.campanasUsuario = [];
    this.sectores = [];
  }

  generarDatos() {
    const idUsuarioActivo = this.userService.usuarioActivo().id_usuario;
    const idCiudad = this.userService.usuarioActivo().id_ciudad;

    const diaHoy = new Date().toLocaleDateString();
    const dia = diaHoy.split('/')[0];
    const mes = diaHoy.split('/')[1];
    const anio = diaHoy.split('/')[2];

    this.recorridoService.getRecorridos().subscribe((recorridos) => {
      if (recorridos) {
        //hay recorridos
        this.hayRecorridos = true;
        this.recorridosUsuario = recorridos.filter(
          (recorrido) =>
            recorrido.id_usuario === idUsuarioActivo &&
            idCiudad === recorrido.id_ciudad
        );

        const idCampanas = this.recorridosUsuario.map(
          (recorrido) => recorrido.id_campana
        );

        this.idCampanasUsuario = idCampanas.filter((id, i, self) => {
          return self.indexOf(id) === i;
        });

        this.numeroCampanas = this.idCampanasUsuario.length;

        this.recorridosUsuario.forEach((recorrido) => {
          const fechaRecorrido = recorrido.fecha_hora_inicio.split(',')[0];
          const diaRecorrido = fechaRecorrido.split('/')[0];
          const mesRecorrido = fechaRecorrido.split('/')[1];
          const yearRecorrido = fechaRecorrido.split('/')[2];

          if (
            diaRecorrido === dia &&
            mesRecorrido === mes &&
            yearRecorrido === anio
          ) {
            this.recorridosHoy.push(recorrido);
          }
        });

        this.getHorarioInicioHoy();
        this.getHorarioFinHoy();
        this.getTiempoTranscurrido();
        this.generarCobro2Meses();

        //crear Campanas y luego Mapa
        const idCampanasHoyRepetidas = this.recorridosHoy.map(
          (recorrido) => recorrido.id_campana
        );

        const idCampanasHoy = idCampanasHoyRepetidas.filter((id, i, self) => {
          return self.indexOf(id) === i;
        });

        if (idCampanasHoy.length > 0) {
          idCampanasHoy.forEach((id) => {
            this.campanaService.getCampanabyId(id).subscribe((campana) => {
              this.sectorService
                .getSectorbyId(campana.id_sector)
                .subscribe((sector) => {
                  this.sectores.push(sector);
                  this.createMap();
                });
            });
          });
        } else {
          this.createMap();
        }

        //create Map
      } else {
        this.hayRecorridos = false;
        //no hay recorridos
      }
    });
  }

  generarCobro2Meses() {
    this.cobro = 0;
  }

  getKMSRecorridos(arr: RecorridoRealizado[]) {
    const KMS = arr.map((recorrido) => recorrido.kilometraje_recorrido);
    var distancia = KMS.reduce(
      (acumulador, valorActual) => acumulador + valorActual,
      0
    );
    return distancia.toFixed(2);
  }

  getDineroRecaudado(arr: RecorridoRealizado[]) {
    const R = arr.map((recorrido) => recorrido.dinero_recaudado);
    if (R) {
      var dinero = R.reduce((x, y) => x + y, 0);
      return dinero.toFixed(2);
    }
    return 0;
  }

  getHorarioInicioHoy(): void {
    const inicios = this.recorridosHoy.map(
      (recorrido) =>
        this.transformarDate(recorrido.fecha_hora_inicio).getHours() * 100 +
        this.transformarDate(recorrido.fecha_hora_inicio).getMinutes()
    );

    if (inicios) {
      const horaMinima = Math.min(...inicios);
      let hora = String(Math.floor(horaMinima / 100));
      let minutos = String(horaMinima % 100);
      hora === 'Infinity' ? (hora = '-') : hora;
      hora === '-Infinity' ? (hora = '-') : hora;
      minutos === 'NaN' ? (minutos = '-') : minutos;
      const horaFinal = Number(hora)<10?'0'+hora:hora;
      const minutosFinal = Number(minutos)<10?'0'+minutos:minutos;
      this.horarioInicio = horaFinal + ':' + minutosFinal;
    }
  }

  getHorarioFinHoy(): void {
    const fines = this.recorridosHoy.map(
      (recorrido) =>
        this.transformarDate(recorrido.fecha_hora_fin).getHours() * 100 +
        this.transformarDate(recorrido.fecha_hora_fin).getMinutes()
    );

    if (fines) {
      const horaMaxima = Math.max(...fines);
      let hora = String(Math.floor(horaMaxima / 100));
      let minutos = String(horaMaxima % 100);
      hora === 'Infinity' ? (hora = '-') : hora;
      hora === '-Infinity' ? (hora = '-') : hora;
      minutos === 'NaN' ? (minutos = '-') : minutos;
      const horaFinal = Number(hora)<10?'0'+hora:hora;
      const minutosFinal = Number(minutos)<10?'0'+minutos:minutos;
      this.horarioFin = horaFinal + ':' + minutosFinal;
    }
  }

  transformarDate(fecha: string) {
    const [datePart, timePart] = fecha.split(', ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    const dateObject = new Date(year, month - 1, day, hour, minute, second);
    return dateObject;
  }

  getTiempoTranscurrido() {
    //corregir la logica
    const inicios = this.recorridosUsuario.map((recorrido) =>
      this.transformarDate(recorrido.fecha_hora_inicio)
    );
    const fines = this.recorridosUsuario.map(
      (recorrido) => this.transformarDate(recorrido.fecha_hora_fin)
    );

    if (inicios && fines) {

      const iniciosAscendente = inicios.sort((a, b) => {
        return a.getTime() - b.getTime();
      });

      let finesAscendente = fines.sort((x, y) => {
        return x.getTime() - y.getTime();
      });

      const inicioRecorridos = iniciosAscendente[0];
      const finRecorridos = finesAscendente.pop();

      if (inicioRecorridos && finRecorridos) {
        const tiempo = this.msDias(
          finRecorridos!.getTime() - inicioRecorridos.getTime()
        );

        this.dias = tiempo.dias;
        this.horas = tiempo.horas;
        this.minutos = tiempo.minutos;
      }
    }
  }

  msDias(milisegundos: number): {
    dias: number;
    horas: number;
    minutos: number;
  } {
    const segundosEnUnMinuto = 60;
    const segundosEnUnaHora = 60 * segundosEnUnMinuto;
    const segundosEnUnDia = 24 * segundosEnUnaHora;

    const dias = Math.floor(milisegundos / (1000 * segundosEnUnDia));
    const horas = Math.floor(
      (milisegundos % (1000 * segundosEnUnDia)) / (1000 * segundosEnUnaHora)
    );
    const minutos = Math.floor(
      (milisegundos % (1000 * segundosEnUnaHora)) / (1000 * segundosEnUnMinuto)
    );

    return { dias, horas, minutos };
  }

  createMap() {
    const idCiudad = this.userService.usuarioActivo().id_ciudad;
    this.ciudadService.getCiudadbyId(idCiudad).subscribe((ciudad: Ciudad) => {
      const centro = ciudad.ubicacion_google_maps.centro;
      const zoom = ciudad.ubicacion_google_maps.zoom;
      if (this.recorridosHoy && this.sectores) {
        let ubicacionesHoy: Ubicacion[] = [];

        this.recorridosHoy.forEach((recorrido) => {
          recorrido.ubicaciones.forEach((ubicacion) => {
            ubicacionesHoy.push(ubicacion);
          });
        });

        const c = this.sectores.map((sector) => sector.cerco_virtual);

        let cercosVirtuales: Ubicacion[][] = [[]];

        c.forEach((cerco) => {
          cerco.forEach((cercoVirtual) => {
            cercosVirtuales.push(cercoVirtual);
          });
        });

        this.googleMapService.createMap(
          centro,
          zoom,
          'map-panel',
          this.map,
          cercosVirtuales,
          ubicacionesHoy,
          true
        );
      } else {
        this.googleMapService.createMap(centro, zoom, 'map-panel', this.map);
      }
    });
  }

  verHistorial() {
    this.router.navigate(['/historial-pagos']);
    // Location.
  }
}
