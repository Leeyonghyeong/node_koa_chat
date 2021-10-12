// IIFE
(() => {
  const socket = new WebSocket(`ws://${window.location.host}/ws`);
  const formEl = document.querySelector('#form');
  const inputEl = document.querySelector('#input');
  const chatsEl = document.querySelector('#chats');

  const adjectives = ['멋진', '훌륭한', '친절한', '새침한'];
  const animals = ['물범', '사자', '사슴', '돌고래', '독수리'];

  const chats = [];

  function pickRandom(array) {
    const randomIdx = Math.floor(Math.random() * array.length);

    return array[randomIdx];
  }

  const randomNickname = `${pickRandom(adjectives)} ${pickRandom(animals)}`;

  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      nickname: randomNickname,
      message: inputEl.value,
    };
    socket.send(JSON.stringify(data));
    inputEl.value = '';
  });

  const drawChats = () => {
    chatsEl.innerHTML = '';
    chats.forEach(({ nickname, message }) => {
      const div = document.createElement('div');
      div.innerText = `${nickname} : ${message}`;
      chatsEl.appendChild(div);
    });
  };

  socket.addEventListener('message', (event) => {
    const { type, payload } = JSON.parse(event.data);

    if (type === 'sync') {
      const { chats: syncedChats } = payload;
      chats.push(...syncedChats);
    } else {
      const chat = payload;
      chats.push(chat);
    }

    drawChats();
  });
})();
