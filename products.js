document.addEventListener('DOMContentLoaded', () => {
    const categoryBoxes = document.querySelectorAll('.category-box');
    const productItems = document.querySelectorAll('.product-item');

    // Array to store product details
    const products = [];

    // Extract product details from products.html
    productItems.forEach(item => {
        const category = item.getAttribute('data-category');
        const nameElement = item.querySelector('h3');
        const descriptionElement = item.querySelector('p');
        const priceElement = item.querySelector('.price');
        const imgElement = item.querySelector('img');
        const buyButton = item.querySelector('.buy-button');

        // Check if the necessary elements exist
        if (nameElement && descriptionElement && priceElement && imgElement && buyButton) {
            const name = nameElement.textContent.trim();
            const description = descriptionElement.textContent.trim();
            const price = priceElement.textContent.trim();
            const imgSrc = imgElement.getAttribute('src');
            const detailsUrlMatch = buyButton.getAttribute('onclick').match(/'(.*?)'/);
            const detailsUrl = detailsUrlMatch ? detailsUrlMatch[1] : ''; // Safe extraction

            products.push({
                category,
                name,
                description,
                price,
                imgSrc,
                detailsUrl
            });
        } else {
            console.error('Missing element in product item:', item);
        }
    });

    // Make products array globally accessible
    window.products = products;

    // Event listeners for category boxes
    categoryBoxes.forEach(box => {
        box.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove the selected effect from all category boxes
            categoryBoxes.forEach(box => {
                box.classList.remove('selected-category');
            });

            // Add the selected effect to the clicked category box
            this.classList.add('selected-category');

            // Get the selected category
            const category = this.querySelector('p').textContent.toLowerCase();

            // Map categories to their respective tags
            const categoryMap = {
                'headwear': ['hat', 'beanie', 'headwear'],
                'tops': ['top', 'shirt', 'sweater', 'jacket'],
                'legs': ['pants', 'leggings', 'shorts'],
                'handwear': ['gloves', 'mittens', 'handwear'],
                'scarves': ['scarf', 'muffler'],
                'swimwear': ['swimming trunks', 'bikini', 'swimwear'],
                'underwear': ['underwear', 'undergarments', 'briefs', 'boxers', 'bras', 'panties', 'lingerie', 'corset', 'vest'],
                'footwear': ['socks', 'slippers', 'shoes', 'footwear']
            };

            // Get the relevant tags for the selected category
            const relevantTags = categoryMap[category];

            // Show or hide product items based on category
            productItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category')?.toLowerCase();
                if (!itemCategory || !relevantTags.includes(itemCategory)) {
                    item.style.display = 'none';
                } else {
                    item.style.display = 'block';
                }
            });
        });
    });
});
