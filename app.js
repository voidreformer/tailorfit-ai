document.addEventListener('DOMContentLoaded', () => {
  const resumeInput = document.getElementById('resume-input');
  const jobInput = document.getElementById('job-input');
  const optimizeBtn = document.getElementById('optimize-btn');
  const resultsPanel = document.getElementById('results-panel');

  const origScoreEl = document.getElementById('orig-score');
  const optScoreEl = document.getElementById('opt-score');
  const missingKwWrapper = document.getElementById('missing-keywords-wrapper');
  const execSummaryEl = document.getElementById('executive-summary-display');
  const outputResumeEl = document.getElementById('output-resume-content');
  const copyBtn = document.getElementById('copy-btn');
  const aiStatusBadge = document.getElementById('ai-status-badge');

  // Navigation
  const navDashboard = document.getElementById('nav-dashboard');
  const navHistory = document.getElementById('nav-history');
  const viewDashboard = document.getElementById('view-dashboard-container');
  const viewHistory = document.getElementById('view-history-container');
  const historyContainer = document.getElementById('history-items-container');

  // Auth State
  let currentUser = null;
  let isRegisterMode = false;

  const userProfileBtn = document.getElementById('user-profile-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userNameDisplay = document.getElementById('user-name-display');
  const userRoleDisplay = document.getElementById('user-role-display');

  const authModal = document.getElementById('auth-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const authForm = document.getElementById('auth-form');
  const authName = document.getElementById('auth-name');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const nameGroup = document.getElementById('name-group');
  const modalTitle = document.getElementById('modal-title');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authToggleBtn = document.getElementById('auth-toggle-btn');
  const authToggleText = document.getElementById('auth-toggle-text');
  const authErrorMsg = document.getElementById('auth-error-msg');

  function getToken() { return localStorage.getItem('tailorfit_auth_token'); }
  function setToken(token) { localStorage.setItem('tailorfit_auth_token', token); }
  function removeToken() { localStorage.removeItem('tailorfit_auth_token'); }

  async function checkAuth() {
    const token = getToken();
    if (!token) return updateUserUI(null);

    try {
      const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        updateUserUI(currentUser);
      } else {
        removeToken();
        updateUserUI(null);
      }
    } catch(e) {
      updateUserUI(null);
    }
  }

  function updateUserUI(user) {
    if (user) {
      userAvatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'C';
      userNameDisplay.textContent = user.name;
      userRoleDisplay.textContent = 'Authenticated (Logout)';
    } else {
      userAvatar.textContent = '?';
      userNameDisplay.textContent = 'Guest Mode';
      userRoleDisplay.textContent = 'Click to Login / Register';
    }
  }

  userProfileBtn.addEventListener('click', () => {
    if (currentUser) {
      if (confirm(`Logout from ${currentUser.email}?`)) {
        removeToken();
        currentUser = null;
        updateUserUI(null);
      }
    } else {
      openAuthModal(false);
    }
  });

  function openAuthModal(registerMode = false) {
    isRegisterMode = registerMode;
    authErrorMsg.classList.add('hidden');
    authForm.reset();
    if (isRegisterMode) {
      modalTitle.textContent = 'Register for TailorFit.ai';
      nameGroup.style.display = 'block';
      authSubmitBtn.textContent = 'Register Account';
      authToggleText.innerHTML = 'Already have an account? <a href="#" id="auth-toggle-btn">Sign in here</a>';
    } else {
      modalTitle.textContent = 'Login to TailorFit.ai';
      nameGroup.style.display = 'none';
      authSubmitBtn.textContent = 'Sign In';
      authToggleText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-toggle-btn">Register here</a>';
    }
    document.getElementById('auth-toggle-btn').addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal(!isRegisterMode);
    });
    authModal.classList.remove('hidden');
  }

  closeModalBtn.addEventListener('click', () => authModal.classList.add('hidden'));

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorMsg.classList.add('hidden');

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode
      ? { name: authName.value, email: authEmail.value, password: authPassword.value }
      : { email: authEmail.value, password: authPassword.value };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setToken(data.token);
      currentUser = data.user;
      updateUserUI(currentUser);
      authModal.classList.add('hidden');
    } catch(err) {
      authErrorMsg.textContent = err.message;
      authErrorMsg.classList.remove('hidden');
    }
  });

  // Navigation
  navDashboard.addEventListener('click', () => {
    navDashboard.classList.add('active');
    navHistory.classList.remove('active');
    viewDashboard.classList.remove('hidden');
    viewHistory.classList.add('hidden');
  });

  navHistory.addEventListener('click', () => {
    navHistory.classList.add('active');
    navDashboard.classList.remove('active');
    viewHistory.classList.remove('hidden');
    viewDashboard.classList.add('hidden');
    loadHistory();
  });

  async function loadHistory() {
    historyContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 20px;">Loading saved resume scans...</div>';
    const token = getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const res = await fetch('/api/history', { headers });
      const data = await res.json();

      if (!data.history || data.history.length === 0) {
        historyContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 20px;">No saved resume scans found. Scan a resume on the Tailor Tool tab to save reports!</div>';
        return;
      }

      historyContainer.innerHTML = '';
      data.history.forEach(item => {
        const dateStr = new Date(item.created_at).toLocaleString();
        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 12px;';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-weight: 700; color: #fff; font-size: 15px;">Scan #${item.id.substring(0,8)}</span>
              <span style="background: #10b981; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">Match: ${item.optimized_score}%</span>
            </div>
            <span style="color: #94a3b8; font-size: 12px;">📅 ${dateStr}</span>
          </div>
          <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 8px;"><strong>Summary:</strong> ${item.executive_summary}</p>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${(item.missing_keywords || []).map(kw => `<span style="background: rgba(239,68,68,0.2); color: #f87171; font-size: 11px; padding: 2px 8px; border-radius: 4px;">+ ${kw}</span>`).join('')}
          </div>
        `;
        historyContainer.appendChild(card);
      });
    } catch(err) {
      historyContainer.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">Failed to load history: ${err.message}</div>`;
    }
  }

  // Scan & Optimize Button
  optimizeBtn.addEventListener('click', async () => {
    const resume = resumeInput.value.trim();
    const jobDescription = jobInput.value.trim();

    if (!resume || !jobDescription) {
      alert('Please paste both your candidate resume and target job description.');
      return;
    }

    optimizeBtn.textContent = 'Scanning & Optimizing ATS Bullet Points...';
    optimizeBtn.disabled = true;
    if (aiStatusBadge) aiStatusBadge.textContent = 'Processing via NVIDIA Nemotron...';

    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ resume, jobDescription })
      });

      if (!res.ok) throw new Error('API error or server offline');
      const data = await res.json();

      resultsPanel.classList.remove('hidden');
      origScoreEl.textContent = `${data.original_score}%`;
      optScoreEl.textContent = `${data.optimized_score}%`;

      missingKwWrapper.innerHTML = '';
      if (data.missing_keywords) {
        data.missing_keywords.forEach(kw => {
          missingKwWrapper.innerHTML += `<span class="tag missing-tag">+ ${kw}</span>`;
        });
      }

      if (execSummaryEl) execSummaryEl.textContent = data.executive_summary;
      if (outputResumeEl) outputResumeEl.value = data.optimized_resume;

    } catch(err) {
      alert('Optimization error: ' + err.message);
    } finally {
      optimizeBtn.textContent = 'Scan & Optimize Resume';
      optimizeBtn.disabled = false;
      if (aiStatusBadge) aiStatusBadge.textContent = 'NVIDIA Nemotron ATS Engine';
    }
  });

  copyBtn.addEventListener('click', () => {
    if (!outputResumeEl.value) return;
    navigator.clipboard.writeText(outputResumeEl.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy Resume', 2000);
  });

  checkAuth();
});
