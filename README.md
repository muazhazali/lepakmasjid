# LepakMasjid.app

A community-maintained, searchable directory of mosques in Malaysia focused on facilities, activities, and events. Optimized for mobile and elderly users.

## Features

- 🕌 **Mosque Directory**: Searchable directory with GPS coordinates and detailed information
- 🔍 **Advanced Search**: Search by name, location, state, and amenities with filtering capabilities
- 🗺️ **Interactive Map**: Map view with marker clustering using Leaflet.js and OpenStreetMap
- 📱 **Mobile-First**: Responsive design optimized for mobile devices
- ♿ **Accessibility**: Large fonts, high contrast, adjustable font size, skip links, and ARIA labels
- 🌐 **Bilingual**: Full Bahasa Melayu and English support with language toggle
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 👥 **Community-Driven**: Users can submit new mosques and suggest edits to existing mosque information
- 🔐 **Admin Panel**: Comprehensive moderation workflow for submissions and edits with audit logging
- 📊 **Activities & Events**: Track one-off, recurring, and fixed activities at mosques
- 🏢 **Amenities Management**: Standardized amenities catalog with custom amenities support
- 🔒 **User Authentication**: Email/password and Google OAuth authentication
- 📝 **Submission Workflow**: Structured submission system with approval/rejection workflow
- 📈 **Analytics Dashboard**: Admin dashboard with statistics and insights

## Tech Stack

### Frontend
- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 7.3+
- **Routing**: React Router DOM 6.30+
- **UI Components**: shadcn-ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4+ with Tailwind Typography
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **State Management**: Zustand 4.5+
- **Data Fetching**: TanStack Query (React Query) 5.83+
- **Maps**: Leaflet.js 1.9+ with React Leaflet 4.2+
- **Charts**: Recharts 2.15+ (for admin dashboard)
- **Notifications**: Sonner (toast notifications)
- **SEO**: React Helmet Async

### Backend
- **Backend**: PocketBase 0.21+
- **Authentication**: PocketBase Auth with Google OAuth2 support
- **Database**: SQLite (via PocketBase)

### Development Tools
- **Package Manager**: pnpm 8+
- **Linting**: ESLint 9.32+ with TypeScript ESLint
- **Type Checking**: TypeScript 5.8+
- **Code Quality**: Lovable Tagger (development mode)

## Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8+ ([Install pnpm](https://pnpm.io/installation))
- **Git**: For version control

## Local Development Setup

### 1. Clone the repository

```powershell
git clone <YOUR_GIT_URL>
cd lepakmasjid_v2
```

### 2. Install dependencies

```powershell
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
VITE_POCKETBASE_URL=https://pb.muazhazali.me
VITE_APP_URL=http://localhost:8080
```

The app connects to PocketBase at `pb.muazhazali.me` by default. You can override this with the `VITE_POCKETBASE_URL` environment variable.

### 4. Start the development server

```powershell
pnpm dev
```

The app will be available at `http://localhost:8080`

### 5. Build for production

```powershell
pnpm build
```

The production build will be output to the `dist` directory.

### 6. Preview production build

```powershell
pnpm preview
```

This serves the production build locally for testing.

## Project Structure

```
lepakmasjid_v2/
├── public/                 # Static assets
│   ├── _headers           # Cloudflare Pages headers
│   ├── _redirects         # Client-side routing redirects
│   └── ...
├── scripts/               # Node.js setup and utility scripts
│   ├── create-collections.js
│   ├── seed-data.js
│   ├── test-connection.js
│   └── ...
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn-ui components (buttons, cards, etc.)
│   │   ├── Admin/        # Admin panel components
│   │   ├── Auth/         # Authentication components
│   │   │   ├── AuthDialog.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   ├── GoogleAuthButton.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── Map/          # Map-related components
│   │   │   ├── MapView.tsx
│   │   │   ├── MosqueMap.tsx
│   │   │   └── MosqueMarker.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturedMosques.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── MosqueCard.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── use-mosques.ts
│   │   ├── use-submissions.ts
│   │   ├── use-users.ts
│   │   ├── use-activities.ts
│   │   ├── use-amenities.ts
│   │   ├── use-audit.ts
│   │   ├── use-pocketbase.ts
│   │   ├── use-translation.ts
│   │   └── ...
│   ├── lib/              # Utilities and services
│   │   ├── api/         # API service functions
│   │   │   ├── mosques.ts
│   │   │   ├── submissions.ts
│   │   │   ├── users.ts
│   │   │   ├── activities.ts
│   │   │   ├── amenities.ts
│   │   │   └── audit.ts
│   │   ├── pocketbase.ts      # PocketBase client singleton
│   │   ├── audit-logger.ts   # Audit logging utility
│   │   ├── error-handler.ts  # Error handling utilities
│   │   ├── validation.ts     # Zod validation schemas
│   │   ├── i18n/             # Internationalization
│   │   │   └── translations.ts
│   │   └── utils.ts          # General utilities
│   ├── pages/            # Page components
│   │   ├── Index.tsx     # Homepage
│   │   ├── Explore.tsx  # Mosque exploration page
│   │   ├── MosqueDetail.tsx
│   │   ├── Submit.tsx    # Submission form
│   │   ├── Profile.tsx   # User profile
│   │   ├── About.tsx
│   │   ├── PrivacyPolicy.tsx
│   │   ├── TermsOfUse.tsx
│   │   ├── ContentPolicy.tsx
│   │   ├── AuthCallback.tsx  # OAuth callback handler
│   │   ├── NotFound.tsx
│   │   └── Admin/        # Admin panel pages
│   │       ├── Dashboard.tsx
│   │       ├── Submissions.tsx
│   │       ├── Mosques.tsx
│   │       ├── Users.tsx
│   │       └── AuditLog.tsx
│   ├── stores/           # Zustand state stores
│   │   ├── auth.ts       # Authentication state
│   │   ├── language.ts   # Language preference
│   │   ├── fontSize.ts   # Font size preference
│   │   └── theme.ts      # Theme preference
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Core types (Mosque, User, Activity, etc.)
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # Application entry point
├── .docs/                # Documentation
│   ├── POCKETBASE_SETUP.md
│   ├── CLOUDFLARE_DEPLOYMENT.md
│   └── ...
├── components.json       # shadcn-ui configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Data Structure

The application uses PocketBase as the backend with the following collection structure:

### 1. Users (`users`)
**Type**: Auth (built-in authentication collection)  
**Purpose**: Stores authenticated users with optional roles (user or admin).

**Key Fields**:
- `id` (15-char auto-generated text, primary key)
- `email`, `password`, `verified`, `name`, `avatar`
- `role` (optional: `user` or `admin`)
- `tokenKey` for session/auth management

**Rules**:
- Users can only view/edit/delete their own records unless they are admins

**Auth Features**:
- Email/password login enabled
- OAuth2 mapping for name and avatar
- Email verification, password reset, and email change workflows configured
- Login alerts for new locations

### 2. Mosques (`mosques`)
**Type**: Base  
**Purpose**: Stores information about mosques.

**Key Fields**:
- `name`, `name_bm` (Malay), `address`, `state`
- `lat`, `lng` (geolocation)
- `description` (English & Malay)
- `status`: `pending` | `approved` | `rejected`
- `created_by` (relation to user)
- `image` (file upload)

**Rules**:
- Publicly visible only if `status = "approved"`
- Authenticated users can create/update/delete (including unapproved entries)

**Indexes**: Optimized for state, status, and geolocation queries

### 3. Amenities (`amenities`)
**Type**: Base  
**Purpose**: Catalog of standardized amenities (e.g., wheelchair access, parking).

**Key Fields**:
- `key` (unique string identifier, e.g., `wheelchair`)
- `label_en`, `label_bm` (display names)
- `icon` (optional icon name or URL)
- `order` (for UI sorting)

**Constraints**:
- `key` must be unique

**Usage**: Referenced by `mosque_amenities` to associate amenities with mosques

### 4. Mosque Amenities (`mosque_amenities`)
**Type**: Base (join table)  
**Purpose**: Links mosques to amenities with optional verification and details.

**Key Fields**:
- `mosque_id` → `mosques`
- `amenity_id` → `amenities`
- `details` (JSON for extra info, e.g., capacity, notes)
- `verified` (boolean)

**Indexes**: Optimized for lookups by mosque or amenity

### 5. Activities (`activities`)
**Type**: Base  
**Purpose**: Represents scheduled events or programs at mosques.

**Key Fields**:
- `title` / `title_bm`, `description` / `description_bm`
- `type`: `one_off` | `recurring` | `fixed`
- `schedule_json` (structured JSON for timing rules)
- `start_date`, `end_date` (optional)
- `status`: `active` | `cancelled`
- `mosque_id` → `mosques`
- `created_by` → `users`

**Rules**:
- Authenticated users can create
- Only the creator can update/delete

**Indexes**: By mosque and status

### 6. Submissions (`submissions`)
**Type**: Base  
**Purpose**: Tracks user-submitted changes (e.g., new mosque or edits).

**Key Fields**:
- `type`: `new_mosque` | `edit_mosque`
- `mosque_id` (only set for edits)
- `data` (JSON payload of proposed changes)
- `status`: `pending` | `approved` | `rejected`
- `submitted_by`, `reviewed_by` (user relations)
- `submitted_at`, `reviewed_at`
- `rejection_reason`, `image` (supporting media)

**Workflow**:
- Users submit → admins review → approve/reject

**Indexes**: For status, submitter, and timestamp

### 7. Audit Logs (`audit_logs`)
**Type**: Base  
**Purpose**: Immutable log of administrative or sensitive actions.

**Access**: Only visible to admins

**Key Fields**:
- `actor_id` → user who performed action
- `action` (e.g., `"mosque.updated"`)
- `entity_type`, `entity_id` (what was changed)
- `before` / `after` (JSON snapshots of data)
- `timestamp`, `ip_address`, `user_agent`

**Indexes**: Optimized for actor, entity, and time-based queries

### Summary of Relationships

- **Users** create mosques, activities, and submissions
- **Mosques** have many amenities (via `mosque_amenities`)
- **Submissions** propose changes to mosques
- **Audit logs** track changes to any entity by authorized users

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_POCKETBASE_URL` | PocketBase instance URL | `https://pb.muazhazali.me` |
| `VITE_APP_URL` | Application URL (for OAuth redirects) | `http://localhost:8080` |

## Available Scripts

### Development
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

### PocketBase Setup
- `pnpm test:connection` - Test connection to PocketBase
- `pnpm setup:collections` - Create all required PocketBase collections
- `pnpm test:schema` - Verify PocketBase collections match PRD schema
- `pnpm test:submission` - Test submission workflow end-to-end
- `pnpm seed:data` - Seed database with sample mosque data (10 mosques)

### Maintenance
- `pnpm setup:role-field` - Add role field to users collection
- `pnpm setup:admin` - Set admin role for a user
- `pnpm fix:permissions` - Fix collection permissions
- `pnpm fix:audit-logs` - Fix audit logs permissions
- `pnpm add:image-field` - Add image field to submissions collection

## PocketBase Setup

The application connects to a deployed PocketBase instance at `pb.muazhazali.me`.

### Quick Setup

1. **Test Connection**: Verify you can connect to PocketBase
   ```powershell
   pnpm run test:connection
   ```

2. **Create Collections**: Set up all required collections in PocketBase
   ```powershell
   pnpm run setup:collections
   ```
   This will prompt for your PocketBase admin credentials and create all collections automatically.

3. **Verify Schema**: Check that collections match the PRD schema
   ```powershell
   pnpm run test:schema
   ```

4. **Configure Google OAuth**: Follow the guide in `.docs/GOOGLE_OAUTH_SETUP.md`

5. **Test Submission Workflow**: Test the end-to-end submission process
   ```powershell
   pnpm run test:submission
   ```

6. **Seed Sample Data**: Populate the database with sample mosque data
   ```powershell
   pnpm run seed:data
   ```
   This will create 10 sample mosques from different Malaysian states with amenities and descriptions.

For detailed setup instructions, see:
- [PocketBase Setup Guide](./.docs/POCKETBASE_SETUP.md) - Detailed PocketBase configuration
- [Cloudflare Deployment Guide](./.docs/CLOUDFLARE_DEPLOYMENT.md) - Step-by-step guide to deploy to Cloudflare Pages

## Deployment

### Cloudflare Pages Deployment

This application is designed to be deployed on Cloudflare Pages, a JAMstack platform that provides free hosting with global CDN, automatic deployments, and custom domain support.

#### Quick Start

1. **Push code to Git** (GitHub/GitLab/Bitbucket)

2. **Connect to Cloudflare Pages** via dashboard
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**

3. **Configure Build Settings**:
   - **Build command**: `pnpm build` (or `npm run build`)
   - **Root directory**: `/` (or empty) ⚠️ **NOT `dist`!**
   - **Build output directory**: `dist`
   - **Framework preset**: `Vite` (or `None`)

4. **Add Environment Variables**:
   - `VITE_POCKETBASE_URL=https://pb.muazhazali.me`
   - `VITE_APP_URL=https://your-site.pages.dev` (update after deployment)

5. **Deploy!** (automatic on git push)

#### Important Configuration Notes

- **Root directory** = Where your source code is located (use `/` or leave empty)
- **Build output directory** = Where Vite outputs built files (use `dist`)
- **Deploy command** = Leave empty! Cloudflare automatically deploys from `dist`
- The `public/_redirects` file is already configured for client-side routing

#### Post-Deployment Steps

1. **Update PocketBase CORS**: Add your Cloudflare Pages domain to allowed origins in PocketBase Admin UI → Settings → API

2. **Update Google OAuth**: Add your domain's callback URL to Google Cloud Console OAuth settings

3. **Set Custom Domain** (optional): Configure in Cloudflare Pages → Settings → Custom domains

4. **Update Environment Variables**: After setting up custom domain, update `VITE_APP_URL` to your final domain

For detailed deployment instructions, see:
- [Cloudflare Deployment Guide](./.docs/CLOUDFLARE_DEPLOYMENT.md) - Complete step-by-step guide with troubleshooting

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
   ```powershell
   git clone <YOUR_FORK_URL>
   cd lepakmasjid_v2
   ```

2. **Create a feature branch**
   ```powershell
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Commit your changes**
   ```powershell
   git commit -m 'Add some amazing feature'
   ```
   Use clear, descriptive commit messages.

5. **Push to the branch**
   ```powershell
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Ensure all checks pass

### Development Guidelines

- **Code Style**: Follow the existing TypeScript/React patterns
- **Components**: Use shadcn-ui components when possible
- **State Management**: Use Zustand for global state, React Query for server state
- **Accessibility**: Ensure all components are accessible (ARIA labels, keyboard navigation)
- **Internationalization**: All user-facing text should support both English and Bahasa Melayu
- **Testing**: Test your changes locally before submitting PRs

## License

This project is licensed under the **AGPL v3** (GNU Affero General Public License v3.0).

See the [LICENSE](./LICENSE) file for details.

## Acknowledgements

This project is inspired by:

- **[sedekah.je](https://sedekah.je)** by [khairin chan](https://github.com/khairinchan) - Inspiration for community-driven directory approach
- **[getdoa.com](https://getdoa.com)** by [hazqeel](https://github.com/hazqeel) - Inspiration for Islamic community tools
- **[pasarmalam.app](https://pasarmalam.app)** by [muaz](https://github.com/muazhazali) - Inspiration for location-based directory applications

We are grateful to the open-source community and all the contributors who have made this project possible.

## Support

For issues, questions, or feature requests:

- **Email**: [hello@lepakmasjid.app](mailto:hello@lepakmasjid.app)
- **GitHub Issues**: Open an issue on [GitHub](https://github.com/your-username/lepakmasjid_v2/issues)

Please include:
- A clear description of the issue or question
- Steps to reproduce (if applicable)
- Expected vs. actual behavior
- Browser/device information (if relevant)

---

**Made with ❤️ for the Malaysian Muslim community**
