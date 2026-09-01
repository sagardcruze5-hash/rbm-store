document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Products (Main Page)
    const productList = document.getElementById('product-list');
    let allProducts = JSON.parse(localStorage.getItem('rbm_products')) || [];

    function displayProducts(productsToRender) {
        if (!productList) return;
        if (productsToRender.length === 0) {
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No products found!</p>';
        } else {
            productList.innerHTML = productsToRender.map(product => `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/150'">
                    <h3>${product.title}</h3>
                    <p class="price">${product.price}</p>
                    <a href="${product.link}" target="_blank" class="buy-btn">Buy on Amazon</a>
                </div>
            `).join('');
        }
    }

    displayProducts(allProducts);

    // Real-Time Search Functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function filterProducts() {
        const query = searchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => p.title.toLowerCase().includes(query));
        displayProducts(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', filterProducts);
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', filterProducts);
    }

    // 2. Load Custom Links
    const sidebarMenu = document.getElementById('sidebar-menu');
    const customLinks = JSON.parse(localStorage.getItem('rbm_nav_links')) || [];
    if (sidebarMenu && customLinks.length > 0) {
        customLinks.forEach(link => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${link.url}">${link.title}</a>`;
            sidebarMenu.appendChild(li);
        });
    }

    // 3. Load Saved Footer Details
    const footerData = JSON.parse(localStorage.getItem('rbm_footer')) || {};
    if (document.getElementById('footer-about-text') && footerData.about) {
        document.getElementById('footer-about-text').innerText = footerData.about;
    }
    if (document.getElementById('footer-privacy-text') && footerData.privacy) {
        document.getElementById('footer-privacy-text').innerText = footerData.privacy;
    }
    if (document.getElementById('footer-contact-text') && footerData.contact) {
        document.getElementById('footer-contact-text').innerText = footerData.contact;
    }

    // --- ADMIN PANEL CONTROLS ---

    // Save Product
    const pForm = document.getElementById('admin-product-form');
    if (pForm) {
        pForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newP = {
                title: document.getElementById('p-title').value,
                price: document.getElementById('p-price').value,
                image: document.getElementById('p-image').value,
                link: document.getElementById('p-link').value,
                id: Date.now()
            };
            allProducts.push(newP);
            localStorage.setItem('rbm_products', JSON.stringify(allProducts));
            alert('Product Added Successfully!');
            pForm.reset();
        });
    }

    // Save Nav Link
    const navForm = document.getElementById('admin-nav-form');
    if (navForm) {
        navForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const linkObj = {
                title: document.getElementById('nav-title').value,
                url: document.getElementById('nav-url').value
            };
            let links = JSON.parse(localStorage.getItem('rbm_nav_links')) || [];
            links.push(linkObj);
            localStorage.setItem('rbm_nav_links', JSON.stringify(links));
            alert('Category/Nav Link Added!');
            navForm.reset();
        });
    }

    // Save Footer
    const footForm = document.getElementById('admin-footer-form');
    if (footForm) {
        footForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fData = {
                about: document.getElementById('foot-about').value,
                privacy: document.getElementById('foot-privacy').value,
                contact: document.getElementById('foot-contact').value
            };
            localStorage.setItem('rbm_footer', JSON.stringify(fData));
            alert('Footer Info Updated!');
        });
    }
});

















// ১. ফায়ারবেস কনফিগারেশন (আপনার আসল প্রজেক্ট ডাটা)
const firebaseConfig = {
  apiKey: "AIzaSyA7itgqaCU1EZAgfO-SccODzDEBvSP5nEE",
  authDomain: "rbm-store-458c8.firebaseapp.com",
  projectId: "rbm-store-458c8",
  storageBucket: "rbm-store-458c8.firebasestorage.app",
  messagingSenderId: "415572875433",
  appId: "1:415572875433:web:e2b856af421b636bb271b8",
  measurementId: "G-GDR5R78Y6D"
};

// ২. Firebase চালুকরণ
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ৩. DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');

    // Firestore থেকে ক্লাউড ডাটা রিয়েল-টাইমে লোড
    db.collection("products").onSnapshot((snapshot) => {
        let products = [];
        snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        displayProducts(products);
    }, (error) => {
        console.error("প্রোডাক্ট লোড করতে সমস্যা:", error);
    });

    function displayProducts(productsToRender) {
        if (!productList) return;
        if (productsToRender.length === 0) {
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No products found!</p>';
        } else {
            productList.innerHTML = productsToRender.map(product => `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/150'">
                    <h3>${product.title}</h3>
                    <p class="price">${product.price}</p>
                    <a href="${product.link}" target="_blank" class="buy-btn">Buy on Amazon</a>
                </div>
            `).join('');
        }
    }

    // Admin Panel: প্রোডাক্ট এড করা
    const pForm = document.getElementById('admin-product-form');
    if (pForm) {
        pForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newP = {
                title: document.getElementById('p-title').value,
                price: document.getElementById('p-price').value,
                image: document.getElementById('p-image').value,
                link: document.getElementById('p-link').value,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            db.collection("products").add(newP)
            .then(() => {
                alert('Product Added to Cloud Successfully!');
                pForm.reset();
            })
            .catch(err => alert("Error adding product: " + err.message));
        });
    }
});

// ৪. টেস্ট বাটনের জন্য ফাংশন
function testSignUp() {
  const email = document.getElementById("testEmail").value;
  const password = document.getElementById("testPassword").value;

  if(!email || !password) {
    alert("ইমেইল ও পাসওয়ার্ড লিখুন!");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      alert("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! User ID: " + userCredential.user.uid);
    })
    .catch((error) => {
      alert("ত্রুটি: " + error.message);
    });
}

function testSaveData() {
  const user = auth.currentUser;

  if (user) {
    db.collection("users").doc(user.uid).set({
      storeName: "RBMN Store",
      cart: ["Product A", "Product B"],
      userEmail: user.email,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      alert("অভিনন্দন! ডাটা ফায়ারবেসে সফলভাবে সেভ হয়েছে।");
    })
    .catch((error) => {
      alert("ডাটা সেভ হতে সমস্যা: " + error.message);
    });
  } else {
    alert("আগে ১ নম্বর বাটনে চাপ দিয়ে একাউন্ট তৈরি বা লগইন করুন!");
  }
}
