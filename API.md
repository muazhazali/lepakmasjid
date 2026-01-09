# API Reference

This document provides comprehensive documentation for the Lepak Masjid API, built with React Query hooks and PocketBase as the backend.

## Table of Contents

- [Custom Hooks](#custom-hooks)
  - [useMosques](#usemosques)
  - [useMosquesAll](#usemosquesall)
  - [useMosque](#usemosque)
  - [useMosquesAdmin](#usemosquesadmin)
  - [useUpdateMosque](#useupdatemosque)
  - [useSubmissions](#usesubmissions)
  - [useMySubmissions](#usemysubmissions)
  - [useSubmission](#usesubmission)
  - [useCreateSubmission](#usecreatesubmission)
  - [useApproveSubmission](#useapprovesubmission)
  - [useRejectSubmission](#userejectsubmission)
  - [useAmenities](#useamenities)
  - [useActivities](#useactivities)
  - [useUsers](#useusers)
  - [useAudit](#useaudit)
  - [usePocketBase](#usepocketbase)
- [API Service Functions](#api-service-functions)
  - [mosquesApi](#mosquesapi)
  - [submissionsApi](#submissionsapi)
  - [amenitiesApi](#amenitiesapi)
  - [mosqueAmenitiesApi](#mosqueamenitiesapi)
  - [activitiesApi](#activitiesapi)
  - [usersApi](#usersapi)
  - [auditApi](#auditapi)
- [PocketBase Collection Access Patterns](#pocketbase-collection-access-patterns)
  - [Authentication](#authentication)
  - [Filtering](#filtering)
  - [Expansion](#expansion)
  - [Sorting](#sorting)
  - [Pagination](#pagination)
- [Filter Syntax Examples](#filter-syntax-examples)
- [Expand/Relation Examples](#expandrelation-examples)
- [Error Handling Patterns](#error-handling-patterns)

## Custom Hooks

All custom hooks use React Query for caching, background refetching, and optimistic updates. They follow consistent patterns for query keys, error handling, and cache invalidation.

### useMosques

Fetches paginated list of mosques with optional filtering.

```typescript
import { useMosques } from '@/hooks/use-mosques';

function MosqueList() {
  const {
    data,
    isLoading,
    error,
    isFetching,
    hasNextPage,
    fetchNextPage
  } = useMosques({
    state: 'Selangor',
    amenities: ['parking', 'wudhu'],
    sortBy: 'nearest',
    userLocation: { lat: 3.1390, lng: 101.6869 },
    page: 1,
    perPage: 12
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.items.map(mosque => (
        <div key={mosque.id}>{mosque.name}</div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `filters?: MosqueFilters` - Optional filtering options

**Returns:**
- `PaginatedResponse<Mosque>` - Paginated mosque data
- React Query properties (isLoading, error, etc.)

**Stale time:** 5 minutes

### useMosquesAll

Fetches all mosques without pagination (used for map views).

```typescript
import { useMosquesAll } from '@/hooks/use-mosques';

function MosqueMap() {
  const { data: mosques, isLoading } = useMosquesAll({
    state: 'Selangor',
    search: 'masjid jamek'
  });

  if (isLoading) return <div>Loading map...</div>;

  return (
    <Map markers={mosques?.map(m => ({
      lat: m.lat,
      lng: m.lng,
      name: m.name
    }))} />
  );
}
```

**Parameters:**
- `filters?: Omit<MosqueFilters, 'page' | 'perPage'>` - Filtering without pagination

**Returns:**
- `Mosque[]` - Array of mosques

**Stale time:** 5 minutes

### useMosque

Fetches single mosque with full details (amenities, activities).

```typescript
import { useMosque } from '@/hooks/use-mosques';

function MosqueDetail({ mosqueId }: { mosqueId: string }) {
  const { data: mosque, isLoading } = useMosque(mosqueId);

  if (isLoading) return <div>Loading...</div>;
  if (!mosque) return <div>Mosque not found</div>;

  return (
    <div>
      <h1>{mosque.name}</h1>
      <p>{mosque.description}</p>

      {/* Amenities */}
      {mosque.amenities?.map(amenity => (
        <div key={amenity.id}>
          {amenity.label_en}: {amenity.details.notes}
        </div>
      ))}

      {/* Activities */}
      {mosque.activities?.map(activity => (
        <div key={activity.id}>
          {activity.title} - {activity.schedule_json.type}
        </div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `id: string | null` - Mosque ID

**Returns:**
- `MosqueWithDetails | undefined` - Mosque with expanded relations

**Stale time:** 5 minutes

### useMosquesAdmin

Fetches all mosques for admin view (including pending/rejected).

```typescript
import { useMosquesAdmin } from '@/hooks/use-mosques';

function AdminMosqueList() {
  const { data: mosques, isLoading } = useMosquesAdmin();

  return (
    <div>
      {mosques?.map(mosque => (
        <div key={mosque.id}>
          {mosque.name} - {mosque.status}
        </div>
      ))}
    </div>
  );
}
```

**Returns:**
- `Mosque[]` - All mosques (admin view)

**Stale time:** 5 minutes

### useUpdateMosque

Updates mosque data with optional image upload.

```typescript
import { useUpdateMosque } from '@/hooks/use-mosques';

function EditMosqueForm({ mosqueId }: { mosqueId: string }) {
  const updateMosque = useUpdateMosque();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (data: Partial<Mosque>) => {
    try {
      await updateMosque.mutateAsync({
        id: mosqueId,
        data,
        imageFile: imageFile || undefined,
        deleteImage: false
      });
      // Success - form will close automatically
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
      <button type="submit" disabled={updateMosque.isPending}>
        {updateMosque.isPending ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
}
```

**Mutation parameters:**
```typescript
{
  id: string;
  data: Partial<Mosque>;
  imageFile?: File;
  deleteImage?: boolean;
}
```

### useSubmissions

Fetches submissions for admin review.

```typescript
import { useSubmissions } from '@/hooks/use-submissions';

function SubmissionsPanel() {
  const { data: submissions, isLoading } = useSubmissions('pending');

  return (
    <div>
      {submissions?.map(submission => (
        <div key={submission.id}>
          <h3>{submission.data.name}</h3>
          <p>Status: {submission.status}</p>
          <p>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `status?: "pending" | "approved" | "rejected"` - Filter by status

**Returns:**
- `Submission[]` - Array of submissions

**Stale time:** 1 minute

### useMySubmissions

Fetches current user's submissions.

```typescript
import { useMySubmissions } from '@/hooks/use-submissions';

function UserSubmissions() {
  const { data: submissions } = useMySubmissions();

  return (
    <div>
      <h2>My Submissions</h2>
      {submissions?.map(submission => (
        <div key={submission.id}>
          <p>{submission.data.name}</p>
          <span>Status: {submission.status}</span>
        </div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `status?: "pending" | "approved" | "rejected"` - Filter by status

**Returns:**
- `Submission[]` - Current user's submissions

**Stale time:** 1 minute

### useSubmission

Fetches single submission details.

```typescript
import { useSubmission } from '@/hooks/use-submissions';

function SubmissionDetail({ id }: { id: string }) {
  const { data: submission } = useSubmission(id);

  return (
    <div>
      <h1>Submission Review</h1>
      <pre>{JSON.stringify(submission?.data, null, 2)}</pre>
    </div>
  );
}
```

**Parameters:**
- `id: string | null` - Submission ID

**Returns:**
- `Submission | undefined` - Submission details

**Stale time:** 1 minute

### useCreateSubmission

Creates new mosque submission.

```typescript
import { useCreateSubmission } from '@/hooks/use-submissions';

function SubmitMosqueForm() {
  const createSubmission = useCreateSubmission();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (mosqueData: Partial<Mosque>) => {
    try {
      await createSubmission.mutateAsync({
        type: 'new_mosque',
        data: mosqueData,
        imageFile
      });
      // Success handling
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Mosque form fields */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
    </form>
  );
}
```

**Mutation parameters:**
```typescript
{
  type: "new_mosque" | "edit_mosque";
  data: Record<string, unknown>; // Mosque data
  imageFile?: File;
}
```

### useApproveSubmission

Approves submission and creates/updates mosque.

```typescript
import { useApproveSubmission } from '@/hooks/use-submissions';

function SubmissionActions({ submissionId }: { submissionId: string }) {
  const approve = useApproveSubmission();

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({
        id: submissionId,
        reviewedBy: currentUser.id
      });
      // Success - redirects or refreshes
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  return (
    <button
      onClick={handleApprove}
      disabled={approve.isPending}
    >
      {approve.isPending ? 'Approving...' : 'Approve'}
    </button>
  );
}
```

**Mutation parameters:**
```typescript
{
  id: string;
  reviewedBy: string;
}
```

### useRejectSubmission

Rejects submission with reason.

```typescript
import { useRejectSubmission } from '@/hooks/use-submissions';

function RejectSubmission({ submissionId }: { submissionId: string }) {
  const reject = useRejectSubmission();
  const [reason, setReason] = useState('');

  const handleReject = async () => {
    await reject.mutateAsync({
      id: submissionId,
      reviewedBy: currentUser.id,
      reason
    });
  };

  return (
    <div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rejection"
      />
      <button onClick={handleReject} disabled={reject.isPending}>
        Reject Submission
      </button>
    </div>
  );
}
```

**Mutation parameters:**
```typescript
{
  id: string;
  reviewedBy: string;
  reason: string;
}
```

### useAmenities

Fetches all available amenities.

```typescript
import { useAmenities } from '@/hooks/use-amenities';

function AmenitySelector() {
  const { data: amenities } = useAmenities();

  return (
    <div>
      {amenities?.map(amenity => (
        <label key={amenity.id}>
          <input type="checkbox" value={amenity.key} />
          {amenity.label_en}
        </label>
      ))}
    </div>
  );
}
```

**Returns:**
- `Amenity[]` - All amenities

**Stale time:** 10 minutes

### useActivities

Fetches activities (used internally by mosque hooks).

```typescript
import { useActivities } from '@/hooks/use-activities';

// Usually used internally, but can be used directly
const { data: activities } = useActivities();
```

**Returns:**
- `Activity[]` - All activities

### useUsers

Fetches user data and handles user operations.

```typescript
import { useUsers } from '@/hooks/use-users';

// Get all users (admin)
const { data: users } = useUsers();

// Get current user profile
const { data: profile } = useUsers('current');

// Update user profile
const updateUser = useUpdateUser();
```

**Hooks available:**
- `useUsers(userId?: string)` - Fetch users
- `useUpdateUser()` - Update user profile
- `useDeleteUser()` - Delete user (admin)

### useAudit

Fetches audit log entries.

```typescript
import { useAudit } from '@/hooks/use-audit';

function AuditLogViewer() {
  const { data: auditLogs, isLoading } = useAudit({
    page: 1,
    perPage: 50,
    entityType: 'mosque',
    action: 'update'
  });

  return (
    <div>
      {auditLogs?.items.map(log => (
        <div key={log.id}>
          <p>{log.action} {log.entity_type} by {log.actor_id}</p>
          <small>{new Date(log.timestamp).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
```

**Parameters:**
```typescript
{
  page?: number;
  perPage?: number;
  entityType?: 'mosque' | 'submission' | 'user';
  action?: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  entityId?: string;
  actorId?: string;
}
```

### usePocketBase

Provides access to PocketBase instance and auth state.

```typescript
import { usePocketBase } from '@/hooks/use-pocketbase';

function AuthStatus() {
  const { pb, isAuthenticated, user, isAdmin } = usePocketBase();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      {isAdmin && <p>You are an admin</p>}
    </div>
  );
}
```

**Returns:**
```typescript
{
  pb: PocketBase;           // PocketBase instance
  isAuthenticated: boolean; // Auth status
  user: User | null;       // Current user
  isAdmin: boolean;        // Admin status
  logout: () => void;      // Logout function
}
```

## API Service Functions

Direct API service functions that are used internally by hooks. These handle PocketBase operations, validation, and error handling.

### mosquesApi

Core mosque operations with filtering, pagination, and relation handling.

```typescript
import { mosquesApi } from '@/lib/api';

// List mosques with filters
const result = await mosquesApi.list({
  state: 'Selangor',
  amenities: ['parking', 'wudhu'],
  search: 'masjid jamek',
  sortBy: 'nearest',
  userLocation: { lat: 3.1390, lng: 101.6869 },
  page: 1,
  perPage: 12
});

// Get single mosque with details
const mosque = await mosquesApi.get('mosque_id_123');

// Create mosque
const newMosque = await mosquesApi.create({
  name: 'Masjid Example',
  address: '123 Main St',
  state: 'Selangor',
  lat: 3.1390,
  lng: 101.6869
}, imageFile);

// Update mosque
const updatedMosque = await mosquesApi.update('mosque_id', {
  name: 'Updated Name'
}, newImageFile, false);

// Delete mosque
await mosquesApi.delete('mosque_id');

// Admin: list all mosques
const allMosques = await mosquesApi.listAllAdmin();
```

**Methods:**
- `list(filters?: MosqueFilters): Promise<PaginatedResponse<Mosque>>`
- `listAll(filters?: Omit<MosqueFilters, 'page' | 'perPage'>): Promise<Mosque[]>`
- `get(id: string): Promise<MosqueWithDetails>`
- `create(data: Partial<Mosque>, imageFile?: File): Promise<Mosque>`
- `update(id: string, data: Partial<Mosque>, imageFile?: File, deleteImage?: boolean): Promise<Mosque>`
- `delete(id: string): Promise<boolean>`
- `listAllAdmin(): Promise<Mosque[]>`

### submissionsApi

Handles mosque submissions for approval workflow.

```typescript
import { submissionsApi } from '@/lib/api';

// List submissions (admin)
const pendingSubs = await submissionsApi.list('pending');

// List user's submissions
const mySubs = await submissionsApi.listMySubmissions();

// Get single submission
const submission = await submissionsApi.get('submission_id');

// Create submission
const newSubmission = await submissionsApi.create({
  type: 'new_mosque',
  data: {
    name: 'New Mosque',
    address: '123 Street',
    state: 'Selangor',
    lat: 3.1390,
    lng: 101.6869
  },
  imageFile: imageFile
});

// Approve submission
await submissionsApi.approve('submission_id', 'reviewer_id');

// Reject submission
await submissionsApi.reject('submission_id', 'reviewer_id', 'Reason for rejection');
```

**Methods:**
- `list(status?: string): Promise<Submission[]>`
- `listMySubmissions(status?: string): Promise<Submission[]>`
- `get(id: string): Promise<Submission>`
- `create(data: Partial<Submission> & { imageFile?: File }): Promise<Submission>`
- `update(id: string, data: Partial<Submission>): Promise<Submission>`
- `approve(id: string, reviewedBy: string): Promise<Submission>`
- `reject(id: string, reviewedBy: string, reason: string): Promise<Submission>`

### amenitiesApi

Manages amenity definitions and mosque-amenity relationships.

```typescript
import { amenitiesApi, mosqueAmenitiesApi } from '@/lib/api';

// List all amenities
const amenities = await amenitiesApi.list();

// Create custom amenity
const newAmenity = await amenitiesApi.createCustom({
  key: 'custom_parking',
  label_en: 'Custom Parking',
  label_bm: 'Parking Custom',
  icon: 'car'
});

// Get amenities for a mosque
const mosqueAmenities = await mosqueAmenitiesApi.getByMosque('mosque_id');

// Add amenity to mosque
const newMosqueAmenity = await mosqueAmenitiesApi.create({
  mosque_id: 'mosque_id',
  amenity_id: 'amenity_id',
  details: { notes: 'Underground parking' },
  verified: true
});

// Update amenity details
await mosqueAmenitiesApi.update('amenity_id', {
  details: { notes: 'Updated notes' },
  verified: true
});

// Replace all amenities for mosque
await mosqueAmenitiesApi.replaceAll('mosque_id', [
  { amenity_id: 'parking_id', verified: true },
  { amenity_id: 'wudhu_id', verified: false }
]);
```

### mosqueAmenitiesApi Methods:
- `getByMosque(mosqueId: string): Promise<MosqueAmenity[]>`
- `create(data: { mosque_id: string; amenity_id?: string | null; details?: MosqueAmenityDetails; verified?: boolean }): Promise<MosqueAmenity>`
- `update(id: string, data: { details?: MosqueAmenityDetails; verified?: boolean }): Promise<MosqueAmenity>`
- `delete(id: string): Promise<boolean>`
- `replaceAll(mosqueId: string, amenities: AmenityData[]): Promise<MosqueAmenity[]>`

### activitiesApi

Manages mosque activities and events.

```typescript
import { activitiesApi } from '@/lib/api';

// List activities
const activities = await activitiesApi.list();

// Get activities for mosque
const mosqueActivities = await activitiesApi.getByMosque('mosque_id');

// Create activity
const newActivity = await activitiesApi.create({
  mosque_id: 'mosque_id',
  title: 'Friday Prayer',
  description: 'Weekly Jumuah prayer',
  type: 'recurring',
  schedule_json: {
    recurrence: 'weekly',
    days_of_week: [5], // Friday
    start_date: '2024-01-01',
    time: '13:00'
  },
  status: 'active'
});

// Update activity
await activitiesApi.update('activity_id', {
  title: 'Updated Title'
});

// Delete activity
await activitiesApi.delete('activity_id');
```

### usersApi

User management operations.

```typescript
import { usersApi } from '@/lib/api';

// List users (admin)
const users = await usersApi.list();

// Get user profile
const user = await usersApi.get('user_id');

// Update user
const updatedUser = await usersApi.update('user_id', {
  name: 'New Name'
});

// Delete user (admin)
await usersApi.delete('user_id');

// Get current user
const currentUser = await usersApi.getCurrent();
```

### auditApi

Audit logging operations.

```typescript
import { auditApi } from '@/lib/api';

// List audit logs
const auditLogs = await auditApi.list({
  page: 1,
  perPage: 50,
  entityType: 'mosque',
  action: 'update'
});

// Get single audit entry
const auditEntry = await auditApi.get('audit_id');

// Create audit entry (usually done automatically)
const newAudit = await auditApi.create({
  actor_id: 'user_id',
  action: 'update',
  entity_type: 'mosque',
  entity_id: 'mosque_id',
  before: { name: 'Old Name' },
  after: { name: 'New Name' }
});
```

## PocketBase Collection Access Patterns

### Authentication

```typescript
import { pb } from '@/lib/pocketbase';

// Login
await pb.collection('users').authWithPassword(email, password);

// OAuth login (Google)
await pb.collection('users').authWithOAuth2({
  provider: 'google',
  scopes: ['email', 'profile']
});

// Check auth status
if (pb.authStore.isValid) {
  const user = pb.authStore.model;
}

// Logout
pb.authStore.clear();
```

### Filtering

PocketBase supports complex filter expressions:

```typescript
// Basic filters
const approvedMosques = await pb.collection('mosques').getList(1, 50, {
  filter: 'status = "approved"'
});

// Complex filters
const selangorMosques = await pb.collection('mosques').getList(1, 50, {
  filter: 'state = "Selangor" && status = "approved"'
});

// Search filters
const searchResults = await pb.collection('mosques').getList(1, 50, {
  filter: '(name ~ "jamek" || address ~ "jamek") && state = "Selangor"'
});

// Date filters
const recentSubmissions = await pb.collection('submissions').getList(1, 50, {
  filter: 'submitted_at > "2024-01-01 00:00:00"'
});

// ID filters
const userSubmissions = await pb.collection('submissions').getList(1, 50, {
  filter: 'submitted_by = "user_id_123"'
});
```

### Expansion

Fetch related data in single query:

```typescript
// Expand single relation
const mosqueWithAmenities = await pb.collection('mosques').getOne('mosque_id', {
  expand: 'created_by'
});

// Expand multiple relations
const mosqueWithDetails = await pb.collection('mosques').getOne('mosque_id', {
  expand: 'created_by,amenities.amenity_id'
});

// Expand in list queries
const mosquesWithDetails = await pb.collection('mosques').getList(1, 20, {
  expand: 'created_by'
});
```

### Sorting

```typescript
// Single field sort
const sortedByName = await pb.collection('mosques').getList(1, 50, {
  sort: 'name'
});

// Descending sort
const newestFirst = await pb.collection('mosques').getList(1, 50, {
  sort: '-created'
});

// Multiple field sort (newest first, then by name)
const sortedMosques = await pb.collection('mosques').getList(1, 50, {
  sort: '-created,name'
});
```

### Pagination

```typescript
// Basic pagination
const page1 = await pb.collection('mosques').getList(1, 20);
const page2 = await pb.collection('mosques').getList(2, 20);

// Handle pagination info
const result = await pb.collection('mosques').getList(1, 20);
console.log({
  currentPage: result.page,
  totalPages: result.totalPages,
  totalItems: result.totalItems,
  hasNextPage: result.page < result.totalPages
});
```

## Filter Syntax Examples

### Mosque Filters

```typescript
// State filter
filter: 'state = "Selangor"'

// Multiple states
filter: 'state = "Selangor" || state = "Kuala Lumpur"'

// Search in multiple fields
filter: '(name ~ "jamek" || address ~ "jamek")'

// Combined filters
filter: '(name ~ "jamek" || address ~ "jamek") && state = "Selangor" && status = "approved"'

// Date range
filter: 'created >= "2024-01-01" && created <= "2024-12-31"'

// User submissions
filter: 'submitted_by = "user_id_123"'
```

### Amenity Filters

```typescript
// Mosque amenities
filter: 'mosque_id = "mosque_id_123"'

// Verified amenities only
filter: 'mosque_id = "mosque_id_123" && verified = true'

// Custom amenities (no amenity_id)
filter: 'mosque_id = "mosque_id_123" && amenity_id = null'
```

### Activity Filters

```typescript
// Mosque activities
filter: 'mosque_id = "mosque_id_123"'

// Active activities
filter: 'mosque_id = "mosque_id_123" && status = "active"'

// Recurring activities
filter: 'mosque_id = "mosque_id_123" && type = "recurring"'
```

## Expand/Relation Examples

### Mosque Relations

```typescript
// Expand creator
expand: 'created_by'

// Expand amenities with their definitions
expand: 'amenities.amenity_id'

// Expand activities
expand: 'activities'

// Multiple expands
expand: 'created_by,amenities.amenity_id,activities'
```

### Submission Relations

```typescript
// Expand submitter and reviewer
expand: 'submitted_by,reviewed_by'

// Expand all relations
expand: 'submitted_by,reviewed_by'
```

### Audit Relations

```typescript
// Expand actor
expand: 'actor_id'
```

### Complex Expand Examples

```typescript
// Mosque with all relations
const mosque = await pb.collection('mosques').getOne('mosque_id', {
  expand: 'created_by,amenities.amenity_id,activities'
});

// Result structure
{
  id: 'mosque_id',
  name: 'Masjid Example',
  // ... other fields
  expand: {
    created_by: { id: 'user_id', name: 'John Doe' },
    amenities: [
      {
        id: 'amenity_link_id',
        verified: true,
        expand: {
          amenity_id: { id: 'parking_id', label_en: 'Parking' }
        }
      }
    ],
    activities: [
      {
        id: 'activity_id',
        title: 'Friday Prayer',
        // ... other activity fields
      }
    ]
  }
}
```

## Error Handling Patterns

### Sanitized Error Handling

All API functions use `sanitizeError()` for consistent error handling:

```typescript
import { sanitizeError } from '@/lib/error-handler';

try {
  const result = await someApiCall();
  return result;
} catch (error: unknown) {
  // Error is sanitized for client display
  throw sanitizeError(error);
}
```

### Production vs Development

```typescript
// Production: Generic error messages
throw new Error("An error occurred. Please try again.");

// Development: Detailed error messages
throw new Error("Failed to fetch mosques: Network error at /api/mosques");
```

### Common Error Types

```typescript
// Authentication errors
if (error.status === 401) {
  throw new Error("Please log in to continue.");
}

// Permission errors
if (error.status === 403) {
  throw new Error("You don't have permission to perform this action.");
}

// Not found errors
if (error.status === 404) {
  throw new Error("The requested item was not found.");
}

// Validation errors (safe to show)
if (error.status === 400 && error.message.includes("required")) {
  throw error; // Show validation messages
}

// Network errors
if (error.message.includes("fetch")) {
  throw new Error("Network error. Please check your connection.");
}
```

### Error Handling in Hooks

```typescript
function MyComponent() {
  const { data, error, isLoading } = useMosques();

  if (isLoading) return <div>Loading...</div>;

  if (error) {
    // Error is already sanitized by the API layer
    return <div className="error">Error: {error.message}</div>;
  }

  return <div>{/* Render data */}</div>;
}
```

### Validation Errors

```typescript
// Input validation (client-side)
if (!validateRecordId(mosqueId)) {
  throw new Error("Invalid mosque ID format");
}

if (!validateState(state)) {
  throw new Error("Invalid state selection");
}

// Image validation
const validationError = validateImageFile(imageFile);
if (validationError) {
  throw new Error(validationError);
}
```

### Rate Limiting

```typescript
// Rate limit errors are safe to show
if (error.message.includes("too many") || error.message.includes("rate limit")) {
  return <div>Please wait a moment before trying again.</div>;
}
```

This API reference covers all major functionality of the Lepak Masjid application. The patterns shown here ensure consistent data handling, error management, and user experience across the application.
