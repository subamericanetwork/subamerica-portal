# Meta Developer App Setup Guide
## Instagram & Facebook Analytics Integration

This guide walks you through setting up a Meta Developer app to enable Instagram and Facebook analytics for your artist portal.

---

## Prerequisites

- A Facebook account
- A Facebook Business Page (for Facebook analytics)
- An Instagram Business or Creator account linked to your Facebook Page (for Instagram analytics)

---

## Step 1: Create a Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **"Get Started"** in the top right
3. Complete the registration process
4. Verify your account via email if prompted

---

## Step 2: Create a New App

1. From the Meta for Developers dashboard, click **"Create App"**
2. Select **"Manage everything on your Page"** as your use case
3. Click **"Next"**
4. Fill in your app details:
   - **App Name**: Choose a name (e.g., "Artist Portal Analytics")
   - **App Contact Email**: Your email address
   - **Business Portfolio**: Select or create one (optional but recommended)
5. Click **"Create App"**
6. Complete any security verification (CAPTCHA, etc.)

---

## Step 3: Add Required Products

After creating your app, you need to add three products:

### A. Instagram Basic Display

1. In the left sidebar, scroll to **"Add Products"**
2. Find **"Instagram Basic Display"** and click **"Set Up"**
3. Click **"Create New App"** (this creates a sub-app for Instagram)
4. Accept the terms and create the app

### B. Instagram Graph API

1. Go back to **"Add Products"**
2. Find **"Instagram Graph API"** and click **"Set Up"**
3. This will be added automatically

### C. Facebook Login

1. Go back to **"Add Products"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"** as your platform
4. Enter your Site URL (your Lovable app URL)
5. Click **"Save"** and **"Continue"**

---

## Step 4: Configure Facebook Login Settings

1. In the left sidebar, click **"Facebook Login"** → **"Settings"**
2. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   https://hxzjhhsvssqrjlmbeokn.supabase.co/functions/v1/social-oauth-callback
   ```
3. Under **"Authorized JavaScript Origins"**, add your app URL:
   ```
   https://your-app.lovable.app
   ```
4. Click **"Save Changes"**

---

## Step 5: Configure Instagram Basic Display

1. In the left sidebar, click **"Instagram Basic Display"** → **"Basic Display"**
2. Scroll to **"User Token Generator"**
3. Click **"Add or Remove Instagram Testers"**
4. Click **"Add Instagram Testers"** and enter your Instagram username
5. Go to your Instagram app and accept the tester invitation (Settings → Apps and Websites → Tester Invites)
6. Return to the Meta Developer dashboard
7. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   https://hxzjhhsvssqrjlmbeokn.supabase.co/functions/v1/social-oauth-callback
   ```
8. Click **"Save Changes"**

---

## Step 6: Get Your App Credentials

1. In the left sidebar, click **"Settings"** → **"Basic"**
2. You'll see:
   - **App ID** (this is your `FACEBOOK_APP_ID`)
   - **App Secret** (click "Show" to reveal - this is your `FACEBOOK_APP_SECRET`)
3. **IMPORTANT**: Keep these credentials secure and never share them publicly

---

## Step 7: Configure App Permissions

1. In the left sidebar, go to **"App Review"** → **"Permissions and Features"**
2. Request the following permissions (click "Request Advanced Access"):
   - `pages_show_list` - Get list of Facebook Pages
   - `pages_read_engagement` - Read Page engagement data
   - `instagram_basic` - Access basic Instagram data
   - `instagram_manage_insights` - Access Instagram insights
   - `read_insights` - Read insights data

**Note**: For development/testing, you can use Standard Access. Advanced Access is required for production.

---

## Step 8: App Modes

1. In the top navigation, you'll see your app mode (Development or Live)
2. Start in **Development Mode** for testing
3. Before going public, you'll need to:
   - Complete App Review for required permissions
   - Add a Privacy Policy URL
   - Add Terms of Service URL
   - Switch to **Live Mode**

---

## Step 9: Add Your Credentials to Lovable

Once you have your App ID and App Secret:

1. Return to your Lovable app
2. When prompted, enter:
   - **FACEBOOK_APP_ID**: Your App ID from Step 6
   - **FACEBOOK_APP_SECRET**: Your App Secret from Step 6
   - **META_REDIRECT_URI**: `https://hxzjhhsvssqrjlmbeokn.supabase.co/functions/v1/social-oauth-callback`

---

## Step 10: Test Your Integration

1. Go to your Analytics page in the artist portal
2. Click **"Connect Instagram"** or **"Connect Facebook"**
3. You'll be redirected to Facebook/Instagram to authorize the app
4. Grant the requested permissions
5. You'll be redirected back to your app
6. Check that the connection shows as "Connected"

---

## Troubleshooting

### "This app is in Development Mode"
- This is normal during testing
- Add your Instagram account as a tester (Step 5)
- Add your Facebook account as an app tester (Settings → Roles → Add Testers)

### "Invalid OAuth Redirect URI"
- Double-check that you've added the exact redirect URI in both Facebook Login and Instagram Basic Display settings
- Make sure there are no extra spaces or trailing slashes

### "Missing Permissions"
- Go to App Review → Permissions and Features
- Make sure all required permissions are requested and approved (at least Standard Access)

### "Can't access Instagram insights"
- Make sure your Instagram account is a Business or Creator account
- Verify it's linked to your Facebook Page
- Check that you've accepted the tester invitation on Instagram

---

## Important Notes

### Rate Limits
- **Instagram Graph API**: 200 calls per hour per user
- **Facebook Graph API**: 200 calls per hour per user
- Our app syncs once daily to stay well within these limits

### Data Retention
- Analytics data is synced for the last 30 days
- Older data is aggregated to save storage

### Privacy & Compliance
- You're responsible for adding Privacy Policy and Terms of Service
- Make sure to comply with Meta's Platform Terms and Developer Policies
- Only request permissions you actually need

### Testing with Real Data
- In Development Mode, only app testers can connect
- To test with real Instagram data, add yourself as a tester
- To test with Facebook Pages, make sure you're an admin of the Page

---

## Need Help?

- **Meta Developer Documentation**: [developers.facebook.com/docs](https://developers.facebook.com/docs)
- **Instagram Graph API Docs**: [developers.facebook.com/docs/instagram-api](https://developers.facebook.com/docs/instagram-api)
- **Facebook Graph API Docs**: [developers.facebook.com/docs/graph-api](https://developers.facebook.com/docs/graph-api)

---

## Next Steps

After completing this setup:

1. The OAuth flow will be implemented to allow artists to connect their accounts
2. Daily automatic syncs will pull analytics data
3. Artists will be able to view their Instagram and Facebook performance in one place
4. Manual sync options will be available for immediate updates

Your Meta app is now ready to integrate with the artist portal!
