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

  // Sample Presets
  const sampleSweBtn = document.getElementById('sample-swe-btn');
  const samplePmBtn = document.getElementById('sample-pm-btn');

  if (sampleSweBtn) {
    sampleSweBtn.addEventListener('click', () => {
      resumeInput.value = `ALEX RIVERA
Software Engineer | Full Stack Specialist
Email: alex.rivera@example.com | GitHub: github.com/arivera | LinkedIn: linkedin.com/in/arivera

SUMMARY
Experienced Full Stack Engineer with 4 years building scalable web applications. Skilled in React, Node.js, Express, and PostgreSQL. Focused on clean code, unit testing, and performant REST APIs.

EXPERIENCE
Software Engineer | Acme Tech Inc | 2022 - Present
- Developed customer-facing React dashboard used by 50k monthly active users.
- Built backend REST endpoints using Node.js and PostgreSQL to handle order processing.
- Collaborated with product designers to implement responsive UI layouts.

Junior Developer | CloudScale Solutions | 2020 - 2022
- Wrote unit tests using Jest and React Testing Library, increasing code coverage from 60% to 85%.
- Maintained internal Node.js scripts and fixed web frontend bug tickets.

SKILLS
JavaScript, TypeScript, React, Node.js, Express, HTML/CSS, PostgreSQL, Git, Jest`;

      jobInput.value = `SENIOR FULL STACK ENGINEER (CLOUD & SYSTEM ARCHITECTURE)

We are seeking a Senior Full Stack Engineer to lead our cloud-native platforms.

Requirements:
- 4+ years of professional engineering experience with React, Node.js, and TypeScript.
- Strong expertise in System Architecture, Microservices, and GraphQL API design.
- Hands-on experience with Kubernetes, Docker containerization, and AWS cloud infrastructure.
- Demonstrated success establishing automated CI/CD pipelines (GitHub Actions / Jenkins).
- Proven track record optimizing database query performance and high-frequency backend services.
- Excellent cross-functional leadership skills with agile development methodologies.`;
    });
  }

  if (samplePmBtn) {
    samplePmBtn.addEventListener('click', () => {
      resumeInput.value = `PRIYA SHARMA
Technical Product Manager | Growth & Analytics
Email: priya.sharma@example.com | LinkedIn: linkedin.com/in/psharma

SUMMARY
Data-driven Product Manager with 5 years leading mobile app features and SaaS retention workflows. Proficient in SQL, A/B testing, user journey mapping, and agile roadmap development.

EXPERIENCE
Product Manager | GrowthPay Inc | 2021 - Present
- Managed checkout optimization roadmap, improving user conversion rate by 14%.
- Conducted weekly user research interviews and analyzed funnels using Amplitude.
- Led sprint planning and backlog grooming with a 9-person engineering squad.

Associate PM | MarketPulse App | 2019 - 2021
- Defined PRDs and user stories for onboarding features.
- Launched referral feature resulting in 25,000 new organic user signups in Q3.

SKILLS
Product Strategy, User Research, SQL, A/B Testing, Wireframing, Jira, Amplitude, Agile/Scrum`;

      jobInput.value = `SENIOR TECHNICAL PRODUCT MANAGER (AI PLATFORMS)

Looking for a Senior TPM to drive our AI Product Intelligence roadmap.

Requirements:
- 5+ years of Product Management experience in SaaS / AI ecosystems.
- Deep expertise in Product Strategy, Go-To-Market (GTM) execution, and AI model metrics.
- Strong proficiency in SQL, quantitative retention modeling, and complex user funnel analytics.
- Proven experience managing cross-functional engineering, data science, and design teams.
- Experience with API integrations, LLM workflows, and developer platform adoption.`;
    });
  }

  // Tabs: Resume vs Cover Letter
  const tabBtnResume = document.getElementById('tab-btn-resume');
  const tabBtnCover = document.getElementById('tab-btn-cover');
  const tabContentResume = document.getElementById('tab-content-resume');
  const tabContentCover = document.getElementById('tab-content-cover');
  const outputCoverEl = document.getElementById('output-cover-content');
  const exportTxtBtn = document.getElementById('export-txt-btn');
  let activeTab = 'resume';

  if (tabBtnResume && tabBtnCover) {
    tabBtnResume.addEventListener('click', () => {
      activeTab = 'resume';
      tabBtnResume.className = 'btn primary btn-sm';
      tabBtnCover.className = 'btn secondary btn-sm';
      tabContentResume.classList.remove('hidden');
      tabContentCover.classList.add('hidden');
    });

    tabBtnCover.addEventListener('click', () => {
      activeTab = 'cover';
      tabBtnCover.className = 'btn primary btn-sm';
      tabBtnResume.className = 'btn secondary btn-sm';
      tabContentCover.classList.remove('hidden');
      tabContentResume.classList.add('hidden');
    });
  }

  // Copy Active Button
  copyBtn.addEventListener('click', () => {
    const textToCopy = activeTab === 'resume' ? outputResumeEl.value : (outputCoverEl ? outputCoverEl.value : '');
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = '📋 Copy Active', 2000);
  });

  // Export TXT Button
  if (exportTxtBtn) {
    exportTxtBtn.addEventListener('click', () => {
      const textToExport = activeTab === 'resume' ? outputResumeEl.value : (outputCoverEl ? outputCoverEl.value : '');
      if (!textToExport) {
        alert('No content available to export.');
        return;
      }
      const filename = activeTab === 'resume' ? `tailorfit_resume_${Date.now()}.txt` : `tailorfit_cover_letter_${Date.now()}.txt`;
      const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    });
  }

  // Sub-scores elements
  const subKwMatch = document.getElementById('sub-kw-match');
  const subFmt = document.getElementById('sub-fmt');
  const subMetrics = document.getElementById('sub-metrics');
  const subSkills = document.getElementById('sub-skills');

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

      if (data.score_breakdown) {
        if (subKwMatch) subKwMatch.textContent = `${data.score_breakdown.keyword_match || 92}%`;
        if (subFmt) subFmt.textContent = `${data.score_breakdown.formatting || 96}%`;
        if (subMetrics) subMetrics.textContent = `${data.score_breakdown.quantified_metrics || 90}%`;
        if (subSkills) subSkills.textContent = `${data.score_breakdown.hard_skills || 94}%`;
      }

      missingKwWrapper.innerHTML = '';
      if (data.missing_keywords) {
        data.missing_keywords.forEach(kw => {
          missingKwWrapper.innerHTML += `<span class="tag missing-tag">+ ${kw}</span>`;
        });
      }

      if (execSummaryEl) execSummaryEl.textContent = data.executive_summary;
      if (outputResumeEl) outputResumeEl.value = data.optimized_resume;
      if (outputCoverEl) outputCoverEl.value = data.cover_letter || 'Cover letter generated.';

    } catch(err) {
      alert('Optimization error: ' + err.message);
    } finally {
      optimizeBtn.textContent = 'Scan & Tailor ATS Resume + Cover Letter';
      optimizeBtn.disabled = false;
      if (aiStatusBadge) aiStatusBadge.textContent = 'NVIDIA Nemotron ATS Engine';
    }
  });

  checkAuth();
});
