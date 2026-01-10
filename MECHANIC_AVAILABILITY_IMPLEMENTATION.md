# Mechanic Availability Status Implementation

## Overview
This document outlines the implementation of mechanic availability status tracking in the MotoReach application. The system now displays mechanic availability on the team management page and automatically updates availability when mechanics are assigned to or removed from service requests.

## Changes Made

### 1. Backend Changes

#### File: `backend/accounts/serializers.py`
- **Modified**: `MechanicRequestSerializer`
- **Change**: Added `'availability'` field to the serializer's fields list
- **Impact**: The API now returns the mechanic's availability status (AVAILABLE/BUSY) when fetching mechanics data

```python
class MechanicRequestSerializer(serializers.ModelSerializer):
    # ... existing fields ...
    class Meta:
        model = Mechanic
        fields = ['mechanic_id', 'user_id', 'mechanic_name', 'email', 'contact_number', 'availability', 'joining_status', 'created_at']
```

### 2. Frontend Changes

#### File: `frontend/src/pages/workshop/WorkshopMechanicManager.jsx`
- **Modified**: Mechanic card display in the Active Mechanics tab
- **Change**: Added availability status badge alongside the "Active" status badge
- **Visual Design**:
  - **Available**: Green badge (emerald-50 background, emerald-700 text)
  - **Busy**: Orange badge (orange-50 background, orange-700 text)

## Existing Functionality Verified

### Automatic Availability Updates
The system already has the following functionality in place (no changes needed):

#### File: `backend/service_request/views.py`

**When Assigning a Mechanic** (Line 423):
```python
mechanic.availability = 'BUSY'
mechanic.save()
```

**When Removing a Mechanic** (Line 455):
```python
mechanic.availability = 'AVAILABLE'
mechanic.save()
```

### Assignment Modal Filtering
The WorkshopServiceFlow page already filters mechanics correctly:

#### File: `frontend/src/pages/workshop/WorkshopServiceFlow.jsx` (Lines 97-100)
```javascript
const availableMechanics = workshopMechanics.filter(m =>
    m.availability === 'AVAILABLE' &&
    !assignedMechanics.some(am => am.id === m.id)
);
```

## Workshop Type Handling

### Individual vs Team Workshops
The system correctly handles two workshop types:

1. **INDIVIDUAL**: Workshop admin works alone (no mechanics)
2. **TEAM**: Workshop can have multiple mechanics

**Backend Validation** (`backend/accounts/views.py`, Lines 665-666):
```python
if workshop.type == 'INDIVIDUAL':
    return Response({'error': 'Individual workshops cannot accept team members...'})
```

## User Flow

### For Workshop Admins (TEAM Type)

1. **View Team Page** (`/workshop/team`)
   - See all active mechanics with their availability status
   - Green "Available" badge = mechanic can be assigned
   - Orange "Busy" badge = mechanic is currently assigned to a service

2. **Assign Mechanic to Service** (WorkshopServiceFlow page)
   - Click "Add Mechanic" button
   - Modal shows only AVAILABLE mechanics
   - Select and assign mechanic
   - **Automatic**: Mechanic's status changes to BUSY

3. **Remove Mechanic from Service**
   - Click "X" button on assigned mechanic
   - Confirm removal
   - **Automatic**: Mechanic's status changes back to AVAILABLE

### For Workshop Admins (INDIVIDUAL Type)
- No mechanics can be added (validation prevents it)
- Workshop admin assigns themselves to services
- Team management page would show no mechanics

## API Endpoints Used

### Fetch Mechanics
- **Endpoint**: `GET /api/accounts/workshop/mechanics/`
- **Returns**: List of mechanics with availability status
- **Used by**: WorkshopMechanicManager component

### Fetch Workshop Mechanics for Assignment
- **Endpoint**: `GET /api/service-request/workshop/my-mechanics/`
- **Returns**: List of mechanics for service assignment
- **Used by**: WorkshopServiceFlow component

### Assign Mechanic
- **Endpoint**: `POST /api/service-request/execution/{serviceRequestId}/assign/`
- **Body**: `{ mechanic_id: <id> }`
- **Side Effect**: Sets mechanic availability to BUSY

### Remove Mechanic
- **Endpoint**: `POST /api/service-request/execution/{serviceRequestId}/remove/`
- **Body**: `{ mechanic_id: <id> }`
- **Side Effect**: Sets mechanic availability to AVAILABLE

## Database Schema

### Mechanic Model
```python
class Mechanic(models.Model):
    AVAILABILITY_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('BUSY', 'Busy')
    ]
    availability = models.CharField(
        max_length=20, 
        choices=AVAILABILITY_CHOICES, 
        default='AVAILABLE'
    )
    # ... other fields ...
```

## Testing Checklist

- [x] Backend serializer includes availability field
- [x] Frontend displays availability status on team page
- [x] Assign mechanic sets status to BUSY
- [x] Remove mechanic sets status to AVAILABLE
- [x] Only AVAILABLE mechanics shown in assignment modal
- [x] Individual workshops cannot add mechanics
- [x] Team workshops can manage mechanics

## Notes

- **No Bottlenecks**: The implementation reuses existing API endpoints and Redux actions
- **Efficient Updates**: Availability changes happen automatically during assign/remove operations
- **Clean Code**: No over-complications, follows existing patterns
- **Type Safety**: Workshop type validation prevents mechanics from joining individual workshops

## Future Enhancements (Optional)

1. Add real-time updates using WebSockets when mechanic status changes
2. Show which service a BUSY mechanic is currently assigned to
3. Add mechanic workload statistics (number of active assignments)
4. Implement mechanic scheduling/calendar view
