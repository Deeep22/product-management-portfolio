const THEME_KEY = "portfolio-theme";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {}
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;
  const dark = theme === "dark";
  toggle.setAttribute("aria-pressed", dark ? "true" : "false");
  toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

applyTheme(
  (() => {
    try {
      return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch (error) {
      return "light";
    }
  })()
);

const themeToggle = document.querySelector("[data-theme-toggle]");
if (themeToggle) {
  themeToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}

const avatar = document.querySelector("[data-avatar]");
let holdTimer;

if (avatar) {
  function showHi(sticky) {
    avatar.classList.add("is-hi");
    if (!sticky) return;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => avatar.classList.remove("is-hi"), 1600);
  }

  avatar.addEventListener("pointerenter", () => showHi(false));
  avatar.addEventListener("pointerleave", () => avatar.classList.remove("is-hi"));
  avatar.addEventListener("click", () => showHi(true));
  avatar.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showHi(true);
    }
  });
}

const linkOrder = [
  ["linkedin", "LinkedIn"],
  ["github", "GitHub"],
  ["email", "Email"],
  ["resume", "Resume"],
];

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node && value) node.textContent = value;
}

function renderList(selector, items, renderItem) {
  const list = document.querySelector(selector);
  if (!list) return;
  list.innerHTML = "";
  (items || []).forEach((item) => list.append(renderItem(item)));
}

function lineItem(title, meta, extras = {}) {
  const item = document.createElement("li");
  const bullets = (extras.bullets || [])
    .map((line) => `<li>${line}</li>`)
    .join("");
  const image = extras.image
    ? `<img class="cert-image" src="${extras.image}" alt="${title}" />`
    : "";
  item.innerHTML = `
    ${image}
    <strong>${title}</strong>
    ${meta ? `<span>${meta}</span>` : ""}
    ${bullets ? `<ul class="bullets">${bullets}</ul>` : ""}
  `;
  return item;
}

function renderLinks(links = {}) {
  document.querySelectorAll("[data-link]").forEach((anchor) => {
    const key = anchor.dataset.link;
    const value = (links[key] || "").trim();
    if (!value) return;
    anchor.href = key === "email" && !value.startsWith("mailto:") ? `mailto:${value}` : value;
    if (key === "resume") {
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
    }
  });
}

function renderProjects(projects = []) {
  renderList("[data-projects]", projects, (project) => lineItem(project.title, project.year));
  const first = projects[0];
  const preview = document.querySelector("[data-work-preview]");
  if (preview && first?.image) {
    preview.style.backgroundImage = `url("${first.image}")`;
  }
}

function renderProjectBoard(projects = []) {
  const board = document.querySelector("[data-project-board]");
  if (!board) return;
  board.innerHTML = "";
  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";
    const details = [
      ["Problem", project.problem],
      ["Approach", project.approach],
      ["Key decision", project.insight],
      ["Outcome", project.outcome],
    ]
      .filter(([, value]) => value)
      .map(([label, value]) => `<p><strong class="project-label">${label}</strong> ${value}</p>`)
      .join("");
    const links = (project.links || [])
      .map((link) => `<a href="${link.href}" target="_blank" rel="noreferrer">${link.label}</a>`)
      .join("");
    card.innerHTML = `
      ${project.image ? `<div class="project-image" style="background-image:url('${project.image}')"></div>` : ""}
      <p class="eyebrow">${project.year || "Project"}</p>
      <h2>${project.title}</h2>
      ${project.summary ? `<p>${project.summary}</p>` : ""}
      ${details}
      ${links ? `<p class="project-links">${links}</p>` : ""}
    `;
    board.append(card);
  });
}

function renderAboutBody(text) {
  const node = document.querySelector("[data-about-body]");
  if (!node || !text) return;
  if (node.classList.contains("about-copy")) {
    node.innerHTML = text
      .split(/\n\n+/)
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");
    return;
  }
  node.textContent = text.split(/\n\n+/)[0];
}

function renderSkills(skills = {}) {
  const node = document.querySelector("[data-skills]");
  if (!node) return;
  node.innerHTML = Object.entries(skills)
    .map(([group, items]) => `<p><strong class="skill-label">${group}</strong> ${items}</p>`)
    .join("");
}

async function loadContent() {
  const response = await fetch("data/content.json");
  if (!response.ok) return;
  const data = await response.json();
  const projects = data.projects || data.work || [];
  const page = document.body.className;
  const detailed = Boolean(document.querySelector(".story-stack"));

  if (page.includes("subpage-work")) document.title = `${data.name} — Projects`;
  else if (page.includes("subpage-about")) document.title = `${data.name} — About`;
  else if (page.includes("subpage-education")) document.title = `${data.name} — Education`;
  else document.title = `${data.name} — ${data.role}`;

  setText("[data-tooltip]", data.photoTooltip);
  setText("[data-greeting]", data.greeting);
  setText("[data-tagline]", data.tagline);
  setText("[data-about-heading]", `I'm ${data.name}, a ${data.role.toLowerCase()}.`);
  renderAboutBody(data.about);
  setText("[data-leadership-title]", data.leadership?.title);
  setText("[data-leadership-body]", data.leadership?.body);
  renderLinks(data.links);
  renderList("[data-experience]", data.experience, (job) =>
    lineItem(
      job.title,
      [job.company, job.location, job.dates].filter(Boolean).join(" · "),
      detailed ? { bullets: job.bullets } : {}
    )
  );
  renderList("[data-education]", data.education, (edu) =>
    lineItem(edu.degree || edu.school, [edu.school, edu.dates].filter(Boolean).join(" · "), {
      bullets: detailed ? edu.highlights : [],
    })
  );
  renderList("[data-certifications]", data.certifications, (cert) =>
    lineItem(cert.name, [cert.issuer, cert.year].filter(Boolean).join(" · "), {
      image: detailed ? cert.image : "",
    })
  );
  renderSkills(data.skills);
  renderProjects(projects);
  renderProjectBoard(projects);
}

loadContent().catch(() => {
  renderLinks({});
});
