import { fetchDashboardData, fetchUserPredictions, fetchAllPredictions, savePrediction, deletePrediction } from './api.js';

let appState = {
    currentUser: null,
    categories: [],
    nominees: [],
    predictions: [],
    allPredictions: [],
    selectedCategoryIdFilter: 'all',
    isViewingAllPredictions: false
};

export async function renderDashboard(appContainer, currentUser, onLogout) {
    appState.currentUser = currentUser;

    // Initial Shell Loader with Sticky Nav & Modal Structure
    appContainer.innerHTML = `
        <div class="container fade-in">
            <header class="header-nav glass-panel sticky-header">
                <h1>Bolão Oscar</h1>
                <div class="header-actions">
                    <select id="categoryFilter" class="form-control" style="width:auto; display:none;">
                        <option value="all">Todas as Categorias</option>
                    </select>
                    <button class="btn btn-outline" id="btnViewAllPredictions" style="display:none;">Ver Todos Palpites</button>
                    <button id="logoutBtn" class="btn btn-outline" style="padding: 0.5rem 1rem;">Sair</button>
                </div>
            </header>
            
            <main id="mainContent">
                <div class="loader"></div>
            </main>
        </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => {
        onLogout();
    });

    // Fetch Data concurrently
    try {
        const { categories, nominees } = await fetchDashboardData();
        const predictions = await fetchUserPredictions(currentUser.id);

        appState.categories = categories;
        appState.nominees = nominees;
        appState.predictions = predictions;

        setupFilterAndModal();
        renderCategoriesGrid();
    } catch (err) {
        console.error("Error fetching data:", err);
        document.getElementById('mainContent').innerHTML = `
            <div class="error-message">Erro ao carregar os dados. Verifique a conexão com o banco de dados.</div>
        `;
    }
}

function setupFilterAndModal() {
    const filterSelect = document.getElementById('categoryFilter');

    filterSelect.style.display = 'inline-block';
    document.getElementById('btnViewAllPredictions').style.display = 'inline-block';

    appState.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        filterSelect.appendChild(opt);
    });

    filterSelect.addEventListener('change', (e) => {
        appState.selectedCategoryIdFilter = e.target.value;
        renderCategoriesGrid();
    });

    // View All Predictions Logic
    const btnViewAll = document.getElementById('btnViewAllPredictions');
    const mainContent = document.getElementById('mainContent');

    btnViewAll.addEventListener('click', async () => {
        appState.isViewingAllPredictions = !appState.isViewingAllPredictions;

        if (appState.isViewingAllPredictions) {
            btnViewAll.textContent = 'Voltar ao Início';
            filterSelect.style.display = 'none';

            // Render basic layout for the new view page directly into mainContent
            mainContent.innerHTML = `
                <div class="fade-in" style="margin-bottom: 2rem;">
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="color: var(--primary-color);">Palpites de Todos</h2>
                    </div>
                    <div class="form-group">
                        <input type="text" id="searchUserInput" class="form-control" placeholder="Buscar por nome do utilizador..." style="width: 100%; max-width: 400px; margin-bottom: 2rem;">
                    </div>
                    <div id="allPredictionsContentWrapper">
                        <div class="loader"></div>
                    </div>
                </div>
            `;

            const searchInput = document.getElementById('searchUserInput');
            const contentWrapper = document.getElementById('allPredictionsContentWrapper');

            searchInput.addEventListener('input', (e) => {
                renderAllPredictionsContent(contentWrapper, e.target.value);
            });

            try {
                const allPreds = await fetchAllPredictions();
                appState.allPredictions = allPreds;
                renderAllPredictionsContent(contentWrapper, '');
            } catch (err) {
                console.error("Erro", err);
                contentWrapper.innerHTML = '<div class="error-message">Erro ao carregar palpites.</div>';
            }
        } else {
            // Revert back to original view
            btnViewAll.textContent = 'Ver Todos Palpites';
            filterSelect.style.display = 'inline-block';
            renderCategoriesGrid();
        }
    });

}

async function handleNomineeClick(catId, nomId, nomineeItem) {
    if (nomineeItem.classList.contains('nominee-loading')) return;

    const existingPred = appState.predictions.find(p => p.category_id == catId);
    const isAlreadySelected = existingPred && existingPred.nominee_id == nomId;

    nomineeItem.classList.add('nominee-loading');

    try {
        if (isAlreadySelected) {
            // DE-SELECT
            await deletePrediction(appState.currentUser.id, parseInt(catId));

            // Update local state
            appState.predictions = appState.predictions.filter(p => p.category_id != catId);
        } else {
            // SELECT / CHANGE
            const updatedPred = await savePrediction(appState.currentUser.id, parseInt(catId), parseInt(nomId));

            // Update local state
            const existingIdx = appState.predictions.findIndex(p => p.category_id == catId);
            if (existingIdx >= 0) {
                appState.predictions[existingIdx] = updatedPred;
            } else {
                appState.predictions.push(updatedPred);
            }
        }

        renderCategoriesGrid();

    } catch (err) {
        console.error("Erro ao processar palpite", err);
        alert("Erro ao processar palpite. Tente novamente.");
        nomineeItem.classList.remove('nominee-loading');
    }
}

function renderAllPredictionsContent(container, searchStr = '') {
    if (appState.allPredictions.length === 0) {
        container.innerHTML = '<p class="text-center" style="margin-top: 2rem;">Ninguém fez palpites ainda!</p>';
        return;
    }

    // Group predictions by User
    const groupedByUser = {};

    appState.allPredictions.forEach(pred => {
        const username = pred.users?.username || 'Desconhecido';

        // Apply search filter if there is one
        if (searchStr && !username.toLowerCase().includes(searchStr.toLowerCase())) {
            return;
        }

        if (!groupedByUser[username]) {
            groupedByUser[username] = [];
        }
        groupedByUser[username].push(pred);
    });

    const users = Object.keys(groupedByUser).sort(); // sort alphabetically

    if (users.length === 0) {
        container.innerHTML = '<p class="text-center" style="margin-top: 2rem;">Nenhum utilizador encontrado com esse nome.</p>';
        return;
    }

    let html = '<div class="global-predictions-list" style="display:flex; flex-direction:column; gap:1.5rem;">';

    users.forEach(username => {
        const userPreds = groupedByUser[username];

        html += `
            <div class="category-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem; margin-bottom: 1rem;">
                    <h3 style="color:var(--primary-color); margin: 0; display:flex; align-items:center; gap:0.5rem;">
                        <span style="font-size:1.5rem">👤</span> ${username}
                    </h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 0.2rem 0.6rem; border-radius: 12px;">${userPreds.length} Palpites</span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
        `;

        // Sort by Category Name
        userPreds.sort((a, b) => {
            const catA = appState.categories.find(c => c.id === a.category_id)?.name || '';
            const catB = appState.categories.find(c => c.id === b.category_id)?.name || '';
            return catA.localeCompare(catB);
        }).forEach(pred => {
            const catName = appState.categories.find(c => c.id === pred.category_id)?.name || 'Categoria Desconhecida';
            const nomName = pred.nominees ? pred.nominees.name : 'Vazio';
            const movieInfo = (pred.nominees && pred.nominees.movie) ? ` <span style="font-size:0.8rem; color:var(--text-muted); display:block; margin-top:0.2rem;">${pred.nominees.movie}</span>` : '';

            html += `
                <div style="padding: 0.8rem; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid var(--primary-color);">
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">${catName}</div>
                    <div style="font-weight: 500; font-size: 1rem;">${nomName}</div>
                    ${movieInfo}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderCategoriesGrid() {
    const mainContent = document.getElementById('mainContent');
    const { categories, nominees, predictions, selectedCategoryIdFilter } = appState;

    let displayCategories = categories;
    if (selectedCategoryIdFilter !== 'all') {
        displayCategories = categories.filter(c => c.id == selectedCategoryIdFilter);
    }

    if (displayCategories.length === 0) {
        mainContent.innerHTML = '<p class="text-center">Nenhuma categoria encontrada.</p>';
        return;
    }

    let html = '<div class="categories-grid fade-in" style="animation-delay: 0.1s">';

    displayCategories.forEach(category => {
        const catsNominees = nominees.filter(n => n.category_id === category.id);
        const userPred = predictions.find(p => p.category_id === category.id);

        html += `
            <div class="category-card" data-category-id="${category.id}">
                <div class="category-header">
                    <h3>${category.name}</h3>
                </div>
                <ul class="nominees-list">
        `;

        if (catsNominees.length === 0) {
            html += '<li class="nominee-item"><span class="nominee-name" style="color:var(--text-muted)">Nenhum indicado.</span></li>';
        } else {
            catsNominees.forEach(nominee => {
                const isSelected = userPred && userPred.nominee_id === nominee.id;
                html += `
                    <li class="nominee-item ${isSelected ? 'nominee-selected' : ''}" data-nominee-id="${nominee.id}">
                        ${isSelected ? '<span class="prediction-badge">Seu Palpite</span>' : ''}
                        <span class="nominee-name">${nominee.name}</span>
                        ${nominee.movie ? `<span class="nominee-movie">${nominee.movie}</span>` : ''}
                    </li>
                `;
            });
        }

        html += `
                </ul>
            </div>
        `;
    });

    html += '</div>';
    mainContent.innerHTML = html;

    // Attach click events
    const items = mainContent.querySelectorAll('.nominee-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const nomId = item.getAttribute('data-nominee-id');
            const catId = item.closest('.category-card').getAttribute('data-category-id');
            if (nomId && catId) {
                handleNomineeClick(catId, nomId, item);
            }
        });
    });
}
