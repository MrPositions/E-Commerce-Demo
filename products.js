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

    // Get the URL query parameter
    const params = new URLSearchParams(window.location.search);
    const selectedCategory = params.get('category');

    // If there's a category specified in the URL, filter the products and pre-select the category box
    if (selectedCategory) {
        filterProductsByCategory(selectedCategory);

        // Pre-select the corresponding category box
        categoryBoxes.forEach(box => {
            const boxCategory = box.querySelector('p').textContent.toLowerCase();
            if (boxCategory === selectedCategory.toLowerCase()) {
                box.classList.add('selected-category');
            }
        });
    }

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

            // Update the URL without reloading the page
            const newUrl = window.location.pathname + '?category=' + category;
            window.history.pushState({}, '', newUrl);

            // Map categories to their respective tags
            const categoryMap = {
                'all': [
                    'hat', 'beanie', 'headwear',
                    'top', 'shirt', 'sweater', 'jacket',
                    'pants', 'leggings', 'shorts',
                    'gloves', 'mittens', 'handwear',
                    'scarf', 'muffler',
                    'swimming trunks', 'bikini', 'swimwear',
                    'underwear', 'undergarments', 'briefs',
                    'boxers', 'bras', 'panties', 'lingerie',
                    'corset', 'vest',
                    'socks', 'slippers', 'shoes', 'footwear'
                ],
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
            filterProductsByTags(relevantTags);
        });
    });

    // Function to filter products by category
    function filterProductsByCategory(category) {
        const categoryMap = {
            'all': [
                'hat', 'beanie', 'headwear',
                'top', 'shirt', 'sweater', 'jacket',
                'pants', 'leggings', 'shorts',
                'gloves', 'mittens', 'handwear',
                'scarf', 'muffler',
                'swimming trunks', 'bikini', 'swimwear',
                'underwear', 'undergarments', 'briefs',
                'boxers', 'bras', 'panties', 'lingerie',
                'corset', 'vest',
                'socks', 'slippers', 'shoes', 'footwear'
            ],
            'headwear': ['hat', 'beanie', 'headwear'],
            'tops': ['top', 'shirt', 'sweater', 'jacket'],
            'legs': ['pants', 'leggings', 'shorts'],
            'handwear': ['gloves', 'mittens', 'handwear'],
            'scarves': ['scarf', 'muffler'],
            'swimwear': ['swimming trunks', 'bikini', 'swimwear'],
            'underwear': ['underwear', 'undergarments', 'briefs', 'boxers', 'bras', 'panties', 'lingerie', 'corset', 'vest'],
            'footwear': ['socks', 'slippers', 'shoes', 'footwear']
        };

        // Get relevant tags for the category from the map
        const relevantTags = categoryMap[category.toLowerCase()];
        if (relevantTags) {
            filterProductsByTags(relevantTags);
        }
    }

    // Function to filter products by relevant tags
    function filterProductsByTags(relevantTags) {
        productItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category')?.toLowerCase();
            if (!itemCategory || !relevantTags.includes(itemCategory)) {
                item.style.display = 'none'; // Hide the product if it doesn't match the relevant tags
            } else {
                item.style.display = 'block'; // Show the product if it matches
            }
        });
    }

    // Reset functionality when page is refreshed (back to the original view)
    window.addEventListener('popstate', function() {
        // On back or refresh, clear all filters
        categoryBoxes.forEach(box => {
            box.classList.remove('selected-category');
        });

        // Show all products again
        productItems.forEach(item => {
            item.style.display = 'block'; // Show all products
        });

        // Remove any query parameters from the URL without reloading
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    });

});
