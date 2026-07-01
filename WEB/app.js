// ===== API БАЗОВЫЙ URL =====
const API_BASE_URL = "http://127.0.0.1:8000";

// ===== DOM ЭЛЕМЕНТЫ =====
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksList = document.getElementById('tasksList');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const remainingTasks = document.getElementById('remainingTasks');

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

// 📥 Загрузка всех задач
async function LoadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        const tasks = await response.json();
        renderTasks(tasks);
        updateStats(tasks);
    } catch (error) {
        console.error('Ошибка загрузки задач:', error);
        showError('Не удалось загрузить задачи');
    }
}

// ➕ Добавление задачи
async function AddTask(title) {
    if (!title || title.trim() === '') {
        showError('Введите текст задачи!');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: title.trim(),
            })
        });

        const data = await response.json();
        
        if (data.success === true) {
            console.log(`✅ Задача "${title.trim()}" успешно добавлена`);
            taskInput.value = '';
            taskInput.focus();
            await LoadTasks(); // Обновляем список
            return true;
        } else {
            showError('Ошибка при добавлении задачи');
            return false;
        }
    } catch (error) {
        console.error('Ошибка добавления:', error);
        showError('Не удалось добавить задачу');
        return false;
    }
}

// ✏️ Обновление задачи (completed)
async function UpdateTask(taskId, completed) {
    try {
        // Находим задачу в DOM для получения текущего заголовка
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const titleElement = taskElement?.querySelector('.task-title');
        const currentTitle = titleElement?.textContent || '';

        const response = await fetch(`${API_BASE_URL}/tasks/update/${taskId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: currentTitle,
                completed: completed
            })
        });

        const data = await response.json();
        
        if (data.success === true) {
            console.log(`✅ Задача ${taskId} обновлена`);
            await LoadTasks(); // Обновляем список
            return true;
        } else {
            showError('Ошибка при обновлении задачи');
            return false;
        }
    } catch (error) {
        console.error('Ошибка обновления:', error);
        showError('Не удалось обновить задачу');
        return false;
    }
}

// 🗑️ Удаление задачи
async function DeleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: "DELETE",
        });

        const data = await response.json();
        
        if (data.success === true) {
            console.log(`✅ Задача ${taskId} удалена`);
            await LoadTasks(); // Обновляем список
            return true;
        } else {
            showError('Ошибка при удалении задачи');
            return false;
        }
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showError('Не удалось удалить задачу');
        return false;
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

// 🎨 Отрисовка задач
function renderTasks(tasks) {
    if (!tasks || tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>Нет задач</p>
                <p class="empty-sub">Добавьте свою первую задачу!</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-content">
                <input type="checkbox" class="task-checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="handleCheckboxChange('${task.id}', this.checked)">
                <span class="task-title">${escapeHtml(task.title)}</span>
            </div>
            <div class="task-actions">
                <button class="delete-btn" onclick="handleDelete('${task.id}')" title="Удалить">
                    ❌
                </button>
            </div>
        </div>
    `).join('');
}

// 📊 Обновление статистики
function updateStats(tasks) {
    const total = tasks?.length || 0;
    const completed = tasks?.filter(t => t.completed).length || 0;
    const remaining = total - completed;

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    remainingTasks.textContent = remaining;
}

// 🛡️ Экранирование HTML (безопасность)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ❌ Показ ошибок
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
        animation: slideIn 0.3s ease;
        z-index: 1000;
        max-width: 400px;
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

// 📝 Обработка добавления задачи
function handleAddTask() {
    const title = taskInput.value.trim();
    if (title) {
        AddTask(title);
    } else {
        showError('Введите текст задачи!');
        taskInput.focus();
    }
}

// ✅ Обработка изменения чекбокса
async function handleCheckboxChange(taskId, completed) {
    await UpdateTask(taskId, completed);
}

// 🗑️ Обработка удаления
async function handleDelete(taskId) {
    await DeleteTask(taskId);
}

// ===== НАВЕШИВАНИЕ СОБЫТИЙ =====

// Добавление по клику
addTaskBtn.addEventListener('click', handleAddTask);

// Добавление по Enter
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTask();
    }
});

// Фокус на поле ввода при загрузке
window.addEventListener('load', () => {
    taskInput.focus();
    LoadTasks();
});

// Обновление задач при возвращении на вкладку
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        LoadTasks();
    }
});

// ===== ДОПОЛНИТЕЛЬНЫЙ ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС =====

// Подсказка в консоли
console.log('📋 Task Manager загружен!');
console.log('💡 Используйте поле ввода для добавления задач');
console.log(`🔗 API URL: ${API_BASE_URL}`);