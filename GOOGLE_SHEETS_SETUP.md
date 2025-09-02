# Google Sheets Integration Setup

## Required Setup Steps

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Sheets API**
4. Go to **Credentials** > **Create Credentials**

### 2. OAuth 2.0 Client Setup
1. Click **Create Credentials** > **OAuth 2.0 Client IDs**
2. Application type: **Web application**
3. Name: `Fire Banking Calculator`
4. **Authorized JavaScript origins**: `http://localhost:5173` (for development)
5. **Authorized redirect URIs**: `http://localhost:5173` (for development)
6. Copy the **Client ID**

### 3. API Key Setup
1. Click **Create Credentials** > **API Key**
2. Restrict the key to **Google Sheets API** only
3. Copy the **API Key**

### 4. Create Shared Spreadsheet
1. Create a new Google Sheets document
2. Share it with all 3 team members (Editor permissions)
3. Copy the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### 5. Environment Variables
Create a `.env` file in the project root:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id-here
VITE_GOOGLE_SPREADSHEET_ID=your-shared-spreadsheet-id-here
```

### 5. Production Setup
For production deployment, update:
- **Authorized JavaScript origins**: Add your production domain
- **Authorized redirect URIs**: Add your production domain
- Update environment variables in your hosting platform

## Security Notes
- Never commit actual credentials to version control
- Use environment variables for all sensitive data
- Restrict API keys to only necessary services
- Use HTTPS in production

## Usage
Once configured, users can:
1. Click "Exportar para Google Sheets"
2. Authenticate with Google account
3. Data will be exported to a new spreadsheet
4. Spreadsheet link will be provided to open in browser