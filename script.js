document.addEventListener('DOMContentLoaded', () => {
  const {
    auth, provider, database, ref, push, onValue, off, set,
    signInWithPopup, signOut, onAuthStateChanged
  } = window.firebase;

  const authContainer = document.getElementById('auth-container');
  const chatContainer = document.getElementById('chat-container');
  const messagesContainer = document.getElementById('messages');
  const googleLoginBtn = document.getElementById('google-login');
  const logoutBtn = document.getElementById('logout-btn');
  const sendBtn = document.getElementById('send-btn');
  const messageInput = document.getElementById('message-input');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');
  const userAvatar = document.getElementById('user-avatar');
  const usernameSpan = document.getElementById('username');
  const notificationSound = document.getElementById('notification-sound');

  const messagesRef = ref(database, 'messages');

  onAuthStateChanged(auth, user => {
    if (user) loginUser(user);
    else logoutUser();
  });

  googleLoginBtn.addEventListener('click', () => signInWithPopup(auth, provider));
  logoutBtn.addEventListener('click', () => signOut(auth));
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());
  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const apiKey = '58156ee7-6623-4205-8a51-0bc57bdb480a';
    const response = await fetch("https://pixeldrain.com/api/file", {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(":" + apiKey) },
      body: formData
    });
    const data = await response.json();

    const fileUrl = `https://pixeldrain.com/api/file/${data.id}`;
    const user = auth.currentUser;
    const newMessage = {
      text: file.type.startsWith('image')
        ? `<img src="${fileUrl}" class="message-media">`
        : `<video src="${fileUrl}" controls class="message-media"></video>`,
      name: user.displayName,
      userId: user.uid,
      photoURL: user.photoURL,
      timestamp: Date.now(),
      isMedia: true
    };
    push(messagesRef, newMessage);
  });

  function loginUser(user) {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    userAvatar.src = user.photoURL;
    usernameSpan.textContent = user.displayName?.split(" ").slice(0, 2).join(" ") || "Anonymous";
    loadMessages();
  }

  function logoutUser() {
    chatContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    messagesContainer.innerHTML = '';
    off(messagesRef);
  }

  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    const user = auth.currentUser;
    const msg = {
      text,
      name: user.displayName,
      userId: user.uid,
      photoURL: user.photoURL,
      timestamp: Date.now()
    };
    push(messagesRef, msg).then(() => messageInput.value = '');
  }

  function loadMessages() {
    onValue(messagesRef, snapshot => {
      messagesContainer.innerHTML = '';
      const messages = snapshot.val();
      if (messages) {
        Object.values(messages).forEach(displayMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }

  function displayMessage(msg) {
    const isOwn = msg.userId === auth.currentUser?.uid;
    const el = document.createElement('div');
    el.className = `message ${isOwn ? 'own-message' : ''}`;
    const header = `<span class="message-sender">${msg.name}</span>
                    <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>`;
    el.innerHTML = `
      <img class="message-avatar" src="${msg.photoURL}" alt="avatar">
      <div class="message-content">
        <div class="message-header">${header}</div>
        <div class="message-text">${msg.text}</div>
      </div>
    `;
    messagesContainer.appendChild(el);
  }
});
