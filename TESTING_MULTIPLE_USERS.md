# 🧪 Testing with Multiple Users

## Understanding Online Status

**Important:** Online status is based on **active socket connections**, not just logged-in accounts.

### How It Works:
- ✅ **Online** = User has an active browser tab/window open and is logged in
- ❌ **Offline** = User is logged out OR browser tab is closed

---

## 🎯 How to Test with Multiple Users

### Option 1: Multiple Browser Windows (Recommended)

1. **Open Multiple Windows:**
   - Window 1: Chrome (or any browser)
   - Window 2: Chrome Incognito (or different browser)
   - Window 3: Edge/Firefox (or another incognito window)

2. **Login Different Users in Each:**
   ```
   Window 1: http://localhost:5173
   → Login as: emma.thompson@example.com / 123456
   
   Window 2: http://localhost:5173
   → Login as: james.anderson@example.com / 123456
   
   Window 3: http://localhost:5173
   → Login as: olivia.miller@example.com / 123456
   ```

3. **Now You Can:**
   - See all users as "Online" (green dot)
   - Chat between windows in real-time
   - Test typing indicators
   - Test read receipts
   - Create groups and add members

---

### Option 2: Multiple Browser Tabs

1. Open multiple tabs in the same browser
2. Login different users in each tab
3. **Note:** Some browsers share cookies between tabs, so you might need to:
   - Use different browsers, OR
   - Use incognito/private mode for additional sessions

---

### Option 3: Different Browsers

Use different browsers for each user:
- Chrome → User 1
- Firefox → User 2
- Edge → User 3
- Brave → User 4

---

## 📋 Step-by-Step Testing Guide

### Setup:
1. **Seed the database:**
   ```bash
   cd backend
   npm run seed
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Test Scenario:

**Window 1 - User 1 (Emma):**
1. Go to http://localhost:5173
2. Login: `emma.thompson@example.com` / `123456`
3. You'll see other users in contacts
4. Click on "James Anderson" to start chat

**Window 2 - User 2 (James):**
1. Open new browser window (or incognito)
2. Go to http://localhost:5173
3. Login: `james.anderson@example.com` / `123456`
4. You'll see "Emma Thompson" in contacts
5. Click on "Emma Thompson"

**Now Test:**
- ✅ Send message from Window 1 → See it appear in Window 2 instantly
- ✅ Send message from Window 2 → See it appear in Window 1 instantly
- ✅ Type in Window 1 → See "typing..." in Window 2
- ✅ Both users show as "Online" (green dots)
- ✅ Read receipts work (double check marks)

---

## 🔍 Why Users Show as Offline

### If you only have ONE browser window open:
- ✅ **Your account** = Online (you're logged in)
- ❌ **All other accounts** = Offline (no one else is logged in)

### To see others as Online:
- You need **multiple browser windows** open
- Each window logged in as a **different user**
- Each window maintains a **socket connection**

---

## 💡 Quick Test Setup

### Fastest Way:
1. **Window 1:** Login as `emma.thompson@example.com`
2. **Window 2 (Incognito):** Login as `james.anderson@example.com`
3. **Window 3 (Another Incognito):** Login as `olivia.miller@example.com`

Now all 3 users are online and can chat!

---

## 🎮 Testing Features

### With Multiple Windows Open:

✅ **Real-time Messaging:**
- Send message in Window 1 → Appears instantly in Window 2

✅ **Online Status:**
- All open windows show users as "Online"
- Close a window → That user becomes "Offline"

✅ **Typing Indicators:**
- Type in Window 1 → Window 2 shows "typing..."

✅ **Read Receipts:**
- Read message in Window 2 → Window 1 shows double check (read)

✅ **Groups:**
- Create group in Window 1
- Add members from Window 2 and 3
- All members can chat in group

✅ **Media Sharing:**
- Send image from Window 1 → Appears in Window 2

---

## 🚀 Production vs Development

### Development (Now):
- All users on same computer (localhost)
- Need multiple browser windows to test
- This is normal for local testing!

### Production (When Deployed):
- Each user on their own device
- Everyone automatically online when they open the app
- No need for multiple windows

---

## ⚡ Quick Commands

```bash
# 1. Seed users
cd backend && npm run seed

# 2. Start backend (Terminal 1)
cd backend && npm run dev

# 3. Start frontend (Terminal 2)
cd frontend && npm run dev

# 4. Open multiple browser windows
# Window 1: Login as user1@example.com
# Window 2: Login as user2@example.com
# Window 3: Login as user3@example.com
```

---

## ✅ Summary

**To see users as "Online":**
- ✅ Open multiple browser windows
- ✅ Login different users in each window
- ✅ Each window = one active user connection

**If only one window:**
- ✅ Only YOUR account shows as online
- ❌ Others show as offline (they're not logged in)

This is **normal behavior** - online status reflects active connections, not just registered accounts!

