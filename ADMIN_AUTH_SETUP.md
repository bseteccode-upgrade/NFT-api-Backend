# Admin Authentication Setup Guide

This API includes admin authentication with JWT tokens. Admins are stored in the database with email only (no password). The first admin added becomes the super admin and receives a JWT token. All subsequent admins use the same JWT token from the environment.

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-in-production

# Admin JWT Token (Set this after creating the first admin)
ADMIN_JWT_TOKEN=your-jwt-token-here
```

**Note**: JWT tokens never expire. Once generated, they remain valid indefinitely.

**⚠️ IMPORTANT**: 
- Generate a strong JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ADMIN_JWT_TOKEN` will be provided when you create the first admin (super admin)

## How It Works

1. **First Admin (Super Admin)**: When you add the first admin via `POST /admin/auth/add`, it becomes the super admin and receives a newly generated JWT token. You should set this token as `ADMIN_JWT_TOKEN` in your `.env` file.

2. **Subsequent Admins**: When adding more admins, the system uses `ADMIN_JWT_TOKEN` from the environment (if set). All admins share the same JWT token.

3. **Unique Admin IDs**: Each admin has a unique ID in the database, but they all use the same JWT token for authentication.

## API Endpoints

### 1. Add Admin
**POST** `/admin/auth/add`

Add a new admin to the system. The first admin becomes the super admin.

#### Request Body
```json
{
  "email": "admin@example.com"
}
```

#### Response (First Admin - Super Admin)
```json
{
  "success": true,
  "message": "Super admin created successfully. Please set ADMIN_JWT_TOKEN in your .env file with the token below.",
  "admin": {
    "hashedId": "abc123...",
    "email": "admin@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isSuperAdmin": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": null,
  "note": "This is the super admin. Set ADMIN_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... in your .env file for subsequent admin operations."
}
```

#### Response (Subsequent Admins)
```json
{
  "success": true,
  "message": "Admin created successfully",
  "admin": {
    "hashedId": "def456...",
    "email": "admin2@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isSuperAdmin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": null
}
```

**Note**: 
- First admin gets a newly generated JWT token
- Subsequent admins use `ADMIN_JWT_TOKEN` from environment (if set)
- Each admin has a unique `hashedId` but shares the same JWT token
- **Tokens never expire** - `expiresIn` is `null`

### 2. Get Admin User Info with Token
**GET** `/admin/auth/user?email=admin@example.com`  
**POST** `/admin/auth/user`

Get admin information by email and return JWT token. 
**No authentication required** - This is the entry point to get the admin token.

#### Query Parameters (GET) or Request Body (POST)
- `email` (required) - Admin email address

#### Request Examples

**GET Request:**
```
GET /admin/auth/user?email=admin@example.com
```

**POST Request:**
```json
{
  "email": "admin@example.com"
}
```

#### Response
```json
{
  "success": true,
  "admin": {
    "hashedId": "abc123...",
    "email": "admin@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "isSuperAdmin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": null
}
```

**Note**: 
- Validates email format
- Returns admin information for the provided email
- Uses `ADMIN_JWT_TOKEN` from environment if set, otherwise generates a new token
- Returns `isSuperAdmin: true` if the admin is the first admin (super admin)
- **Tokens never expire** - `expiresIn` is `null`

### 3. Verify Token
**GET** `/admin/auth/verify`

Verify if a JWT token is valid. **Requires authentication.**

#### Headers
```
Authorization: Bearer <your-jwt-token>
```

#### Response
```json
{
  "success": true,
  "message": "Token is valid",
  "admin": {
    "id": 1,
    "adminId": 1,
    "email": "admin@example.com"
  }
}
```

## Usage Examples

### Step 1: Add First Admin (Super Admin)

```bash
curl -X POST http://localhost:3000/admin/auth/add \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com"
  }'
```

**Response will include:**
- `isSuperAdmin: true`
- A new JWT token
- A note to set `ADMIN_JWT_TOKEN` in your `.env` file

### Step 2: Set Token in Environment

Copy the token from the response and add it to your `.env` file:

```env
ADMIN_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Restart your server after updating `.env` file.

### Step 3: Add Subsequent Admins

```bash
curl -X POST http://localhost:3000/admin/auth/add \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@example.com"
  }'
```

**Response will include:**
- `isSuperAdmin: false`
- The same JWT token (from `ADMIN_JWT_TOKEN` env variable)

### Step 4: Get Admin User Info by Email

```bash
# Using GET with query parameter
curl -X GET "http://localhost:3000/admin/auth/user?email=admin@example.com"

# Or using POST with body
curl -X POST http://localhost:3000/admin/auth/user \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

Returns the admin info (hashed ID) and JWT token for the provided email.

### Step 5: Use Token for Protected Routes

```bash
curl -X GET http://localhost:3000/get_Transaction_details/0x123... \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Schema

The `admin_users` table has the following structure:

- `id` (INTEGER, Primary Key, Auto Increment) - Unique ID for each admin
- `email` (STRING, Unique, Required) - Admin email address
- `isActive` (BOOLEAN, Default: true) - Whether the admin account is active
- `createdAt` (DATE) - When the admin was created
- `updatedAt` (DATE) - When the admin was last updated

**Note**: There is no password field. Admins are identified by email only.

## Protecting Routes with Admin Authentication

All transaction-related routes are already protected with admin authentication. To protect additional routes, use the `authenticateAdmin` middleware:

```javascript
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Protect a route
router.post('/some-route', authenticateAdmin, someController);

// Or protect all routes in a router
router.use(authenticateAdmin);
router.post('/route1', controller1);
router.get('/route2', controller2);
```

## Accessing Admin Info in Controllers

When a route is protected with `authenticateAdmin`, the admin information is available in `req.admin`:

```javascript
async function someProtectedFunction(req, res, next) {
  try {
    // Access authenticated admin
    const adminId = req.admin.id;
    const adminEmail = req.admin.email;
    
    // Your logic here
    res.json({ message: `Hello admin ${adminEmail}!` });
  } catch (error) {
    next(error);
  }
}
```

## Transaction APIs

All transaction APIs require JWT authentication and include the hashed admin ID in responses:

- `GET /get_Transaction_details/:txHash` - Requires JWT, returns `adminId` in response
- `GET /get_Transaction_details/status/:txHash` - Requires JWT, returns `adminId` in response
- `GET /get_Transaction_details/token-ids/:txHash` - Requires JWT, returns `adminId` in response

Example response:
```json
{
  "txHash": "0x...",
  "adminId": "hashed-admin-id...",
  "network": "arbitrum-sepolia",
  ...
}
```

## Error Responses

### 400 Bad Request - Email Required
```json
{
  "error": "Email is required",
  "message": "Please provide an email address as query parameter: ?email=admin@example.com"
}
```

### 400 Bad Request - Invalid Email Format
```json
{
  "error": "Invalid email format",
  "message": "Please provide a valid email address."
}
```

### 404 Not Found - Admin Not Found
```json
{
  "error": "Admin not found",
  "message": "No admin found with this email address."
}
```

### 409 Conflict - Admin Already Exists
```json
{
  "error": "Admin already exists",
  "message": "An admin with this email already exists."
}
```

### 401 Unauthorized - No Token (for protected routes)
```json
{
  "error": "Access denied. No token provided.",
  "message": "Please provide a valid JWT token in the Authorization header: Bearer <token>"
}
```

### 401 Unauthorized - Token Expired (Legacy tokens only)
```json
{
  "error": "Token expired",
  "message": "Your authentication token has expired. Please get a new token."
}
```

**Note**: New tokens never expire. This error only applies to old tokens that were generated with expiration.

### 403 Forbidden - Account Disabled
```json
{
  "error": "Account disabled",
  "message": "Your admin account has been disabled."
}
```

## Security Notes

1. **JWT Secret**: Always use a strong, randomly generated secret in production
2. **HTTPS**: Use HTTPS in production to protect tokens in transit
3. **Token Storage**: Store `ADMIN_JWT_TOKEN` securely in your environment variables
4. **Super Admin**: The first admin is the super admin. Keep the token secure.
5. **No Password**: Admins are identified by email only. Ensure email addresses are secure.
6. **Token Expiration**: JWT tokens never expire. Once generated, they remain valid indefinitely. If you need to revoke access, you must change the `JWT_SECRET` or disable the admin account.

## Complete Setup Flow

1. **Set Environment Variables**:
   ```env
   JWT_SECRET=your-jwt-secret-key
   ```

2. **Add First Admin (Super Admin)**:
   ```bash
   POST /admin/auth/add
   { "email": "superadmin@example.com" }
   ```

3. **Set ADMIN_JWT_TOKEN**:
   ```env
   ADMIN_JWT_TOKEN=<token-from-step-2>
   ```

4. **Restart Server** (to load new env variable)

5. **Add More Admins** (optional):
   ```bash
   POST /admin/auth/add
   { "email": "admin2@example.com" }
   ```

6. **Use Token for Protected Routes**:
   ```bash
   Authorization: Bearer <your-jwt-token>
   ```

## Troubleshooting

### No admin found error
- Add the first admin using `POST /admin/auth/add`
- Verify admin exists in `admin_users` table

### Token not working for subsequent admins
- Ensure `ADMIN_JWT_TOKEN` is set in `.env` file
- Restart the server after updating `.env`
- Verify the token matches the one from the first admin

### Token verification fails
- Check that `JWT_SECRET` matches the one used to generate tokens
- Ensure token is sent in `Authorization: Bearer <token>` header format
- Note: Tokens never expire, so expiration is not a concern

### Database connection issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Run `npm run init-db` to create tables
