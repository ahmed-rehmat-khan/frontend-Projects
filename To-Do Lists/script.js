const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');

const sampleTodos = [
    { text: 'Learn Git basics', completed: false },
    { text: 'Complete section 8 video', completed: false },
    { text: 'Practice Git commands', completed: true },
    { text: 'Review data analytics course', completed: false },
    { text: 'Prepare project presentation', completed: false }
];

let todos = JSON.parse(localStorage.getItem('todos')) || sampleTodos;

function loadTodos() {
    todoList.innerHTML = '';

    if (todos.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        todos.forEach((todo, index) => {
            addTodoElement(todo, index);
        });
    }

    updateStats();
}

function addTodoElement(todo, index) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

    li.style.animationDelay = `${index * 0.05}s`;

    li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    onchange="toggleTodo(${index})"
                >
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="deleteTodo(${index})">Delete</button>
            `;

    todoList.appendChild(li);
}

function addTodo() {
    const text = todoInput.value.trim();

    if (text === '') {
        alert('Please enter a task!');
        return;
    }

    todos.push({ text: text, completed: false });
    todoInput.value = '';
    saveTodos();
    loadTodos();
    todoInput.focus();
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    loadTodos();
}

function deleteTodo(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        const todoItems = document.querySelectorAll('.todo-item');
        todoItems[index].classList.add('deleting');

        setTimeout(() => {
            todos.splice(index, 1);
            saveTodos();
            loadTodos();
        }, 400);
    }
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const remaining = total - completed;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('remainingCount').textContent = remaining;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

todoInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});

loadTodos();

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    document.querySelector('.theme-toggle').textContent = '☀️';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const themeToggle = document.querySelector('.theme-toggle');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.textContent = '🌙';
    }
}

function clearCompleted() {
    const completedCount = todos.filter(t => t.completed).length;

    if (completedCount === 0) {
        alert('No completed tasks to clear!');
        return;
    }

    if (confirm(`Clear ${completedCount} completed task(s)?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        loadTodos();
    }
}

function exportTodos() {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('✅ Tasks exported successfully!');
}

function importTodos() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const importedTodos = JSON.parse(event.target.result);

                if (!Array.isArray(importedTodos)) {
                    throw new Error('Invalid format');
                }

                if (confirm('Replace current tasks with imported ones?')) {
                    todos = importedTodos;
                    saveTodos();
                    loadTodos();
                    alert('✅ Tasks imported successfully!');
                }
            } catch (err) {
                alert('❌ Error importing file. Make sure it\'s a valid JSON file.');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

function showAbout() {
    alert('️📝 Todo Pro\n\nA beautiful, feature-rich todo list application.\n\nFeatures:\n✅ Add, complete, and delete tasks\n🌙 Dark/Light mode\n💾 Auto-save to local storage\n📥 Export/Import tasks\n📊 Live statistics\n\nMade with ❤️ using HTML, CSS & JavaScript');
}
