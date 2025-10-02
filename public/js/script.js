// Custom sidebar toggle functionality
document.addEventListener("DOMContentLoaded", function () {
  const openSidebarBtn = document.getElementById("openSidebar");
  const closeSidebarBtn = document.getElementById("closeSidebar");
  const sidebar = document.getElementById("sidebarMenu");
  const content = document.querySelector(".content");
  const overlay = document.getElementById("overlay");

  // Open sidebar
  openSidebarBtn.addEventListener("click", function () {
    sidebar.classList.add("show");
    content.classList.add("shifted");
    overlay.classList.add("show");
  });

  // Close sidebar
  function closeSidebar() {
    sidebar.classList.remove("show");
    content.classList.remove("shifted");
    overlay.classList.remove("show");
  }

  closeSidebarBtn.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);

  // Close sidebar when clicking on a nav link (mobile only)
  if (window.innerWidth < 992) {
    const navLinks = document.querySelectorAll(".sidebar .nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", closeSidebar);
    });
  }

  // Handle window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 992) {
      sidebar.classList.add("show");
      content.classList.remove("shifted");
      overlay.classList.remove("show");
    } else {
      sidebar.classList.remove("show");
      content.classList.remove("shifted");
    }
  });
});

// Add new input field when "+" is clicked
document.addEventListener("click", function (e) {
  if (e.target.closest(".add-input")) {
    const container = document.getElementById("inputContainer");
    const newField = document.createElement("div");
    newField.classList.add("input-group", "mb-3");
    newField.innerHTML = `
        <input type="text" class="form-control" placeholder="Input field" required>
        <button class="btn btn-outline-secondary add-input" type="button">
          <i class="bi bi-plus"></i>
        </button>
      `;
    container.appendChild(newField);
  }
});
