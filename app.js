document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Main Products (6 Grid Columns Layout)
    const productList = document.getElementById('product-list');
    if (productList) {
        const products = JSON.parse(localStorage.getItem('rbm_products')) || [];
        
        if (products.length === 0) {
            productList.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No products uploaded yet!</p>';
        } else {
            productList.innerHTML = products.map(product => `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/150'">
                    <h3>${product.title}</h3>
                    <p class="price">${product.price}</p>
                    <a href="${product.link}" target="_blank" class="buy-btn">Buy on Amazon</a>
                </div>
            `).join('');
        }
    }

    // 2. Load Custom Nav Links Saved from Admin
    const customNavContainer = document.getElementById('custom-nav-links');
    const customLinks = JSON.parse(localStorage.getItem('rbm_nav_links')) || [];
    if (customNavContainer && customLinks.length > 0) {
        customNavContainer.innerHTML = customLinks.map(item => `<a href="${item.url}">${item.title}</a>`).join('');
    }

    // 3. Admin Panel - Product & Navigation Bar Upload Handler
    const adminForm = document.getElementById('product-form') || document.querySelector('form');
    if (adminForm && window.location.pathname.includes('admin')) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = adminForm.querySelectorAll('input');
            const title = inputs[0].value;
            const price = inputs[1].value;
            const image = inputs[2].value;
            const link = inputs[3].value;

            const newProduct = { title, price, image, link, id: Date.now() };
            let products = JSON.parse(localStorage.getItem('rbm_products')) || [];
            products.push(newProduct);
            
            localStorage.setItem('rbm_products', JSON.stringify(products));
            alert('Product Uploaded Successfully!');
            adminForm.reset();
            window.location.reload();
        });
    }
});

// Admin Panel Helper to Add Navigation Links
function addCustomNavLink(title, url) {
    let customLinks = JSON.parse(localStorage.getItem('rbm_nav_links')) || [];
    customLinks.push({ title, url });
    localStorage.setItem('rbm_nav_links', JSON.stringify(customLinks));
    alert('Nav Link Added!');
}
