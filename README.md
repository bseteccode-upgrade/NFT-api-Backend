# Ethereum/Arbitrum Account Derivation Service

A secure Express.js service that generates a master mnemonic seed and derives Ethereum-compatible accounts (for use on Ethereum and Arbitrum networks) using BIP44 derivation paths. All sensitive data (mnemonics and private keys) are encrypted and stored in PostgreSQL.

## Features

- ✅ **Secure Storage**: Encrypted mnemonic  stored in PostgreSQL
- ✅ **Auto-increment Index**: Automatic index management (0, 1, 2, ...)
- ✅ **Modular Architecture**: Organized codebase with routes, controllers, models, and middleware
- ✅ **BIP44 Compliant**: Uses standard `m/44'/60'/0'/0/{index}` derivation path
- ✅ **Database Persistence**: All accounts and seeds stored in PostgreSQL
- ✅ **Encryption**: AES-256 encryption for sensitive data

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb eth_accounts

# Or using psql:
psql -U postgres -c "CREATE DATABASE eth_accounts;"
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eth_accounts
DB_USER=postgres
DB_PASSWORD=your_password

# Encryption Key (REQUIRED - generate a strong key)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-32-byte-hex-encryption-key-here

# Optional: Arbitrum RPC
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-key
```

**⚠️ IMPORTANT**: Generate a strong encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

Initialize the database tables:
```bash
npm run init-db
```

This creates:
- `seeds` table (encrypted mnemonics)
- `accounts` table (derived accounts with encrypted private keys)

**Warning**: `npm run init-db:force` will DROP all existing tables!

## Running the Service

Start the server:
```bash
npm start
```

Or in development mode:
```bash
npm run dev
```

The server will:
1. Connect to PostgreSQL
2. Sync database models (create tables if needed)
3. Start listening on the configured PORT

## API Endpoints

### Health Check
```bash
GET /health
```
Returns service status and database connection info.

### Seed Management

#### Initialize Seed (One-time)
```bash
POST /seed/init
```
Generates a new random mnemonic, encrypts it, and stores it in the database. Can only be called once.

**Response:**
```json
{
  "message": "Master seed created and stored securely.",
  "fingerprint": "abandon...zoo (24)",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "note": "Seed is encrypted and stored in database."
}
```

#### Get Seed Status
```bash
GET /seed/status
```
Returns whether a seed has been initialized.

**Response:**
```json
{
  "initialized": true,
  "source": "database",
  "fingerprint": "abandon...zoo (24)",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Account Management

#### Create Next Account (Auto-increment)
```bash
POST /create_eth_account
```
Derives the next account using auto-incremented index. Stores the account in the database with encrypted private key.

**Response:**
```json
{
  "index": 0,
  "derivationPath": "m/44'/60'/0'/0/0",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "publicKey": "0x03...",
  "privateKey": "0x...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Project Structure

```
src/
├── config/
│   └── database.js          # PostgreSQL connection & configuration
├── models/
│   ├── Seed.js              # Seed model (encrypted mnemonic)
│   └── Account.js           # Account model (derived accounts)
├── controllers/
│   ├── seedController.js    # Seed management logic
│   └── accountController.js # Account creation & retrieval
├── routes/
│   ├── seedRoutes.js        # Seed API routes
│   └── accountRoutes.js     # Account API routes
├── middleware/
│   └── errorHandler.js      # Error handling middleware
├── utils/
│   ├── encryption.js        # Encryption/decryption utilities
│   ├── derivation.js        # BIP44 derivation logic
│   └── seed.js              # Mnemonic generation utilities
├── scripts/
│   └── init-db.js           # Database initialization script
└── server.js                # Express app & server setup
```

## Security Notes

1. **Encryption Key**: Always use a strong, randomly generated encryption key in production. Store it securely (environment variables, secrets manager).

2. **Database Access**: Restrict database access. Use strong passwords and consider connection encryption.

3. **Environment Variables**: Never commit `.env` file. Use `.env.example` as a template.


4. **Backup**: Regularly backup your PostgreSQL database, especially the `seeds` table.

## Development

The codebase is organized into:
- **Models**: Sequelize models for database tables
- **Controllers**: Business logic for handling requests
- **Routes**: API endpoint definitions
- **Middleware**: Request/response processing
- **Utils**: Helper functions (encryption, derivation, etc.)
- **Config**: Configuration files (database, etc.)

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check `.env` database credentials
- Ensure database exists: `psql -l | grep eth_accounts`

### Encryption Errors
- Verify `ENCRYPTION_KEY` is set in `.env`
- Ensure key is 32 bytes (64 hex characters)

### Account Derivation Issues
- Ensure seed is initialized: `POST /seed/init`
- Check database for existing accounts
- Verify index auto-increment is working

## License

ISC
