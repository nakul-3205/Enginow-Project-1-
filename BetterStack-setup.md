# BetterStack (Logtail) Setup Guide

This guide explains how to set up BetterStack logging for your Enginow Auth-system.

## What is BetterStack?

BetterStack (formerly Logtail) is a centralized logging platform that provides:
- Real-time log streaming
- Advanced search and filtering
- Log retention and analysis
- Alerts and notifications
- Beautiful dashboards
- Performance monitoring

## Getting Your Source Token

### Step 1: Create a BetterStack Account

1. Go to https://betterstack.com/
2. Sign up for a free account
3. Verify your email

### Step 2: Create a Source

1. After logging in, go to **Logs** → **Sources**
2. Click **Add Source**
3. Select **Node.js** or **Custom** as the platform
4. Give it a name: `Enginow Auth-System`
5. Click **Create Source**
6. Copy the **Source Token** (looks like: `xxxxxxxxxxxxxxxxxxxxx`)

### Step 3: Add Token to Your Project

Add the token to your `.env` file:

```env
# Logging (BetterStack)
LOGTAIL_SOURCE_TOKEN=your_betterstack_source_token_here
```

### Step 4: Verify Integration

1. Start your server: `npm run dev`
2. Perform some actions (login, signup, etc.)
3. Go to BetterStack dashboard → **Live Tail**
4. You should see logs appearing in real-time! 🎉

## Understanding Your Logs

### Log Levels

Your application uses these log levels:

- **INFO** - General information (user login, service start, etc.)
- **WARN** - Warnings (connection retries, deprecated features)
- **ERROR** - Errors (API failures, validation errors)
- **FATAL** - Critical errors (service crashes, DB failures)

### Example Logs in BetterStack

```json
{
  "level": "info",
  "msg": "User logged in",
  "userId": "699190482ad6c656b7bef454",
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

## BetterStack Dashboard Features

### 1. Live Tail
- Real-time log streaming
- See logs as they happen
- Filter by level, service, or custom fields

### 2. Search
- Search across all logs
- Filter by time range
- Advanced query language

### 3. Alerts
Set up alerts for:
- Error rate spikes
- Specific error patterns
- Service downtime
- Custom conditions

### 4. Dashboards
Create custom dashboards to visualize:
- Request rates
- Error rates
- Response times
- User activity

## Useful Queries

### Find all login attempts
```
msg:"Login successful" OR msg:"Invalid credentials"
```

### Find errors in the last hour
```
level:error AND timestamp:>now-1h
```

### Find specific user activity
```
userId:"699190482ad6c656b7bef454"
```

### Find slow database queries
```
duration:>1000
```

## Setting Up Alerts

### Example: Alert on High Error Rate

1. Go to **Alerts** → **New Alert**
2. Name: `High Error Rate`
3. Condition: `level:error`
4. Threshold: `> 10 errors in 5 minutes`
5. Notification: Email/Slack/PagerDuty
6. Save

### Example: Alert on Failed Logins

1. Go to **Alerts** → **New Alert**
2. Name: `Multiple Failed Login Attempts`
3. Condition: `msg:"Invalid credentials"`
4. Threshold: `> 5 in 1 minute`
5. Save

## Best Practices

### 1. Use Structured Logging
✅ **Good:**
```javascript
logger.info("User logged in", { userId: user._id, email: user.email });
```

❌ **Bad:**
```javascript
logger.info(`User ${user.email} logged in`);
```

### 2. Include Context
Always include relevant context in your logs:
```javascript
logger.error({ error, userId, endpoint: req.path }, "API request failed");
```

### 3. Use Appropriate Log Levels
- `info` - Normal operations
- `warn` - Something unusual but not breaking
- `error` - Something broke but app continues
- `fatal` - Critical failure, app might crash

### 4. Don't Log Sensitive Data
❌ **Never log:**
- Passwords
- API keys
- Credit card numbers
- Personal identification numbers

✅ **Safe to log:**
- User IDs
- Timestamps
- Request paths
- Error codes

## Cost Optimization

### Free Tier Limits
BetterStack free tier includes:
- 1 GB of logs per month
- 3-day retention
- Unlimited sources

### Tips to Stay Within Free Tier

1. **Set appropriate log levels in production:**
```env
NODE_ENV=PRODUCTION
LOG_LEVEL=warn  # Only warn, error, fatal
```

2. **Use sampling for high-volume logs:**
```javascript
// Log only 10% of info messages in production
if (process.env.NODE_ENV !== 'PRODUCTION' || Math.random() < 0.1) {
    logger.info("High volume event", data);
}
```

3. **Clean up old data:**
- BetterStack automatically handles retention
- Focus on important error logs

## Troubleshooting

### Logs Not Appearing

1. **Check your token:**
```bash
echo $LOGTAIL_SOURCE_TOKEN
```

2. **Verify network connectivity:**
```bash
curl -H "Authorization: Bearer $LOGTAIL_SOURCE_TOKEN" https://in.logtail.com/
```

3. **Check server logs:**
Look for Pino/Logtail initialization messages

### Slow Log Delivery

- Logs are buffered and sent in batches
- Can take 5-10 seconds to appear
- Check your network connection

### Token Issues

- Regenerate token in BetterStack dashboard
- Update `.env` file
- Restart your server

## Alternative: Local Development

For local development without BetterStack:

```env
# Comment out BetterStack token
# LOGTAIL_SOURCE_TOKEN=

# Logs will go to console only
NODE_ENV=DEVELOPMENT
```

## Support

- BetterStack Docs: https://betterstack.com/docs
- Support: support@betterstack.com
- Community: https://community.betterstack.com

## Summary

1. ✅ Sign up at https://betterstack.com
2. ✅ Create a source for Node.js
3. ✅ Copy your source token
4. ✅ Add to `.env` as `LOGTAIL_SOURCE_TOKEN`
5. ✅ Restart server
6. ✅ View logs in BetterStack dashboard

Happy logging! 📊