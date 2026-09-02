// ==========================================
// ১. ফায়ারবেস কনফিগারেশন
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA7itgqaCU1EZAgfO-SccODzDEBvSP5nEE",
  authDomain: "rbm-store-458c8.firebaseapp.com",
  projectId: "rbm-store-458c8",
  storageBucket: "rbm-store-458c8.firebasestorage.app",
  messagingSenderId: "415572875433",
  appId: "1:415572875433:web:e2b856af421b636bb271b8",
  measurementId: "G-GDR5R78Y6D"
};

// ২. Firebase ইনিশিয়ালাইজেশন
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

let currentLoadedProducts = [];

// ==========================================
// ৩. মডাল ও গ্লোবাল ফাংশনসমূহ
// ==========================================

// Auth Modal Open
function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'flex';
        authModal.classList.add('active');
    }
}

// Auth Modal Close
function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
        authModal.classList.remove('active');
    }
}

// Update Cart Badge Counter
function updateCartBadgeCount(count) {
    const cartCountEl = document.querySelector('.cart-count') || document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

// Real-time Firestore Cart Listener
function listenToUserCart(userId) {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        firebase.firestore().collection('users').doc(userId).collection('cart').onSnapshot(snapshot => {
            updateCartBadgeCount(snapshot.size);
        }, err => {
            console.error("Cart Listener Error:", err);
        });
    }
}

// Add Item to Firestore Cart
function addToCart(id, title, price, image) {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert("ফায়ারবেস কানেকশন পাওয়া যায়নি!");
        return;
    }
    
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
        alert('কার্টে প্রোডাক্ট সেভ হয়েছে!');
    }).catch(err => {
        alert('Error: ' + err.message);
    });
}

// Helper to escape single quotes in product attributes for inline HTML
function escapeString(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ==========================================
// ৪. DOM Content Loaded Events
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    const productList = document.getElementById('product-list') || document.querySelector('.product-grid');

    // প্রোডাক্ট গ্রিড রেন্ডারিং ফাংশন
    function displayProducts(productsToRender) {
        if (!productList) return;
        
        if (!productsToRender || productsToRender.length === 0) {
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px 20px; font-size: 1.1rem; color: #666;">কোনো প্রোডাক্ট পাওয়া যায়নি!</p>';
            return;
        }

        productList.innerHTML = productsToRender.map(product => {
            const pId = product.id || '';
            const pTitle = product.title || product.name || 'Untitled Product';
            const pPrice = product.price || 0;
            const pImg = product.image || product.img || 'https://via.placeholder.com/200';

            return `
                <div class="product-card">
                    <img src="${pImg}" alt="${escapeString(pTitle)}" onerror="this.src='https://via.placeholder.com/200'">
                    <h3>${pTitle}</h3>
                    <p class="price">৳${pPrice}</p>
                    <button class="buy-btn" onclick="addToCart('${pId}', '${escapeString(pTitle)}', '${pPrice}', '${escapeString(pImg)}')">Add to Cart</button>
                </div>
            `;
        }).join('');
    }

    // ফায়ারবেস থেকে রিয়েল-টাইম প্রোডাক্ট লোড
    function loadProductsFromCloud() {
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
                console.error("Firestore Error:", error);
            });
        } else {
            setTimeout(loadProductsFromCloud, 300);
        }
    }

    loadProductsFromCloud();

    // ==========================================
    // ৫. সার্চ এবং ফিল্টারিং লজিক (Search Fix)
    // ==========================================
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function filterProducts() {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase().trim();
        
        const filtered = currentLoadedProducts.filter(p => {
            const title = (p.title || p.name || '').toLowerCase();
            return title.includes(query);
        });
        
        displayProducts(filtered);
    }

    if (searchInput) {
        // টাইপ করার সাথে সাথে ফিল্টার হবে
        searchInput.addEventListener('input', filterProducts);
        // Enter প্রেস করলেও ফিল্টার হবে
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterProducts();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filterProducts();
        });
    }

    // ==========================================
    // ৬. অ্যাডমিন প্রোডাক্ট আপলোড ফর্ম
    // ==========================================
    const pForm = document.getElementById('admin-product-form');
    if (pForm) {
        pForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('p-title') ? document.getElementById('p-title').value.trim() : '';
            const price = document.getElementById('p-price') ? document.getElementById('p-price').value.trim() : '';
            const image = document.getElementById('p-image') ? document.getElementById('p-image').value.trim() : '';
            const link = document.getElementById('p-link') ? document.getElementById('p-link').value.trim() : '';

            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                db.collection("products").add({
                    title: title,
                    price: price,
                    image: image,
                    link: link,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    alert('SUCCESS: প্রোডাক্টটি সফলভাবে ক্লাউডে আপলোড হয়েছে!');
                    pForm.reset();
                }).catch(err => {
                    alert("Upload Error: " + err.message);
                });
            } else {
                alert("Firebase এখনো লোড হয়নি! পেজটি রিফ্রেশ দিয়ে আবার চেষ্টা করুন।");
            }
        });
    }

    // ==========================================
    // ৭. অ্যাকাউন্ট রেজিস্টার ও লগইন লজিক
    // ==========================================
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Registration Handler
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof firebase === 'undefined' || !firebase.auth) return;

            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value.trim();

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
                    registerForm.reset();
                })
                .catch((error) => alert('Registration Error: ' + error.message));
        });
    }

    // Login Handler
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof firebase === 'undefined' || !firebase.auth) return;

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert('Logged in successfully!');
                    closeAuthModal();
                    loginForm.reset();
                })
                .catch((error) => alert('Login Error: ' + error.message));
        });
    }

    // Modal Background Click Handler (To Close Modal)
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }

    // ==========================================
    // ৮. ইউজারের Auth স্টেট লিসেনার
    // ==========================================
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
                    }).catch(err => {
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
});
