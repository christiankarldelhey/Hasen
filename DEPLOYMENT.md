# Deployment Guide - Hasen Game

## Fly.io Deployment (Backend)

### Prerequisites

1. Install Fly CLI:
   ```bash
   # macOS
   brew install flyctl
   
   # Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. Create a Fly.io account and login:
   ```bash
   flyctl auth login
   ```

### Initial Setup

1. **Launch the app** (first time only):
   ```bash
   flyctl launch
   ```
   
   When prompted:
   - App name: `hasen-backend` (or your preferred name)
   - Region: `fra` (Frankfurt) or closest to your users
   - PostgreSQL: **No** (we use MongoDB)
   - Redis: **No**
   - Deploy now: **No** (we need to set secrets first)

2. **Set environment variables**:
   ```bash
   # MongoDB connection string
   flyctl secrets set MONGODB_URI="your_mongodb_connection_string"
   
   # Frontend URL for CORS (update with your actual frontend URL)
   flyctl secrets set FRONTEND_URL="https://your-frontend-url.netlify.app"
   ```

3. **Deploy the application**:
   ```bash
   flyctl deploy
   ```

### Subsequent Deployments

After the initial setup, deploy updates with:
```bash
flyctl deploy
```

### Monitoring & Management

- **View logs**:
  ```bash
  flyctl logs
  ```

- **Check status**:
  ```bash
  flyctl status
  ```

- **View app info**:
  ```bash
  flyctl info
  ```

- **SSH into the machine**:
  ```bash
  flyctl ssh console
  ```

- **Scale machines** (if needed):
  ```bash
  flyctl scale count 1  # Number of machines
  flyctl scale memory 512  # Memory in MB
  ```

### Configuration Details

- **No Cold Start**: The `fly.toml` is configured with `min_machines_running = 1` to keep at least one instance always active, eliminating cold starts.
- **Auto-scaling**: Machines will auto-start on demand and auto-stop when idle (but minimum 1 always running).
- **Health checks**: Configured to check `/api/health` every 30 seconds.
- **Region**: Frankfurt (`fra`) for European users.

### URLs

After deployment, your backend will be available at:
```
https://hasen-backend.fly.dev
```

Update your frontend's `VITE_API_URL` to:
```
https://hasen-backend.fly.dev/api
```

### Troubleshooting

1. **Deployment fails**:
   ```bash
   flyctl logs
   ```
   Check for errors in the build or startup process.

2. **Health check fails**:
   - Verify MongoDB connection string is correct
   - Check that the app is listening on port 3001
   - Ensure `/api/health` endpoint is working

3. **WebSocket issues**:
   - Fly.io supports WebSockets by default
   - Ensure CORS is configured correctly with `FRONTEND_URL`

4. **View secrets**:
   ```bash
   flyctl secrets list
   ```

5. **Update a secret**:
   ```bash
   flyctl secrets set SECRET_NAME="new_value"
   ```

### Cost

With the current configuration:
- **Free tier**: Includes 3 shared-cpu-1x VMs with 256MB RAM
- **Current setup**: 1 machine with 256MB RAM = **FREE**
- No cold starts with `min_machines_running = 1`

### Rollback

If you need to rollback to a previous version:
```bash
flyctl releases
flyctl releases rollback <version>
```

---

## Frontend Deployment (Netlify/Vercel)

The frontend remains on your current hosting platform (Netlify or Vercel).

### Update Environment Variables

After deploying the backend to Fly.io, update your frontend environment variable:

**Netlify**:
1. Go to Site settings → Environment variables
2. Update `VITE_API_URL` to `https://hasen-backend.fly.dev/api`
3. Redeploy

**Vercel**:
1. Go to Project Settings → Environment Variables
2. Update `VITE_API_URL` to `https://hasen-backend.fly.dev/api`
3. Redeploy

---

## Migration from Render

1. Deploy to Fly.io following the steps above
2. Test the Fly.io deployment thoroughly
3. Update frontend to point to Fly.io backend
4. Keep Render deployment as backup for a few days
5. Once confirmed working, delete Render deployment

---

## MongoDB Atlas

Your MongoDB database remains on MongoDB Atlas. No changes needed.

---

## Quick Reference

```bash
# Deploy
flyctl deploy

# Logs
flyctl logs

# Status
flyctl status

# Secrets
flyctl secrets list
flyctl secrets set KEY="value"

# Scale
flyctl scale count 1
flyctl scale memory 256
```
