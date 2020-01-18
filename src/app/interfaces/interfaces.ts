export interface Lugar {
    id: string;
    nombre: string;
    lng: number;
    lat: number;
    color: string;
}

export interface RespLugares {
    [key: string]: Lugar;
}