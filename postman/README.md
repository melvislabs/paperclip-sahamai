# Saham AI API Postman Collection

This directory contains comprehensive Postman collections for testing the Saham AI API - an AI-powered stock analysis platform for Indonesian equities (IHSG).

## Collections Overview

### 🚀 Core API Collections

1. **[Saham-AI-API.postman_collection.json](./collections/Saham-AI-API.postman_collection.json)**
   - **Main Collection**: Health, Authentication, Signals, Analysis, Stocks, Market
   - **Endpoints Covered**:
     - Health checks (`/health`)
     - Authentication (`/v1/auth/*`)
     - Trading signals (`/v1/signals/*`)
     - AI analysis (`/v1/analysis/*`)
     - Stock data (`/v1/stocks/*`)
     - Market overview (`/v1/market/overview`)

2. **[Saham-AI-API-Portfolios.postman_collection.json](./collections/Saham-AI-API-Portfolios.postman_collection.json)**
   - **Portfolio Management**: Complete portfolio and holdings management
   - **Endpoints Covered**:
     - Portfolio summary with computed metrics (`/v1/portfolio/summary`)
     - Portfolio CRUD operations (`/v1/portfolios/*`)
     - Holdings management (`/v1/portfolios/:id/stocks/*`)

3. **[Saham-AI-API-Alerts.postman_collection.json](./collections/Saham-AI-API-Alerts.postman_collection.json)**
   - **Price Alerts**: Alert creation, management, and history
   - **Endpoints Covered**:
     - Alert CRUD operations (`/v1/alerts/*`)
     - Alert history tracking (`/v1/alerts/history`)

4. **[Saham-AI-API-Operations.postman_collection.json](./collections/Saham-AI-API-Operations.postman_collection.json)**
   - **Operations & Monitoring**: System observability and metrics
   - **Endpoints Covered**:
     - Operational metrics (`/v1/ops/metrics`)
     - SLO dashboard (`/v1/ops/dashboard/latest`)
     - Active alerts (`/v1/ops/alerts/latest`)

5. **[Saham-AI-API-Users.postman_collection.json](./collections/Saham-AI-API-Users.postman_collection.json)**
   - **User Management**: Profile and preferences management
   - **Endpoints Covered**:
     - User profile (`/v1/users/me`)
     - Profile updates (`/v1/users/me` - PATCH)

6. **[Saham-AI-API-Watchlist.postman_collection.json](./collections/Saham-AI-API-Watchlist.postman_collection.json)**
   - **Watchlist Management**: Personal stock watchlists with real-time tracking
   - **Endpoints Covered**:
     - Watchlist CRUD operations (`/v1/watchlist/*`)
     - Real-time price and signal integration

7. **[Saham-AI-API-Digest.postman_collection.json](./collections/Saham-AI-API-Digest.postman_collection.json)**
   - **Daily Digest**: Automated market summary and personalized insights
   - **Endpoints Covered**:
     - Digest preferences (`/v1/settings/digest`)
     - Email content customization

8. **[Saham-AI-API-WebSocket.postman_collection.json](./collections/Saham-AI-API-WebSocket.postman_collection.json)**
   - **Real-time Data**: WebSocket connection for live updates
   - **Endpoints Covered**:
     - WebSocket connection (`/v1/ws`)

### 🌍 Environment Configuration

- **[Saham-AI-API-Environment.postman_environment.json](./environments/Saham-AI-API-Environment.postman_environment.json)**
  - Pre-configured environment variables
  - Auto-populated authentication tokens
  - Test data placeholders

## 🚀 Quick Start

### 1. Import Collections

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select all `.postman_collection.json` files from the `collections/` directory
4. Import the environment file from `environments/` directory

### 2. Set Up Environment

1. Select the **"Saham AI API - Environment"** from the environment dropdown
2. Verify `baseUrl` is set to `http://localhost:3000` (or your API server URL)
3. Other variables will be auto-populated during usage

### 3. Authentication Flow

1. **Register User**: Use `POST /v1/auth/register` to create an account
2. **Login**: Use `POST /v1/auth/login` to authenticate
3. **Auto-Token Management**: Collections automatically handle token refresh

### 4. Test the API

1. Start with the **Health Check** endpoint to verify connectivity
2. Follow the collection order for logical testing flow
3. Use the main collection for core functionality testing

## 📋 API Features Covered

### 🔐 Authentication
- User registration and login
- JWT token management with auto-refresh
- Role-based access control

### 📊 Trading Signals
- Single symbol signal retrieval
- Batch signal queries
- Signal freshness tracking
- Aggregate signal summaries

### 🤖 AI Analysis
- Technical indicator analysis
- LLM-powered insights
- Multi-provider model support
- Cached analysis results

### 📈 Stock Data
- Real-time quotes
- Historical OHLCV data
- Stock news aggregation
- Symbol search functionality

### 💼 Portfolio Management
- Portfolio creation and management
- Holdings tracking with performance metrics
- Sector allocation analysis
- Gain/loss calculations

### 🔔 Price Alerts
- Multiple alert conditions (ABOVE, BELOW, PERCENT_CHANGE)
- Notification channel configuration
- Alert history tracking
- Expiration and recurrence settings

### 👀 Watchlist Management
- Personal stock watchlists
- Real-time price integration
- Signal status for watchlist items
- Custom notes and tracking

### 📧 Daily Digest
- Automated market summaries
- Personalized content preferences
- Multiple delivery channels
- Scheduling and timezone support

### 📡 Real-time Updates
- WebSocket connections
- Live signal streaming
- Real-time quote updates
- Portfolio change notifications

### 🔧 Operations & Monitoring
- System health metrics
- Performance SLO tracking
- Cost monitoring
- Active operational alerts

## 🛠️ Advanced Features

### Auto-Token Refresh
The collections include automatic token refresh logic:
- Tokens are automatically refreshed when expiring within 5 minutes
- Failed refresh attempts are logged
- Collection variables are updated automatically

### Response Examples
Each request includes detailed response examples:
- Success responses with realistic data
- Error responses for various scenarios
- Status codes and headers
- JSON structure documentation

### Variable Management
- Dynamic variables for IDs and symbols
- Environment-specific configurations
- Test data isolation

## 📝 Request Examples

### Authentication
```json
POST /v1/auth/login
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Get Trading Signal
```bash
GET /v1/signals/latest/BBCA
Authorization: Bearer {{accessToken}}
```

### Run AI Analysis
```json
POST /v1/analysis/BBCA
{
  "priceHistory": [
    {
      "timestamp": "2024-01-10T00:00:00.000Z",
      "open": 9750,
      "high": 9900,
      "low": 9700,
      "close": 9850,
      "volume": 1500000
    }
  ],
  "news": []
}
```

### Create Price Alert
```json
POST /v1/alerts
{
  "symbol": "BBCA",
  "condition": "ABOVE",
  "targetPrice": 10000,
  "alertType": "ONE_TIME",
  "notificationChannels": ["in_app", "email"]
}
```

### Add to Watchlist
```json
POST /v1/watchlist
{
  "symbol": "BMRI",
  "notes": "Bank Mandiri - largest state-owned bank"
}
```

### Update Digest Preferences
```json
PATCH /v1/settings/digest
{
  "enabled": true,
  "frequency": "daily",
  "time": "09:00",
  "content": {
    "marketOverview": true,
    "portfolioUpdates": true,
    "signalAlerts": true,
    "newsDigest": true
  }
}
```

## 🔍 Testing Scenarios

### Basic Flow Test
1. Health Check → Authentication → Get Signals → Get Quote
2. Verify API connectivity and basic functionality

### Portfolio Management Test
1. Create Portfolio → Add Holdings → Get Summary → Update Holdings
2. Test portfolio CRUD operations and calculations

### Alert System Test
1. Create Alert → List Alerts → Update Alert → Delete Alert
2. Verify alert lifecycle management

### Watchlist Test
1. Get Watchlist → Add Stock → Update Notes → Remove Stock
2. Test watchlist management with real-time data

### Digest System Test
1. Get Preferences → Update Settings → Verify Configuration
2. Test digest customization and scheduling

### Operations Monitoring Test
1. Get Metrics → Check SLO Dashboard → Review Active Alerts
2. Validate system observability

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if `accessToken` is set in environment
   - Try logging in again to refresh tokens

2. **404 Not Found**
   - Verify `baseUrl` is correct
   - Check if API server is running

3. **503 Service Unavailable**
   - Check if `STOCK_API_KEY` environment variable is set
   - Verify external API connectivity

4. **WebSocket Connection Failed**
   - Ensure authentication token is valid
   - Check WebSocket endpoint accessibility

5. **Portfolio Summary Empty**
   - Verify user has a portfolio created
   - Check if holdings have been added

6. **Watchlist Empty**
   - Add stocks to watchlist first
   - Verify symbols are valid Indonesian stocks

### Debug Mode
Enable Postman console to see:
- Token refresh attempts
- Request/response details
- Variable updates
- Error messages

## 📚 Additional Resources

- [API Documentation](http://localhost:3000/docs) - Interactive Swagger UI
- [Project Repository](https://github.com/your-org/paperclip-sahamai)
- [API Architecture Guide](../docs/PROJECT-OVERVIEW.md)

## 🤝 Contributing

To update the collections:
1. Modify the relevant `.postman_collection.json` file
2. Update response examples with current API behavior
3. Test changes with the API server
4. Update this README if adding new endpoints

## 📄 License

These Postman collections are part of the Saham AI project and follow the same license terms.
