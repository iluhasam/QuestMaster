//Общие функции
function  initPage(){
    if (document.getElementById('create-quest-btn')){
        initIndexPage();
    } else if (document.getElementById('quest-title')){
        initQuestPage();
    }
    initThemeToggle();
    initAuthModal();
}

//Главная страница
function  initIndexPage(){
    //Показать/скрыть форму
    const createQuestBtn = document.getElementById('create-quest-btn');
    const questform = document.getElementById('quest-form');
    const cancelQuestBtn = document.getElementById('cancel-quest');
    const questlist = document.getElementById('quest-list');
    const chatSection = document.getElementById('chat-section');
    const chatLink = document.getElementById('chat-link');
    const mapSvg = document.getElementById('map-svg');
    const achievementList = document.getElementById('achievement-list');
    let questCount = 0;

    // Инициализация SVG карты
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

    createQuestBtn.addEventListener('click', () => {
        questform.classList.remove('hidden');
        createQuestBtn.classList.add('hidden');
    });

    cancelQuestBtn.addEventListener('click', () => {
        questform.classList.add('hidden');
        createQuestBtn.classList.remove('hidden');
        document.getElementById('quest-title').value ='';
        document.getElementById('quest-description').value = '';
    });

    //Добавление Квеста
    document.getElementById('submit-quest').addEventListener('click', () => {
        const title = document.getElementById('quest-title').value
        const descripiton = document.getElementById('quest-description').value;

        if(title.trim() === ''){
            alert('Название квеста обязательно!');
            return;
        }

        const questItem = document.createElement('div');
        questItem.classList.add('quest-item');
        questItem.innerHTML = `
        <div class="quest-content">
            <h3><a href="quest.html?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(descripiton || '')}"
             class ="quest-link">${title}</a></h3>
            ${descripiton ? `<p>${descripiton}</p>` : ''}
        </div>
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
        `;

        // удаление Сообщения "Пока квестов нет"
        const  emptyMessage = questlist.querySelector('.empty');
        if(emptyMessage) emptyMessage.remove();

        //Добавить квест в список
        questlist.appendChild(questItem);

        //Скрыть форму и очистить поля
        questform.classList.add('hidden');
        createQuestBtn.classList.remove('hidden');
        document.getElementById('quest-title').value = '';
        document.getElementById('quest-description').value = '';

        questCount++;
        updateMap(questCount);
        checkAchievements(questCount);
    });

//Удаление квеста(добавление делегированных событий)
    questlist.addEventListener('click', (e) => {
        if(e.target.closest('.delete-btn')){
            const questItem = e.target.closest('.quest-item');
            questItem.remove();
            questCount--;
            updateMap(questCount);
            if(questlist.children.length === 0){
                questlist.innerHTML = '<p class="empty">Пока квестов нет. Создай первый!</p>';
            }
        }
    });

    function updateMap(count) {
        const totalLength = path.getTotalLength();
        const step = totalLength / 5;
        const position = Math.min(count * step, totalLength);
        const point = path.getPointAtLength(position);
        marker.setAttribute('cx', point.x);
        marker.setAttribute('cy', point.y);
    }

    function checkAchievements(count){
        if (count === 1){
            addAchievement('Первый шаг', 'Создай свой первый квест');
        } else if (count === 5){
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

    chatLink.addEventListener('click', (e) => {
        e.preventDefault();
        chatSection.classList.toggle('hidden');
    });

    document.getElementById('send-chat').addEventListener('click', () => {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        if (message) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('chat-message');
            messageDiv.innerHTML = `<span><i class="fas fa-user"></i> Ты:</span>> ${message}`;
            document.getElementById('chat-messages').appendChild(messageDiv);
            chatInput.value = '';
            document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
        }
    });
}

//Страница квеста
function initQuestPage(){
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title') || 'Без названия';
    const description = urlParams.get('desc') || '';
    let isBoss = false;
    let bossHealth = 100;

    document.getElementById('quest-title').textContent = title;
    document.getElementById('guest-description').textContent = description || 'Описание отсутствует';

    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const toggleBossBtn = document.getElementById('toggle-boss');
    const bossInfo = document.getElementById('boss-info');
    let tasks = [];
    let completedTasks = 0;

    function updateProgress(){
        const totalTasks = tasks.length;
        const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
        document.getElementById('progress-text').textContent = `Прогресс: ${completedTasks}/${totalTasks}`;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        if (isBoss) {
            bossHealth = Math.max(0, 100 - progress);
            document.getElementById('boss-health-text').textContent = `Здоровье: ${Math.round(bossHealth)}/100`;
            document.getElementById('boss-health-fill').style.width = `${bossHealth}%`;
            if (bossHealth === 0) {
                alert('Босс побеждён!');
            }
        }
    }

    toggleBossBtn.addEventListener('click', () => {
        isBoss = !isBoss;
        bossInfo.classList.toggle('hidden' , !isBoss);
        toggleBossBtn.textContent = isBoss ? 'Убрать босса' : 'Сделать боссом';
        document.getElementById('boss-name').textContent = title;
        updateProgress();
    })

    addTaskBtn.addEventListener('click', () => {
        const taskInput = document.getElementById('task-input');
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            alert('Введите задачу!');
            return
        }

        addTask(taskText);
        taskInput.value = '';
    });

    function addTask(taskText) {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox">
            <span contenteditable="false">${taskText}</span>
            <button class="edit-btn"><i class="fas fa-edit"</i></button>
            <button class="delete-btn"><i class="fas fa-trash">-</i></button>
        `;

        const emptyMessage = taskList.querySelector('.empty');
        if (emptyMessage) emptyMessage.remove();

        taskList.appendChild(taskItem);
        tasks.push(taskText);
        updateProgress();
    }

    taskList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        if (e.target.classList.contains('task-checkbox')) {
            const  checkbox = e.target;
            completedTasks += checkbox.checked ? 1 : -1;
            updateProgress();
        } else if (e.target.closest('.delete-btn')) {
            const checkbox = taskItem.querySelector('.task-checkbox')
            if (checkbox.checked) completedTasks--;
            tasks = tasks.filter(t => t !== taskItem.querySelector('span').textContent);
            taskItem.remove();
            if (taskList.children.length === 0) {
                 taskList.innerHTML = '<p class="empty"> Задач пока нет. Добавь первую!</p>';
            }
            updateProgress();
        } else if (e.target.closest('.edit-btn')){
            const span = taskItem.querySelector('span');
            const isEditable = span.getAttribute('contenteditable') === 'true';
            span.setAttribute('contenteditable', !isEditable);
            if (isEditable) {
                span.blur();
                const newText = span.textContent.trim();
                const index = tasks.indexOf(taskText);
                if(index !== -1) tasks[index] = newText;
            } else {
                span.focus();
            }
        }
    });
}

function  initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        toggleBtn.innerHTML = document.body.classList.contains('light-theme')
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    });
}

function initAuthModal() {
    const modal = document.getElementById('auth-modal');
    const profileLink = document.getElementById('profile-link');
    const closeBtn = document.getElementById('close-auth');
    const loginBtn = document.getElementById('login-btn');

    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username && password) {
            alert(`Вход выполнен: ${username}`);
            modal.classList.add('hidden');
        } else {
            alert('Введите имя пользователя и пароль!');
        }
    });
}

document.addEventListener('DOMContentLoaded', initPage);
