const STORAGE_KEY = "offline_novel_manager_data_v1";
const isMobile = window.innerWidth <= 900;

let data = { novels: [] };
let selectedNovelIndex = null;
let selectedChapterIndex = null;

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse stored data:", e);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const novelListEl = document.getElementById("novelList");
const chapterListEl = document.getElementById("chapterList");
const newNovelBtn = document.getElementById("newNovelBtn");
const mainHeaderEl = document.getElementById("mainHeader");
const mainBodyEl = document.getElementById("mainBody");
const chapterSidebarTitleEl = document.getElementById("chapterSidebarTitle");

function renderNovels() {
  novelListEl.innerHTML = "";

  if (data.novels.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "info-text";
    emptyMsg.style.padding = "4px";
    emptyMsg.textContent = "No novels yet";
    novelListEl.appendChild(emptyMsg);
    return;
  }

  data.novels.forEach((novel, index) => {
    const item = document.createElement("div");
    item.className = "list-item";
    if (index === selectedNovelIndex) item.classList.add("active");

    const contentDiv = document.createElement("div");
    contentDiv.className = "list-item-content";

    const titleDiv = document.createElement("div");
    titleDiv.className = "list-item-title";
    titleDiv.textContent = novel.name || "Untitled Novel";

    const subtitleDiv = document.createElement("div");
    subtitleDiv.className = "list-item-subtitle";
    const count = novel.chapters ? novel.chapters.length : 0;
    subtitleDiv.textContent =
      count + (count === 1 ? " chapter" : " chapters");

    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(subtitleDiv);
    contentDiv.addEventListener("click", () => selectNovel(index));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "list-item-delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteNovel(index);
    });

    item.appendChild(contentDiv);
    item.appendChild(deleteBtn);
    novelListEl.appendChild(item);
  });
}

function renderChapters() {
  chapterListEl.innerHTML = "";

  if (selectedNovelIndex === null || data.novels.length === 0) {
    chapterSidebarTitleEl.textContent = "Chapters";
    const msg = document.createElement("div");
    msg.className = "info-text";
    msg.style.padding = "4px";
    msg.textContent = "Select a novel";
    chapterListEl.appendChild(msg);
    return;
  }

  const novel = data.novels[selectedNovelIndex];
  chapterSidebarTitleEl.textContent = `Chapters – ${
    novel.name || "Untitled"
  }`;

  if (!novel.chapters || novel.chapters.length === 0) {
    const empty = document.createElement("div");
    empty.className = "info-text";
    empty.style.padding = "4px";
    empty.textContent = "No chapters";
    chapterListEl.appendChild(empty);
    return;
  }

  novel.chapters.forEach((chapter, idx) => {
    const item = document.createElement("div");
    item.className = "list-item";
    if (idx === selectedChapterIndex) item.classList.add("active");

    const titleDiv = document.createElement("div");
    titleDiv.className = "list-item-title";
    titleDiv.textContent =
      "Chapter " +
      (chapter.chapterNumber || idx + 1) +
      (chapter.chapterTitle ? `: ${chapter.chapterTitle}` : "");

    const snippetDiv = document.createElement("div");
    snippetDiv.className = "list-item-subtitle";
    const snippet = (chapter.content || "").slice(0, 40);
    snippetDiv.textContent = snippet ? snippet + "…" : "No content";

    item.appendChild(titleDiv);
    item.appendChild(snippetDiv);
    item.addEventListener("click", () => selectChapter(idx));

    chapterListEl.appendChild(item);
  });
}

function selectNovel(index) {
  selectedNovelIndex = index;
  selectedChapterIndex = null;
  renderNovels();
  renderChapters();
  isMobile ? showMobileChaptersView() : showAddChapterView();
}

function selectChapter(chapterIndex) {
  selectedChapterIndex = chapterIndex;
  renderChapters();
  showChapterReadOnlyView();
}

function deleteNovel(index) {
  const novel = data.novels[index];
  if (confirm(`Delete "${novel.name || "Untitled"}"?`)) {
    data.novels.splice(index, 1);
    saveData();

    if (selectedNovelIndex === index) {
      selectedNovelIndex = null;
      selectedChapterIndex = null;
      mainBodyEl.innerHTML = "<p class='info-text'>Novel deleted.</p>";
    } else if (selectedNovelIndex > index) {
      selectedNovelIndex--;
    }

    renderNovels();
    renderChapters();
  }
}

/* ===== NEW: DELETE CHAPTER ===== */
function deleteChapter() {
  if (selectedNovelIndex === null || selectedChapterIndex === null) return;

  const novel = data.novels[selectedNovelIndex];
  const chapter = novel.chapters[selectedChapterIndex];

  const label =
    chapter.chapterTitle ||
    `Chapter ${chapter.chapterNumber || selectedChapterIndex + 1}`;

  if (confirm(`Delete "${label}"?`)) {
    novel.chapters.splice(selectedChapterIndex, 1);
    saveData();

    selectedChapterIndex = null;
    renderChapters();
    isMobile ? showMobileChaptersView() : showAddChapterView();
  }
}

function clearMainBody() {
  mainBodyEl.innerHTML = "";
}

function showMobileChaptersView() {
  if (selectedNovelIndex === null) return;

  const novel = data.novels[selectedNovelIndex];
  mainHeaderEl.textContent = novel.name || "Untitled";
  clearMainBody();

  if (!novel.chapters || novel.chapters.length === 0) {
    mainBodyEl.innerHTML =
      "<div class='info-text' style='padding:12px'>No chapters</div>";
    return;
  }

  novel.chapters.forEach((chapter, idx) => {
    const card = document.createElement("div");
    card.style.cssText =
      "cursor:pointer;padding:12px;background:#2d2d30;border-radius:4px;margin-bottom:8px";

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent =
      "Chapter " +
      (chapter.chapterNumber || idx + 1) +
      (chapter.chapterTitle ? `: ${chapter.chapterTitle}` : "");

    const snippet = document.createElement("div");
    snippet.className = "list-item-subtitle";
    snippet.style.marginTop = "4px";
    const content = (chapter.content || "").slice(0, 50);
    snippet.textContent = content ? content + "…" : "No content";

    card.appendChild(title);
    card.appendChild(snippet);
    card.addEventListener("click", () => selectChapter(idx));

    mainBodyEl.appendChild(card);
  });
}

function showAddChapterView() {
  if (selectedNovelIndex === null) {
    mainHeaderEl.textContent = "Offline Novel Manager";
    clearMainBody();
    return;
  }

  mainHeaderEl.textContent = `Novel: ${
    data.novels[selectedNovelIndex].name || "Untitled"
  } – Add Chapter`;

  clearMainBody();

  const addSection = document.createElement("div");
  addSection.className = "section";

  const title = document.createElement("div");
  title.className = "section-title";
  title.textContent = "Add Chapter";

  addSection.appendChild(title);

  const numberGroup = document.createElement("div");
  numberGroup.className = "field-group";
  const numberLabel = document.createElement("label");
  numberLabel.textContent = "Chapter Number";
  const numberInput = document.createElement("input");
  numberInput.type = "text";
  numberInput.placeholder = "e.g. 1";
  numberGroup.appendChild(numberLabel);
  numberGroup.appendChild(numberInput);

  const titleGroup = document.createElement("div");
  titleGroup.className = "field-group";
  const titleLabel = document.createElement("label");
  titleLabel.textContent = "Chapter Title";
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.placeholder = "e.g. Awakening";
  titleGroup.appendChild(titleLabel);
  titleGroup.appendChild(titleInput);

  const contentGroup = document.createElement("div");
  contentGroup.className = "field-group";
  const contentLabel = document.createElement("label");
  contentLabel.textContent = "Content";
  const contentTextarea = document.createElement("textarea");
  contentTextarea.placeholder = "Write your chapter content here...";
  contentGroup.appendChild(contentLabel);
  contentGroup.appendChild(contentTextarea);

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save Chapter";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "btn-secondary";

  buttonRow.appendChild(saveBtn);
  buttonRow.appendChild(cancelBtn);

  addSection.appendChild(numberGroup);
  addSection.appendChild(titleGroup);
  addSection.appendChild(contentGroup);
  addSection.appendChild(buttonRow);

  mainBodyEl.appendChild(addSection);

  saveBtn.addEventListener("click", () => {
    const chapterNumber = numberInput.value.trim();
    const chapterTitle = titleInput.value.trim();
    const content = contentTextarea.value.trim();

    if (!chapterNumber && !chapterTitle && !content) {
      alert("Please enter chapter information");
      return;
    }

    const novel = data.novels[selectedNovelIndex];
    if (!novel.chapters) novel.chapters = [];

    novel.chapters.push({ chapterNumber, chapterTitle, content });
    saveData();

    selectedChapterIndex = novel.chapters.length - 1;
    renderChapters();
    showChapterReadOnlyView();
  });

  cancelBtn.addEventListener("click", () => {
    numberInput.value = "";
    titleInput.value = "";
    contentTextarea.value = "";
  });
}

function showChapterReadOnlyView() {
  if (
    selectedNovelIndex === null ||
    selectedChapterIndex === null ||
    !data.novels[selectedNovelIndex] ||
    !data.novels[selectedNovelIndex].chapters[selectedChapterIndex]
  ) {
    return;
  }

  const novel = data.novels[selectedNovelIndex];
  const chapter = novel.chapters[selectedChapterIndex];

  mainHeaderEl.textContent = isMobile
    ? novel.name || "Untitled"
    : `Novel: ${novel.name || "Untitled"}`;

  clearMainBody();

  const container = document.createElement("div");
  container.className = "section";

  const numDiv = document.createElement("div");
  numDiv.className = "chapter-display-number";
  numDiv.textContent =
    "Chapter " +
    (chapter.chapterNumber || selectedChapterIndex + 1);

  const titleDiv = document.createElement("div");
  titleDiv.className = "chapter-display-title";
  titleDiv.textContent = chapter.chapterTitle || "";

  const contentDiv = document.createElement("div");
  contentDiv.className = "chapter-display-content";
  contentDiv.textContent = chapter.content || "[No content]";

  container.appendChild(numDiv);
  if (chapter.chapterTitle) container.appendChild(titleDiv);
  container.appendChild(contentDiv);

  mainBodyEl.appendChild(container);

  const backSection = document.createElement("div");
  backSection.className = "section";

  const backBtn = document.createElement("button");
  backBtn.textContent = isMobile
    ? "Back to Chapters"
    : "Add Another Chapter";

  backBtn.addEventListener("click", () => {
    selectedChapterIndex = null;
    renderChapters();
    isMobile ? showMobileChaptersView() : showAddChapterView();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete Chapter";
  deleteBtn.className = "btn-danger";
  deleteBtn.style.marginLeft = "8px";
  deleteBtn.addEventListener("click", deleteChapter);

  backSection.appendChild(backBtn);
  backSection.appendChild(deleteBtn);
  mainBodyEl.appendChild(backSection);
}

newNovelBtn.addEventListener("click", () => {
  const name = window.prompt("Enter the novel's name:");
  if (name === null) return;

  const novelName = name.trim() || "Untitled Novel";
  data.novels.push({ name: novelName, chapters: [] });
  saveData();

  selectedNovelIndex = data.novels.length - 1;
  selectedChapterIndex = null;

  renderNovels();
  renderChapters();
  showAddChapterView();
});

loadData();
renderNovels();
renderChapters();
