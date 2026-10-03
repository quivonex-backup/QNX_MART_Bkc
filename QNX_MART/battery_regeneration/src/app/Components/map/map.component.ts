import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../services/alert.service';

declare var google: any;

@Component({
  selector: 'app-map',
  imports: [FormsModule, CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit {

  latitude: number | null = null;
  longitude: number | null = null;
  map: any;
  marker: any;

  ngOnInit(): void {
    this.loadMapScript();
  }

  constructor(
    private alertService: AlertService
  ) {}

  // 🔑 Load Google Map Script
  loadMapScript() {
    const script = document.createElement('script');
   script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyD6SCNxA5Ap8em5HonlKNIFhzxhxsWHYtw&libraries=marker';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  // 📍 Get User Location
  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;

          this.initMap();
        },
        (error) => {
          this.alertService.unialert('Location access denied or not available');
          console.error(error);
        }
      );
    } else {
      this.alertService.unialert('Geolocation is not supported by this browser.');
    }
  }

  // 🗺️ Initialize Map
initMap() {
  const location = {
    lat: this.latitude!,
    lng: this.longitude!
  };

  this.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: location
  });

  // check if advanced marker available
  if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
    this.marker = new google.maps.marker.AdvancedMarkerElement({
      position: location,
      map: this.map
    });
  } else {
    // fallback (old marker)
    this.marker = new google.maps.Marker({
      position: location,
      map: this.map
    });
  }
}
}