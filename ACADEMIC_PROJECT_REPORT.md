# ACADEMIC PROJECT REPORT OUTLINE

## 1. INTRODUCTION

### 1.1 Project Description

This project is a real-time chat application similar to WhatsApp, enabling instant messaging. It supports one-to-one and group chats, media sharing (images, videos, documents, voice notes), location sharing, and features like read receipts, reactions, message editing, and deletion. The system includes authentication with OTP email verification, end-to-end encryption, scheduled and disappearing messages, and call logging. It uses modern web technologies to provide real-time communication with a responsive, mobile-friendly UI.

### 1.2 Company Profile

[Include details about your institution, department, or client. Example: "This project was developed as part of the academic curriculum at [Your Institution Name], Department of [Your Department], under the guidance of [Supervisor Name]. The project demonstrates practical application of full-stack development, real-time communication protocols, and database management systems in building enterprise-grade messaging applications."]

---

## 2. LITERATURE SURVEY

### 2.1 Existing System

Current chat applications like WhatsApp, Telegram, and Discord offer real-time messaging with media support. They rely on centralized servers and use WebSocket protocols for instant delivery. Limitations include limited customization, privacy concerns, and dependency on internet connectivity. Enterprise solutions are expensive and complex. The proposed system addresses these gaps by providing an open-source, customizable solution with flexible authentication, encryption, and modular architecture suitable for educational and small-scale deployment scenarios.

### 2.2 Proposed System

This system offers a full-stack real-time chat application with a React-based frontend and Node.js backend. It supports multiple message types, real-time synchronization via Socket.io, secure authentication with JWT and OTP, file storage using MongoDB GridFS, and advanced features like message editing, scheduling, and encryption. The architecture separates concerns between client and server, uses RESTful APIs for standard operations, and WebSockets for real-time events, enabling scalable, maintainable code with clear separation of authentication, messaging, and file handling logic.

### 2.3 Feasibility Study

The project is technically feasible using mature open-source technologies (React, Node.js, MongoDB). Economically, it uses free tools, reducing development costs. Operational feasibility is high due to web-based deployment accessible from browsers. The timeline is manageable with modular development. Risk mitigation includes error handling, input validation, and security measures like encryption and authentication. The system can be deployed on local networks or cloud platforms, making it adaptable to various environments.

### 2.4 Tools and Technologies Used

**Frontend:** React 18.3, Vite 6.0, Redux Toolkit, Tailwind CSS, DaisyUI, Lucide React, Socket.io Client. **Backend:** Node.js, Express.js, MongoDB 8.0, Mongoose, Socket.io, bcryptjs, jsonwebtoken, GridFS. **Development Tools:** Git, VS Code, npm. Authentication uses JWT for session management and email service for OTP verification. File handling uses MongoDB GridFS for efficient media storage and retrieval, eliminating the need for separate file servers.

### 2.5 Hardware and Software Requirements

**Hardware:** Processor 2.0 GHz+, RAM 4GB+, Storage 10GB+, network connection. **Software:** Operating System (Windows/Linux/macOS), Node.js v18+, MongoDB 8.0+, modern browser (Chrome/Firefox/Edge). Server requirements: MongoDB running locally or cloud instance, Node.js runtime environment, npm package manager. Client requirements: web browser with JavaScript enabled, stable internet connection for real-time features. Optional: MongoDB Atlas for cloud database hosting, email service credentials for OTP functionality.

---

## 3. SOFTWARE REQUIREMENTS SPECIFICATION

### 3.1 Functional Requirements

**FR1:** User authentication with email/phone registration, OTP verification, login/logout, and JWT-based session management. **FR2:** One-to-one messaging with text, media, voice notes, and location sharing. **FR3:** Group chat with member management, roles, and group-specific messaging. **FR4:** Real-time message delivery, typing indicators, online status, and read receipts. **FR5:** Message management with editing (15-minute window), deletion, reactions, and scheduled sending. **FR6:** Media handling with image compression, document upload/download, video playback, and voice message recording. **FR7:** Advanced features including disappearing messages, end-to-end encryption, call logging, and message search.

### 3.2 Non-Functional Requirements

**NFR1:** Performance with <500ms message delivery latency, support for 100+ concurrent users per server instance, and optimized media loading. **NFR2:** Security with password hashing (bcrypt), encrypted connections (HTTPS), JWT token expiration, and input sanitization. **NFR3:** Usability with responsive design, intuitive UI, clear error messages, and accessibility considerations. **NFR4:** Reliability with error handling, graceful degradation, data persistence, and automatic reconnection for real-time features. **NFR5:** Scalability with modular architecture, stateless API design, and efficient database indexing. **NFR6:** Maintainability with clean code structure, comprehensive error logging, and documentation.

---

## 4. SYSTEM DESIGN

### 4.1 System Perspective

The system follows a three-tier architecture: presentation (React frontend), business logic (Node.js/Express API), and data (MongoDB). The frontend manages UI state via Redux, handles user interactions, and communicates with the backend via REST and WebSocket. The backend processes requests, validates data, interacts with MongoDB, and broadcasts real-time events via Socket.io. MongoDB stores user data, messages, and files. Authentication middleware protects routes, GridFS handles media storage, and cron jobs manage scheduled messages and cleanup tasks.

### 4.2 Flow Chart (Textual Explanation)

**User Registration:** User enters email → System sends OTP → User verifies OTP → Account created → Redirect to login. **Login:** User enters credentials → Backend validates → JWT tokens issued → User authenticated → Redirect to chat interface. **Message Sending:** User composes message → Frontend validates → POST to API → Backend saves to database → Socket.io broadcasts to recipient → Recipient receives real-time update. **Real-time Events:** Connection established → Socket joins user room → Events (typing, online status, message delivery) broadcast → Clients update UI accordingly. **Message Editing:** User selects edit → Time validation (15 min) → Update request sent → Database updated → Socket broadcasts update → All clients refresh message display.

---

## 5. DETAILED DESIGN

### 5.1 Class Diagram (Brief Description)

**User Model:** Attributes include _id, email, fullName, password (hashed), phoneNumber, profilePic, isOnline, lastSeen, refreshToken. Methods: save(), findOne(), findByIdAndUpdate(). **Message Model:** Attributes include senderId, receiverId, groupId, messageType, text, image, video, document, location, voice, reactions, readReceipts, edited, editedAt, isDeleted. Methods: save(), find(), populate(). **Group Model:** Attributes include name, description, adminId, members[], createdAt. Methods: findById(), updateOne(). **Controllers:** AuthController (login, signup, sendOTP, refreshToken), MessageController (sendMessage, getMessages, editMessage, deleteMessage), GroupController (createGroup, addMembers, getGroupDetails). Socket handlers manage real-time events and room management.

### 5.2 Data Flow Diagram (Brief Description)

**Level 0:** External entities (User, Database) interact with the Chat Application System. **Level 1:** User → Frontend (React) → Authentication Process → Backend API → Database; User → Frontend → Message Process → Socket Manager → Database; Database → Backend API → Frontend → User Display. **Level 2:** Authentication includes email validation, OTP generation/storage, password hashing, JWT generation. Message Process includes input validation, media processing (compression, GridFS upload), database storage, socket broadcasting. Real-time Manager handles connection management, room joining/leaving, event routing, status updates. **Data Flow:** Registration data → Validation → OTP storage → Email service; Login credentials → Verification → Token generation → Cookie setting; Message data → Validation → Media processing → Database insert → Socket emit → Recipient update.

---

## 6. IMPLEMENTATION

### 6.1 Code Snippets (Explain Logic Only)

**Authentication:** Login uses bcrypt.compare() to verify the password, generates JWT via generateToken(), sets HTTP-only cookies, and returns user data. OTP storage uses an in-memory Map with expiration timestamps, verified before account creation. **Message Sending:** The handleSendMessage function validates input, constructs message payload based on type (text/media/location), dispatches Redux action, handles encryption if enabled, and manages scheduled messages via cron jobs. **Real-time Updates:** Socket.io emits "newMessage" to recipient rooms, clients listen via socket.on("newMessage"), Redux dispatches addMessage(), and UI re-renders automatically. **Message Editing:** The editMessage controller checks 15-minute time window, validates ownership, updates text/encryptedContent, sets edited flag, and broadcasts via Socket.io. **Media Handling:** Images are compressed using sharp library, converted to base64, uploaded to GridFS, and URLs stored in message documents for efficient retrieval.

---

## 7. SOFTWARE TESTING

Testing was performed manually using seeded test accounts. Functional testing covered all user flows: registration with OTP verification, login with email/phone, sending text/media/voice/location messages, group creation and messaging, message editing within the 15-minute window, deletion, reactions, and read receipts. Integration testing verified API endpoints, Socket.io real-time events, MongoDB operations, and file upload/download. Security testing checked password hashing, JWT token validation, unauthorized access prevention, and input sanitization. Performance testing measured message delivery latency, concurrent user handling, and media loading times. Edge cases tested included expired OTP, invalid credentials, network disconnections, and time-limit validations for editing/deletion. All critical paths were verified to work as expected.

---

## 8. CONCLUSION

The project demonstrates a full-stack real-time chat application with modern web technologies. Key achievements include real-time messaging, secure authentication, media handling, and advanced features like message editing, scheduling, and encryption. The modular architecture ensures maintainability and scalability. Challenges addressed include real-time synchronization, file storage optimization, and security implementation. The system successfully meets functional and non-functional requirements, providing a solid foundation for production deployment. Future enhancements could include video calls, message search, cloud deployment, and automated testing frameworks.

---

## 9. FUTURE ENHANCEMENT

Planned enhancements include video calling using WebRTC, advanced message search with full-text indexing, push notifications for mobile devices, message translation, dark mode themes, user status messages, message forwarding, backup/restore functionality, cloud deployment on AWS/Azure, automated unit and integration testing with Jest, mobile applications for iOS/Android, end-to-end encryption improvements, admin dashboard for user management, analytics and reporting features, and integration with third-party services like Google Drive for file sharing.

---

## APPENDIX A: BIBLIOGRAPHY

1. React Documentation. (2024). "Getting Started with React." https://react.dev
2. Node.js Documentation. (2024). "Node.js API Documentation." https://nodejs.org/docs
3. MongoDB Manual. (2024). "MongoDB Documentation." https://docs.mongodb.com
4. Socket.io Documentation. (2024). "Socket.io Guide." https://socket.io/docs
5. Express.js Guide. (2024). "Express Framework Documentation." https://expressjs.com
6. Redux Toolkit Documentation. (2024). "Redux Toolkit Guide." https://redux-toolkit.js.org
7. WebSocket API Specification. (2024). W3C Recommendation. https://www.w3.org/TR/websockets/
8. JWT (JSON Web Token) RFC 7519. (2015). IETF Standard. https://tools.ietf.org/html/rfc7519

---

## APPENDIX B: USER MANUAL

**Installation:** Install Node.js and MongoDB. Clone the repository, run npm install in backend and frontend folders. Configure backend/.env with MongoDB URI and JWT secrets. Start MongoDB service. Run npm run dev in backend and frontend terminals. Access the application at http://localhost:5173. **Registration:** Click "Sign Up", enter email and password, verify OTP sent to email, account created. **Login:** Enter email/phone and password, click "Sign In". **Chatting:** Select user from sidebar, type message, click send or press Enter. Share media via paperclip icon. Share location via location pin icon. Hold microphone for voice messages. Right-click messages to edit (within 15 min), delete, or add reactions. **Group Chat:** Click "Create Group", add members, start group conversation. **Settings:** Access profile settings, update name/status, change theme, manage privacy settings.

