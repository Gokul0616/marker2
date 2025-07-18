# Database Configuration Guide

## Current Status
Your backend is configured for **PostgreSQL** and ready for production.

## Database Options

### Option 1: Automatic Database (Recommended)
**Railway/Render/Heroku provide databases automatically**

#### Railway Setup:
1. Deploy your backend to Railway
2. Add PostgreSQL service (one click)
3. Railway automatically sets: `DATABASE_URL=postgresql://...`
4. Your backend connects automatically - no configuration needed!

#### What you get:
- PostgreSQL database
- Automatic backups
- Monitoring dashboard
- Connection pooling
- **Cost**: $5/month

#### Environment Variables (Railway handles automatically):
```bash
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://username:password@host:port
```

### Option 2: Separate Database Provider
**Use dedicated database services**

#### Popular Options:
- **Supabase**: $25/month (includes extras like real-time, auth)
- **ElephantSQL**: $20/month (PostgreSQL specialist)
- **Neon**: $19/month (serverless PostgreSQL)
- **PlanetScale**: $29/month (MySQL alternative)

#### Setup:
1. Create account with database provider
2. Create PostgreSQL database
3. Copy connection string
4. Add to your backend service environment variables

#### Environment Variables (you provide):
```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

## Recommendation

**Choose Option 1 (Automatic Database)** because:
- ✅ Simplest setup
- ✅ Everything in one place
- ✅ Integrated monitoring
- ✅ Most cost-effective
- ✅ Automatic backups

## Database Schema
Your backend will automatically create these tables:
- `users` - User accounts
- `mfa_backup_codes` - MFA codes
- `login_attempts` - Rate limiting
- `workspaces` - User workspaces
- `pages` - Workspace pages
- `databases` - User databases
- `workspace_members` - Workspace access
- `page_permissions` - Page access
- `database_rows` - Database content

## Next Steps

1. **Choose Railway** (recommended) or Render/Heroku
2. **Deploy backend** - service will provide database
3. **Add PostgreSQL service** - one click setup
4. **Deploy and test** - everything works automatically!

No database URL needed - it's all handled automatically! 🎉