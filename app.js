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
    if (authModal) {
        authModal.style.display = 'flex';
        authModal.classList.add('active');
    }
}

function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
        authModal.classList.remove('active');
    }
}

let currentLoadedProducts = [];

document.addEventListener('DOMContentLoaded', () => {

    const productList = document.getElementById('product-list') || document.querySelector('.product-grid');

    function displayProducts(productsToRender) {
        if (!productList) return;
        if (!productsToRender || productsToRender.length === 0) {
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 20px;">কোনো প্রোডাক্ট পাওয়া যায়নি!</p>';
        } else {
            productList.innerHTML = productsToRender.map(product => `
                <div class="product-card">
                    <img src="${product.image || product.img}" alt="${product.title || product.name}" onerror="this.src='https://via.placeholder.com/150'">
                    <h3>${product.title || product.name}</h3>
                    <p class="price">৳${product.price}</p>
                    <button class="buy-btn" onclick="addToCart('${product.id}', '${product.title || product.name}', '${product.price}', '${product.image || product.img}')">Add to Cart</button>
                </div>
            `).join('');
        }
    }

    // ফায়ারবেস থেকে লাইভ ডাটা লোড
    function fetchCloudProducts() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            db.collection("products").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
                let products = [];
                snapshot.forEach((doc) => {
                    products.push({ id: doc.id, ...doc.data() });
                });
                currentLoadedProducts = products;
                displayProducts(products);
            }, (error) => {
                console.error("Firebase Read Error:", error);
            });
        } else {
            setTimeout(fetchCloudProducts, 500);
        }
    }

    fetchCloudProducts();

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


    // --- ADMIN PANEL PRODUCT UPLOAD (DIRECT CLOUD SAVE) ---
    const pForm = document.getElementById('admin-product-form');
    if (pForm) {
        pForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('p-title').value;
            const price = document.getElementById('p-price').value;
            const image = document.getElementById('p-image').value;
            const link = document.getElementById('p-link') ? document.getElementById('p-link').value : '';

            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                db.collection("products").add({
                    title: title,
                    price: price,
                    image: image,
                    link: link,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    alert('সফলভাবে ক্লাউড ডাটাবেজে প্রোডাক্ট আপলোড হয়েছে! সব ডিভাইসে এখন দেখাবে।');
                    pForm.reset();
                }).catch(err => {
                    alert("Firebase Error: " + err.message + "\n\nদয়া করে Firebase Rules চেক করুন!");
                });
            } else {
                alert("Firebase এখনো লোড হয়নি, কিছুক্ষণ পর আবার চেষ্টা করুন।");
            }
        });
    }

    // --- AUTHENTICATION ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

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

// ইউজারের লগইন স্ট্যাটাস চেক
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
                });
            }
            listenToUserCart(user.uid);
        } else {
            if (userText) userText.innerText = 'Hello, sign in';
            updateCartBadgeCount(0);
        }
    });
}

// অ্যাকাউন্ট ভিত্তিক কার্ট
function addToCart(id, title, price, image) {
    if (typeof firebase === 'undefined' || !firebase.auth) return;
    const auth = firebase.auth();
    
    if (!auth.currentUser) {
        alert("প্রোডাক্ট কার্টে যোগ করার জন্য আগে লগইন করুন!");
        openAuthModal();
        return;
    }

    const user = auth.currentUser;
    firebase.firestore().collection('users').doc(user.uid).collection('cart').doc(id).set({
        productId: id,
        title: title,
        price: price,
        image: image,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('কার্টে প্রোডাক্ট সেভ হয়েছে!');
    });
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
