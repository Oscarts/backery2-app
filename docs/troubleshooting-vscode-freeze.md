# Troubleshooting VS Code Freezing Issues

## Common Issues

When VS Code freezes or crashes while running the webapp, it's typically caused by one of these issues:

### 1. Multiple Concurrent Dev Server Processes

**Symptom:** Multiple instances of `tsx watch`, `vite`, and `concurrently` running simultaneously from different times.

**Root Cause:** Starting the dev servers multiple times without properly killing previous instances creates resource conflicts and memory pressure.

**Solution:**
```bash
# Kill all running dev processes before starting new ones
pkill -f "tsx watch" && pkill -f "vite" && pkill -f "concurrently"

# Or use the cleanup helper
./cleanup-dev-processes.sh  # (if exists)
```

### 2. Rate Limiter IPv6 Configuration Error

**Symptom:** Backend throwing `ValidationError: ERR_ERL_KEY_GEN_IPV6` on startup.

**Root Cause:** Custom keyGenerator in rate limiter wasn't handling IPv6 addresses properly according to express-rate-limit requirements.

**Solution:** Added helper function to properly extract IP addresses:
```typescript
// Helper to extract IP from request (handles IPv6)
const getIpFromRequest = (req: any): string => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

// Then use in keyGenerator
keyGenerator: (req: any) => {
    // ... custom logic ...
    return getIpFromRequest(req);  // Instead of String(req.ip)
},
```

## Prevention Best Practices

### Before Starting Dev Servers

1. **Check for existing processes:**
   ```bash
   ps aux | grep -E "node|vite|tsx" | grep -v grep
   ```

2. **Kill existing processes if found:**
   ```bash
   pkill -f "tsx watch" && pkill -f "vite" && pkill -f "concurrently"
   ```

3. **Verify ports are free:**
   ```bash
   lsof -ti:8000,3002 | xargs kill -9 2>/dev/null || echo "Ports are free"
   ```

### Recommended Startup Methods

**Option 1: Using VS Code Tasks (Recommended)**
```
Press Cmd+Shift+P → Tasks: Run Task → "Start Development Servers"
```
Benefits:
- Managed by VS Code
- Proper cleanup on window close
- Integrated terminal output

**Option 2: Using Shell Script**
```bash
./start-with-data.sh
```

**Option 3: Manual (for debugging)**
```bash
npm run dev
```

### If VS Code Freezes

1. **Don't force quit VS Code immediately** - Try graceful shutdown first:
   - Press `Ctrl+C` in the terminal running dev servers
   - Wait 5 seconds for cleanup
   - Close terminal tabs

2. **If still frozen:**
   - Open Activity Monitor (macOS) or Task Manager (Windows)
   - Look for multiple `node` processes consuming high CPU/memory
   - Kill processes manually if needed

3. **After VS Code restart:**
   - Clean up remaining processes:
     ```bash
     pkill -f "tsx watch" && pkill -f "vite" && pkill -f "concurrently"
     ```
   - Restart fresh using VS Code Tasks

## Health Check Commands

After starting servers, verify they're working:

```bash
# Backend health
curl http://localhost:8000/health

# Frontend accessible
curl -I http://localhost:3002

# Check running processes
ps aux | grep -E "(tsx watch|vite)" | grep -v grep
```

Expected output:
- Backend: `{"status":"OK","timestamp":"...","uptime":...}`
- Frontend: `HTTP/1.1 200 OK`
- Processes: Should see exactly 1 tsx process and 1 vite process

## Quick Reference

**Servers:**
- Backend: http://localhost:8000
- Frontend: http://localhost:3002

**Health Endpoints:**
- Backend: http://localhost:8000/health (NOT /api/health)

**Stop Servers:**
```bash
# Graceful (in terminal where they're running)
Ctrl+C

# Force kill (if frozen)
pkill -f "tsx watch" && pkill -f "vite" && pkill -f "concurrently"
```

**Restart Clean:**
```bash
# Kill all processes
pkill -f "tsx watch" && pkill -f "vite" && pkill -f "concurrently"

# Wait for cleanup
sleep 2

# Start fresh
npm run dev
# OR use VS Code task
```

## Files Modified

1. `backend/src/middleware/rateLimiter.ts` - Fixed IPv6 handling in rate limiter

## Related Documentation

- [Development Guidelines](./development-guidelines.md)
- [Running with Data](./running-with-data.md)
- Backend rate limiter: [backend/src/middleware/rateLimiter.ts](../backend/src/middleware/rateLimiter.ts)
