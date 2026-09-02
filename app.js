// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA7itgqaCU1EZAgfO-SccODzDEBvSP5nEE",
  authDomain: "rbm-store-458c8.firebaseapp.com",
  projectId: "rbm-store-458c8",
  storageBucket: "rbm-store-458c8.firebasestorage.app",
  messagingSenderId: "415572875433",
  appId: "1:415572875433:web:e2b856af421b636bb271b8"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let globalProducts = [];

// Auth Modal Functions
function openAuthModal() {
    document.getElementById('auth-modal').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function switchAuthTab(type) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab-btn');
    const regTab = document.getElementById('register-tab-btn');

    if (type === 'login') {
        loginForm.style.display = 'flex';
        regForm.style.display = 'none';
        loginTab.classList.add('active');
        regTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'flex';
        regTab.classList.add('active');
        loginTab.classList.remove('active');
    }
}

// Render Products
function renderProducts(products) {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    if (!products || products.length === 0) {
        productList.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 20px;">No products found in store!</p>';
        return;
    }

    productList.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.title || 'Product'}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${product.title || product.name || 'Untitled Product'}</h3>
            <p class="price">৳ ${product.price || 0}</p>
            <button class="buy-btn" onclick="addToCart('${product.id}', '${(product.title || '').replace(/'/g, "\\'")}', '${product.price}', '${product.image}')">Add to Cart</button>
        </div>
    `).join('');
}

// Fetch Products from Firestore
function loadProducts() {
    db.collection("products").onSnapshot((snapshot) => {
        let products = [];
        snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        globalProducts = products;
        renderProducts(products);
    }, (error) => {
        console.error("Firestore Error:", error);
    });
}

// Add to Cart Function
function addToCart(id, title, price, image) {
    const user = auth.currentUser;
    if (!user) {
        alert("Please login first to add products to cart!");
        openAuthModal();
        return;
    }

    db.collection('users').doc(user.uid).collection('cart').doc(id).set({
        productId: id,
        title: title,
        price: price,
        image: image,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Added to cart successfully!');
    }).catch(err => alert(err.message));
}

// Real-time Cart Listener
function listenToCart(userId) {
    db.collection('users').doc(userId).collection('cart').onSnapshot(snapshot => {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) cartCount.textContent = snapshot.size;
    });
}

// DOM Events
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    // Search Logic
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    function executeSearch() {
        const query = searchInput.value.toLowerCase().trim();
        const filtered = globalProducts.filter(p => 
            (p.title && p.title.toLowerCase().includes(query)) ||
            (p.name && p.name.toLowerCase().includes(query))
        );
        renderProducts(filtered);
    }

    if (searchInput) searchInput.addEventListener('keyup', executeSearch);
    if (searchBtn) searchBtn.addEventListener('click', executeSearch);

    // Register Event
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((cred) => {
                    return db.collection('users').doc(cred.user.uid).set({ name, email });
                })
                .then(() => {
                    alert('Registration Successful!');
                    closeAuthModal();
                })
                .catch(err => alert(err.message));
        });
    }

    // Login Event
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert('Login Successful!');
                    closeAuthModal();
                })
                .catch(err => alert(err.message));
        });
    }

    // Auth State Observer
    auth.onAuthStateChanged((user) => {
        const userText = document.getElementById('user-display-name');
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && doc.data().name) {
                    if (userText) userText.innerText = `Hello, ${doc.data().name}`;
                } else {
                    if (userText) userText.innerText = `Hello, ${user.email.split('@')[0]}`;
                }
            });
            listenToCart(user.uid);
        } else {
            if (userText) userText.innerText = 'Hello, Sign in';
            document.getElementById('cart-count').textContent = '0';
        }
    });
});
