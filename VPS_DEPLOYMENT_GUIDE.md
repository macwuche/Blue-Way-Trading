# Blue Way Trading - VPS Deployment Guide

## Domain: accessbluewave.site
## Server: Ubuntu 24.04 LTS (76.13.139.24)
## App folder: /root/Bluewave

---

## STEP 1: Connect to your VPS

Open a terminal on your computer and type:

```bash
ssh root@76.13.139.24
```

**What this does:** Connects you to your VPS server remotely. You'll be asked for your password. Type it and press Enter (it won't show as you type -- that's normal).

---

## STEP 2: Update the server

```bash
apt update && apt upgrade -y
```

**What this does:** Downloads the latest list of available software and upgrades everything that's already installed. The `-y` flag means "yes to everything" so it doesn't ask for confirmation on each one.

---

## STEP 3: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

**What this does:** 
- The first line downloads a setup script from NodeSource that adds Node.js 20 to your server's software sources.
- The second line installs Node.js (the engine that runs your app) and npm (the package manager).

Verify it worked:
```bash
node --version
npm --version
```

---

## STEP 4: Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

**What this does:**
- Installs PostgreSQL (the database your app uses to store users, trades, portfolios, etc.)
- `start` runs the database right now
- `enable` makes it start automatically whenever the server reboots

---

## STEP 5: Create the database and user

```bash
sudo -u postgres psql
```

**What this does:** Opens the PostgreSQL command line as the `postgres` admin user.

Now type these commands inside the PostgreSQL prompt (one at a time):

```sql
CREATE USER bluewave WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE bluewave_db OWNER bluewave;
GRANT ALL PRIVILEGES ON DATABASE bluewave_db TO bluewave;
\c bluewave_db
GRANT ALL ON SCHEMA public TO bluewave;
\q
```

**What this does:**
- Creates a new database user called `bluewave` with a password (change `YourStrongPassword123!` to something secure)
- Creates a new database called `bluewave_db` and makes `bluewave` the owner
- Gives the `bluewave` user full access to that database
- Connects to the new database and grants schema permissions (needed for creating tables)
- `\q` exits the PostgreSQL prompt

---

## STEP 6: Create the app folder and upload your files

On your VPS:
```bash
mkdir -p /root/Bluewave
```

**What this does:** Creates the `/root/Bluewave` folder where your app will live.

Now, **open a NEW terminal window on your local computer** (not the VPS). In Replit, download the file called `bluewave-deploy.tar.gz` from the project root first. Then from your local machine run:

```bash
scp bluewave-deploy.tar.gz root@76.13.139.24:/root/Bluewave/
```

**What this does:** Copies the app bundle from your computer to the VPS server.

**Alternative -- if you can't use scp**, you can transfer via GitHub or manually. But the easiest way is to download the tarball from Replit's file browser (it's at the project root) and then use `scp`.

Now go back to your VPS terminal:

```bash
cd /root/Bluewave
tar xzf bluewave-deploy.tar.gz
```

**What this does:** Extracts all the app files from the compressed archive.

---

## STEP 7: Install Node.js dependencies

```bash
cd /root/Bluewave
npm install
```

**What this does:** Installs all the packages (libraries) your app needs to run. We install everything (including development tools) because they are needed for database setup in the next steps.

---

## STEP 8: Set up environment variables

```bash
cat > /root/Bluewave/.env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://bluewave:YourStrongPassword123!@localhost:5432/bluewave_db
SESSION_SECRET=replace-with-a-long-random-string-at-least-32-chars
MARKETAUX_API_KEY=your_marketaux_api_key_here
MASSIVE_API_KEY=your_massive_api_key_here
MASSIVE_S3_ACCESS_KEY_ID=your_s3_access_key_here
MASSIVE_S3_SECRET_ACCESS_KEY=your_s3_secret_key_here
MASSIVE_S3_ENDPOINT=https://files.massive.com
MASSIVE_S3_BUCKET=flatfiles
EOF
```

**What this does:** Creates a `.env` file with all the settings your app needs. You MUST replace:
- `YourStrongPassword123!` with the actual database password you set in Step 5
- `replace-with-a-long-random-string-at-least-32-chars` with a random string (used for encrypting user sessions)
- The API keys with your actual keys from Marketaux and Massive.com

To generate a random session secret, you can run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Now secure the file so only root can read it:
```bash
chmod 600 /root/Bluewave/.env
```

---

## STEP 9: Set up the database tables

```bash
cd /root/Bluewave
export $(grep -v '^#' .env | xargs)
npx drizzle-kit push
```

**What this does:** 
- Loads your environment variables so the database connection works
- Runs Drizzle's migration tool which creates all the necessary tables in your PostgreSQL database (users, portfolios, trades, etc.)

You should see output showing tables being created. If you get a prompt asking to confirm, type `yes`.

---

## STEP 10: Create the PM2 startup configuration

First, install PM2 (a process manager that keeps your app running 24/7):

```bash
npm install -g pm2
```

**What this does:** Installs PM2 globally. PM2 keeps your app running even after you close the terminal, and automatically restarts it if it crashes.

Now create a PM2 configuration file that includes your environment variables:

```bash
cat > /root/Bluewave/ecosystem.config.cjs << 'PMEOF'
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...vals] = line.split('=');
    env[key.trim()] = vals.join('=').trim();
  }
});

module.exports = {
  apps: [{
    name: 'bluewave',
    script: './dist/index.cjs',
    cwd: '/root/Bluewave',
    env: env,
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
  }]
};
PMEOF
```

**What this does:** Creates a configuration file for PM2 that:
- Reads your `.env` file and loads all the settings
- Tells PM2 where your app file is and how to run it
- Sets automatic restart if the app crashes or uses too much memory

---

## STEP 11: Test that the app starts

```bash
cd /root/Bluewave
pm2 start ecosystem.config.cjs
pm2 logs bluewave --lines 20
```

**What this does:** Starts your app through PM2 and shows the last 20 lines of logs. You should see a message like `serving on port 5000`. If you see errors, check your `.env` file and database settings.

Press `Ctrl+C` to exit the log viewer (the app keeps running).

If there are errors and you need to fix something:
```bash
pm2 stop bluewave     # Stop the app
# ... fix the issue ...
pm2 start ecosystem.config.cjs  # Start again
```

Set PM2 to start on boot:

```bash
pm2 startup
pm2 save
```

**What this does:**
- `pm2 startup` configures PM2 to start automatically when the server reboots
- `pm2 save` saves the current list of running apps so PM2 knows what to restart

Useful PM2 commands:
```bash
pm2 status          # Check if your app is running
pm2 logs bluewave   # View app logs (Ctrl+C to exit)
pm2 restart bluewave # Restart the app
pm2 stop bluewave   # Stop the app
```

---

## STEP 12: Install and configure Nginx (web server)

```bash
apt install -y nginx
```

**What this does:** Installs Nginx, a high-performance web server that will sit in front of your app. It handles incoming web traffic, SSL certificates, and forwards requests to your Node.js app.

Create the Nginx configuration:

```bash
cat > /etc/nginx/sites-available/bluewave << 'EOF'
server {
    listen 80;
    server_name accessbluewave.site www.accessbluewave.site;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_buffering off;
        gzip off;
    }
}
EOF
```

**What this does:** Creates a configuration file that tells Nginx:
- Listen for web traffic on port 80 (standard HTTP)
- Accept requests for `accessbluewave.site` and `www.accessbluewave.site`
- Forward all requests to your app running on port 5000
- The timeout settings (86400 seconds = 24 hours) are needed for Server-Sent Events (the live update feature)
- `proxy_buffering off` and `gzip off` ensure that live updates (SSE) are delivered instantly without being buffered

Enable the site and remove the default:

```bash
ln -s /etc/nginx/sites-available/bluewave /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

**What this does:**
- `ln -s` creates a shortcut (symlink) to enable your site configuration
- Removes the default "Welcome to Nginx" page
- `nginx -t` tests the configuration for errors (you should see "test is successful")
- Restarts Nginx to apply the changes

---

## STEP 13: Point your domain to the server

Go to your domain registrar (where you bought `accessbluewave.site`) and update the DNS settings:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.13.139.24 | 300 |
| A | www | 76.13.139.24 | 300 |

**What this does:**
- The `@` record points `accessbluewave.site` to your server's IP address
- The `www` record points `www.accessbluewave.site` to the same IP
- TTL 300 means DNS caches refresh every 5 minutes (so changes take effect quickly)

DNS changes can take 5-30 minutes to propagate worldwide. You can check if it's working:
```bash
ping accessbluewave.site
```

You should see your server's IP (76.13.139.24) in the response. Press `Ctrl+C` to stop.

---

## STEP 14: Set up SSL (HTTPS) with Let's Encrypt

**Important:** Only do this step AFTER your domain DNS is pointing to the server (Step 13). Wait until `ping accessbluewave.site` returns `76.13.139.24` before running this.

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d accessbluewave.site -d www.accessbluewave.site
```

**What this does:**
- Installs Certbot (a free tool that gets and installs SSL certificates from Let's Encrypt)
- Runs Certbot which will:
  - Ask for your email address (for renewal notifications)
  - Ask you to agree to terms of service
  - Automatically get a free SSL certificate
  - Automatically update your Nginx configuration to use HTTPS
  - Set up automatic certificate renewal (certificates expire every 90 days, Certbot renews them automatically)

Test auto-renewal:
```bash
certbot renew --dry-run
```

---

## STEP 15: Configure the firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**What this does:**
- Allows SSH connections (port 22) so you can still log in
- Allows HTTP traffic (port 80)
- Allows HTTPS traffic (port 443)
- Enables the firewall to block all other ports

Type `y` when asked to confirm.

---

## STEP 16: Change your SSH password (IMPORTANT)

Since your password was shared in this chat, change it immediately:

```bash
passwd root
```

**What this does:** Lets you set a new password for the root user. Type your new password twice.

Even better, set up SSH key authentication. From your **local computer** (not the VPS):
```bash
ssh-keygen -t ed25519
ssh-copy-id root@76.13.139.24
```

---

## You're done! Your app should now be live at:
- **https://accessbluewave.site**

---

## Troubleshooting

### App not working?
```bash
pm2 logs bluewave     # Check app logs for errors
pm2 restart bluewave  # Restart the app
```

### Nginx not working?
```bash
nginx -t              # Test configuration for errors
systemctl status nginx # Check Nginx status
journalctl -u nginx   # View Nginx logs
```

### Database not connecting?
```bash
sudo -u postgres psql -c "SELECT 1;"  # Test PostgreSQL is running
```

### Deploying updates?
When you make changes to your app in Replit:
1. Build the new version in Replit (run `npm run build`)
2. Download the new `dist/` folder
3. Upload to VPS: `scp -r dist/ root@76.13.139.24:/root/Bluewave/`
4. Restart: `pm2 restart bluewave`

### Check if everything is running:
```bash
pm2 status            # App status
systemctl status nginx # Web server status
systemctl status postgresql # Database status
```

### If you change environment variables:
Edit the `.env` file, then restart:
```bash
nano /root/Bluewave/.env
pm2 restart bluewave
```
