const {
  showMessage = () => {},
  clearMessage = () => {},
  validateEmail = () => false,
  validatePhone = () => false
} = window.sfHelpers || {};

function sitePrefix() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const compIdx = parts.indexOf('components');
  if (compIdx === -1) return './';
  const depth = parts.length - compIdx;
  return '../'.repeat(Math.max(0, depth - 1)) || './';
}

window.addEventListener("DOMContentLoaded", () => {
  handleLoginPage();
  handleSignupPage();
  handleProfilePage();
  handleRestaurantsPage();
  handleMenuPage();
  handleDashboardPage();
});

function handleLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const msg = document.getElementById("formMessage");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearMessage(msg);

    const id = form.identifier.value.trim();
    const pass = form.password.value.trim();

    if (!id || !pass) {
      showMessage(msg, "Please fill all fields.", "error");
      return;
    }

    if (!validateEmail(id) && !validatePhone(id)) {
      showMessage(msg, "Enter a valid email or phone.", "error");
      return;
    }

    if (pass.length < 6) {
      showMessage(msg, "Password must be at least 6 characters.", "error");
      return;
    }

    showMessage(msg, "Login successful! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = `${sitePrefix()}components/dashboard/dashboard.html`;
    }, 1000);
  });
}

function handleSignupPage() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const msg = document.getElementById("signupMessage");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearMessage(msg);

    const name = form.fullname.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const pass = form.password.value;
    const confirm = form.confirmPassword.value;

    if (!name || !email || !phone || !pass || !confirm) {
      showMessage(msg, "Please fill all fields.", "error");
      return;
    }

    if (!validateEmail(email)) {
      showMessage(msg, "Enter a valid email.", "error");
      return;
    }

    if (!validatePhone(phone)) {
      showMessage(msg, "Enter a valid phone number.", "error");
      return;
    }

    if (pass !== confirm) {
      showMessage(msg, "Passwords do not match.", "error");
      return;
    }

    if (pass.length < 6) {
      showMessage(msg, "Password must be at least 6 characters.", "error");
      return;
    }

    showMessage(msg, "Account created successfully! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = `${sitePrefix()}components/login/login.html`;
    }, 1000);
  });
}

function handleProfilePage() {
  const form = document.getElementById("profileForm");
  if (!form) return;

  const msg = document.getElementById("profileMsg");

  const saveBtn = document.getElementById("saveProfile");
  if (saveBtn) {
    saveBtn.onclick = () => {
      clearMessage(msg);

      const name = form.fullname.value.trim();
      const email = form.email.value.trim();
      const phone = form.phone.value.trim();
      const address = form.address.value.trim();

      if (!name || !email || !phone || !address) {
        showMessage(msg, "Please fill out all fields.", "error");
        return;
      }

      if (!validateEmail(email)) {
        showMessage(msg, "Invalid email.", "error");
        return;
      }

      if (!validatePhone(phone)) {
        showMessage(msg, "Invalid phone.", "error");
        return;
      }

      showMessage(msg, "Profile saved successfully!", "success");
    };
  }

  const cancelBtn = document.getElementById("cancelProfile");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      form.reset();
      clearMessage(msg);
    };
  }
}

function handleRestaurantsPage() {
  const list = document.getElementById("restaurantsList");
  if (!list) return;

  const prefix = sitePrefix();

  const restaurants = [
    {
      name: "Pizza House",
      cuisine: "Italian",
      img: `${prefix}assets/images/pizza.jpg`,
      desc: "Hot wood-fired pizzas & pasta."
    },
    {
      name: "Mo:Mo Legend",
      cuisine: "Asian",
      img: `${prefix}assets/images/momo.jpg`,
      desc: "Nepal's favorite steamed & fried MoMo."
    },
    {
      name: "Burger Hub",
      cuisine: "Fast Food",
      img: `${prefix}assets/images/burger.jpg`,
      desc: "Juicy grilled burgers with fries."
    }
  ];

  list.innerHTML = restaurants
    .map(
      (r) => `
      <div class="card">
        <img src="${r.img}" alt="${r.name}" style="width:100%;border-radius:10px;height:160px;object-fit:cover;">
        <h3>${r.name}</h3>
        <p>${r.desc}</p>
        <div class="actions">
          <button class="btn primary small" onclick="location.href='${prefix}components/menu/menu.html?res=${encodeURIComponent(r.name)}'">View Menu</button>
        </div>
      </div>`
    )
    .join("");
}

function handleMenuPage() {
  const menuList = document.getElementById("menuList");
  if (!menuList) return;

  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  let cart = [];
  const prefix = sitePrefix();

  const menu = [
    { name: "Veg Pizza", price: 450, img: `${prefix}assets/images/pizza1.jpg` },
    { name: "Chicken Burger", price: 380, img: `${prefix}assets/images/burger.jpg` },
    { name: "Fried Mo:Mo", price: 250, img: `${prefix}assets/images/momo.jpg` }
  ];

  menuList.innerHTML = menu
    .map(
      (m, i) => `
      <div class="menu-item card">
        <img src="${m.img}" alt="${m.name}">
        <div class="meta">
          <h4>${m.name}</h4>
          <p>NPR ${m.price}</p>
          <button class="btn primary" onclick="addToCart(${i})">Add</button>
        </div>
      </div>`
    )
    .join("");

  window.addToCart = (i) => {
    cart.push(menu[i]);
    renderCart();
  };

  function renderCart() {
    if (!cartItems || !cartTotal || !checkoutBtn) return;

    if (cart.length === 0) {
      cartItems.textContent = "No items yet.";
      checkoutBtn.disabled = true;
      cartTotal.textContent = "0";
      return;
    }

    checkoutBtn.disabled = false;
    cartItems.innerHTML = cart.map((c) => `<p>${c.name} — NPR ${c.price}</p>`).join("");
    cartTotal.textContent = cart.reduce((t, i) => t + i.price, 0);
  }
}

function handleDashboardPage() {
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  if (!nameEl || !emailEl) return;

  nameEl.textContent = "Hello, User";
  emailEl.textContent = "user@example.com";
}
