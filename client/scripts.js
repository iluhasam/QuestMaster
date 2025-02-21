//Общие функции
function  initPage(){
    if (document.getElementById('create-quest-btn')){
        initIndexPage();
    } else if (document.getElementById('quest-title')){
        initQuestPage();
    }
}

//Главная страница
function  initIndexPage(){
    //Показать/скрыть форму
    const createQuestBtn = document.getElementById('create-quest-btn');
    const questform = document.getElementById('quest-form');
    const cancelQuestBtn = document.getElementById('cancel-quest');
    const questlist = document.getElementById('quest-list');

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
    });

//Удаление квеста(добавление делегированных событий)
    questlist.addEventListener('click', (e) => {
        if(e.target.closest('.delete-btn')){
            const questItem = e.target.closest('.quest-item');
            questItem.remove();
            if(questlist.children.length === 0){
                questlist.innerHTML = '<p class="empty">Пока квестов нет. Создай первый!</p>';
            }
        }
    });
}

//Страница квеста
function initQuestPage(){
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title') || 'Без названия';
    const description = urlParams.get('desc') || '';

    document.getElementById('quest-title').textContent = title;
    document.getElementById('guest-description').textContent = description || 'Описание отсутствует';

    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    let tasks = [];
    let completedTasks = 0;

    function updateProgress(){
        const totalTasks = tasks.length;
        const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
        document.getElementById('progress-text').textContent = `Прогресс: ${completedTasks}/${totalTasks}`;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    addTaskBtn.addEventListener('click', () => {
        const taskInput = document.getElementById('task-input');
        const taskText = taskInput.value.trim();

        if(taskText === ''){
            alert('Введите задачу!');
            return
        }

        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox">
            <span>${taskText}</span>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        `;

        const emptyMessage = taskList.querySelector('.empty');
        if (emptyMessage) emptyMessage.remove();

        taskList.appendChild(taskItem);
        tasks.push(taskText);
        taskInput.value = '';
        updateProgress();
    });

    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const  checkbox = e.target;
            completedTasks += checkbox.checked ? 1 : -1;
            updateProgress();
        } else if (e.target.closest('.delete-btn')) {
            const taskItem = e.target.closest('.task-checkbox');
            if (checkbox.checked) completedTasks--;
            tasks = tasks.filter(t => t !== taskItem.querySelector('span').textContent);
            taskItem.remove();
            if (taskList.children.length === 0) {
                 taskList.innerHTML = '<p class="empty"> Задач пока нет. Добавь первую!</p>';
            }
            updateProgress();
        }
    })
}

//Навигация
document.addEventListener('DOMContentLoaded', ()=> {
    initPage();

    const profileLink = document.getElementById('profile-link');
    const chatLink = document.getElementById('chat-link');

    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Профиль пока в разработке!');
        });
    }

    if (chatLink) {
        chatLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Чат скоро будет готов!')
        });
    }
});
