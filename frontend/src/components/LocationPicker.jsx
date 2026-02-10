import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react'; 
import L from 'leaflet';
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, onLocationSelect }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

const LocationPicker = ({ onLocationSelect, initialLat, initialLng }) => {
    const [position, setPosition] = useState(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );
    const [loadingLocation, setLoadingLocation] = useState(false);

    const [status, setStatus] = useState({ type: '', message: '' });

    const handleUseCurrentLocation = () => {
        setStatus({ type: '', message: '' });

        if (!navigator.geolocation) {
            setStatus({
                type: 'error',
                message: 'Your browser does not support location services.'
            });
            return;
        }

        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const latlng = { lat: latitude, lng: longitude };
                setPosition(latlng);
                onLocationSelect(latitude, longitude);
                setLoadingLocation(false);
                setStatus({ type: 'success', message: 'Location detected successfully!' });
            },
            (err) => {
                console.error("GPS failed, attempting IP fallback...", err);
                fallbackToIp();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    };

    const fallbackToIp = async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            if (data.latitude && data.longitude) {
                const latlng = { lat: data.latitude, lng: data.longitude };
                setPosition(latlng);
                onLocationSelect(data.latitude, data.longitude);
                setStatus({
                    type: 'warning',
                    message: 'GPS unavailable. Used IP for approximate location.'
                });
            } else {
                throw new Error("Invalid IP data");
            }
        } catch (error) {
            setStatus({
                type: 'error',
                message: 'Could not detect location. Please select manually on the map.'
            });
        } finally {
            setLoadingLocation(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={loadingLocation}
                    className={`px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 ${loadingLocation
                            ? 'bg-blue-400 cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                        }`}
                >
                    {loadingLocation ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Navigation className="w-4 h-4" />
                    )}
                    Locate Me
                </button>
                <span className="text-sm text-gray-500 italic">or click on the map</span>
            </div>

            {/* Professional Status Bar */}
            {status.message && (
                <div className={`flex items-center gap-2 p-3 text-sm rounded-lg border transition-all animate-in fade-in slide-in-from-top-1 ${status.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                        status.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-green-50 text-green-700 border-green-200'
                    }`}>
                    {status.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {status.message}
                </div>
            )}

            <div className="h-[320px] w-full rounded-xl overflow-hidden border border-gray-200 relative z-0 shadow-md group">
                <MapContainer
                    center={position || [20.5937, 78.9629]}
                    zoom={position ? 15 : 4}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    key={position ? `${position.lat}-${position.lng}` : 'default'}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
                </MapContainer>
            </div>

            {position && (
                <div className="flex items-center gap-2 text-xs text-gray-600 font-mono bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold text-gray-400">COORDS:</span>
                    {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;