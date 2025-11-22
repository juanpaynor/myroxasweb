# Reports Feature - Web Team Documentation

## Overview
This document explains the Reports feature database structure and how to integrate it with your web admin dashboard using Supabase.

---

## What is the Reports Feature?

The Reports feature allows citizens to submit issues/complaints through the mobile app (e.g., road damage, tricycle fare complaints, health concerns). The web admin dashboard will be used to:
- View all submitted reports
- Update report status (Pending → In Progress → Resolved)
- Add comments/responses to reports
- Assign reports to staff members
- View analytics and statistics

---

## Supabase Connection Details

### Project Information
- **Supabase URL**: `https://<YOUR_PROJECT>.supabase.co`
- **Anon Key**: `<YOUR_SUPABASE_ANON_KEY>`

### Installation (JavaScript/TypeScript)
```bash
npm install @supabase/supabase-js
```

### Initialize Supabase Client
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Database Tables

### 1. `report_categories`
Stores all report categories (managed by admin).

**Columns:**
- `id` (UUID) - Unique identifier
- `name` (TEXT) - Category name (e.g., "Public Works Issues", "Tricycle Fare Complaint")
- `description` (TEXT) - Category description
- `icon` (TEXT) - Icon emoji (e.g., 🏗️, 🛺)
- `color` (TEXT) - Hex color code (e.g., #3B82F6)
- `is_active` (BOOLEAN) - Whether category is visible to users
- `display_order` (INTEGER) - Sort order for display
- `created_at`, `updated_at` (TIMESTAMP) - Timestamps

**Available Categories:**
1. Public Works Issues (🏗️)
2. Tricycle Fare Complaint (🛺)
3. Public Safety Concerns (🚨)
4. Environmental Issues (🌿)
5. Health Concerns (🏥)
6. Other Municipal Services (📋)

---

### 2. `reports`
Main table storing all user-submitted reports.

**Columns:**
- `id` (UUID) - Unique identifier
- `user_id` (UUID) - User who submitted the report (references `auth.users`)
- `category_id` (UUID) - Category of the report
- `title` (TEXT) - Report title/subject
- `description` (TEXT) - Detailed description
- `location_lat` (DECIMAL) - GPS latitude
- `location_lng` (DECIMAL) - GPS longitude
- `location_address` (TEXT) - Human-readable address
- `urgency` (TEXT) - Priority: `low`, `medium`, `high`
- `status` (TEXT) - Current status: `pending`, `in_progress`, `resolved`, `rejected`
- `assigned_to` (UUID) - Admin/staff assigned to this report
- `admin_notes` (TEXT) - Internal notes (not visible to users)
- `created_at`, `updated_at`, `resolved_at` (TIMESTAMP) - Timestamps

---

### 3. `report_attachments`
Photos/files uploaded with reports.

**Columns:**
- `id` (UUID) - Unique identifier
- `report_id` (UUID) - Parent report reference
- `file_url` (TEXT) - Supabase Storage URL
- `file_name` (TEXT) - Original filename
- `file_type` (TEXT) - MIME type (e.g., image/jpeg)
- `file_size` (INTEGER) - File size in bytes
- `uploaded_by` (UUID) - User who uploaded (user or admin)
- `created_at` (TIMESTAMP) - Upload timestamp

**Storage Bucket:** `report-attachments`

---

### 4. `report_comments`
Comments/updates on reports (from users or admins).

**Columns:**
- `id` (UUID) - Unique identifier
- `report_id` (UUID) - Parent report reference
- `user_id` (UUID) - Comment author
- `comment` (TEXT) - Comment text
- `is_admin` (BOOLEAN) - Whether posted by admin (for styling)
- `created_at`, `updated_at` (TIMESTAMP) - Timestamps

---

### 5. `report_status_history`
Audit trail of all status changes.

**Columns:**
- `id` (UUID) - Unique identifier
- `report_id` (UUID) - Parent report reference
- `old_status` (TEXT) - Previous status
- `new_status` (TEXT) - New status
- `changed_by` (UUID) - Admin who made the change
- `notes` (TEXT) - Optional change notes
- `created_at` (TIMESTAMP) - Change timestamp

---

## Common Queries for Web Dashboard

### 1. Fetch All Reports (with category info)
```javascript
const { data: reports, error } = await supabase
  .from('reports')
  .select(`
    *,
    category:report_categories(name, icon, color),
    user:auth.users(email),
    assigned_admin:auth.users(email)
  `)
  .order('created_at', { ascending: false })
```

### 2. Fetch Reports by Status
```javascript
const { data: pendingReports, error } = await supabase
  .from('reports')
  .select('*, category:report_categories(*)')
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
```

### 3. Fetch Reports by Category
```javascript
const { data: tricycleReports, error } = await supabase
  .from('reports')
  .select('*, category:report_categories(*)')
  .eq('category.name', 'Tricycle Fare Complaint')
```

### 4. Update Report Status
```javascript
const { data, error } = await supabase
  .from('reports')
  .update({ 
    status: 'in_progress',
    assigned_to: adminUserId 
  })
  .eq('id', reportId)
```

### 5. Add Admin Comment to Report
```javascript
const { data, error } = await supabase
  .from('report_comments')
  .insert({
    report_id: reportId,
    user_id: adminUserId,
    comment: 'We are working on this issue.',
    is_admin: true
  })
```

### 6. Fetch Report with All Details
```javascript
const { data: report, error } = await supabase
  .from('reports')
  .select(`
    *,
    category:report_categories(*),
    attachments:report_attachments(*),
    comments:report_comments(*, user:auth.users(email)),
    history:report_status_history(*, changed_by:auth.users(email))
  `)
  .eq('id', reportId)
  .single()
```

### 7. Get Report Statistics
```javascript
// Count by status
const { count: pendingCount } = await supabase
  .from('reports')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending')

// Count by category
const { data: categoryStats } = await supabase
  .from('reports')
  .select('category_id, category:report_categories(name)')
  .then(result => {
    // Group by category in JavaScript
    const stats = {}
    result.data.forEach(report => {
      const catName = report.category.name
      stats[catName] = (stats[catName] || 0) + 1
    })
    return stats
  })
```

### 8. Search Reports
```javascript
const { data: searchResults, error } = await supabase
  .from('reports')
  .select('*, category:report_categories(*)')
  .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
```

### 9. Filter Reports by Date Range
```javascript
const { data: recentReports, error } = await supabase
  .from('reports')
  .select('*, category:report_categories(*)')
  .gte('created_at', '2025-01-01')
  .lte('created_at', '2025-01-31')
```

### 10. Get Active Categories
```javascript
const { data: categories, error } = await supabase
  .from('report_categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order')
```

---

## Real-time Subscriptions

Listen for new reports in real-time:

```javascript
const reportsSubscription = supabase
  .channel('reports-channel')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'reports' 
    }, 
    (payload) => {
      console.log('New report received:', payload.new)
      // Update your UI with the new report
    }
  )
  .subscribe()

// Cleanup when component unmounts
reportsSubscription.unsubscribe()
```

Listen for status changes:

```javascript
const statusSubscription = supabase
  .channel('status-channel')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'reports' 
    }, 
    (payload) => {
      if (payload.old.status !== payload.new.status) {
        console.log('Status changed:', payload.new)
      }
    }
  )
  .subscribe()
```

---

## Storage: Viewing Report Attachments

Photos are stored in the `report-attachments` bucket.

### Get Public URL for Image
```javascript
const { data } = supabase.storage
  .from('report-attachments')
  .getPublicUrl('path/to/image.jpg')

// Use: data.publicUrl in <img src={data.publicUrl} />
```

### List All Attachments for a Report
```javascript
const { data: attachments, error } = await supabase
  .from('report_attachments')
  .select('*')
  .eq('report_id', reportId)
```

---

## Admin Dashboard Features to Implement

### 1. Reports Dashboard
- **View**: List all reports with filters (status, category, date)
- **Search**: By title, description, or location
- **Sort**: By date, urgency, status
- **Display**: Category icon/color badges, status badges

### 2. Report Details Page
- **Show**:
  - Report title, description, category
  - User information (email, phone if available)
  - Location (map view if possible)
  - Attached photos
  - Comments thread
  - Status history timeline
- **Actions**:
  - Change status
  - Assign to staff
  - Add admin response/comment
  - Upload response photos (e.g., fixed issue)
  - Add internal notes

### 3. Category Management
- **CRUD Operations**: Create, Read, Update, Delete categories
- **Fields**: Name, description, icon, color, active status
- **Reorder**: Change display order

### 4. Analytics/Reports
- **Metrics**:
  - Total reports by status
  - Reports by category
  - Average resolution time
  - Reports by location/area
  - Trending issues
- **Charts**: Bar charts, pie charts, line graphs

### 5. Notifications (Optional)
- Alert admins of new high-urgency reports
- Email notifications for status changes

---

## Authentication & Authorization

### Admin Login
Admins should log in using Supabase Auth:

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password123'
})
```

### Check if User is Admin
```javascript
const { data: { user } } = await supabase.auth.getUser()

// Check user metadata for admin role
if (user?.user_metadata?.role === 'admin') {
  // User is admin
}
```

### Setting Admin Role
Admins must be set up in Supabase:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
WHERE email = 'admin@example.com';
```

---

## Status Workflow

Reports follow this status flow:

```
pending → in_progress → resolved
                     ↘ rejected
```

- **pending**: Newly submitted, awaiting review
- **in_progress**: Admin is working on it
- **resolved**: Issue fixed/resolved
- **rejected**: Not valid or duplicate

---

## Urgency Levels

- **low**: Minor issues, not urgent
- **medium**: Standard priority (default)
- **high**: Critical issues requiring immediate attention

---

## Best Practices

1. **Always fetch related data** using Supabase joins to minimize queries
2. **Use real-time subscriptions** for live dashboard updates
3. **Implement pagination** for large report lists
4. **Cache category data** since it changes infrequently
5. **Show loading states** while fetching data
6. **Handle errors gracefully** and show user-friendly messages
7. **Validate status transitions** (e.g., can't go from resolved to pending)
8. **Log all admin actions** for audit trail

---

## Example: Complete Report Details Component (React)

```javascript
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function ReportDetails({ reportId }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchReport()
  }, [reportId])

  async function fetchReport() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        category:report_categories(*),
        attachments:report_attachments(*),
        comments:report_comments(*, user:auth.users(email))
      `)
      .eq('id', reportId)
      .single()

    if (error) {
      console.error('Error fetching report:', error)
    } else {
      setReport(data)
    }
    setLoading(false)
  }

  async function updateStatus(newStatus) {
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', reportId)

    if (!error) {
      fetchReport() // Refresh
    }
  }

  async function addComment() {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('report_comments')
      .insert({
        report_id: reportId,
        user_id: user.id,
        comment: newComment,
        is_admin: true
      })

    if (!error) {
      setNewComment('')
      fetchReport() // Refresh
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>{report.title}</h1>
      <span className="badge">{report.category.name}</span>
      <span className="badge">{report.status}</span>
      
      <p>{report.description}</p>
      
      <div className="attachments">
        {report.attachments.map(att => (
          <img key={att.id} src={att.file_url} alt="Report photo" />
        ))}
      </div>

      <div className="status-actions">
        <button onClick={() => updateStatus('in_progress')}>
          Mark In Progress
        </button>
        <button onClick={() => updateStatus('resolved')}>
          Mark Resolved
        </button>
      </div>

      <div className="comments">
        {report.comments.map(comment => (
          <div key={comment.id} className={comment.is_admin ? 'admin' : 'user'}>
            <strong>{comment.user.email}</strong>
            <p>{comment.comment}</p>
          </div>
        ))}
      </div>

      <div className="add-comment">
        <textarea 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a response..."
        />
        <button onClick={addComment}>Send Response</button>
      </div>
    </div>
  )
}

export default ReportDetails
```

---

## Support

If you have questions about the database schema or Supabase integration, contact the mobile development team.

**Database Schema Reference**: See `REPORTS_DATABASE_SCHEMA.md` for full SQL details.

---

## Quick Start Checklist

- [ ] Install `@supabase/supabase-js`
- [ ] Initialize Supabase client with provided credentials
- [ ] Test fetching reports list
- [ ] Test updating report status
- [ ] Test adding comments
- [ ] Implement real-time subscriptions
- [ ] Build admin authentication
- [ ] Create reports dashboard UI
- [ ] Create report details page
- [ ] Add filtering and search
- [ ] Implement category management
- [ ] Add analytics/statistics

---

**Last Updated**: November 19, 2025
