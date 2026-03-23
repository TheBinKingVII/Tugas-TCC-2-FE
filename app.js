const API_BASE = "/api/notes";

const noteForm = document.getElementById("noteForm");
const noteIdEl = document.getElementById("noteId");
const judulEl = document.getElementById("judul");
const isiEl = document.getElementById("isi");
const formTitleEl = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const messageEl = document.getElementById("message");
const notesList = document.getElementById("notesList");
const refreshBtn = document.getElementById("refreshBtn");

function setMessage(text, kind = "info") {
  messageEl.textContent = text || "";
  messageEl.classList.toggle("error", kind === "error");
}

function formatTanggal(value) {
  if (!value) return "-";
  // Sequelize bisa mengirim Date object atau string.
  const normalized = String(value).replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("id-ID");
}

function clearForm() {
  noteIdEl.value = "";
  judulEl.value = "";
  isiEl.value = "";
  formTitleEl.textContent = "Tambah Catatan";
  submitBtn.textContent = "Simpan";
  cancelBtn.hidden = true;
}

function startEdit(note) {
  noteIdEl.value = String(note.id);
  judulEl.value = note.judul || "";
  isiEl.value = note.isi || "";
  formTitleEl.textContent = "Edit Catatan";
  submitBtn.textContent = "Simpan Perubahan";
  cancelBtn.hidden = false;
  judulEl.focus();
}

function renderNotes(notes) {
  notesList.innerHTML = "";

  if (!notes || notes.length === 0) {
    notesList.innerHTML =
      '<div class="noteItem" style="color: var(--muted)">Belum ada catatan.</div>';
    return;
  }

  for (const note of notes) {
    const wrapper = document.createElement("div");
    wrapper.className = "noteItem";

    const top = document.createElement("div");
    top.className = "noteTop";

    const left = document.createElement("div");

    const title = document.createElement("div");
    title.className = "noteTitle";
    title.textContent = note.judul;

    const date = document.createElement("div");
    date.className = "noteDate";
    date.textContent = `Dibuat: ${formatTanggal(note.tanggal_dibuat)}`;

    left.appendChild(title);
    left.appendChild(date);
    top.appendChild(left);

    const actions = document.createElement("div");
    actions.className = "noteActions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEdit(note));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Hapus";
    deleteBtn.classList.add("btnDanger");
    deleteBtn.addEventListener("click", () => deleteNote(note.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    const body = document.createElement("div");
    body.className = "noteBody";
    body.textContent = note.isi;

    wrapper.appendChild(top);
    wrapper.appendChild(body);
    wrapper.appendChild(actions);
    notesList.appendChild(wrapper);
  }
}

async function apiGetNotes() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Gagal memuat daftar notes.");
  return res.json();
}

async function apiCreateNote(payload) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Gagal membuat notes.");
  }
  return res.json();
}

async function apiUpdateNote(id, payload) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Gagal mengupdate notes.");
  }
  return res.json();
}

async function apiDeleteNote(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Gagal menghapus notes.");
  }
  return res.json();
}

async function loadNotes() {
  setMessage("");
  try {
    const notes = await apiGetNotes();
    renderNotes(notes);
  } catch (err) {
    setMessage(err.message || "Gagal memuat daftar notes.", "error");
    notesList.innerHTML = "";
  }
}

async function deleteNote(id) {
  const ok = confirm("Yakin ingin menghapus catatan ini?");
  if (!ok) return;
  setMessage("");
  try {
    await apiDeleteNote(id);
    setMessage("Notes berhasil dihapus.");
    clearForm();
    await loadNotes();
  } catch (err) {
    setMessage(err.message || "Gagal menghapus notes.", "error");
  }
}

cancelBtn.addEventListener("click", () => {
  clearForm();
  setMessage("");
});

noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("");

  const payload = {
    judul: judulEl.value,
    isi: isiEl.value,
  };

  try {
    if (noteIdEl.value) {
      await apiUpdateNote(noteIdEl.value, payload);
      setMessage("Notes berhasil diupdate.");
    } else {
      await apiCreateNote(payload);
      setMessage("Notes berhasil ditambahkan.");
    }

    clearForm();
    await loadNotes();
  } catch (err) {
    setMessage(err.message || "Terjadi kesalahan.", "error");
  }
});

refreshBtn.addEventListener("click", loadNotes);

// Startup
loadNotes();
