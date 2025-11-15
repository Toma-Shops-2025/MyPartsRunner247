# CRON Secret Token Setup Guide

This guide explains what CRON is, what the CRON_SECRET_TOKEN is used for, and how to create one.

## 🤔 **What is CRON?**

**CRON** is a time-based job scheduler that runs automated tasks at specific intervals. In web development, it's used to:
- Run scheduled tasks (e.g., check for expiring documents daily)
- Send automated emails (e.g., daily reports)
- Clean up old data (e.g., delete old logs)
- Process background jobs (e.g., update statistics)

### **Common CRON Examples:**
- **Every day at midnight:** `0 0 * * *`
- **Every hour:** `0 * * * *`
- **Every 5 minutes:** `*/5 * * * *`
- **Every Monday at 9 AM:** `0 9 * * 1`

---

## 🔒 **What is CRON_SECRET_TOKEN?**

The `CRON_SECRET_TOKEN` is a **secret password** that protects your CRON job endpoints from unauthorized access. It ensures that only authorized services can trigger your automated tasks.

### **Why is it needed?**
- **Security:** Prevents unauthorized access to your CRON endpoints
- **Protection:** Stops malicious users from triggering your automated tasks
- **Control:** Allows you to control who can execute your scheduled jobs

---

## 🔑 **How to Create a CRON_SECRET_TOKEN**

The CRON_SECRET_TOKEN is **not something you find** - it's something **you create yourself**. Here's how:

### **Method 1: Generate a Random Token (Recommended)**

Use one of these methods to generate a secure random token:

#### **Option A: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### **Option B: Using Online Tool**
1. Go to: https://randomkeygen.com/
2. Click **"CodeIgniter Encryption Keys"**
3. Copy one of the generated keys (64 characters)

#### **Option C: Using OpenSSL**
```bash
openssl rand -hex 32
```

#### **Option D: Using PowerShell (Windows)**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### **Method 2: Create Your Own Token**

You can create your own token using any combination of:
- Letters (a-z, A-Z)
- Numbers (0-9)
- Special characters (!@#$%^&*)

**Example tokens:**
```
my-secret-cron-token-2025
CRON_TOKEN_abc123xyz
secure-token-4-cron-jobs
```

**⚠️ Important:** Make it long and random (at least 32 characters) for better security!

---

## 📝 **What Your Token Should Look Like**

A good CRON_SECRET_TOKEN should be:
- **Long:** At least 32 characters
- **Random:** Hard to guess
- **Unique:** Different from other tokens
- **Secure:** Not easily guessed

**Examples:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
CRON_SECRET_2025_abc123xyz789
secure-random-token-for-cron-jobs-64-chars-long
```

---

## 🚀 **How to Add CRON_SECRET_TOKEN to Netlify**

### **Step 1: Generate Your Token**

Use one of the methods above to generate a secure token.

### **Step 2: Add to Netlify**

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"**
5. Add:
   - **Name:** `CRON_SECRET_TOKEN`
   - **Value:** `your-generated-token-here` (paste your token)
   - **Scope:** All scopes
6. Click **"Save"**
7. **Redeploy your site**

---

## 🔧 **How CRON_SECRET_TOKEN is Used**

The token is used in the `document-expiration-cron.js` function to verify requests:

```javascript
// Check if the request has the correct token
const authHeader = event.headers.authorization;
const expectedToken = process.env.CRON_SECRET_TOKEN;

if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'Unauthorized' })
  };
}
```

### **How to Use It:**

When calling your CRON endpoint, include the token in the Authorization header:

```bash
curl -X POST https://my-runner.com/.netlify/functions/document-expiration-cron \
  -H "Authorization: Bearer your-cron-secret-token-here"
```

---

## 📅 **Setting Up CRON Jobs**

### **Option 1: Using Netlify Scheduled Functions**

Netlify supports scheduled functions using `netlify.toml`:

```toml
[[plugins]]
package = "@netlify/plugin-scheduled-functions"

[[plugins.inputs]]
schedule = "0 0 * * *"  # Every day at midnight
function = "document-expiration-cron"
```

### **Option 2: Using External CRON Services**

You can use external services to trigger your CRON function:

#### **EasyCRON**
1. Go to: https://www.easycron.com/
2. Create an account
3. Add a new CRON job
4. Set the URL: `https://my-runner.com/.netlify/functions/document-expiration-cron`
5. Set the schedule: `0 0 * * *` (daily at midnight)
6. Add header: `Authorization: Bearer your-cron-secret-token-here`

#### **Cron-Job.org**
1. Go to: https://cron-job.org/
2. Create an account
3. Add a new CRON job
4. Set the URL: `https://my-runner.com/.netlify/functions/document-expiration-cron`
5. Set the schedule: `0 0 * * *` (daily at midnight)
6. Add header: `Authorization: Bearer your-cron-secret-token-here`

#### **GitHub Actions**
You can use GitHub Actions to trigger your CRON function:

```yaml
name: Document Expiration Cron
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger CRON
        run: |
          curl -X POST https://my-runner.com/.netlify/functions/document-expiration-cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}"
```

---

## ✅ **Is CRON_SECRET_TOKEN Required?**

**Short answer: No, it's optional.**

The `CRON_SECRET_TOKEN` is only needed if you want to:
- Secure your CRON endpoints
- Prevent unauthorized access
- Control who can trigger your automated tasks

### **If you don't set it:**
- The CRON function will still work
- But it won't be secured
- Anyone can trigger it if they know the URL

### **If you do set it:**
- The CRON function will be secured
- Only requests with the correct token will work
- Better security for your automated tasks

---

## 🚨 **Troubleshooting**

### **"Unauthorized" Error**
- **Solution:** Check that the `Authorization` header includes `Bearer your-token`
- **Verify:** The token in the header matches the token in Netlify

### **"CRON_SECRET_TOKEN not found"**
- **Solution:** Add `CRON_SECRET_TOKEN` to Netlify environment variables
- **Verify:** The token is set correctly

### **CRON Job Not Running**
- **Solution:** Check that your CRON service is configured correctly
- **Verify:** The URL is correct and the token is included in the header

---

## 🔒 **Security Best Practices**

1. **Use a Long Token:**
   - At least 32 characters
   - Random and unique
   - Hard to guess

2. **Keep it Secret:**
   - Never commit it to Git
   - Only store it in Netlify environment variables
   - Don't share it publicly

3. **Rotate Periodically:**
   - Change the token periodically
   - Update it in Netlify and your CRON service
   - Revoke old tokens

4. **Monitor Usage:**
   - Check Netlify function logs
   - Monitor for unauthorized access attempts
   - Set up alerts for failed requests

---

## 📊 **Quick Reference**

**What is CRON?**
- Time-based job scheduler for automated tasks

**What is CRON_SECRET_TOKEN?**
- Secret password to secure CRON endpoints

**Do I need it?**
- Optional, but recommended for security

**How do I create it?**
- Generate a random token (32+ characters)
- Add it to Netlify environment variables

**How do I use it?**
- Include it in the `Authorization` header when calling CRON endpoints
- Format: `Authorization: Bearer your-token-here`

---

## 🎯 **Summary**

1. **CRON** = Automated scheduled tasks
2. **CRON_SECRET_TOKEN** = Secret password to secure CRON endpoints
3. **Create it yourself** = Generate a random token (not something you find)
4. **Add to Netlify** = Set it as an environment variable
5. **Use it** = Include it in the Authorization header when calling CRON endpoints

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

