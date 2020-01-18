import { Component, OnInit } from '@angular/core';
import { Lugar, RespLugares } from '../../interfaces/interfaces';
// importamos el modulo del mapbox
import * as mapboxgl from 'mapbox-gl';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit {

  mapa: mapboxgl.Map;

  // lugares: Lugar[] = [];
  lugares: RespLugares = {};
  markerMapBox: { [id: string]: mapboxgl.Marker } = {};

  constructor(
    private http: HttpClient,
    private wsService: WebsocketService) { }


  ngOnInit() {

    this.http.get<RespLugares>('http://localhost:5000/mapa').subscribe((data: RespLugares) => {
      // console.log(data);

      this.lugares = data;

      this.crearMapa();

      this.escucharSockets();
    });
  }

  escucharSockets() {

    // marcador-nuevo
    this.wsService.listen('nuevo-marcador').subscribe((marcador: Lugar) => {
      // console.log('Socket');
      // console.log(marcador);

      // añadirmos el marcado a los marcadores
      this.agregarMarcado(marcador);
    });

    // marcador-mover
    this.wsService.listen('mover-marcador').subscribe((marcador: Lugar) => {

      this.markerMapBox[marcador.id].setLngLat([marcador.lng, marcador.lat]);

    });


    // marcador-borrar
    this.wsService.listen('eliminar-marcador').subscribe((id: string) => {

      // quitamos el marcado de la lista
      this.markerMapBox[id].remove();

      // eliminamos la propiedad del objeto
      delete this.markerMapBox[id];

    });

  }


  crearMapa() {

    (mapboxgl as any).accessToken = 'pk.eyJ1IjoidmljdG9ydXVnbyIsImEiOiJjazVqank2bHIwM3U1M2psYnI2eTlleDdsIn0.KMWyqB7FkXVs01P2bR311Q';

    this.mapa = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-75.75512993582937,
        45.349977429009954
      ], zoom: 15.8
    });

    for (const [key, marcador] of Object.entries(this.lugares)) {
      this.agregarMarcado(marcador);
    }

  }


  agregarMarcado(marcador: Lugar) {

    // const html = `<h4>${marcador.nombre}</h4>
    //              <br>
    //              <button class="btn-sm btn-danger">Borrar</button>`;

    const h4 = document.createElement('h4');
    h4.innerText = marcador.nombre;

    const btnBorrar = document.createElement('button');
    btnBorrar.innerText = 'Borrar';

    const div = document.createElement('div');
    div.appendChild(h4);
    div.appendChild(btnBorrar);


    const customPopup = new mapboxgl.Popup({
      offset: 25,
      closeOnClick: false
    }).setDOMContent(div);

    const marker = new mapboxgl.Marker({
      draggable: true,
      color: marcador.color
    })
      .setLngLat([marcador.lng, marcador.lat])
      .setPopup(customPopup)
      .addTo(this.mapa);


    marker.on('drag', () => {
      const lngLat = marker.getLngLat();
      console.log(lngLat);

      // Creamos un marcado para enviar
      const nuevoMarcador = {
        id: marcador.id,
        lng: lngLat.lng,
        lat: lngLat.lat
      };

      // TODO crear evento para emitir las coordenadas de este marcador
      this.wsService.emit('mover-marcador', nuevoMarcador);
    });

    btnBorrar.addEventListener('click', () => {
      marker.remove();

      // TODO eliminar marcador mediante sockets
      this.wsService.emit('eliminar-marcador', marcador.id);
    });

    this.markerMapBox[marcador.id] = marker;
  }


  crearMarcador() {
    const customMarker: Lugar = {
      id: new Date().toISOString(),
      lng: -75.75512993582937,
      lat: 45.349977429009954,
      nombre: 'sin-nombre',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    };

    this.agregarMarcado(customMarker);

    // Emitir nuevo marcador
    this.wsService.emit('nuevo-marcador', customMarker, () => {
      console.log('emitido...');
    });
  }

}
