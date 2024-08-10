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
    document.querySelectorAll('.style-option').forEach(img => {
        img.addEventListener('click', () => {
            document.querySelectorAll('.styles li').forEach(li => li.classList.remove('selected'));
            img.parentElement.classList.add('selected');

            const selectedStyle = img.getAttribute('data-style');
            console.log('Selected style:', selectedStyle);
        });
    });

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
                if (item.name === productName && item.color === selectedColor) {
                    item.quantity += 1;
                    itemFound = true;
                }
            });

            if (!itemFound) {
                // Add new item to cart
                cartItems.push({
                    name: productName,
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
                        <p class="color-display" style="background-color: ${item.color}; width: 20px; height: 20px; display: inline-block;"></p>
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
                quantityInput.value = parseInt(quantityInput.value) + 1;
                updateCartTotal(); // Update total when quantity changes
            });

            cartItem.querySelector('.quantity-minus').addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                    updateCartTotal(); // Update total when quantity changes
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
        const uniqueItemsCount = new Set(cartItems.map(item => `${item.name}-${item.color}`)).size; // Count unique items
        document.getElementById('cart-badge').textContent = uniqueItemsCount;
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
            window.location.href = `search-results.html?query=${encodeURIComponent(searchQuery)}`;
        }
    });

    // Optional: Handle Enter key press for search functionality
    document.querySelector('.search-bar input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            const searchQuery = event.target.value.trim();
            if (searchQuery) {
                window.location.href = `search-results.html?query=${encodeURIComponent(searchQuery)}`;
            }
        }
    });

    // JavaScript to handle displaying search results based on query parameter
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');

    if (query) {
        const searchResults = document.querySelector('.search-results');
        if (searchResults) {
            searchResults.textContent = `Results for: ${query}`;
            // Perform actual search logic here
        }
    }

    // Adjust spacing for cart items and buttons
    function adjustSpacing() {
        const cartItems = document.querySelectorAll('.cart-item');
        const totalSection = document.querySelector('.cart-content .total-section');
        const continueShoppingBtn = document.querySelector('.continue-shopping');
        const proceedToCheckoutBtn = document.querySelector('.proceed-to-checkout');

        if (cartItems.length > 0) {
            const lastItem = cartItems[cartItems.length - 1];
            const itemBottom = lastItem.getBoundingClientRect().bottom;
            const totalSectionTop = totalSection.getBoundingClientRect().top;
            const continueShoppingBtnTop = continueShoppingBtn.getBoundingClientRect().top;

            const distanceToItem = continueShoppingBtnTop - itemBottom;

            if (distanceToItem < 0.4 * (continueShoppingBtn.offsetHeight)) {
                const adjustAmount = 0.4 * (continueShoppingBtn.offsetHeight) - distanceToItem;
                totalSection.style.marginTop = `${adjustAmount}px`;
            }
        }
    }

    window.addEventListener('load', () => {
        document.querySelectorAll('.style-option img, .color-button img').forEach(img => {
            img.style.width = '60px'; // Ensure width
            img.style.height = '60px'; // Ensure height
        });

        updateCartBadge(); // Initial badge update
        updateCartDisplay(); // Initial cart display update
    });

    window.addEventListener('resize', adjustSpacing);
    adjustSpacing();
});
