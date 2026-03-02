// core/location.js  GPS・位置情報管理

export class LocationManager {
  constructor() {
    this.watchId = null;
    this.currentPos = null;
  }

  static haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const f1 = lat1 * Math.PI / 180, f2 = lat2 * Math.PI / 180;
    const df = (lat2 - lat1) * Math.PI / 180, dl = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  start(onUpdate, onError) {
    if (!navigator.geolocation) {
      if (onError) onError('Geolocation非対応のブラウザです');
      return;
    }
    this.watchId = navigator.geolocation.watchPosition(
      pos => { this.currentPos = pos; if (onUpdate) onUpdate(pos); },
      err => { if (onError) onError(err.message); },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  distanceTo(lat, lng) {
    if (!this.currentPos) return Infinity;
    return LocationManager.haversine(
      this.currentPos.coords.latitude,
      this.currentPos.coords.longitude,
      lat, lng
    );
  }
}
