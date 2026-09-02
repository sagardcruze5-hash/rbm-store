// ১. ফায়ারবেস কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyA7itgqaCU1EZAgfO-SccODzDEBvSP5nEE",
  authDomain: "rbm-store-458c8.firebaseapp.com",
  projectId: "rbm-store-458c8",
  storageBucket: "rbm-store-458c8.firebasestorage.app",
  messagingSenderId: "415572875433",
  appId: "1:415572875433:web:e2b856af421b636bb271b8",
  measurementId: "G-GDR5R78Y6D"
};

// ২. Firebase ইনিশিয়ালাইজেশন
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global Open/Close Modal Functions
function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.style.setProperty('display', 'flex', 'important');
}

function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.style.setProperty('display', 'none', 'important');
}

let currentLoadedProducts = [];

// ৩. DOM Content Loaded (প্রধান ইভেন্ট)
document.addEventListener('DOMContentLoaded', () => {

    const productList = document.getElementById('product-list') || document.querySelector('.product-grid');

    // প্রোডাক্ট গ্রিডে প্রদর্শন করার ফংশন
    function displayProducts(productsToRender) {
        if (!productList) return;
        if (!productsToRender || productsToRender.length === 0) {
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">কোনো প্রোডাক্ট পাওয়া যায়নি!</p>';
        } else {
            productList.innerHTML = productsToRender.map(product => `
                <div class="product-card">
                    <img src="${product.image || product.img}" alt="${product.title || product.name}" onerror="this.src='https://via.placeholder.com/150'">
                    <h3>${product.title || product.name}</h3>
                    <p class="price">৳${product.price}</p>
                    <button class="buy-btn" onclick="addToCart('${product.id || Date.now()}', '${product.title || product.name}', '${product.price}', '${product.image || product.img}')">Add to Cart</button>
                </div>
            `).join('');
        }
    }

    // ফায়ারবেস বা লোকালস্টোরেজ থেকে প্রোডাক্ট লোড করা
    function loadAllProducts() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            db.collection("products").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
                let products = [];
                snapshot.forEach((doc) => {
                    products.push({ id: doc.id, ...doc.data() });
                });
                if (products.length > 0) {
                    currentLoadedProducts = products;
                    displayProducts(products);
                    return;
                }
                fallbackLocalProducts();
            }, (error) => {
                console.error("Firebase Error:", error);
                fallbackLocalProducts();
            });
        } else {
            fallbackLocalProducts();
        }
    }

    function fallbackLocalProducts() {
        const localProducts = JSON.parse(localStorage.getItem('rbm_products')) || [];
        currentLoadedProducts = localProducts;
        displayProducts(localProducts);
    }

    loadAllProducts();

    // Search Feature
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function filterProducts() {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase();
        const filtered = currentLoadedProducts.filter(p => 
            (p.title && p.title.toLowerCase().includes(query)) || 
            (p.name && p.name.toLowerCase().includes(query))
        );
        displayProducts(filtered);
    }

    if (searchInput) searchInput.addEventListener('keyup', filterProducts);
    if (searchBtn) searchBtn.addEventListener('click', filterProducts);


    // --- B. SIDEBAR & FOOTER ---
    const sidebarMenu = document.getElementById('sidebar-menu');
    const customLinks = JSON.parse(localStorage.getItem('rbm_nav_links')) || [];
    if (sidebarMenu && customLinks.length > 0) {
        customLinks.forEach(link => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${link.url}">${link.title}</a>`;
            sidebarMenu.appendChild(li);
        });
    }

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


    // --- C. ADMIN PANEL CONTROLS (Product Upload) ---
    const pForm = document.getElementById('admin-product-form');
    if (pForm) {
        pForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('p-title').value;
            const price = document.getElementById('p-price').value;
            const image = document.getElementById('p-image').value;
            const link = document.getElementById('p-link') ? document.getElementById('p-link').value : '';

            const newP = { 
                id: Date.now().toString(),
                title: title, 
                price: price, 
                image: image, 
                link: link 
            };

            // লোকালস্টোরেজে সাথে সাথে সেভ
            let localProducts = JSON.parse(localStorage.getItem('rbm_products')) || [];
            localProducts.unshift(newP);
            localStorage.setItem('rbm_products', JSON.stringify(localProducts));

            // ফায়ারবেসে থাকলে ক্লাউডেও সেভ
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                db.collection("products").add({
                    ...newP,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    console.log("Cloud synced successfully!");
                }).catch(err => console.error("Cloud Sync Error:", err));
            }

            alert('প্রোডাক্ট সফলভাবে আপলোড হয়েছে!');
            pForm.reset();
            displayProducts(localProducts);
        });
    }

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


    // --- D. AUTHENTICATION UI ---
    const authBtn = document.getElementById('auth-trigger-btn');
    const authModal = document.getElementById('auth-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (authBtn) authBtn.addEventListener('click', (e) => { e.preventDefault(); openAuthModal(); });
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeAuthModal());

    window.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });

    if (tabLoginBtn && tabRegisterBtn) {
        tabLoginBtn.addEventListener('click', () => {
            loginForm.style.display = 'flex';
            registerForm.style.display = 'none';
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
        });

        tabRegisterBtn.addEventListener('click', () => {
            loginForm.style.display = 'none';
            registerForm.style.display = 'flex';
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
        });
    }

    // Register Submit
    if (registerForm && typeof firebase !== 'undefined' && firebase.auth) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return firebase.firestore().collection('users').doc(user.uid).set({
                        name: name,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    alert('Account created successfully!');
                    closeAuthModal();
                })
                .catch((error) => alert('Registration Error: ' + error.message));
        });
    }

    // Login Submit
    if (loginForm && typeof firebase !== 'undefined' && firebase.auth) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert('Logged in successfully!');
                    closeAuthModal();
                })
                .catch((error) => alert('Login Error: ' + error.message));
        });
    }
});


// ৪. ইউজারের স্ট্যাটাস অনুযায়ী নাম ও কার্ট আপডেট
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        const userText = document.getElementById('user-display-name');
        if (user) {
            if (firebase.firestore) {
                firebase.firestore().collection('users').doc(user.uid).get().then((doc) => {
                    if (doc.exists && doc.data().name) {
                        if (userText) userText.innerText = `Hello, ${doc.data().name}`;
                    } else {
                        if (userText) userText.innerText = `Hello, ${user.email.split('@')[0]}`;
                    }
                }).catch(() => {
                    if (userText) userText.innerText = `Hello, ${user.email.split('@')[0]}`;
                });
            }
            listenToUserCart(user.uid);
        } else {
            if (userText) userText.innerText = 'Hello, sign in';
            updateCartBadgeCount(0);
        }
    });
}


// ৫. অ্যাকাউন্ট ভিত্তিক কার্ট (CLOUD & LOCAL FALLBACK CART)
function addToCart(id, title, price, image) {
    const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
    
    if (!auth || !auth.currentUser) {
        alert("প্রোডাক্ট কার্টে যোগ করার জন্য দয়া করে আগে লগইন করুন!");
        openAuthModal();
        return;
    }

    const user = auth.currentUser;
    const userEmail = user.email;

    // ১. লোকাল সেভ
    let userCart = JSON.parse(localStorage.getItem(`cart_${userEmail}`)) || [];
    userCart.push({ id, title, price, image });
    localStorage.setItem(`cart_${userEmail}`, JSON.stringify(userCart));
    updateCartBadgeCount(userCart.length);

    // ২. ফায়ারবেস ক্লাউড সেভ
    if (firebase.firestore) {
        firebase.firestore().collection('users').doc(user.uid).collection('cart').doc(id).set({
            productId: id,
            title: title,
            price: price,
            image: image,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    alert('প্রোডাক্টটি সফলভাবে আপনার অ্যাকাউন্টের কার্টে যোগ হয়েছে!');
}

function listenToUserCart(userId) {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        firebase.firestore().collection('users').doc(userId).collection('cart').onSnapshot(snapshot => {
            updateCartBadgeCount(snapshot.size);
        });
    }
}

function updateCartBadgeCount(count) {
    const cartCountEl = document.querySelector('.cart-count') || document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}
