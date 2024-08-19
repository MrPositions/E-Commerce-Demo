document.addEventListener('DOMContentLoaded', () => {
    // JavaScript for handling tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

            button.classList.add('active');
            document.querySelector(`.tab-content.${button.dataset.tab}`).style.display = 'block';
        });
    });

    // JavaScript to handle color selection
    document.querySelectorAll('.color-button').forEach(button => {
        button.addEventListener('click', () => {
            const color = button.getAttribute('data-color');
            document.querySelector('.product-image img').style.backgroundColor = color;
            document.querySelectorAll('.color-button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    // JavaScript to handle style image selection
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach((img, index) => {
        img.addEventListener('click', () => {
            document.querySelectorAll('.styles li').forEach(li => li.classList.remove('selected'));
            img.parentElement.classList.add('selected');

            // Update main display image
            const displayImage = document.querySelector('.product-image img');
            displayImage.src = img.src; // Set the main display image to the clicked style image
        });
    });

    // Ensure the first style image is selected by default
    if (styleOptions.length > 0) {
        const firstStyleOption = styleOptions[0];
        firstStyleOption.parentElement.classList.add('selected');
        document.querySelector('.product-image img').src = firstStyleOption.src;
    }

    // JavaScript to handle Add to Cart button
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (event) => {
            console.log('Add to Cart button clicked');

            // Retrieve product information
            const productItem = event.target.closest('.product-details');
            if (!productItem) {
                console.error('Product item not found');
                return;
            }

            const productName = productItem.querySelector('h1')?.textContent;
            const productImage = productItem.querySelector('.product-image img')?.src;
            const productPrice = productItem.querySelector('.price')?.textContent;
            const selectedColor = document.querySelector('.color-button.selected')?.getAttribute('data-color') || '';
            const selectedStyleIndex = [...document.querySelectorAll('.style-option')].indexOf(document.querySelector('.styles li.selected .style-option')) + 1;
            const styleIdentifier = selectedStyleIndex ? `-S${selectedStyleIndex}` : '';

            console.log('Product Name:', productName);
            console.log('Product Image:', productImage);
            console.log('Product Price:', productPrice);
            console.log('Selected Color:', selectedColor);

            if (!productName || !productImage || !productPrice) {
                console.error('Product information missing');
                return;
            }

            // Get cart items from localStorage
            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            let itemFound = false;

            // Check for duplicate items with same color and style
            cartItems.forEach(item => {
                if (item.name === productName + styleIdentifier && item.color === selectedColor) {
                    item.quantity += 1;
                    itemFound = true;
                }
            });

            if (!itemFound) {
                // Add new item to cart
                cartItems.push({
                    name: productName + styleIdentifier,
                    image: productImage,
                    price: productPrice,
                    color: selectedColor,
                    quantity: 1
                });
            }

            // Save updated cart to localStorage
            localStorage.setItem('cartItems', JSON.stringify(cartItems));

            // Update cart display and badge
            updateCartDisplay();
            updateCartBadge();

            // Open cart and bring it into view when adding an item
            const cartSection = document.querySelector('.cart-section');
            if (cartSection) {
                cartSection.classList.add('open');
                setTimeout(() => {
                    cartSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 300); // Delay to allow CSS transition if necessary
            } else {
                console.error('Cart section not found');
            }
        });
    });

    // Function to update the cart display
    function updateCartDisplay() {
        const cartContent = document.querySelector('.cart-section .cart-content');
        cartContent.innerHTML = ''; // Clear current cart content

        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        cartItems.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="item-info d-flex align-items-start">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="item-details ml-3 flex-grow-1">
                        <div class="details-header">
                            <h4>${item.name}</h4>
                            <p class="price">${item.price}</p>
                        </div>
                        <p class="style-display">${item.style ? `Style: ${item.style}` : ''}</p>
                        <div class="quantity-controls">
                            <button class="quantity-minus">-</button>
                            <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                            <button class="quantity-plus">+</button>
                        </div>
                    </div>
                    <button class="delete-btn">&times;</button>
                </div>
            `;

            // Add to cart section
            cartContent.appendChild(cartItem);

            // Handle delete button
            cartItem.querySelector('.delete-btn').addEventListener('click', () => {
                const updatedCartItems = cartItems.filter(cartItem => cartItem.name !== item.name || cartItem.color !== item.color);
                localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
                updateCartDisplay(); // Update display
                updateCartBadge(); // Update badge after removal
            });

            // Handle quantity controls
            const quantityInput = cartItem.querySelector('.quantity-input');
            cartItem.querySelector('.quantity-plus').addEventListener('click', () => {
                const newQuantity = parseInt(quantityInput.value) + 1;
                quantityInput.value = newQuantity;
                updateCartQuantity(item.name, item.color, newQuantity);
            });

            cartItem.querySelector('.quantity-minus').addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    const newQuantity = currentValue - 1;
                    quantityInput.value = newQuantity;
                    updateCartQuantity(item.name, item.color, newQuantity);
                }
            });
        });

        updateCartTotal();
    }

    // Function to update the cart total
    function updateCartTotal() {
        let total = 0;
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        cartItems.forEach(item => {
            const price = parseFloat(item.price.replace(/[^0-9.-]+/g, '')); // Extract numeric value from text
            total += price * item.quantity;
        });

        // Display total
        document.querySelector('.cart-total').textContent = `Total: $${total.toFixed(2)}`;
        adjustSpacing(); // Adjust spacing after total update
    }

    // Function to update the cart badge count
    function updateCartBadge() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        console.log('Cart Items:', cartItems); // Debugging line to check cart items
        // Create a Set to track unique item names with color and style
        const uniqueItems = new Set(cartItems.map(item => `${item.name}-${item.color}`));
        document.getElementById('cart-badge').textContent = uniqueItems.size;
    }

    // Function to update cart quantity
    function updateCartQuantity(name, color, quantity) {
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        cartItems = cartItems.map(item => {
            if (item.name === name && item.color === color) {
                return { ...item, quantity: quantity };
            }
            return item;
        });
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartDisplay(); // Ensure the cart display is updated
    }

    // JavaScript to handle Buy Now button
    document.querySelectorAll('.buy-now').forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'checkout.html'; // Redirect directly to the checkout page
        });
    });

    // JavaScript to handle cart section open/close
    document.getElementById('cart-icon').addEventListener('click', () => {
        document.querySelector('.cart-section').classList.toggle('open');
    });

    document.getElementById('continue-shopping').addEventListener('click', () => {
        document.querySelector('.cart-section').classList.remove('open');
    });

    document.getElementById('proceed-to-checkout').addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });

    // JavaScript to handle search functionality
    document.querySelector('.search-bar button').addEventListener('click', () => {
        const searchQuery = document.querySelector('.search-bar input').value.trim();
        if (searchQuery) {
            window.location.href = `search.html?query=${encodeURIComponent(searchQuery)}`;
        }
    });

    // Update cart badge and display on page load
    updateCartBadge();
    updateCartDisplay(); // Ensure cart items are displayed
});

document.addEventListener('DOMContentLoaded', function() {
    const categoryBoxes = document.querySelectorAll('.category-box');
    const productItems = document.querySelectorAll('.product-item');

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
                'undergarments': ['underwear', 'briefs', 'boxers', 'bras', 'panties', 'lingerie', 'corset', 'vest'],
                'footwear': ['socks', 'slippers', 'shoes', 'footwear']
            };

            // Get the relevant tags for the selected category
            const relevantTags = categoryMap[category];

            // Show or hide product items based on category
            productItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category')?.toLowerCase(); // Using optional chaining to handle missing data-category attribute

                // Hide the item if it has no category or doesn't match the relevant tags
                if (!itemCategory || !relevantTags.includes(itemCategory)) {
                    item.style.display = 'none';
                } else {
                    item.style.display = 'block';
                }
            });
        });
    });
});
