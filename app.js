document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Products on Main Page (Visitor View)
    const productList = document.getElementById('product-list');
    if (productList) {
        const products = JSON.parse(localStorage.getItem('rbm_products')) || [];
        
        if (products.length === 0) {
            productList.innerHTML = '<p style="text-align:center; width:100%;">No products uploaded yet!</p>';
        } else {
            productList.innerHTML = products.map(product => `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/150'">
                    <h3>${product.title}</h3>
                    <p class="price">${product.price}</p>
                    <p class="desc">${product.desc || ''}</p>
                    <a href="${product.link}" target="_blank" class="buy-btn">Buy on Amazon</a>
                </div>
            `).join('');
        }
    }

    // 2. Save Products from Admin Panel
    const adminForm = document.getElementById('product-form') || document.querySelector('form');
    if (adminForm && window.location.pathname.includes('admin')) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const inputs = adminForm.querySelectorAll('input, textarea');
            const title = inputs[0].value;
            const price = inputs[1].value;
            const image = inputs[2].value;
            const link = inputs[3].value;
            const desc = inputs[4] ? inputs[4].value : '';

            const newProduct = { title, price, image, link, desc, id: Date.now() };

            let products = JSON.parse(localStorage.getItem('rbm_products')) || [];
            products.push(newProduct);
            
            try {
                localStorage.setItem('rbm_products', JSON.stringify(products));
                alert('Product Uploaded Successfully!');
                adminForm.reset();
            } catch (err) {
                alert('Error uploading product: ' + err.message);
            }
        });
    }
});
