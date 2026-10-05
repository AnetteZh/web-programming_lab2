const STORAGE_KEY = 'todo.tasks';

function init() {
  // Заголовок
  const title = document.createElement('h1');
  title.textContent = 'To-Do List';
  title.className = 'app-title';

  // Контейнер
  const app = document.createElement('main');
  app.className = 'app';

  // Форма
  const form = document.createElement('form');
  form.className = 'task-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-form__input';
  input.placeholder = 'Новая задача...';
  input.required = true;
  input.setAttribute('aria-label', 'Название задачи');

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'task-form__date';
  dateInput.setAttribute('aria-label', 'Дата задачи');

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'task-form__submit';
  submitBtn.textContent = 'Добавить';

  form.append(input, dateInput, submitBtn);

  // Список
  const list = document.createElement('ul');
  list.className = 'task-list';

  // Сборка
  app.append(form, list);
  document.body.append(title, app);

  let tasks = loadTasks();

  // LocalStorage
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Не удалось прочитать задачи из localStorage:', err);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.warn('Не удалось сохранить задачи в localStorage:', err);
    }
  }

  // Рендер
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task';
    li.dataset.id = task.id;

    const content = document.createElement('div');
    content.className = 'task__content';

    const text = document.createElement('span');
    text.className = 'task__text';
    text.textContent = task.text;

    const date = document.createElement('span');
    date.className = 'task__date';
    date.textContent = task.date || '—';

    content.append(text, date);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task__delete';
    deleteBtn.textContent = 'Удалить';
    deleteBtn.setAttribute('aria-label', 'Удалить задачу');

    deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
    });

    li.append(content, deleteBtn);
    
    return li;
  }

  function renderTasks() {
    list.innerHTML = '';
    for (const task of tasks) {
      list.append(createTaskElement(task));
    }
  }

  // Добавление задачи
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const textValue = input.value.trim();
    if (!textValue) return;

    const task = {
      id: Date.now().toString(),
      text: textValue,
      date: dateInput.value,
      completed: false,
    };

    tasks.push(task);
    saveTasks();
    renderTasks();

    form.reset();
    input.focus();
  });


  // Старт страницы
  renderTasks();
}

document.addEventListener('DOMContentLoaded', init);