import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { User } from 'src/app/interfaces/user';
import { UsersService } from 'src/app/providers/users.service';
import { TerminosCondicionesPage } from '../modals/terminos-condiciones/terminos-condiciones.page';
import { PrivacidadPage } from '../modals/privacidad/privacidad.page';
import { DatosRegistroPage } from '../modals/datos-registro/datos-registro.page';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {
  showPasswordText: boolean = false;

  inputValue: string = '';
  inputType: string = '';

  //mensajes de retroalimentacion
  cedulaNoValida: boolean = false;
  fechaInvalida: boolean = false;
  terminosNoAceptados: boolean = false;
  camposVacios: boolean = false;
  contrasenasIguales: boolean = false;
  usuarioExistente: boolean = false;
  emailInvalido: boolean = false;

  inputValue2: string = '';
  inputType2: string = '';
  formGroup: any;
  formBuilder: any;
  absenceTypeId: any;

  termsAccepted: any;

  //inputs
  cedulaInput: string = '';
  nombresInput: string = '';
  apellidosInput: string = '';
  fechaInput: string = '';
  correoInput: string = '';
  telefonoInput: string = '';
  sexoInput: string = '';

  users: User[] = [];
  usuario: any;
  cliente: any;

  constructor(
    public fb: FormBuilder,
    private router: Router,
    private userService: UsersService,
    private modalController: ModalController,
  ) {}
  cancelar() {
    this.router.navigate(['/login']);
  }

  registrarse() {

    !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.correoInput)?this.emailInvalido = true:this.emailInvalido = false;

    !/^(0[1-9]|1[0-7]|2[0-4])[0-5][0-9]{7}[0-9]$/.test(this.cedulaInput)?this.cedulaNoValida=true:this.cedulaNoValida=false;

    if (
      this.camposCompletos() &&
      !this.usuarioExiste() &&
      this.esMayordeEdad(this.fechaInput) &&
      this.passwordCoincide(this.inputValue, this.inputValue2) &&
      this.aceptoTerminos() &&
      !this.emailInvalido &&
      this.cedulaNoValida
    ) {    
      this.usuario = {
        id_usuario: this.users.length + 6,
        email: this.correoInput,
        placa: '',
        contrasena: this.inputValue,
        fecha_creacion: new Date().toISOString().split('T')[0],
        fecha_modificacion: new Date().toISOString().split('T')[0],
        estado: 1,
        rol_usuario: 2, //chofer
      };

      this.cliente = {
        cedula_cliente: this.cedulaInput,
        nombre: this.nombresInput,
        apellido: this.apellidosInput,
        fecha_nacimiento: this.fechaInput,
        email: this.correoInput,
        sexo: +this.sexoInput,
        telefono: this.telefonoInput,
        estado: 1,
      };
      this.mostrarDatos()
    }
  }

  usuarioExiste(){
    const busquedaEmail = this.users.find(({ email }) => email == this.correoInput);

    if(busquedaEmail){
      this.usuarioExistente = true;
      return true;
    }else{
      this.usuarioExistente = false;
      return false;
    }
  }

  passwordCoincide(contra1: string, contra2: string){
    if(contra1==contra2){
      this.contrasenasIguales=false
      return true;
    }else{
      this.contrasenasIguales=true
      return false;
    }
  }


  esMayordeEdad(fechaInput: string) {
    const fechaNacimientoDate = new Date(fechaInput);
    // Calcula la fecha actual
    const fechaActual = new Date();
    const diferenciaMilisegundos =
      fechaActual.getTime() - fechaNacimientoDate.getTime();

    // Calcula la edad dividiendo la diferencia de tiempo por la cantidad de milisegundos en un año
    const edad = diferenciaMilisegundos / (1000 * 60 * 60 * 24 * 365.25);
    if (edad >= 18) {
      this.fechaInvalida = false;
    } else {
      this.fechaInvalida = true;
    }
    // Comprueba si la persona tiene al menos 18 años
    return edad >= 18;
  }

  camposCompletos() {

    if (
      this.inputValue === undefined ||
      this.inputValue2 === undefined ||
      !this.cedulaInput ||
      !this.nombresInput ||
      !this.apellidosInput ||
      !this.fechaInput ||
      !this.correoInput ||
      !this.inputValue ||
      !this.telefonoInput ||
      !this.sexoInput
    ) {
      this.camposVacios = true;
      return false;
    } else {
      this.camposVacios = false;
      return true;
    }
  }

  aceptoTerminos() {
    if (!this.termsAccepted) {
      this.terminosNoAceptados = true;
      return false;
    } else {
      this.terminosNoAceptados = false;
      return true;
    }
  }

  async mostrarTerminos(){
    const modal = await this.modalController.create({
      component: TerminosCondicionesPage,
      cssClass: 'terms',
    });

    return await modal.present();
  }

  async mostrarPoliticas(){
    const modal = await this.modalController.create({
      component: PrivacidadPage,
      cssClass: 'terms',
    });

    return await modal.present();
  }

  async mostrarDatos() {
    const modal = await this.modalController.create({
      component: DatosRegistroPage,
      cssClass: 'terms',
      componentProps: {
        cedula: this.cedulaInput,
        nombres: this.nombresInput,
        apellidos: this.apellidosInput,
        fechaNacimiento: this.fechaInput,
        correo: this.correoInput,
        password: this.inputValue,
        telefono: this.telefonoInput,
        sexo: this.sexoInput,
        usuario: this.usuario,
        cliente: this.cliente,
      },
    });
    return await modal.present();
  }

  ngOnInit() {
    this.userService.getUsers().subscribe((data) => {
      this.users = data;
    });
  }
}
