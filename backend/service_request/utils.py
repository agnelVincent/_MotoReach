from django.utils import timezone
from payments.utils import check_and_process_refund
from math import radians, cos, sin, asin, sqrt

def calculate_distance(lat1, long1, lat2, long2):
    if lat1 is None or long1 is None or lat2 is None or long2 is None:
        return float('inf')
    
    try:
        lat1, long1, lat2, long2 = map(float, [lat1, long1, lat2, long2])
    except ValueError:
        return float('inf')
    
    R = 6371 
    dlat = radians(lat2 - lat1)
    dlong = radians(long2 - long1)
    a = sin(dlat/2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlong/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c

def get_nearby_workshops(user_lat, user_lon, radius_km=20):
    from accounts.models import Workshop 
    
    if user_lat is None or user_lon is None:
        return []
    
    try:
        user_lat = float(user_lat)
        user_lon = float(user_lon)
    except ValueError:
        return []

    # 1. Bounding Box Optimization
    # 1 degree latitude ~= 111 km
    lat_change = radius_km / 111.0
    
    # 1 degree longitude ~= 111 km * cos(latitude)
    # Avoid division by zero at poles
    if abs(user_lat) > 89: 
        lon_change = 360 # Search all longitudes
    else:
        lon_change = radius_km / (111.0 * abs(cos(radians(user_lat))))

    min_lat = user_lat - lat_change
    max_lat = user_lat + lat_change
    min_lon = user_lon - lon_change
    max_lon = user_lon + lon_change

    # 2. Database Filter (The "Wise" Optimization)
    # This reduces search from N records to a small local subset using DB index
    candidates = Workshop.objects.filter(
        verification_status='APPROVED',
        latitude__range=(min_lat, max_lat),
        longitude__range=(min_lon, max_lon)
    ).exclude(latitude__isnull=True)

    nearby_workshops = []
    for ws in candidates:
        dist = calculate_distance(user_lat, user_lon, ws.latitude, ws.longitude)
        if dist <= radius_km:
            ws.distance = round(dist, 2)
            nearby_workshops.append(ws)
    
    nearby_workshops.sort(key=lambda x: x.distance)
    
    return nearby_workshops

def check_request_expiration(service_request):

    if service_request.status in ['COMPLETED', 'CANCELLED', 'EXPIRED', 'VERIFIED']:
        return False

    if not service_request.expires_at:
        return False

    if service_request.expires_at < timezone.now():
        from .models import ServiceExecution

        is_refunded, msg = check_and_process_refund(service_request)
        
        service_request.status = 'EXPIRED'
        service_request.save()

        try:
            execution = service_request.execution
            if execution:
                for mechanic in execution.mechanics.all():
                    mechanic.availability = 'AVAILABLE'
                    mechanic.save()
                execution.delete()
        except ServiceExecution.DoesNotExist:
            pass

        return True
    
    return False
