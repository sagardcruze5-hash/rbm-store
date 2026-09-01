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








// Firebase Console থেকে পাওয়া কনফিগারেশন অবজেক্ট
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase চালুকরণ
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();






function registerUser(email, password, userName) {
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      
      // Firestore ডাটাবেজে ইউজার প্রোফাইল সেভ
      return db.collection("users").doc(user.uid).set({
        name: userName,
        email: email,
        cart: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      console.log("ইউজার সফলভাবে রেজিস্টার্ড এবং ডাটা সেভ হয়েছে!");
    })
    .catch((error) => {
      console.error("ত্রুটি:", error.message);
    });
}







// ইউজার সাইন-ইন ফাংশন
function loginUser(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .catch((error) => {
      console.error("লগইন ব্যর্থ:", error.message);
    });
}

// যেকোনো ডিভাইস থেকে লগইন করলেই ডাটা লোড হওয়ার লিসেনার
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("লগইন করা ইউজার ID:", user.uid);
    
    // ডাটাবেজ থেকে রিয়েল-টাইম ডাটা রিড করা
    db.collection("users").doc(user.uid)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          console.log("ইউজার ডাটা:", userData);
          // এখানে UI আপডেট করার ফাংশন কল করুন
        }
      });
  } else {
    console.log("কোনো ইউজার লগইন নেই");
  }
});
