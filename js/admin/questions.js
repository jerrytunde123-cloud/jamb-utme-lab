/**
 * Questions manager — add/edit/delete subjects and their questions
 */

let bank = {};
let currentSubject = null;

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await ADMIN.requireLogin())) return;

  document.getElementById('sideLinks').innerHTML = ADMIN.renderSidebar('questions');
  document.getElementById('logoutBtn').addEventListener('click', ADMIN.logout);
  document.getElementById('addSubjectBtn').addEventListener('click', addSubject);
  document.getElementById('saveBtn').addEventListener('click', saveBank);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importJSON);

  await loadBank();
});

async function loadBank() {
  const data = await ADMIN.apiGet('/api/admin/questions');
  if (data && data.success) {
    bank = data.bank || {};
    renderSubjects();
  }
}

function renderSubjects() {
  const list = document.getElementById('subjectList');
  const keys = Object.keys(bank);
  if (!keys.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><br>No subjects yet. Click <strong>Import JSON</strong> or <strong>New Subject</strong>.</div>';
    return;
  }

  list.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Key</th><th>Name</th><th>Icon</th><th>Questions</th><th style="text-align:right;">Actions</th></tr></thead><tbody>' +
    keys.map((k) => {
      const s = bank[k];
      const count = (s.questions && s.questions.length) || 0;
      return '<tr>' +
        '<td class="mono">' + ADMIN.escapeHtml(k) + '</td>' +
        '<td>' + ADMIN.escapeHtml(s.name || k) + '</td>' +
        '<td><code>' + ADMIN.escapeHtml(s.icon || '—') + '</code></td>' +
        '<td><span class="pill pill-gray">' + count + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
        '<button class="btn btn-primary btn-sm" onclick="editSubject(\'' + k.replace(/'/g, "\\'") + '\')"><i class="fas fa-pen"></i> Edit</button> ' +
        '<button class="btn btn-danger btn-sm" onclick="deleteSubject(\'' + k.replace(/'/g, "\\'") + '\')"><i class="fas fa-trash"></i></button>' +
        '</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function addSubject() {
  const key = prompt('Subject key (lowercase, no spaces — e.g. "english", "mathematics"):');
  if (!key) return;
  const safeKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!safeKey) { ADMIN.showToast('Invalid key', 'red'); return; }
  if (bank[safeKey]) { ADMIN.showToast('Subject already exists', 'red'); return; }

  const name = prompt('Display name (e.g. "English Language"):');
  if (!name) return;

  bank[safeKey] = { name: name.trim(), icon: 'fa-book', questions: [] };
  renderSubjects();
  ADMIN.showToast('Subject added — remember to Save', 'green');
}

window.deleteSubject = function(key) {
  if (!confirm('Delete subject "' + key + '" and all its questions?')) return;
  delete bank[key];
  renderSubjects();
  ADMIN.showToast('Subject deleted — remember to Save', 'amber');
};

window.editSubject = function(key) {
  currentSubject = key;
  const s = bank[key];
  document.getElementById('editorCard').style.display = 'block';
  document.getElementById('editorTitle').textContent = 'Editing: ' + (s.name || key);
  renderEditor();
  document.getElementById('editorCard').scrollIntoView({ behavior: 'smooth' });
};

function renderEditor() {
  const s = bank[currentSubject];
  const body = document.getElementById('editorBody');
  const questions = s.questions || [];

  body.innerHTML =
    '<div class="field-row">' +
    '<div style="flex:1;"><div class="field-label">Key</div><input class="field-input mono" value="' + ADMIN.escapeHtml(currentSubject) + '" disabled></div>' +
    '<div style="flex:2;"><div class="field-label">Name</div><input class="field-input" id="subjName" value="' + ADMIN.escapeHtml(s.name || '') + '"></div>' +
    '<div style="flex:1;"><div class="field-label">Icon (FontAwesome)</div><input class="field-input" id="subjIcon" value="' + ADMIN.escapeHtml(s.icon || 'fa-book') + '"></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin:16px 0 8px;flex-wrap:wrap;gap:8px;">' +
    '<div style="font-weight:700;color:#1d3b4f;">Questions (' + questions.length + ')</div>' +
    '<button class="btn btn-primary btn-sm" id="addQuestionBtn"><i class="fas fa-plus"></i> Add Question</button>' +
    '</div>' +
    '<div id="questionList"></div>';

  document.getElementById('subjName').addEventListener('input', (e) => { s.name = e.target.value; });
  document.getElementById('subjIcon').addEventListener('input', (e) => { s.icon = e.target.value; });
  document.getElementById('addQuestionBtn').addEventListener('click', addQuestion);

  renderQuestions();
}

function renderQuestions() {
  const s = bank[currentSubject];
  const list = document.getElementById('questionList');
  const qs = s.questions || [];

  if (!qs.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-question-circle"></i><br>No questions yet.</div>';
    return;
  }

  list.innerHTML = qs.map((q, i) =>
    '<div class="card" style="background:#f8fafc;margin-bottom:10px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">' +
    '<div style="font-weight:700;color:#0b2b40;font-size:0.9rem;">#' + (i + 1) + '</div>' +
    '<div style="display:flex;gap:6px;">' +
    '<button class="btn btn-muted btn-sm" onclick="moveQuestion(' + i + ',-1)"><i class="fas fa-arrow-up"></i></button>' +
    '<button class="btn btn-muted btn-sm" onclick="moveQuestion(' + i + ',1)"><i class="fas fa-arrow-down"></i></button>' +
    '<button class="btn btn-danger btn-sm" onclick="deleteQuestion(' + i + ')"><i class="fas fa-trash"></i></button>' +
    '</div>' +
    '</div>' +
    '<div class="field-label">Question</div>' +
    '<textarea class="field-textarea" oninput="updateQuestion(' + i + ',\'question\',this.value)" placeholder="Enter question text">' + ADMIN.escapeHtml(q.question || '') + '</textarea>' +
    '<div class="field-label" style="margin-top:8px;">Options (4 required)</div>' +
    (q.options || []).map((opt, oi) =>
      '<div class="field-row" style="align-items:center;margin-bottom:6px;">' +
      '<div style="width:32px;text-align:center;font-weight:700;color:' + (q.correct === oi ? '#059669' : '#6f8b9c') + ';">' + String.fromCharCode(65 + oi) + '</div>' +
      '<input class="field-input" style="flex:1;" value="' + ADMIN.escapeHtml(opt) + '" oninput="updateOption(' + i + ',' + oi + ',this.value)">' +
      '<button class="btn ' + (q.correct === oi ? 'btn-success' : 'btn-muted') + ' btn-sm" onclick="setCorrect(' + i + ',' + oi + ')"><i class="fas fa-check"></i></button>' +
      '</div>'
    ).join('') +
    '<div class="field-label" style="margin-top:8px;">Image URL (optional)</div>' +
    '<input class="field-input" value="' + ADMIN.escapeHtml(q.image || '') + '" oninput="updateQuestion(' + i + ',\'image\',this.value)">' +
    '</div>'
  ).join('');
}

function addQuestion() {
  const s = bank[currentSubject];
  s.questions = s.questions || [];
  s.questions.push({
    question: '',
    options: ['', '', '', ''],
    correct: 0
  });
  renderEditor();
}

window.deleteQuestion = function(i) {
  if (!confirm('Delete question #' + (i + 1) + '?')) return;
  bank[currentSubject].questions.splice(i, 1);
  renderEditor();
};

window.moveQuestion = function(i, dir) {
  const qs = bank[currentSubject].questions;
  const j = i + dir;
  if (j < 0 || j >= qs.length) return;
  const tmp = qs[i]; qs[i] = qs[j]; qs[j] = tmp;
  renderEditor();
};

window.updateQuestion = function(i, field, val) {
  bank[currentSubject].questions[i][field] = val;
};

window.updateOption = function(i, oi, val) {
  bank[currentSubject].questions[i].options[oi] = val;
};

window.setCorrect = function(i, oi) {
  bank[currentSubject].questions[i].correct = oi;
  renderQuestions();
};

async function saveBank() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving…';
  const res = await ADMIN.apiPost('/api/admin/questions', { bank });
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  if (res && res.success) {
    ADMIN.showToast('Saved! ' + res.subjects + ' subjects · ' + res.questions + ' questions', 'green');
  } else {
    ADMIN.showToast('Save failed', 'red');
  }
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Not an object');
      if (!confirm('Replace current question bank with ' + Object.keys(parsed).length + ' subjects from file?')) return;
      bank = parsed;
      renderSubjects();
      document.getElementById('editorCard').style.display = 'none';
      ADMIN.showToast('Imported — click Save Changes to persist', 'green');
    } catch (err) {
      ADMIN.showToast('Invalid JSON: ' + err.message, 'red');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}
