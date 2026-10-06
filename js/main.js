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

  const sortBtn = document.createElement('button');
  sortBtn.type = 'button';          
  sortBtn.className = 'task-form__sort';
  sortBtn.textContent = 'Сортировать по дате';

  sortBtn.addEventListener('click', () => {
    if (sortDirection === null) sortDirection = 'asc';
    else if (sortDirection === 'asc') sortDirection = 'desc';
    else sortDirection = null;

    updateSortBtnLabel();
    renderTasks();
  });

  // Обновление кнопки при сортировке 
  function updateSortBtnLabel() {
    if (sortDirection === 'asc') sortBtn.textContent = 'Дата ↑';
    else if (sortDirection === 'desc') sortBtn.textContent = 'Дата ↓';
    else sortBtn.textContent = 'Сортировать по дате';
  }

  // Фильтр по статусу
  const filterSelect = document.createElement('select');
  filterSelect.className = 'task-form__filter';
  filterSelect.setAttribute('aria-label', 'Фильтр по статусу');

  const filterOptions = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'completed', label: 'Выполненные' },
  ];

  for (const opt of filterOptions) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    filterSelect.append(option);
  }

  filterSelect.addEventListener('change', () => {
    filterMode = filterSelect.value;
    renderTasks();
  });

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'task-form__search';
  searchInput.placeholder = 'Поиск по названию...';
  searchInput.setAttribute('aria-label', 'Поиск задач по названию');

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderTasks();
  });

  form.append(input, dateInput, submitBtn, sortBtn, filterSelect, searchInput);

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

  let editingId = null;
  let sortDirection = null;
  let filterMode = 'all';
  let searchQuery = '';

  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task';
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('task--done');

    if (editingId === task.id) {
      return createEditMode(task, li);
    }

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
    deleteBtn.textContent = 'X';
    deleteBtn.setAttribute('aria-label', 'Удалить задачу');

    deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
    });

    const doneCheckBox = document.createElement('input');
    doneCheckBox.type = 'checkbox';
    doneCheckBox.className = 'task__done';
    doneCheckBox.checked = task.completed;
    doneCheckBox.setAttribute('aria-label', 'Отметить как выполненную');

    doneCheckBox.addEventListener('click', () => {
        task.completed = doneCheckBox.checked;
        saveTasks();
        renderTasks();
    });

    // Кнопка редактирования
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'task__edit';
    editBtn.textContent = '✎';
    editBtn.setAttribute('aria-label', 'Редактировать задачу');
    editBtn.addEventListener('click', () => {
      editingId = task.id;
      renderTasks();
      // после перерисовки ставим фокус в поле ввода
      const editInput = list.querySelector(`.task[data-id="${task.id}"] .task__edit-input`);
      editInput?.focus();
    });

    

    li.append(doneCheckBox, content, editBtn, deleteBtn);
    
    return li;
  }

  // Отображение задач
  function renderTasks() {
    list.innerHTML = '';

    // Фильтрация
    let visible = tasks;
    if (filterMode === 'active') {
      visible = visible.filter((t) => !t.completed);
    } else if (filterMode === 'completed') {
      visible = visible.filter((t) => t.completed);
    }

    // Поиск по названию
    if (searchQuery) {
      visible = visible.filter((t) =>
        t.text.toLowerCase().includes(searchQuery)
      );
    }

    // Сортировка
    if (sortDirection) {
      visible = getSortedTasks(visible);
    }

    for (const task of visible) {
      list.append(createTaskElement(task));
    }
  }

  // Сортировка по дате
  function getSortedTasks(source) {
    const copy = [...source];
    copy.sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';

      // Задачи без даты всегда в конец (независимо от направления)
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;

      return sortDirection === 'asc'
        ? da.localeCompare(db)
        : db.localeCompare(da);
    });
    return copy;
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


  // Редактирование задачи
  function createEditMode(task, li) {
    const form = document.createElement('form');
    form.className = 'task__edit-form';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'task__edit-input';
    textInput.value = task.text;
    textInput.required = true;
    textInput.setAttribute('aria-label', 'Название задачи');

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'task__edit-date';
    dateInput.value = task.date || '';
    dateInput.setAttribute('aria-label', 'Дата задачи');

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'task__save';
    saveBtn.textContent = '✓';
    saveBtn.setAttribute('aria-label', 'Сохранить изменения');

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'task__cancel';
    cancelBtn.textContent = 'X';
    cancelBtn.setAttribute('aria-label', 'Отменить редактирование');
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      renderTasks();
    });

    form.append(textInput, dateInput, saveBtn, cancelBtn);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const newText = textInput.value.trim();
      if (!newText) return;

      task.text = newText;
      task.date = dateInput.value;
      editingId = null;

      saveTasks();
      renderTasks();
    });

    li.append(form);
    return li;
  }

  // Старт страницы
  renderTasks();
}

document.addEventListener('DOMContentLoaded', init);