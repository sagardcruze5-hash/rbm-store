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

// ২. Firebase চালুকরণ
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = (typeof firebase !== 'undefined') ? firebase.auth() : null;
const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

// Global Open/Close Functions for HTML onclick attributes
function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.setProperty('display', 'flex', 'important');
    }
}

function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.setProperty('display', 'none', 'important');
    }
}

// ৩. DOM Content Loaded (একক ইভেন্ট লিসেনার)
document.addEventListener('DOMContentLoaded', () => {

    // --- A. PRODUCT DISPLAY & SEARCH ---
    const productList = document.getElementById('product-list');
    let allProducts = JSON.parse(localStorage.getItem('rbm_products')) || [];

    function displayProducts(productsToRender) {
        if (!productList) return;
        if (!productsToRender || productsToRender.length === 0) {
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

    // Firestore রিয়েল-টাইম ডাটা লোড
    if (db) {
        db.collection("products").onSnapshot((snapshot) => {
            let products = [];
            snapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });
            if (products.length > 0) {
                displayProducts(products);
            } else {
                displayProducts(allProducts);
            }
        }, (error) => {
            console.error("প্রোডাক্ট লোড করতে সমস্যা:", error);
            displayProducts(allProducts);
        });
    } else {
        displayProducts(allProducts);
    }

    // Search
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function filterProducts() {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => p.title.toLowerCase().includes(query));
        displayProducts(filtered);
    }

    if (searchInput) searchInput.addEventListener('keyup', filterProducts);
    if (searchBtn) searchBtn.addEventListener('click', filterProducts);


    // --- B. SIDEBAR LINKS & FOOTER ---
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


    // --- C. ADMIN PANEL CONTROLS ---
    const pForm = document.getElementById('admin-product-form');
    if (pForm) {
        pForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newP = {
                title: document.getElementById('p-title').value,
                price: document.getElementById('p-price').value,
                image: document.getElementById('p-image').value,
                link: document.getElementById('p-link').value,
            };

            if (db) {
                db.collection("products").add({
                    ...newP,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    alert('Product Added to Cloud Successfully!');
                    pForm.reset();
                }).catch(err => alert("Error adding product: " + err.message));
            } else {
                newP.id = Date.now();
                allProducts.push(newP);
                localStorage.setItem('rbm_products', JSON.stringify(allProducts));
                alert('Product Added Successfully!');
                pForm.reset();
                displayProducts(allProducts);
            }
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


    // --- D. MODAL & AUTHENTICATION UI ---
    const authBtn = document.getElementById('auth-trigger-btn');
    const authModal = document.getElementById('auth-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (authBtn) {
        authBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeAuthModal();
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
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

    // Register Form Submit
    if (registerForm && auth) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return db.collection('users').doc(user.uid).set({
                        name: name,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    alert('Account created successfully!');
                    closeAuthModal();
                })
                .catch((error) => {
                    alert('Registration Error: ' + error.message);
                });
        });
    }

    // Login Form Submit
    if (loginForm && auth) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert('Logged in successfully!');
                    closeAuthModal();
                })
                .catch((error) => {
                    alert('Login Error: ' + error.message);
                });
        });
    }
});


// ৪. ইউজারের স্ট্যাটাস অনুযায়ী হেডারের নাম আপডেট
if (auth) {
    auth.onAuthStateChanged((user) => {
        const userText = document.getElementById('user-display-name');
        if (user) {
            if (db) {
                db.collection('users').doc(user.uid).get().then((doc) => {
                    if (doc.exists && doc.data().name) {
                        if (userText) userText.innerText = `Hello, ${doc.data().name}`;
                    } else {
                        if (userText) userText.innerText = `Hello, ${user.email.split('@')[0]}`;
                    }
                }).catch(() => {
                    if (userText) userText.innerText = `Hello, ${user.email.split('@')[0]}`;
                });
            }
        } else {
            if (userText) userText.innerText = 'Hello, sign in';
        }
    });
}

// ৫. টেস্ট ফাংশনস
function testSignUp() {
    if (!auth) return;
    const email = document.getElementById("testEmail").value;
    const password = document.getElementById("testPassword").value;

    if(!email || !password) {
        alert("ইমেইল ও পাসওয়ার্ড লিখুন!");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! User ID: " + userCredential.user.uid);
        })
        .catch((error) => {
            alert("ত্রুটি: " + error.message);
        });
}

function testSaveData() {
    if (!auth || !db) return;
    const user = auth.currentUser;

    if (user) {
        db.collection("users").doc(user.uid).set({
            storeName: "RBMN Store",
            cart: ["Product A", "Product B"],
            userEmail: user.email,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert("অভিনন্দন! ডাটা ফায়ারবেসে সফলভাবে সেভ হয়েছে।");
        })
        .catch((error) => {
            alert("ডাটা সেভ হতে সমস্যা: " + error.message);
        });
    } else {
        alert("আগে ১ নম্বর বাটনে চাপ দিয়ে একাউন্ট তৈরি বা লগইন করুন!");
    }
}
