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
        <h3><a href="#" class="quest-link">${title}</a></h3>
        ${descripiton ? `<p>${descripiton}</p>` : ''}
        </div>
        <button class="delete-btn">Удалить</button>
        `;

    // удаление Сообщения "Пока квестов нет"
    const  emptyMessage = questlist.querySelector('.empty');
    if(emptyMessage) {
        emptyMessage.remove();
    }

    //Добавить квест в список
    questlist.appendChild(questItem);

    //Скрыть форму и очистить поля
    questform.classList.add('hidden');
    createQuestBtn.classList.remove('hidden');
    document.getElementById('quest-title').value = '';
    document.getElementById('quest-description').value = '';
})

//Удаление квеста(добавление делегированных событий)
questlist.addEventListener('click', (e) => {
    if(e.target.classList.contains('delete-btn')){
        const questItem = e.target.parentElement;
        questItem.remove();
        if(questlist.children.length === 0){
            questlist.innerHTML = '<p class="empty">Пока квестов нет. Создай первый!</p>';
        }
    } else if (e.target.classList.contains('quest-link')){
        e.preventDefault();
        alert(`Переход на страницу квеста "${e.target.textContent}" (скоро будет готово!)`);
    }
})

//Заглушки
document.getElementById('profile-link').addEventListener('click', (e) =>{
    e.preventDefault();
    alert('Профиль покуда в разработке!');
});

document.getElementById('chat-link').addEventListener('click',(e) => {
    e.preventDefault();
    alert('Чат скоро будет готов!')
});












