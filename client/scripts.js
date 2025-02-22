let token = null;

async function fetchWithAuth(url, options = {}) {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    const response = await fetch(`http://localhost:3000${url}`, options);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

async function initPage() {
    if (document.getElementById('create-quest-btn')) {
        await initIndexPage();
    } else if (document.getElementById('quest-title')) {
        await initQuestPage();
    }
    initThemeToggle();
    initAuthModal();
}

async function initIndexPage() {
    const createQuestBtn = document.getElementById('create-quest-btn');
    const questForm = document.getElementById('quest-form');
    const cancelQuestBtn = document.getElementById('cancel-quest');
    const questList = document.getElementById('quest-list');
    const chatPopup = document.getElementById('chat-popup');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const mapSvg = document.getElementById('map-svg');
    const achievementList = document.getElementById('achievement-list');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 50 150 Q 150 50 250 150 Q 350 250 450 150 Q 550 50 600 150');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#888');
    path.setAttribute('stroke-width', '4');
    mapSvg.appendChild(path);
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('r', '10');
    marker.setAttribute('fill', '#ffd700');
    mapSvg.appendChild(marker);

    try {
        const quests = await fetchWithAuth('/quests');
        quests.forEach(quest => addQuest(quest));
        const progress = await fetchWithAuth('/progress');
        const questCount = progress && progress.quest_count !== undefined ? progress.quest_count : 0;
        updateMap(questCount);
        const achievements = await fetchWithAuth('/achievements');
        achievements.forEach(ach => addAchievement(ach.title, ach.description));
        const chatHistory = await fetchWithAuth('/chat/history');
        chatHistory.forEach(msg => addChatMessage(msg.username, msg.message));
    } catch (err) {
        console.error('Ошибка загрузки данных:', err);
    }

    const ws = new WebSocket('ws://localhost:3000');
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
        const { username, message } = JSON.parse(event.data);
        addChatMessage(username, message);
    };

    createQuestBtn.addEventListener('click', () => {
        questForm.classList.remove('hidden');
        createQuestBtn.classList.add('hidden');
    });

    cancelQuestBtn.addEventListener('click', () => {
        questForm.classList.add('hidden');
        createQuestBtn.classList.remove('hidden');
        document.getElementById('quest-title').value = '';
        document.getElementById('quest-description').value = '';
    });

    document.getElementById('submit-quest').addEventListener('click', async () => {
        const title = document.getElementById('quest-title').value;
        const description = document.getElementById('quest-description').value;
        if (title.trim() === '') return alert('Название квеста обязательно!');

        try {
            const quest = await fetchWithAuth('/quests', {
                method: 'POST',
                body: JSON.stringify({ title, description })
            });
            addQuest(quest);
            const progress = await fetchWithAuth('/progress');
            const questCount = progress && progress.quest_count !== undefined ? progress.quest_count : 0;
            updateMap(questCount);
            await checkAchievements(questCount);

            questForm.classList.add('hidden');
            createQuestBtn.classList.remove('hidden');
            document.getElementById('quest-title').value = '';
            document.getElementById('quest-description').value = '';
        } catch (err) {
            console.error('Ошибка создания квеста:', err);
            alert('Не удалось создать квест!');
        }
    });

    questList.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
            const questItem = e.target.closest('.quest-item');
            questItem.remove();
            if (questList.children.length === 0) {
                questList.innerHTML = '<p class="empty">Пока квестов нет. Создай первый!</p>';
            }
        }
    });

    chatToggleBtn.addEventListener('click', () => {
        chatPopup.classList.toggle('minimized');
        chatToggleBtn.innerHTML = chatPopup.classList.contains('minimized')
            ? '<i class="fas fa-plus"></i>'
            : '<i class="fas fa-minus"></i>';
    });

    document.getElementById('send-chat').addEventListener('click', () => {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        if (message) {
            ws.send(JSON.stringify({ token, message }));
            chatInput.value = '';
        }
    });

    function addQuest(quest) {
        const emptyMessage = questList.querySelector('.empty');
        if (emptyMessage) emptyMessage.remove();

        const questItem = document.createElement('div');
        questItem.classList.add('quest-item');
        questItem.innerHTML = `
      <div class="quest-content">
        <h3><a href="quest.html?id=${quest.id}" class="quest-link">${quest.title}</a></h3>
        ${quest.description ? `<p>${quest.description}</p>` : ''}
      </div>
      <button class="delete-btn"><i class="fas fa-trash"></i></button>
    `;
        questList.appendChild(questItem);
    }

    function updateMap(count) {
        const totalLength = path.getTotalLength();
        const step = totalLength / 5;
        const position = Math.min(count * step, totalLength);
        const point = path.getPointAtLength(position);
        marker.setAttribute('cx', point.x.toString());
        marker.setAttribute('cy', point.y.toString());
    }

    async function checkAchievements(count) {
        if (count === 1) {
            await fetchWithAuth('/achievements', {
                method: 'POST',
                body: JSON.stringify({ title: 'Первый шаг', description: 'Создай свой первый квест' })
            });
            addAchievement('Первый шаг', 'Создай свой первый квест');
        } else if (count === 5) {
            await fetchWithAuth('/achievements', {
                method: 'POST',
                body: JSON.stringify({ title: 'Путешественник', description: 'Заверши 5 квестов' })
            });
            addAchievement('Путешественник', 'Заверши 5 квестов');
        }
    }

    function addAchievement(title, desc) {
        const emptyMessage = achievementList.querySelector('.empty');
        if (emptyMessage) emptyMessage.remove();

        const achievement = document.createElement('div');
        achievement.classList.add('achievement-item');
        achievement.innerHTML = `<strong>${title}</strong><p>${desc}</p>`;
        achievementList.appendChild(achievement);
    }

    function addChatMessage(username, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.innerHTML = `<span><i class="fas fa-user"></i> ${username}:</span> ${message}`;
        document.getElementById('chat-messages').appendChild(messageDiv);
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    }
}

async function initQuestPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const questId = urlParams.get('id');

    let quest;
    try {
        quest = await fetchWithAuth(`/quests/${questId}`);
    } catch (err) {
        console.error('Ошибка загрузки квеста:', err);
        return;
    }

    let isBoss = quest.is_boss || false;
    let bossHealth = quest.boss_health !== undefined ? quest.boss_health : 100;

    const titleElement = document.getElementById('quest-title');
    const descElement = document.getElementById('quest-description');
    if (titleElement) titleElement.textContent = quest.title || 'Без названия';
    if (descElement) descElement.textContent = quest.description || 'Описание отсутствует';

    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const toggleBossBtn = document.getElementById('toggle-boss');
    const bossInfo = document.getElementById('boss-info');

    let tasks = [];
    try {
        tasks = await fetchWithAuth(`/tasks/${questId}`);
    } catch (err) {
        console.error('Ошибка загрузки задач:', err);
    }
    let completedTasks = tasks.filter(t => t.is_completed).length;

    tasks.forEach(task => addTask(task));

    function updateProgress() {
        const totalTasks = tasks.length;
        const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
        document.getElementById('progress-text').textContent = `Прогресс: ${completedTasks}/${totalTasks}`;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        if (isBoss) {
            bossHealth = Math.max(0, 100 - progress);
            document.getElementById('boss-health-text').textContent = `Здоровье: ${Math.round(bossHealth)}/100`;
            document.getElementById('boss-health-fill').style.width = `${bossHealth}%`;
            if (bossHealth === 0) alert('Босс побеждён!');
            fetchWithAuth(`/quests/${questId}`, {
                method: 'PUT',
                body: JSON.stringify({ is_boss: true, boss_health })
            }).catch(err => console.error('Ошибка обновления босса:', err));
        }
    }

    if (toggleBossBtn) {
        toggleBossBtn.addEventListener('click', () => {
            isBoss = !isBoss;
            bossInfo.classList.toggle('hidden', !isBoss);
            toggleBossBtn.textContent = isBoss ? 'Убрать босса' : 'Сделать боссом';
            document.getElementById('boss-name').textContent = quest.title;
            updateProgress();
        });
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', async () => {
            const taskInput = document.getElementById('task-input');
            const taskText = taskInput.value.trim();
            if (taskText === '') return alert('Введите задачу!');

            try {
                const task = await fetchWithAuth('/tasks', {
                    method: 'POST',
                    body: JSON.stringify({ quest_id: questId, description: taskText })
                });
                addTask(task);
                tasks.push(task);
                taskInput.value = '';
                updateProgress();
            } catch (err) {
                console.error('Ошибка добавления задачи:', err);
                alert('Не удалось добавить задачу!');
            }
        });
    }

    function addTask(task) {
        const emptyMessage = taskList.querySelector('.empty');
        if (emptyMessage) emptyMessage.remove();

        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.is_completed ? 'checked' : ''}>
      <span contenteditable="false">${task.description}</span>
      <button class="edit-btn"><i class="fas fa-edit"></i></button>
      <button class="delete-btn"><i class="fas fa-trash"></i></button>
    `;
        taskList.appendChild(taskItem);
    }

    taskList.addEventListener('click', async (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = tasks.find(t => t.description === taskItem.querySelector('span').textContent).id;

        if (e.target.classList.contains('task-checkbox')) {
            const checkbox = e.target;
            completedTasks += checkbox.checked ? 1 : -1;
            await fetchWithAuth(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({ description: taskItem.querySelector('span').textContent, is_completed: checkbox.checked })
            }).catch(err => console.error('Ошибка обновления задачи:', err));
            updateProgress();
        } else if (e.target.closest('.delete-btn')) {
            const checkbox = taskItem.querySelector('.task-checkbox');
            if (checkbox.checked) completedTasks--;
            tasks = tasks.filter(t => t.id !== taskId);
            taskItem.remove();
            if (taskList.children.length === 0) {
                taskList.innerHTML = '<p class="empty">Задач пока нет. Добавь первую!</p>';
            }
            updateProgress();
        } else if (e.target.closest('.edit-btn')) {
            const span = taskItem.querySelector('span');
            const isEditable = span.getAttribute('contenteditable') === 'true';
            span.setAttribute('contenteditable', !isEditable);
            if (isEditable) {
                span.blur();
                const newText = span.textContent.trim();
                await fetchWithAuth(`/tasks/${taskId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ description: newText, is_completed: taskItem.querySelector('.task-checkbox').checked })
                }).catch(err => console.error('Ошибка редактирования задачи:', err));
                const index = tasks.findIndex(t => t.id === taskId);
                tasks[index].description = newText;
            } else {
                span.focus();
            }
        }
    });

    updateProgress();
}

function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            toggleBtn.innerHTML = document.body.classList.contains('light-theme')
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        });
    }
}

function initAuthModal() {
    const modal = document.getElementById('auth-modal');
    const profileLink = document.getElementById('profile-link');
    const closeBtn = document.getElementById('close-auth');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (!modal || !profileLink || !closeBtn || !loginBtn || !usernameInput || !passwordInput) {
        console.log('Некоторые элементы модалки не найдены на странице');
        return;
    }

    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        usernameInput.focus();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
    });

    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert('Введите имя пользователя и пароль!');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                token = data.token;
                modal.style.display = 'none';
                usernameInput.value = '';
                passwordInput.value = '';
                console.log('Успешный вход, токен:', token);
                await initPage();
            } else {
                alert(`Ошибка входа: ${data.error || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            alert(`Ошибка соединения: ${err.message}`);
            console.error('Ошибка логина:', err);
        }
    });

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                alert('Введите имя пользователя и пароль!');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Регистрация успешна! Теперь войдите.');
                    usernameInput.value = '';
                    passwordInput.value = '';
                } else {
                    alert(`Ошибка регистрации: ${data.error || 'Пользователь уже существует'}`);
                }
            } catch (err) {
                alert(`Ошибка соединения: ${err.message}`);
                console.error('Ошибка регистрации:', err);
            }
        });
    }

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            usernameInput.value = '';
            passwordInput.value = '';
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        initAuthModal();
    } else {
        await initPage();
    }
});