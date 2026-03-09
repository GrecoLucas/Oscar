import { loginUser, registerUser } from './api.js';

export function renderAuth(appContainer, onLoginSuccess, isLogin = true) {
    let formHtml = '';

    if (isLogin) {
        formHtml = `
            <form id="authForm" class="auth-form">
                <div class="form-group">
                    <label for="userName">Usuário</label>
                    <input type="text" id="userName" class="form-control" required placeholder="Digite o usuário">
                </div>
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" class="form-control" required placeholder="••••••••">
                </div>
                
                <button type="submit" class="btn btn-primary" id="submitBtn" style="width: 100%;">Entrar</button>
                <p class="text-center mt-4" style="font-size:0.9rem">
                    Não tem uma conta? <a href="#" id="toggleAuthMode" style="color:var(--primary-color)">Registre-se</a>
                </p>
                
                <div id="authError" class="error-message hidden"></div>
            </form>
        `;
    } else {
        formHtml = `
            <form id="authForm" class="auth-form">
                <div class="form-group">
                    <label for="userName">Usuário (Como será visto no bolão)</label>
                    <input type="text" id="userName" class="form-control" required placeholder="Digite o usuário">
                </div>
                <div class="form-group">
                    <label for="password">Crie uma Senha</label>
                    <input type="password" id="password" class="form-control" required placeholder="••••••••">
                </div>
                
                <button type="submit" class="btn btn-primary" id="submitBtn" style="width: 100%;">Criar Conta</button>
                <p class="text-center mt-4" style="font-size:0.9rem">
                    Já possui conta? <a href="#" id="toggleAuthMode" style="color:var(--primary-color)">Faça o Login</a>
                </p>
                
                <div id="authError" class="error-message hidden"></div>
            </form>
        `;
    }

    let html = `
        <div class="auth-container fade-in">
            <div class="auth-card glass-panel" style="max-width: 450px;">
                <h2 class="title-glow">Bolão Oscar <span style="color:var(--primary-color)">2026</span></h2>
                <p>${isLogin ? 'Faça login para ver os indicados.' : 'Crie sua conta no bolão.'}</p>
                ${formHtml}
            </div>
        </div>
    `;

    appContainer.innerHTML = html;

    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    const toggleAuthMode = document.getElementById('toggleAuthMode');

    toggleAuthMode?.addEventListener('click', (e) => {
        e.preventDefault();
        renderAuth(appContainer, onLoginSuccess, !isLogin);
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userName = document.getElementById('userName').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('submitBtn');

        if (!userName || !password) return;

        submitBtn.textContent = 'Carregando...';
        submitBtn.disabled = true;
        authError.classList.add('hidden');

        try {
            let userData;
            if (isLogin) {
                userData = await loginUser(userName, password);
            } else {
                userData = await registerUser(userName, password);
            }

            onLoginSuccess(userData);

        } catch (error) {
            authError.textContent = error.message;
            authError.classList.remove('hidden');
            submitBtn.textContent = isLogin ? 'Entrar' : 'Criar Conta';
            submitBtn.disabled = false;
        }
    });
}
