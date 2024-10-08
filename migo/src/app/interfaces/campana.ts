export interface Campana {
    id_campana: number,
    nombre_campana: string,
    correo_responsable: string,
    id_sector: number,
    fecha_inicio: string,
    fecha_fin: string,
    fecha_fin_registro: string,
    presupuesto: number,
    nombre_responsable: string,
    tarifa_base: number,
    tarifa_min: number,
    tarifa_max: number,
    hora_monetizable_inicio: string,
    hora_monetizable_fin: string,
    cobro_minimo: number,
    tipo_brandeo: string,
    id_talleres: number[],
    carroceria_capo: number,
    carroceria_techo: number,
    puerta_conductor: number,
    puerta_pasajero: number,
    puerta_trasera_iz: number,
    puerta_trasera_der: number,
    puerta_maletero: number,
    fecha_creacion: string,
    fecha_modificacion: string,
    estado: number,
    sedan_admisible: boolean,
    suv_admisible: boolean,
    camion_admisible: boolean,
    camioneta_admisible: boolean,
    bus_admisible: boolean,
    id_empresa: number,
    id_pais: number,
    id_ciudad: number,
}
