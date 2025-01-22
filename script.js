const addTaskButton = document.getElementById("task_add_id");
const inputValue = document.getElementById("addTask");
const taskListDiv = document.getElementById("createdTask");
const taskDetailsDiv = document.getElementById("taskDetails");
const calendarDiv = document.getElementById("calendar");
const currentMonthYear = document.getElementById("currentMonthYear");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const modalCloseButton = document.getElementById("modalClose");

const API_KEY = "WM1p3fnqvtmitClGRwIPET0NKHoYHmi5"; // Replace with your Calendarific API key
let taskLibrary = {}; // Stores tasks grouped by dates
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = new Date().toISOString().split("T")[0]; // Default to today

// Modal functions
function showModal(content) {
    document.getElementById("modalBody").innerHTML = content;
    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

modalCloseButton.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

// Fetch holidays from the API
async function fetchHolidays(year, month) {
    try {
        const response = await fetch(
            `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=IN&year=${year}`
        );
        const data = await response.json();
        const holidays = data.response.holidays.filter((holiday) => {
            const holidayDate = new Date(holiday.date.iso);
            return holidayDate.getMonth() === month; // Filter holidays by month
        });
        return holidays.map((holiday) => holiday.date.iso); // Return an array of holiday dates
    } catch (error) {
        console.error("Error fetching holidays:", error);
        return [];
    }
}

// Generate the calendar
async function generateCalendar(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const holidays = await fetchHolidays(year, month);

    currentMonthYear.textContent = `${new Date(year, month).toLocaleString("default", {
        month: "long",
    })} ${year}`;

    let calendarHTML = `<table class="w-full text-center text-white">
        <thead>
            <tr>
                <th>Sun</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
            </tr>
        </thead>
        <tbody>
            <tr>`;

    // Add empty cells before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<td class="text-gray-500"></td>`;
    }

    // Add days with holiday highlighting and selection support
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isHoliday = holidays.includes(dateStr);
        const isSelected = dateStr === selectedDate;

        calendarHTML += `
            <td class="cursor-pointer ${isHoliday ? 'bg-red-500' : ''} ${
            isSelected ? 'bg-green-500 text-white' : 'hover:bg-blue-500'
        } rounded-lg" onclick="selectDate('${dateStr}')">
                ${day}
            </td>`;

        if ((day + firstDay) % 7 === 0) {
            calendarHTML += `</tr><tr>`;
        }
    }

    calendarHTML += `</tr></tbody></table>`;
    calendarDiv.innerHTML = calendarHTML;
}

// Select a date from the calendar
function selectDate(date) {
    selectedDate = date;
    generateCalendar(currentYear, currentMonth); // Re-render calendar to highlight selected date
    renderTasksForDate(date); // Show tasks for selected date
}

// Render tasks for a selected date
function renderTasksForDate(date) {
    taskListDiv.innerHTML = "";

    const tasks = taskLibrary[date] || [];
    tasks.forEach((task) => {
        const createDiv = document.createElement("div");
        createDiv.className =
            "task flex justify-between items-center bg-gray-800 text-white p-4 rounded-lg shadow-md mb-4 mt-3";
        createDiv.id = task.id;

        createDiv.innerHTML = `
            <div>
                <p class="text-lg font-medium">${task.task}</p>
                <p class="text-sm text-gray-400">${task.creationTime.toLocaleString()}</p>
                <p class="text-sm ${
                    task.status === "completed" ? "text-green-500" : "text-yellow-400"
                }">${task.status}</p>
            </div>
            <button class="remove-btn px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-200"
                onclick="removeTask('${task.id}')">Remove</button>
        `;

        // Add event listener to show task details
        createDiv.addEventListener("click", () => showTaskDetails(task));

        taskListDiv.appendChild(createDiv);
    });
}

// Display task details
function showTaskDetails(task) {
    taskDetailsDiv.innerHTML = `
        <h3 class="text-xl font-semibold mb-2">${task.task}</h3>
        <p><strong>Creation Time:</strong> ${task.creationTime.toLocaleString()}</p>
        <p><strong>Status:</strong> 
            <span class="${
                task.status === "completed" ? "text-green-500" : "text-yellow-400"
            }">${task.status}</span>
        </p>
        <button 
            class="px-4 py-2 ${task.status === "completed" ? 'bg-yellow-500' : 'bg-green-500'} text-white font-semibold rounded-lg hover:bg-opacity-80 transition duration-200"
            onclick="toggleTaskStatus('${task.id}')">
            ${task.status === "completed" ? "Mark as Pending" : "Mark as Completed"}
        </button>
    `;
}

// Toggle task status
function toggleTaskStatus(id) {
    const tasks = taskLibrary[selectedDate];
    if (tasks) {
        const task = tasks.find((task) => task.id === id);
        if (task) {
            task.status = task.status === "completed" ? "pending" : "completed";
            renderTasksForDate(selectedDate);
            showTaskDetails(task);
        }
    }
}

// Remove a task
function removeTask(id) {
    const tasks = taskLibrary[selectedDate] || [];
    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex > -1) {
        tasks.splice(taskIndex, 1); // Remove task from taskLibrary
        renderTasksForDate(selectedDate); // Re-render tasks
        showModal("Task removed successfully");
    }
}

// Add a task
addTaskButton.addEventListener("click", () => {
    if (inputValue.value.trim() === "") {
        showModal("Task cannot be empty!");
        return;
    }

    const taskData = {
        id: `task_${Math.random().toString(36).substr(2, 9)}`,
        task: inputValue.value,
        status: "pending",
        creationTime: new Date(),
    };

    if (!taskLibrary[selectedDate]) {
        taskLibrary[selectedDate] = [];
    }
    taskLibrary[selectedDate].push(taskData);

    renderTasksForDate(selectedDate); // Re-render tasks
    inputValue.value = ""; // Clear input
    showModal("Task added successfully!");
});

// Navigate to the previous month
prevMonthButton.addEventListener("click", () => {
    currentMonth -= 1;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
    }
    generateCalendar(currentYear, currentMonth);
});

// Navigate to the next month
nextMonthButton.addEventListener("click", () => {
    currentMonth += 1;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
    }
    generateCalendar(currentYear, currentMonth);
});

// Initialize the calendar
generateCalendar(currentYear, currentMonth);
