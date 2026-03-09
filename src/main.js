import { renderAuth } from './auth.js';
import { renderDashboard } from './dashboard.js';

// --- STATE MANAGEMENT ---
let currentUser = null;

// --- DOM ELEMENTS ---
const appContainer = document.getElementById('app');

// --- APP INITIALIZATION ---
function init() {
    console.log("Initializing Bolão Oscar App...");

    // Check initial session from localStorage
    const storedUser = localStorage.getItem('bolao_user');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.error("Error parsing stored user", e);
            localStorage.removeItem('bolao_user');
        }
    }

    render();
}

// --- RENDER CONTROLLER ---
function render() {
    appContainer.innerHTML = ''; // Clear current view

    if (currentUser) {
        renderDashboard(appContainer, currentUser, handleLogout);
    } else {
        renderAuth(appContainer, handleLoginSuccess);
    }
}

// --- HANDLERS ---
function handleLoginSuccess(user) {
    currentUser = user;
    localStorage.setItem('bolao_user', JSON.stringify(currentUser));
    render();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('bolao_user');
    render();
}

// Start App when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
