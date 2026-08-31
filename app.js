document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('product-form') || document.querySelector('form');
    
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = adminForm.querySelector('input[placeholder*="Title"], input[name="title"]').value;
            const price = adminForm.querySelector('input[placeholder*="Price"], input[name="price"]').value;
            const image = adminForm.querySelector('input[placeholder*="Image"], input[name="image"]').value;
            const link = adminForm.querySelector('input[placeholder*="Link"], input[name="link"]').value;
            const desc = adminForm.querySelector('textarea, input[name="desc"]').value;

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
