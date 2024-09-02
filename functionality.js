document.addEventListener('DOMContentLoaded', () => {
    // Handle the hamburger menu toggle for mobile
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerIcon && mobileMenu) {
        hamburgerIcon.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Handle tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

            button.classList.add('active');
            document.querySelector(`.tab-content.${button.dataset.tab}`).style.display = 'block';
        });
    });


    // Handle color selection
    document.querySelectorAll('.color-button').forEach(button => {
        button.addEventListener('click', () => {
            const color = button.getAttribute('data-color');
            document.querySelector('.product-image img').style.backgroundColor = color;
            document.querySelectorAll('.color-button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    // Handle style image selection
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach((img, index) => {
        img.addEventListener('click', () => {
            document.querySelectorAll('.styles li').forEach(li => li.classList.remove('selected'));
            img.parentElement.classList.add('selected');

            // Update main display image
            const displayImage = document.querySelector('.product-image img');
            displayImage.src = img.src;
        });
    });

    // Select first style image by default
    if (styleOptions.length > 0) {
        const firstStyleOption = styleOptions[0];
        firstStyleOption.parentElement.classList.add('selected');
        document.querySelector('.product-image img').src = firstStyleOption.src;
    }

    // Handle Add to Cart button
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (event) => {
            const productItem = event.target.closest('.product-details');
            if (!productItem) return;

            const productName = productItem.querySelector('h1')?.textContent || '';
            const productImage = productItem.querySelector('.product-image img')?.src || '';
            const productPrice = productItem.querySelector('.price')?.textContent || '';
            const numericPrice = parseFloat(productPrice.replace(/[^0-9.-]+/g, '')); // Convert price to number
            const selectedColor = document.querySelector('.color-button.selected')?.getAttribute('data-color') || '';
            const selectedStyleIndex = [...document.querySelectorAll('.style-option')].indexOf(document.querySelector('.styles li.selected .style-option')) + 1;
            const styleIdentifier = selectedStyleIndex ? `-S${selectedStyleIndex}` : '';

            if (!productName || !productImage || !productPrice) return;

            // Retrieve cart items from localStorage
            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            let itemFound = false;

            // Check for duplicate items with the same color and style
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

            // Open cart and scroll it into view
            const cartSection = document.querySelector('.cart-section');
            if (cartSection) {
                cartSection.classList.add('open');
                setTimeout(() => {
                    cartSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 300);
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
                updateCartDisplay();
                updateCartBadge();
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

// Function to update the cart total with tax and shipping
function updateCartTotal() {
    let subtotal = 0;
    const taxRate = 0.08; // Example tax rate of 8%
    const shippingFee = 5.00; // Example flat shipping fee

    // Retrieve cart items from local storage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    // Calculate subtotal
    cartItems.forEach(item => {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, '')); // Extract numeric value from text
        subtotal += price * item.quantity; // Update subtotal based on item quantity
    });

    // Calculate tax amount and total amount
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount + shippingFee;

    // Display subtotal, tax, shipping fee, and total in the designated area
    document.querySelector('.cart-total').innerHTML = `
        <p>Subtotal: $${subtotal.toFixed(2)}</p>
        <p>Tax: $${taxAmount.toFixed(2)}</p>
        <p>Shipping: $${shippingFee.toFixed(2)}</p>
        <p><strong>Total: $${totalAmount.toFixed(2)}</strong></p>
    `;

    // Update the total in the cart footer
    document.getElementById('cart-total').innerText = `$${subtotal.toFixed(2)}`; // Update to show just subtotal
}


 function updateCartBadge() {
    // Get cart items from local storage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    // Count the number of unique items in the cart
    const uniqueItemsCount = cartItems.length;

    // Update the badge for both PC and mobile
    document.getElementById('pc-cart-badge').textContent = uniqueItemsCount;
    document.getElementById('mobile-cart-badge').textContent = uniqueItemsCount;
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
        updateCartDisplay();
        updateCartTotal(); // Ensure total is updated after quantity change
        updateCartBadge();
    }

    // Handle Buy Now button
    document.querySelectorAll('.buy-now').forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'checkout.html';
        });
    });

// Handle cart section open/close
const cartIconPC = document.getElementById('pc-cart-icon');
const cartIconMobile = document.getElementById('mobile-cart-icon');
const cartSection = document.querySelector('.cart-section');

if (cartIconPC) {
    cartIconPC.addEventListener('click', () => {
        cartSection.classList.toggle('open');
        updateCartDisplay(); // Ensure cart items are displayed when opening the cart
    });
}

if (cartIconMobile) {
    cartIconMobile.addEventListener('click', () => {
        cartSection.classList.toggle('open');
        updateCartDisplay(); // Ensure cart items are displayed when opening the cart
    });
}

document.getElementById('continue-shopping').addEventListener('click', () => {
    cartSection.classList.remove('open');
});

document.getElementById('proceed-to-checkout').addEventListener('click', () => {
    window.location.href = 'checkout.html';
});

// Update cart badge on every page load
updateCartBadge();

// Clear the cart on the order confirmation page
if (window.location.pathname.endsWith('orderconfirmation.html')) {
    localStorage.removeItem('cartItems');
    updateCartDisplay();
    updateCartBadge();
}

// Initial display update for cart items when the page loads
updateCartDisplay();
});


// Handle search functionality
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-button');

function executeSearch() {
    const searchQuery = searchInput.value.trim();
    if (searchQuery) {
        window.location.href = `search.html?query=${encodeURIComponent(searchQuery)}`;
    }
}

// Add event listener for search button click
searchButton.addEventListener('click', executeSearch);

// Add event listener for Enter key press
searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        executeSearch();
    }
});

document.getElementById('userIcon').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default anchor behavior
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', function(event) {
    const icon = document.getElementById('userIcon');
    const dropdown = document.getElementById('userDropdown');
    if (!icon.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none'; // Close the dropdown if clicked outside
    }
});

