let students = JSON.parse(localStorage.getItem('feePortalStudents') || '[]');

function save() {
  localStorage.setItem('feePortalStudents', JSON.stringify(students));
  render();
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type + ' show';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function calcBalance(s) {
  return Math.max(0, (s.totalFee || 0) - (s.paid || 0));
}

function getStatus(s) {
  const bal = calcBalance(s);
  if (bal <= 0) return 'paid';
  if ((s.paid || 0) > 0) return 'partial';
  return 'unpaid';
}

function esc(t) {
  return String(t).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function fmt(n) {
  return Number(n).toLocaleString();
}

function updateStats() {
  document.getElementById('statStudents').textContent = students.length;
  const collected = students.reduce((sum, s) => sum + (s.paid || 0), 0);
  const totalFee = students.reduce((sum, s) => sum + (s.totalFee || 0), 0);
  document.getElementById('statCollected').textContent = 'PKR ' + fmt(collected);
  document.getElementById('statPending').textContent = 'PKR ' + fmt(Math.max(0, totalFee - collected));
}

function render() {
  const tbody = document.getElementById('studentTableBody');
  const empty = document.getElementById('emptyState');
  const search = (document.getElementById('searchInput').value || '').toLowerCase();

  let filtered = students;
  if (search) {
    filtered = students.filter(s =>
      (s.name || '').toLowerCase().includes(search) ||
      (s.course || '').toLowerCase().includes(search) ||
      (s.batch || '').toLowerCase().includes(search) ||
      (s.father || '').toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = filtered.map((s, i) => {
      const bal = calcBalance(s);
      const status = getStatus(s);
      const badgeCls = status === 'paid' ? 'badge-paid' : status === 'partial' ? 'badge-partial' : 'badge-unpaid';
      const badgeLabel = status === 'paid' ? 'Paid' : status === 'partial' ? 'Partial' : 'Unpaid';
      const isPaid = status === 'paid';
      return `<tr>
        <td>${i + 1}</td>
        <td><strong>${esc(s.name)}</strong></td>
        <td>${esc(s.father || '-')}</td>
        <td>${esc(s.course)}</td>
        <td>${esc(s.batch || '-')}</td>
        <td>PKR ${fmt(s.monthlyFee || 0)}</td>
        <td>PKR ${fmt(s.totalFee || 0)}</td>
        <td>PKR ${fmt(s.paid || 0)}</td>
        <td class="total-fees">PKR ${fmt(bal)}</td>
        <td><span class="badge ${badgeCls}">${badgeLabel}</span></td>
        <td class="actions-cell">
          <button class="btn btn-primary btn-sm" onclick="openEditModal('${s.id}')">Edit</button>
          <button class="btn btn-success btn-sm" onclick="markPaid('${s.id}')">${isPaid ? 'Paid' : 'Pay'}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">Del</button>
        </td>
      </tr>`;
    }).join('');
  }

  updateStats();
}

document.getElementById('studentForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('studentName').value.trim();
  const father = document.getElementById('fatherName').value.trim();
  const email = document.getElementById('studentEmail').value.trim();
  const phone = document.getElementById('studentPhone').value.trim();
  const course = document.getElementById('courseName').value.trim();
  const monthlyFee = parseFloat(document.getElementById('monthlyFee').value) || 0;
  const totalFee = parseFloat(document.getElementById('totalFee').value) || 0;
  const batch = document.getElementById('batchSelect').value;

  if (!name || !course || !totalFee) {
    toast('Name, Course, and Total Fee are required.', 'error');
    return;
  }

  students.push({
    id: generateId(),
    name, father, email, phone, course, batch,
    monthlyFee, totalFee,
    paid: 0,
    createdAt: new Date().toISOString()
  });
  save();
  this.reset();
  toast('Student added successfully!');
});

function openEditModal(id) {
  const s = students.find(st => st.id === id);
  if (!s) return;
  document.getElementById('editId').value = s.id;
  document.getElementById('editName').value = s.name || '';
  document.getElementById('editFather').value = s.father || '';
  document.getElementById('editEmail').value = s.email || '';
  document.getElementById('editPhone').value = s.phone || '';
  document.getElementById('editCourse').value = s.course || '';
  document.getElementById('editMonthlyFee').value = s.monthlyFee || 0;
  document.getElementById('editTotalFee').value = s.totalFee || 0;
  document.getElementById('editPaid').value = s.paid || 0;
  const batchSelect = document.getElementById('editBatch');
  batchSelect.innerHTML = ['', 'Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5']
    .map(b => `<option value="${b}" ${s.batch === b ? 'selected' : ''}>${b || 'Select Batch'}</option>`).join('');
  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

document.getElementById('editForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const s = students.find(st => st.id === id);
  if (!s) return;
  s.name = document.getElementById('editName').value.trim();
  s.father = document.getElementById('editFather').value.trim();
  s.email = document.getElementById('editEmail').value.trim();
  s.phone = document.getElementById('editPhone').value.trim();
  s.course = document.getElementById('editCourse').value.trim();
  s.monthlyFee = parseFloat(document.getElementById('editMonthlyFee').value) || 0;
  s.totalFee = parseFloat(document.getElementById('editTotalFee').value) || 0;
  s.batch = document.getElementById('editBatch').value;
  s.paid = parseFloat(document.getElementById('editPaid').value) || 0;
  save();
  closeEditModal();
  toast('Student updated successfully!');
});

function markPaid(id) {
  const s = students.find(st => st.id === id);
  if (!s) return;
  s.paid = s.totalFee;
  save();
  toast('Fee marked as paid!');
}

function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) return;
  students = students.filter(s => s.id !== id);
  save();
  toast('Student deleted.', 'error');
}

document.getElementById('searchInput').addEventListener('input', render);

render();
