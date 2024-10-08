import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ComunicationService } from 'src/app/providers/comunication.service';
import { ToolbarService } from 'src/app/providers/toolbar.service';

@Component({
  selector: 'app-codigo-password',
  templateUrl: './codigo-password.page.html',
  styleUrls: ['./codigo-password.page.scss'],
})
export class CodigoPasswordPage implements OnInit {

  email: string = '';
  codigo: string = '';
  codigoInput: string = '';
  recibido:[] = [];
  mostrarMensaje: boolean = false;

  constructor(
    private router: Router,
    private communicationService: ComunicationService,
    private toolbarService: ToolbarService,
  ) { }

  siguiente(){
    console.log(this.codigoInput, this.codigo)
    if(this.codigoInput == this.codigo){
      this.router.navigate(['/reestablecer-password']);
    }else{
      console.log('Codigo incorrecto')
      this.mostrarMensaje = true;
    }
    
  }

  ngOnInit() {
    this.toolbarService.setTexto('RECUPERAR CONTRASEÑA')
    this.communicationService.variable$.subscribe((variable) =>{
      this.recibido = variable;
      this.email = variable[0];
      this.codigo = variable[1];
      console.log(variable)

      
    })

    
  }

}
