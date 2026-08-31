// Firebase SDK Import (CDN Links)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase Config (আপনার সঠিক তথ্য দিয়ে সেট করা)
const firebaseConfig = {
  apiKey: "AIzaSyBNw22CAM2UIGw0O_eP9ut_lPpWgi89-9s",
  authDomain: "rbm-store-9456e.firebaseapp.com",
  projectId: "rbm-store-9456e",
  storageBucket: "rbm-store-9456e.firebasestorage.app",
  messagingSenderId: "27337891246",
  appId: "1:27337891246:web:ed8902b19f360ed617fc3f",
  measurementId: "G-CEH8GXEPBE"
};

// Initialize Firebase & Firestore Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------- 1. BACKEND / ADMIN PANEL LOGIC (Product Upload) ----------------
const productForm = document.getElementById('add-product-form');

if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('p-title').value;
        const price = document.getElementById('p-price').value;
        const image = document.getElementById('p-image').value;
        const desc = document.getElementById('p-desc').value;
        const link = document.getElementById('p-link').value;

        try {
            await addDoc(collection(db, "products"), {
                title: title,
                price: price,
                image: image,
                desc: desc,
                link: link,
                createdAt: new Date()
            });
            alert("Success! Product Uploaded to RBM STORE Database.");
            productForm.reset();
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Upload Failed! Check console for errors.");
        }
    });
}

// ---------------- 2. FRONTEND LOGIC (Show Products to Visitor) ----------------
const productList = document.getElementById('product-list');

if (productList) {
    async function loadProducts() {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            productList.innerHTML = "";
            
            if (querySnapshot.empty) {
                productList.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>No products found. Please add products from admin panel!</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                productList.innerHTML += `
                    <div class="card">
                        <img src="${data.image}" alt="${data.title}">
                        <h3>${data.title}</h3>
                        <p>${data.desc}</p>
                        <div class="price">${data.price}</div>
                        <div class="btn-group">
                            <a href="${data.link}" target="_blank" class="btn-cart">Add to Cart</a>
                            <a href="${data.link}" target="_blank" class="btn-buy">Buy Now</a>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error("Error fetching products: ", error);
        }
    }
    loadProducts();
}