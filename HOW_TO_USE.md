# 📱 How to Use the Chat App (WhatsApp-like Features)

## 🚀 Quick Start

### Step 1: Add Test Users (Contacts)

First, you need multiple user accounts to chat with. Run the seed script:

```bash
cd backend
npm run seed
```

This creates **15 test users** you can chat with:
- Email: `emma.thompson@example.com` | Password: `123456`
- Email: `james.anderson@example.com` | Password: `123456`
- ... and 13 more (all passwords are `123456`)

**Or create accounts manually:**
1. Click "Logout" (if logged in)
2. Go to "Create account" (Sign Up)
3. Create accounts with different emails/phones
4. Login with each account in different browser windows/tabs

---

## 💬 How to Chat (One-to-One)

### 1. **See Contacts**
- All registered users appear in the **Contacts** tab
- Green dot = Online, Gray = Offline
- Use search bar to find specific users

### 2. **Start Chatting**
- Click on any user from the sidebar
- Type your message in the input box
- Press Enter or click Send button

### 3. **Send Media**
- Click the **📎 (Paperclip)** icon to send:
  - Images
  - Videos
  - Documents
- Click the **🎤 (Microphone)** icon to record voice messages

### 4. **Message Features**
- **Encrypt**: Check "Encrypt" to encrypt messages
- **Schedule**: Click "Schedule" to send message later
- **Disappearing**: Select duration (24hrs, 7 days) for auto-delete
- **Reactions**: Click smiley icon on messages to add emoji reactions (❤️ 👍 😂)

### 5. **Read Receipts**
- Single check ✓ = Sent
- Double check ✓✓ (gray) = Delivered
- Double check ✓✓ (blue) = Read

---

## 👥 How to Create & Use Groups

### Create a Group:
1. Click **"Groups"** tab in sidebar
2. Click **"Create Group"** button
3. Enter group name (required)
4. Add description (optional)
5. Select members from the list
6. Click **"Create Group"**

### Group Features:
- **Send messages** to all group members
- **Add/Remove members** (admin only)
- **Leave group** anytime
- **Group settings** (admin only)

### Group Management:
- **Admins** can:
  - Add/remove members
  - Change group settings
  - Make other admins
- **Members** can:
  - Send messages
  - Leave group

---

## 🔍 Search & Filter

### Search Contacts:
- Type in the search bar to find users
- Searches by name, email, or phone

### Filter Online Users:
- Check "Show online only" to see only online contacts

---

## ⚙️ Settings & Profile

### Update Profile:
1. Click **"Profile"** in navbar
2. Click camera icon to change profile picture
3. Edit status message
4. View account info

### Privacy Settings:
1. Go to **"Profile"** page
2. Scroll to **"Privacy Settings"**
3. Set who can see:
   - Last seen
   - Profile picture
   - Status
   - Read receipts

### Auto-Reply:
1. Go to **"Profile"** page
2. Scroll to **"Auto-Reply Settings"**
3. Enable auto-reply
4. Set your message
5. App will auto-reply when you're busy

### Theme:
1. Go to **"Settings"** page
2. Choose from 30+ themes
3. Preview before applying
4. Theme saves automatically

---

## 📤 Media Sharing

### Send Images:
1. Click 📎 icon → Image
2. Select image file
3. Image is compressed automatically
4. Click Send

### Send Videos:
1. Click 📎 icon → Video
2. Select video file
3. Click Send

### Send Documents:
1. Click 📎 icon → Document
2. Select file (PDF, Word, etc.)
3. Click Send
4. Recipient can download

### Voice Messages:
1. Click 🎤 icon
2. Click "Start Recording"
3. Speak your message
4. Click "Stop"
5. Preview and click "Send"

---

## 🔐 Security Features

### Message Encryption:
- Check "Encrypt" before sending
- Message is encrypted with AES
- Only sender and receiver can read

### Privacy:
- Hide last seen from specific people
- Hide profile picture
- Hide status
- Disable read receipts

---

## 📅 Advanced Features

### Schedule Messages:
1. Type your message
2. Click "Schedule" button
3. Select date and time
4. Click Send
5. Message sends automatically at scheduled time

### Disappearing Messages:
1. Type your message
2. Select duration (24hrs or 7 days)
3. Send message
4. Message auto-deletes after duration

### Message Reactions:
1. Click smiley icon on any message
2. Choose emoji (❤️ 👍 😂 😮 😢 🙏)
3. Reaction appears on message
4. Click again to remove

---

## 💾 Chat Backup

### Export Chat:
1. Open any chat (one-to-one or group)
2. Click export/download option (coming soon in UI)
3. Chat history downloads as JSON
4. Includes all messages and metadata

---

## 🎯 Tips & Tricks

1. **Multiple Accounts**: Open app in different browser windows to test with multiple users
2. **Real-time Updates**: Messages appear instantly (no refresh needed)
3. **Typing Indicator**: Shows when someone is typing
4. **Online Status**: See who's online in real-time
5. **Search**: Quickly find contacts or groups
6. **Notifications**: Get notified of new messages (sound plays)

---

## 🐛 Troubleshooting

### No Contacts Showing?
- Run seed script: `cd backend && npm run seed`
- Or create multiple user accounts manually
- Make sure backend is running

### Can't Send Messages?
- Check if backend is running on port 5001
- Check browser console for errors
- Make sure you're logged in

### Groups Not Working?
- Make sure you selected at least one member
- Check backend logs for errors
- Refresh the page

---

## 📝 Test Accounts (After Seeding)

After running `npm run seed`, use these accounts:

| Email | Password | Name |
|-------|----------|------|
| emma.thompson@example.com | 123456 | Emma Thompson |
| james.anderson@example.com | 123456 | James Anderson |
| olivia.miller@example.com | 123456 | Olivia Miller |
| william.clark@example.com | 123456 | William Clark |
| ... | 123456 | ... (15 total users) |

**All passwords are: `123456`**

---

## 🎉 You're Ready!

Now you can:
- ✅ Chat with contacts
- ✅ Create groups
- ✅ Send media
- ✅ Use all WhatsApp-like features

Enjoy your chat app! 🚀

