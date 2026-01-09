# Database Schema Documentation

This document provides comprehensive documentation for the PocketBase database schema used in LepakMasjid.app.

## Overview

LepakMasjid uses **PocketBase** as its backend, which provides:
- SQLite database with automatic migrations
- Built-in authentication and authorization
- RESTful API with real-time subscriptions
- File storage and management
- Admin UI for data management

## Collections

The database consists of 7 collections:

1. [users](#1-users-collection) - User authentication and profiles
2. [mosques](#2-mosques-collection) - Mosque directory
3. [amenities](#3-amenities-collection) - Standardized amenities catalog
4. [mosque_amenities](#4-mosque_amenities-collection) - Mosque-amenity relationships
5. [activities](#5-activities-collection) - Mosque activities and events
6. [submissions](#6-submissions-collection) - User-submitted changes
7. [audit_logs](#7-audit_logs-collection) - Administrative audit trail

---

## 1. Users Collection

**Collection ID**: `_pb_users_auth_`  
**Type**: Auth (PocketBase built-in authentication)  
**Purpose**: Stores authenticated users with role-based access control

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | text | ✓ | 15-character auto-generated ID (primary key) |
| `email` | email | ✓ | User's email address (unique) |
| `password` | password | ✓ | Hashed password (min 8 characters) |
| `tokenKey` | text | ✓ | 50-character token for session management |
| `emailVisibility` | bool | - | Whether email is publicly visible |
| `verified` | bool | - | Email verification status |
| `name` | text | - | User's display name (max 255 chars) |
| `avatar` | file | - | Profile picture (image formats only) |
| `role` | select | - | User role: `user` or `admin` |
| `created` | autodate | ✓ | Account creation timestamp |
| `updated` | autodate | ✓ | Last update timestamp |

### Indexes

```sql
CREATE UNIQUE INDEX idx_tokenKey__pb_users_auth_ ON users (tokenKey)
CREATE UNIQUE INDEX idx_email__pb_users_auth_ ON users (email) WHERE email != ''
```

### Authentication Configuration

#### Password Authentication
- **Enabled**: Yes
- **Identity Fields**: `email`
- **Min Password Length**: 8 characters

#### OAuth2
- **Enabled**: Yes
- **Mapped Fields**:
  - `name` → OAuth name
  - `avatar` → OAuth avatar URL

#### Token Durations
- **Auth Token**: 604800 seconds (7 days)
- **Password Reset**: 1800 seconds (30 minutes)
- **Email Change**: 1800 seconds (30 minutes)
- **Verification**: 259200 seconds (3 days)
- **File Token**: 180 seconds (3 minutes)

---

## 2. Mosques Collection

**Collection ID**: `pbc_4054939655`  
**Type**: Base  
**Purpose**: Stores mosque information and metadata

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | text | ✓ | 15-character auto-generated ID (primary key) |
| `name` | text | ✓ | Mosque name (English) |
| `name_bm` | text | - | Mosque name (Bahasa Melayu) |
| `address` | text | ✓ | Full address |
| `contact` | text | - | Contact information (phone/email) |
| `state` | select | ✓ | Malaysian state (see values below) |
| `lat` | number | ✓ | Latitude coordinate |
| `lng` | number | ✓ | Longitude coordinate |
| `description` | text | - | Description (English) |
| `description_bm` | text | - | Description (Bahasa Melayu) |
| `status` | select | ✓ | Approval status: `pending`, `approved`, `rejected` |
| `created_by` | relation | ✓ | User who created the record |
| `image` | file | - | Mosque photo |

### State Values

```
Johor, Kedah, Kelantan, Melaka, Negeri Sembilan, Pahang, Penang, Perak, 
Perlis, Sabah, Sarawak, Selangor, Terengganu, WP Kuala Lumpur, WP Labuan, 
WP Putrajaya
```

### Indexes

```sql
CREATE INDEX idx_mosques_status ON mosques (status)
CREATE INDEX idx_mosques_location ON mosques (lat, lng)
CREATE INDEX idx_mosques_state ON mosques (state)
```

### Business Logic

- Only approved mosques are visible to unauthenticated users
- Authenticated users can see all mosques (for editing/submission purposes)
- Geographic queries are optimized via lat/lng index

---

## 3. Amenities Collection

**Collection ID**: `pbc_2405151471`  
**Type**: Base  
**Purpose**: Catalog of standardized amenities available at mosques

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | text | ✓ | 15-character auto-generated ID (primary key) |
| `key` | text | ✓ | Unique identifier (e.g., `wheelchair`, `parking`) |
| `label_bm` | text | ✓ | Display name in Bahasa Melayu |
| `label_en` | text | ✓ | Display name in English |
| `icon` | text | - | Icon name or URL |
| `order` | number | - | Sort order for UI display |

### Indexes

```sql
CREATE UNIQUE INDEX idx_amenities_key ON amenities (key)
```

### Example Amenities

```json
{
  "key": "wheelchair",
  "label_en": "Wheelchair Accessible",
  "label_bm": "Akses Kerusi Roda",
  "icon": "wheelchair",
  "order": 1
}
```

---

## 4. Mosque Amenities Collection

**Collection ID**: `pbc_4245282413`  
**Type**: Base  
**Purpose**: Junction table linking mosques to amenities with additional metadata

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | text | ✓ | 15-character auto-generated ID (primary key) |
| `mosque_id` | relation | ✓ | Reference to `mosques` collection |
| `amenity_id` | relation | - | Reference to `amenities` collection |
| `details` | json | - | Additional details (capacity, notes, etc.) |
| `verified` | bool | - | Whether amenity has been verified |

### Indexes

```sql
CREATE INDEX idx_mosque_amenities_mosque ON mosque_amenities (mosque_id)
CREATE INDEX idx_mosque_amenities_amenity ON mosque_amenities (amenity_id)
```

### Details JSON Schema

```json
{
  "capacity": 50,
  "notes": "Located on ground floor",
  "lastVerified": "2024-01-15"
}
```

---

## 5. Activities Collection

**Collection ID**: `pbc_1262591861`  
**Type**: Base  
**Purpose**: Stores scheduled activities and events at mosques

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | text | ✓ | 15-character auto-generated ID (primary key) |
| `mosque_id` | relation | ✓ | Reference to `mosques` collection |
| `title` | text | ✓ | Activity title (English) |
| `title_bm` | text | - | Activity title (Bahasa Melayu) |
| `description` | text | - | Activity description (English) |
| `description_bm` | text | - | Activity description (Bahasa Melayu) |
| `type` | select | ✓ | Activity type: `one_off`, `recurring`, `fixed` |
| `schedule_json` | json | ✓ | Schedule configuration (see schema below) |
| `start_date` | date | - | Activity start date |
| `end_date` | date | - | Activity end date |
| `status` | select | ✓ | Activity status: `active`, `cancelled` |
| `created_by` | relation | ✓ | User who created the activity |

### Activity Types

- **`one_off`**: Single occurrence event (e.g., special lecture)
- **`recurring`**: Repeating event (e.g., weekly Quran class)
- **`fixed`**: Regular prayer times or permanent programs

### Schedule JSON Schema

```json
{
  "type": "recurring",
  "frequency": "weekly",
  "days": ["monday", "wednesday", "friday"],
  "time": "20:00",
  "duration": 120,
  "timezone": "Asia/Kuala_Lumpur"
}
```

### Indexes

```sql
CREATE INDEX idx_activities_mosque ON activities (mosque_id)
CREATE INDEX idx_activities_status ON activities (status)
```

---

## 6. Submissions Collection

**Collection ID**: `pbc_3482339971`  
**Type**: Base  
**Purpose**: Tracks user-submitted changes for administrative review

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | text | ✓ | 15-character auto-generated ID (primary key) |
| `type` | select | ✓ | Submission type: `new_mosque`, `edit_mosque` |
| `mosque_id` | relation | - | Reference to mosque (for edits only) |
| `data` | json | ✓ | Submitted data payload |
| `status` | select | ✓ | Review status: `pending`, `approved`, `rejected` |
| `submitted_by` | relation | ✓ | User who submitted |
| `submitted_at` | date | ✓ | Submission timestamp |
| `reviewed_by` | relation | - | Admin who reviewed |
| `reviewed_at` | date | - | Review timestamp |
| `rejection_reason` | text | - | Reason for rejection |
| `image` | file | - | Supporting image (JPEG, PNG, WebP, GIF) |

### Submission Types

- **`new_mosque`**: Proposal for a new mosque entry
- **`edit_mosque`**: Proposed changes to existing mosque

### Data JSON Schema

```json
{
  "name": "Masjid Al-Falah",
  "address": "123 Jalan Masjid, Kuala Lumpur",
  "state": "WP Kuala Lumpur",
  "lat": 3.1390,
  "lng": 101.6869,
  "description": "Community mosque with modern facilities",
  "amenities": ["wheelchair", "parking", "ablution"]
}
```

### Indexes

```sql
CREATE INDEX idx_submissions_status ON submissions (status)
CREATE INDEX idx_submissions_submitted_by ON submissions (submitted_by)
CREATE INDEX idx_submissions_submitted_at ON submissions (submitted_at)
```

### Workflow

1. User submits new mosque or edit → `status: pending`
2. Admin reviews submission
3. Admin approves → `status: approved`, data applied to mosque
4. Admin rejects → `status: rejected`, `rejection_reason` provided

---

## 7. Audit Logs Collection

**Collection ID**: `pbc_681515208`  
**Type**: Base  
**Purpose**: Immutable audit trail for administrative actions

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | text | ✓ | 15-character auto-generated ID (primary key) |
| `actor_id` | relation | ✓ | User who performed the action |
| `action` | text | ✓ | Action identifier (e.g., `mosque.updated`) |
| `entity_type` | text | ✓ | Type of entity affected |
| `entity_id` | text | ✓ | ID of affected entity |
| `before` | json | - | Entity state before action |
| `after` | json | - | Entity state after action |
| `timestamp` | date | ✓ | When action occurred |
| `ip_address` | text | - | IP address of actor |
| `user_agent` | text | - | Browser/client user agent |

### Action Types

```
mosque.created
mosque.updated
mosque.deleted
mosque.approved
mosque.rejected
submission.approved
submission.rejected
user.role_changed
amenity.created
activity.created
activity.cancelled
```

### Indexes

```sql
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id)
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id)
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp)
```

### Example Log Entry

```json
{
  "actor_id": "abc123def456789",
  "action": "mosque.approved",
  "entity_type": "mosques",
  "entity_id": "xyz789ghi012345",
  "before": {
    "status": "pending"
  },
  "after": {
    "status": "approved"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0..."
}
```

---

## Relationships

### Entity Relationship Diagram

```
users (auth)
  ├─→ mosques.created_by
  ├─→ activities.created_by
  ├─→ submissions.submitted_by
  ├─→ submissions.reviewed_by
  └─→ audit_logs.actor_id

mosques
  ├─→ mosque_amenities.mosque_id
  ├─→ activities.mosque_id
  └─→ submissions.mosque_id

amenities
  └─→ mosque_amenities.amenity_id
```

### Cascade Behavior

- **Users**: No cascade delete (preserve data integrity)
- **Mosques**: No cascade delete on `mosque_amenities` or `activities`
- **Amenities**: No cascade delete on `mosque_amenities`

---

## Data Validation

### Client-Side (Zod Schemas)

Located in `src/lib/validation.ts`:

```typescript
// Example: Mosque validation
const mosqueSchema = z.object({
  name: z.string().min(3).max(255),
  address: z.string().min(10),
  state: z.enum([...states]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  // ...
});
```

### Server-Side (PocketBase)

- Field-level validation (min/max, patterns, required)
- Unique constraints (indexes)
- Type validation and constraints

---

## Performance Considerations

### Indexing Strategy

1. **Primary Keys**: All collections use 15-char auto-generated IDs
2. **Foreign Keys**: Indexed for efficient joins
3. **Query Fields**: Common filter fields (status, state, timestamp) are indexed
4. **Geospatial**: Composite index on `(lat, lng)` for proximity queries

### Query Optimization

```javascript
// Efficient mosque search with filters
pb.collection('mosques').getList(1, 20, {
  filter: 'status = "approved" && state = "Selangor"',
  sort: '-created',
  expand: 'created_by,mosque_amenities_via_mosque_id.amenity_id'
});
```

### Caching

- Frontend uses TanStack Query for automatic caching
- PocketBase provides ETag support for HTTP caching
- Real-time subscriptions reduce polling overhead

---

## Security

### Authentication

- JWT-based authentication with 7-day expiry
- OAuth2 integration (Google)
- Email verification required for sensitive operations
- Password reset with time-limited tokens

### Authorization

- Role-based access control (user, admin)
- Collection-level permissions
- Field-level visibility controls
- Owner-based permissions

### Data Protection

- Passwords hashed with bcrypt
- Token keys for session management
- File uploads restricted by MIME type
- SQL injection prevention (parameterized queries)

---

## Backup and Recovery

### PocketBase Backup

```bash
# Backup database
cp pb_data/data.db pb_data/data.db.backup

# Backup files
tar -czf pb_files_backup.tar.gz pb_data/storage
```

### Migration Strategy

1. Export collections via PocketBase admin UI
2. Version control schema changes
3. Test migrations on staging environment
4. Apply migrations during maintenance window

---

## API Examples

### Authentication

```javascript
// Register new user
await pb.collection('users').create({
  email: 'user@example.com',
  password: 'securepassword',
  passwordConfirm: 'securepassword',
  name: 'John Doe'
});

// Login
await pb.collection('users').authWithPassword(
  'user@example.com',
  'securepassword'
);

// OAuth login
await pb.collection('users').authWithOAuth2({ provider: 'google' });
```

### CRUD Operations

```javascript
// Create mosque
const mosque = await pb.collection('mosques').create({
  name: 'Masjid Al-Falah',
  address: '123 Jalan Masjid',
  state: 'Selangor',
  lat: 3.1390,
  lng: 101.6869,
  status: 'pending',
  created_by: pb.authStore.model.id
});

// List mosques with filters
const mosques = await pb.collection('mosques').getList(1, 20, {
  filter: 'status = "approved" && state = "Selangor"',
  sort: '-created'
});

// Update mosque
await pb.collection('mosques').update(mosque.id, {
  status: 'approved'
});

// Delete mosque
await pb.collection('mosques').delete(mosque.id);
```

### Real-time Subscriptions

```javascript
// Subscribe to mosque changes
pb.collection('mosques').subscribe('*', (e) => {
  console.log(e.action); // create, update, delete
  console.log(e.record);
});

// Subscribe to specific record
pb.collection('mosques').subscribe(mosqueId, (e) => {
  console.log('Mosque updated:', e.record);
});
```

---

## Troubleshooting

### Common Issues

1. **"Failed to create record"**
   - Verify required fields
   - Ensure user is authenticated
   - Check field validation constraints

2. **"Relation not found"**
   - Verify related record exists
   - Check cascade delete settings

3. **"Unique constraint violation"**
   - Check for duplicate keys (email, amenity key)
   - Verify unique indexes

### Debug Tools

```javascript
// Enable debug mode
pb.autoCancellation(false);

// Log all requests
pb.beforeSend = (url, options) => {
  console.log('Request:', url, options);
  return { url, options };
};

// Log all responses
pb.afterSend = (response, data) => {
  console.log('Response:', response, data);
  return data;
};
```

---

## Schema Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial schema |
| 1.1.0 | 2024-02-01 | Added `image` field to submissions |
| 1.2.0 | 2024-02-15 | Added `role` field to users |
| 1.3.0 | 2024-03-01 | Added audit logs collection |

---

## References

- [PocketBase Documentation](https://pocketbase.io/docs/)
- [PocketBase API Rules](https://pocketbase.io/docs/api-rules-and-filters/)
- [PocketBase Collections](https://pocketbase.io/docs/collections/)
- [Project README](./README.md)

