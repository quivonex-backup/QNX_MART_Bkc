import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PlacesNearbyService } from '../../../services/places-nearby.service';
import { AlertService } from '../../../services/alert.service';

export interface NearbyPlace {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  icon?: string;
  international_phone_number?: string;
  types?: string[];
  opening_hours?: { open_now?: boolean };
  photos?: { photo_reference: string; height: number; width: number }[];
  geometry?: {
    location: { lat: number; lng: number };
  };
  // computed
  distanceKm?: number;
}

@Component({
  selector: 'app-places-nearby',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './places-nearby.component.html',
  styleUrls: ['./places-nearby.component.css']
})
export class PlacesNearbyComponent implements OnInit, OnDestroy {

  searchForm: FormGroup;
  isLoading = false;
  isLocating = false;
  errorMessage = '';

  places: NearbyPlace[] = [];
  nextPageToken: string | null = null;
  currentLat: number | null = null;
  currentLng: number | null = null;

  readonly quickKeywords = [
    'transport',
    'hospital',
    'school',
    'restaurant',
    'bank',
    'atm',
    'pharmacy',
    'gym',
    'park',
    'shopping mall',
    'bus stop',
    'metro station'
  ];

  constructor(
    private fb: FormBuilder,
    private placesService: PlacesNearbyService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.searchForm = this.fb.group({
      lat: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      lng: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      radius: [5000, [Validators.required, Validators.min(1), Validators.max(50000)]],
      keyword: ['', [Validators.required]]
    });
  }

  // ================= LIFECYCLE =================

  ngOnInit() {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      this.alertService.unialert('Please login to search nearby places.');
      sessionStorage.setItem('redirect_after_login', this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    // Try to auto-fill location on load for convenience
    this.detectLocation(false);
  }

  ngOnDestroy() { }

  // ================= LOCATION =================

  /** Fetch browser GPS location. `silent=false` shows alert on failure. */
  private detectLocation(silent: boolean) {
    if (!navigator.geolocation) {
      if (!silent) this.alertService.unialert('Geolocation is not supported by your browser.');
      return;
    }
    this.isLocating = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        this.searchForm.patchValue({ lat, lng });
        this.currentLat = lat;
        this.currentLng = lng;
        this.isLocating = false;
        this.cdr.detectChanges();
      },
      (err) => {
        this.isLocating = false;
        if (!silent) {
          let msg = 'Unable to retrieve your location.';
          if (err.code === 1) msg = 'Location permission denied.';
          else if (err.code === 2) msg = 'Location unavailable.';
          else if (err.code === 3) msg = 'Location request timed out.';
          this.alertService.unialert(msg);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  /** Button handler — user clicked "Use my location". */
  useMyLocation() {
    this.detectLocation(false);
  }

  // ================= QUICK KEYWORD CHIPS =================

  selectKeyword(kw: string) {
    this.searchForm.patchValue({ keyword: kw });
  }

  // ================= SEARCH =================

  onSearch() {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.alertService.unialert('Please fill all fields correctly before searching.');
      return;
    }

    const v = this.searchForm.value;
    const payload = {
      lat: Number(v.lat),
      lng: Number(v.lng),
      radius: Number(v.radius),
      keyword: String(v.keyword).trim()
    };

    this.isLoading = true;
    this.errorMessage = '';
    this.places = [];
    this.nextPageToken = null;
    this.currentLat = payload.lat;
    this.currentLng = payload.lng;

    this.placesService.getNearbyPlaces(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        // Handle Google API error statuses
        const status = res?.status;
        if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
          const friendly = this.googleStatusMessage(status);
          this.errorMessage = friendly;
          this.alertService.unialert(friendly);
          return;
        }

        const raw = Array.isArray(res?.results) ? res.results : [];
        this.nextPageToken = res?.next_page_token || null;

        this.places = raw.map((p: any) => this.normalizePlace(p, payload.lat, payload.lng));

        if (this.places.length === 0) {
          this.alertService.unialert('No places found for this search. Try a different keyword or a larger radius.');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        let msg = 'Failed to fetch nearby places. Please try again.';
        if (err?.status === 401 || err?.status === 403) {
          msg = 'Your session has expired. Please login again.';
          sessionStorage.removeItem('access_token');
          sessionStorage.setItem('redirect_after_login', this.router.url);
          setTimeout(() => this.router.navigate(['/login']), 1200);
        } else if (err?.error?.message) {
          msg = err.error.message;
        } else if (err?.error?.error) {
          msg = err.error.error;
        } else if (err?.status === 0) {
          msg = 'Network error. Please check your connection.';
        }
        this.errorMessage = msg;
        this.alertService.unialert(msg);
      }
    });
  }

  // ================= NORMALIZE =================

  private normalizePlace(p: any, originLat: number, originLng: number): NearbyPlace {
    const placeLat = p?.geometry?.location?.lat;
    const placeLng = p?.geometry?.location?.lng;
    const distanceKm =
      placeLat != null && placeLng != null
        ? this.calculateDistanceKm(originLat, originLng, placeLat, placeLng)
        : undefined;

    return {
      place_id: p?.place_id || '',
      name: p?.name || 'Unnamed place',
      vicinity: p?.vicinity || '',
      rating: typeof p?.rating === 'number' ? p.rating : undefined,
      user_ratings_total:
        typeof p?.user_ratings_total === 'number' ? p.user_ratings_total : undefined,
      business_status: p?.business_status || '',
      icon: p?.icon || '',
      international_phone_number: p?.international_phone_number || '',
      types: Array.isArray(p?.types) ? p.types : [],
      opening_hours: p?.opening_hours || undefined,
      photos: Array.isArray(p?.photos) ? p.photos : [],
      geometry: p?.geometry || undefined,
      distanceKm
    };
  }

  private calculateDistanceKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371; // Earth radius km
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // 2-decimal km
  }

  private googleStatusMessage(status: string): string {
    switch (status) {
      case 'ZERO_RESULTS':
        return 'No places found nearby.';
      case 'OVER_QUERY_LIMIT':
        return 'Query limit exceeded. Please try again later.';
      case 'REQUEST_DENIED':
        return 'Request denied. Check API key or permissions.';
      case 'INVALID_REQUEST':
        return 'Invalid request. Please check your search parameters.';
      case 'UNKNOWN_ERROR':
        return 'Something went wrong. Please try again.';
      default:
        return `Search failed: ${status}`;
    }
  }

  // ================= HELPERS (template) =================

  formatDistance(km?: number): string {
    if (km == null) return '—';
    if (km < 1) return `${Math.round(km * 1000)} m away`;
    return `${km.toFixed(2)} km away`;
  }

  /** Google Maps link using place_id (best) or coordinates fallback. */
  googleMapsUrl(place: NearbyPlace): string {
    if (place.place_id) {
      return `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
    }
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    if (lat != null && lng != null) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    return 'https://www.google.com/maps';
  }

  /** Directions link (turn-by-turn). */
  googleDirectionsUrl(place: NearbyPlace): string {
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    if (lat != null && lng != null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    return 'https://www.google.com/maps';
  }

  /** Pretty-printed type list (drops generic ones). */
  readableTypes(types?: string[]): string {
    if (!types || types.length === 0) return '';
    const hide = new Set([
      'point_of_interest', 'establishment', 'premise',
      'subpremise', 'political', 'route', 'locality'
    ]);
    const shown = types.filter(t => !hide.has(t)).map(t => t.replace(/_/g, ' '));
    return shown.join(', ');
  }

  trackByPlaceId(_: number, p: NearbyPlace): string {
    return p.place_id;
  }

  clearResults() {
    this.places = [];
    this.nextPageToken = null;
    this.errorMessage = '';
    this.searchForm.patchValue({ keyword: '' });
  }
}