const pageLoader = document.getElementById("pageLoader");
const navbar = document.getElementById("navbar");
const navToggle = document.getElementById("navToggle");
const navLinksWrap = document.getElementById("navLinksWrap");
const cartTrigger = document.getElementById("cartTrigger");
const cartDrawer = document.getElementById("cartDrawer");
const closeCartBtn = document.getElementById("closeCartBtn");
const backdrop = document.getElementById("backdrop");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");
const cartEmptyState = document.getElementById("cartEmptyState");
const productGrid = document.getElementById("productGrid");
const resultsCount = document.getElementById("resultsCount");
const medicineSearch = document.getElementById("medicineSearch");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const sortFilter = document.getElementById("sortFilter");
const quickTags = document.getElementById("quickTags");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const toastContainer = document.getElementById("toastContainer");
const authModal = document.getElementById("authModal");
const closeAuthBtn = document.getElementById("closeAuthBtn");
const authTabs = document.querySelectorAll(".auth-tab");
const authButtons = document.querySelectorAll("[data-auth-target]");
const focusSearchBtn = document.getElementById("focusSearchBtn");
const openConsultBtn = document.getElementById("openConsultBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const prescriptionFile = document.getElementById("prescriptionFile");
const filePreviewName = document.getElementById("filePreviewName");
const uploadZone = document.getElementById("uploadZone");

const STORAGE_KEY = "mediswift-cart";
const medicineCatalogBlueprint = [
    {
        category: "Pain Relief",
        accent: "#1475d2",
        tagline: "Trusted pain and fever relief for everyday home care.",
        items: [
            { name: "ParacetaSwift 500", price: 35, discount: 10 },
            { name: "Ibuprox Relief 400", price: 72, discount: 14, image: "//d1s24u4ln0wd0i.cloudfront.net/med/21911/reclimet-xr-tablet-15s_1733284229e52392cdccb54e968285f06564874274.webp" },
            { name: "PainNil Gel", price: 135, discount: 18 },
            { name: "ThermoEase Patch", price: 189, discount: 20 },
            { name: "MigraCalm Tablet", price: 122, discount: 15 },
            { name: "JointFlex Spray", price: 245, discount: 22 },
            { name: "CrampEase Max", price: 88, discount: 12 },
            { name: "FeverGuard Syrup", price: 76, discount: 10 },
            { name: "MuscleMend Balm", price: 144, discount: 17 },
            { name: "HeadRelief Plus", price: 58, discount: 11 }
        ]
    },
    {
        category: "Diabetes Care",
        accent: "#16b88d",
        tagline: "Daily glucose support and diabetic wellness management.",
        items: [
            { name: "GlucoMet 500", price: 126, discount: 13 },
            { name: "SugarStable XR", price: 196, discount: 16 },
            { name: "InsuCare Needles", price: 320, discount: 18 },
            { name: "DiaBalance Tablet", price: 154, discount: 12 },
            { name: "GlycoCheck Strips", price: 499, discount: 22 },
            { name: "MetaboWell Forte", price: 219, discount: 19 },
            { name: "Diabeta Boost", price: 278, discount: 20 },
            { name: "SugarSense Monitor", price: 1299, discount: 24 },
            { name: "FootCare Diabetic Cream", price: 188, discount: 15 },
            { name: "GlucoseAssist Capsules", price: 332, discount: 17 }
        ]
    },
    {
        category: "Cardiac Care",
        accent: "#0b4f9e",
        tagline: "Heart health essentials with careful chronic care styling.",
        items: [
            { name: "CardioFlow 20", price: 194, discount: 14 },
            { name: "PulseCare 40", price: 236, discount: 16 },
            { name: "BPShield Tablet", price: 168, discount: 12 },
            { name: "HeartMend SR", price: 289, discount: 18 },
            { name: "LipiBalance 10", price: 312, discount: 21 },
            { name: "ArteryLite Plus", price: 355, discount: 20 },
            { name: "PressureEase 5", price: 142, discount: 10 },
            { name: "CardioSafe Aspirin", price: 98, discount: 11 },
            { name: "RhythmGuard 25", price: 421, discount: 23 },
            { name: "Omega Heart Capsules", price: 480, discount: 26 }
        ]
    },
    {
        category: "Vitamins",
        accent: "#24d1b4",
        tagline: "Daily nutrition, immunity, energy, and lifestyle support.",
        items: [
            { name: "Vitaboost Daily", price: 249, discount: 20 },
            { name: "ImmuniC Plus", price: 179, discount: 17 },
            { name: "Vitamin D3 Strong", price: 225, discount: 18 },
            { name: "ZincCare Gummies", price: 199, discount: 15 },
            { name: "IronRise Syrup", price: 165, discount: 12 },
            { name: "B12 Energy Tabs", price: 210, discount: 16 },
            { name: "CalciSwift Bones", price: 312, discount: 22 },
            { name: "WomenGlow Multivit", price: 385, discount: 24 },
            { name: "SeniorShield Nutrients", price: 428, discount: 25 },
            { name: "Kiddo Vita Drops", price: 152, discount: 14 }
        ]
    },
    {
        category: "Skin Care",
        accent: "#5ba9ff",
        tagline: "Skincare, repair, hydration, rash care, and sun protection.",
        items: [
            { name: "DermaSoft Lotion", price: 286, discount: 19, image: "https://m.media-amazon.com/images/I/51gyEUDCM2L.jpg" },
            { name: "AcneClear Gel", price: 199, discount: 16, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxNAEw78x48uTwDlLBvtnoVcLertkOWQ9oTQ&s" },
            { name: "HydraHeal Cream", price: 315, discount: 18, image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTXGZzjcBGT89HqRR9ExaysALrzBy5c5zBkekhGDLQ-1f8sjC599cY_vB3dhHnPmnIMShPSuD5nlAjwQyAL2oYEWBBIJiDCuLmA7jpmcsQv072gUfTL3T3A" },
            { name: "SunBlock Med SPF 50", price: 449, discount: 21, image: "https://m.media-amazon.com/images/I/61dqvGAMXdL._AC_UF1000,1000_QL80_.jpgdxxxx   " },
            { name: "ItchRelief Spray", price: 159, discount: 13, image: "https://dadazpharma.com/cdn/shop/files/ITCHSPRAY.jpg?v=1766148941&width=2000" },
            { name: "RashGuard Ointment", price: 146, discount: 12, image: "https://m.media-amazon.com/images/I/51S3yy8cTuL.jpg" },
            { name: "DermaRepair Serum", price: 520, discount: 25, image: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRxOOreSOLFS1Ao0Jv14whGxV1-4mLOnRfa6_6e8hl0iFmKZ3QjeieAoHN62vit0zZYyTD5Kc1NX2kFDMx1iN5THc8yHBVo6JI1JPXCC1_8zgRA7AzIhq5ILO4" },
            { name: "GlowShield Face Wash", price: 188, discount: 14, image: "https://dermatouch.com/cdn/shop/files/Glow-Shield-Duo.png?v=1766643424&width=1445" },
            { name: "ScarFade Silicone Gel", price: 610, discount: 27, image: "https://cdn11.bigcommerce.com/s-ilgxsy4t82/images/stencil/960w/products/322923/1135109/51prWWxNk4L._AC_SL1200___04460.1739336489.jpg?c=1" },
            { name: "CalmSkin Moist Bar", price: 112, discount: 10, image: "https://www.kroger.com/product/images/large/left/0001111103357" }
        ]
    },
    {
        category: "Digestive Care",
        accent: "#16a085",
        tagline: "Gut balance, acidity support, enzymes, and digestive comfort.",
        items: [
            { name: "Digestozyme Plus", price: 145, discount: 12, image: "https://tiimg.tistatic.com/fp/1/007/210/digestozyme-plus-drops-for-infants-777.jpg" },
            { name: "AcidoCool Suspension", price: 122, discount: 10, image: "data:image/jpeg;base64,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" },
            { name: "GasAway Chewables", price: 88, discount: 11, image: "data:image/jpeg;base64,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" },
            { name: "LiverMend Tonic", price: 268, discount: 17, image: "https://5.imimg.com/data5/SELLER/Default/2023/2/CQ/XL/ML/182653060/5-1-.jpg" },
            { name: "StomachEase Syrup", price: 140, discount: 13, image: "https://sgvpaarogyam.com/cdn/shop/files/digestral-syrup-digestion-and-gas-relief_1024x1024.jpg?v=1773495829" },
            { name: "FiberUp Husk", price: 224, discount: 16, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRslKZDAYZ9N9bT37J5zlQffqo95uLtRkJ3LQ&s" },
            { name: "GutGuard Capsules", price: 246, discount: 18, image: "https://m.media-amazon.com/images/I/612hcdb+lXL._AC_UF1000,1000_QL80_.jpg" },
            { name: "AcidityStop Tablet", price: 104, discount: 9, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoMAQnmF70W8nUIHiYxwyL1MtTY3aHlc7GWA&s" },
            { name: "HydraSalt ORS", price: 38, discount: 8, image: "https://unboxhealth-production.s3.amazonaws.com/unbox/media/product_variant/all_images/Wellbeing-Nutrition-HydraSalt-Electrolytes-2.webp" }
        ]
    },
    {
        category: "Cold & Flu",
        accent: "#1091ba",
        tagline: "Seasonal fever, cough, cold, sore throat, and immunity support.",
        items: [
            { name: "ColdAway Night", price: 96, discount: 11, image: "images.jpg" },
            { name: "CoughMend Syrup", price: 132, discount: 13, image: "images (1).jpg" },
            { name: "FluShield Combo", price: 178, discount: 16, image: "images (2).jpg" },
            { name: "ThroatEase Lozenges", price: 84, discount: 10, image: "images (3).jpg" },
            { name: "SinusClear Drops", price: 125, discount: 12, image: "sinusclear-nasal-drops-802002774-0uum1yhq.avif" },
            { name: "SteamCare Inhalant", price: 168, discount: 14, image: "71hmO0xpzVS._AC_UF1000,1000_QL80_.jpg" },
            { name: "NasalFresh Spray", price: 209, discount: 18, image: "images (4).jpg" },
            { name: "WarmRelief Balm", price: 98, discount: 9, image: "images (5).jpg" },
            { name: "CoughFree Day", price: 118, discount: 12, image: "images (6).jpg" },
            { name: "ImmuniGuard Kadha", price: 160, discount: 15, image: "images (7).jpg" }
        ]
    },
    {
        category: "First Aid",
        accent: "#ea4f67",
        tagline: "Emergency essentials for cuts, wounds, fever, and quick care.",
        items: [
            { name: "QuickHeal Bandage Pack", price: 85, discount: 10 },
            { name: "AntiseptiCare Liquid", price: 120, discount: 11 },
            { name: "BurnSoothe Gel", price: 152, discount: 14 },
            { name: "Sterile Gauze Kit", price: 138, discount: 13 },
            { name: "Pocket First Aid Box", price: 325, discount: 20 },
            { name: "WoundGuard Tape", price: 64, discount: 8 },
            { name: "Digital Thermometer Pro", price: 289, discount: 18 },
            { name: "Cotton Care Pack", price: 58, discount: 7 },
            { name: "HotCold Compress", price: 179, discount: 16 },
            { name: "Mediswift Sanitizer", price: 99, discount: 12 }
        ]
    },
    {
        category: "Women Care",
        accent: "#ff6f91",
        tagline: "Personal wellness, supplements, hygiene, and cycle care support.",
        items: [
            { name: "FemCal Iron Tabs", price: 210, discount: 16 },
            { name: "WomenCare Probiotic", price: 286, discount: 19 },
            { name: "CycleEase Relief", price: 165, discount: 14 },
            { name: "IntimaFresh Wash", price: 198, discount: 15 },
            { name: "Prenatal Plus", price: 438, discount: 24 },
            { name: "CalmHer Magnesium", price: 312, discount: 21 },
            { name: "GlowHer Omega", price: 420, discount: 23 },
            { name: "WomenGuard D3", price: 225, discount: 17 },
            { name: "Period Comfort Patch", price: 154, discount: 13 },
            { name: "BoneRise Women 50+", price: 386, discount: 22 }
        ]
    },
    {
        category: "Baby Care",
        accent: "#7ac9ff",
        tagline: "Gentle products for infants, baby nutrition, and hygiene care.",
        items: [
            { name: "BabySoft Lotion", price: 230, discount: 17 },
            { name: "TinyTummy Drops", price: 135, discount: 12 },
            { name: "Infant Thermometer", price: 310, discount: 20 },
            { name: "LittleNose Saline", price: 122, discount: 11 },
            { name: "KidSafe Sunscreen", price: 268, discount: 18 },
            { name: "Baby Zinc Rash Cream", price: 148, discount: 13 },
            { name: "Junior Vita Syrup", price: 172, discount: 15 },
            { name: "SoftWipe Care Pack", price: 185, discount: 14 },
            { name: "BabyBath Oat Wash", price: 244, discount: 16 },
            { name: "LittleBones Calcium", price: 212, discount: 17 }
        ]
    },
    {
        category: "Respiratory",
        accent: "#0f8ea7",
        tagline: "Breathing support, inhalation care, and chest wellness products.",
        items: [
            { name: "AsthmaEase Inhaler", price: 425, discount: 18 },
            { name: "BronchoCalm Syrup", price: 190, discount: 14 },
            { name: "Airway Steam Capsules", price: 165, discount: 12 },
            { name: "ChestRelief Rub", price: 110, discount: 9 },
            { name: "NebuloCare Mask", price: 275, discount: 17 },
            { name: "LungVital Drops", price: 238, discount: 16 },
            { name: "OxyBoost Herbal Mix", price: 356, discount: 22 },
            { name: "AllerBreath Tabs", price: 204, discount: 15 },
            { name: "RespiraMend Forte", price: 389, discount: 21 },
            { name: "NebuClean Solution", price: 148, discount: 10 }
        ]
    },
    {
        category: "Ayurvedic",
        accent: "#18b58d",
        tagline: "Plant-powered wellness blends for holistic daily care.",
        items: [
            { name: "TulsiGuard Syrup", price: 144, discount: 13 },
            { name: "AshwaPower Capsules", price: 320, discount: 22 },
            { name: "NeemSkin Support", price: 218, discount: 17 },
            { name: "DigestAyu Churna", price: 176, discount: 14 },
            { name: "JointAyu Oil", price: 265, discount: 18 },
            { name: "Kadha Immunity Mix", price: 198, discount: 16 },
            { name: "Triphala Balance", price: 185, discount: 15 },
            { name: "Amla C+ Tonic", price: 142, discount: 11 },
            { name: "StressCalm Herbs", price: 278, discount: 19 },
            { name: "LiverAyu Drops", price: 162, discount: 12 }
        ]
    }
];

const ratingPattern = [4.3, 4.5, 4.7, 4.8, 4.9];
const stockPattern = ["In Stock", "Fast Selling", "Pharmacy Pick", "Ready to Ship"];
const categoryIcons = {
    "Pain Relief": "ri-heart-pulse-line",
    "Diabetes Care": "ri-test-tube-line",
    "Cardiac Care": "ri-heart-3-line",
    "Vitamins": "ri-capsule-line",
    "Skin Care": "ri-sparkling-line",
    "Digestive Care": "ri-mental-health-line",
    "Cold & Flu": "ri-temp-cold-line",
    "First Aid": "ri-first-aid-kit-line",
    "Women Care": "ri-service-line",
    "Baby Care": "ri-bear-smile-line",
    "Respiratory": "ri-lungs-line",
    "Ayurvedic": "ri-leaf-line"
};

const medicineCatalog = medicineCatalogBlueprint.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) => {
        const originalPrice = Math.round(item.price / (1 - item.discount / 100));
        const indexSeed = groupIndex * 10 + itemIndex;

        return {
            id: `med-${groupIndex + 1}-${itemIndex + 1}`,
            name: item.name,
            category: group.category,
            tagline: group.tagline,
            accent: group.accent,
            icon: categoryIcons[group.category] || "ri-capsule-line",
            price: item.price,
            originalPrice,
            discount: item.discount,
            rating: ratingPattern[indexSeed % ratingPattern.length],
            stock: stockPattern[indexSeed % stockPattern.length],
            description: `${item.name} is a sample ${group.category.toLowerCase()} product in the Mediswift catalog for modern pharmacy browsing.`,
            image: item.image || createMedicineImage(item.name, group.category, group.accent)
        };
    })
);

let selectedQuickCategory = "all";
let cart = getStoredCart();

function createMedicineImage(name, category, accent) {
    const safeName = name.length > 18 ? `${name.slice(0, 18)}...` : name;
    const safeCategory = category.length > 16 ? `${category.slice(0, 16)}...` : category;
    const svg = `
        <svg xmlns="http//www.w3.org/2000/svg" viewBox="0 0 600 460">
            <defs>
                <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="#f7fcff" />
                    <stop offset="100%" stop-color="#e6fbf3" />
                </linearGradient>
                <linearGradient id="pill" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="${accent}" />
                    <stop offset="100%" stop-color="#ffffff" />
                </linearGradient>
            </defs>
            <rect width="600" height="460" rx="36" fill="url(#bg)" />
            <circle cx="470" cy="110" r="80" fill="${accent}" opacity="0.12" />
            <circle cx="120" cy="360" r="92" fill="${accent}" opacity="0.1" />
            <rect x="170" y="120" width="260" height="120" rx="60" fill="url(#pill)" transform="rotate(-14 300 180)" />
            <path d="M294 118 L406 210" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.8" />
            <rect x="238" y="236" width="126" height="106" rx="22" fill="#ffffff" opacity="0.92" />
            <path d="M301 258 v50 M276 283 h50" stroke="${accent}" stroke-width="14" stroke-linecap="round" />
            <text x="44" y="74" fill="#0f2940" font-family="Arial, sans-serif" font-size="22" font-weight="700">${safeCategory}</text>
            <text x="44" y="404" fill="#3f667d" font-family="Arial, sans-serif" font-size="28" font-weight="700">${safeName}</text>
        </svg>
        `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getStoredCart() {
    try {
        const storedCart = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(storedCart) ? storedCart : [];
    } catch (error) {
        return [];
    }
}

function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(value);
}

function populateCategoryFilter() {
    const categories = [...new Set(medicineCatalog.map((item) => item.category))];

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function renderQuickTags() {
    const categories = ["all", ...new Set(medicineCatalog.map((item) => item.category))];

    quickTags.innerHTML = categories
        .map((category) => {
            const label = category === "all" ? "All Medicines" : category;
            const activeClass = selectedQuickCategory === category ? "active" : "";

            return `
                <button class="quick-tag ${activeClass}" data-quick-category="${category}">
                    ${label}
                </button>
            `;
        })
        .join("");
}

function getFilteredProducts() {
    const searchTerm = medicineSearch.value.trim().toLowerCase();
    const categoryValue = categoryFilter.value;
    const priceValue = priceFilter.value;
    const sortValue = sortFilter.value;

    let filteredProducts = medicineCatalog.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);

        const matchesCategory =
            categoryValue === "all" &&
                selectedQuickCategory === "all"
                ? true
                : product.category === (selectedQuickCategory !== "all" ? selectedQuickCategory : categoryValue);

        const matchesPrice =
            priceValue === "all" ? true : isWithinPriceRange(product.price, priceValue);

        return matchesSearch && matchesCategory && matchesPrice;
    });

    filteredProducts = sortProducts(filteredProducts, sortValue);

    return filteredProducts;
}

function isWithinPriceRange(price, range) {
    const [min, max] = range.split("-").map(Number);
    return price >= min && price <= max;
}

function sortProducts(products, sortValue) {
    const sortedProducts = [...products];

    switch (sortValue) {
        case "price-asc":
            return sortedProducts.sort((a, b) => a.price - b.price);
        case "price-desc":
            return sortedProducts.sort((a, b) => b.price - a.price);
        case "discount-desc":
            return sortedProducts.sort((a, b) => b.discount - a.discount);
        case "name-asc":
            return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return sortedProducts.sort((a, b) => a.id.localeCompare(b.id));
    }
}

function renderProducts() {
    const filteredProducts = getFilteredProducts();

    resultsCount.textContent = `${filteredProducts.length} items`;

    if (!filteredProducts.length) {
        productGrid.innerHTML = `
            <div class="empty-results">
                <i class="ri-search-eye-line"></i>
                <h3>No medicines matched your search</h3>
                <p>Try a different medicine name, reset the category, or adjust the price filter.</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = filteredProducts
        .map(
            (product) => `
                <article class="product-card">
                    <div class="product-image-wrap">
                        <img class="product-image" src="${product.image}" alt="${product.name}">
                        <div class="product-badges">
                            <span class="discount-badge">${product.discount}% OFF</span>
                            <span class="category-badge">${product.category}</span>
                        </div>
                    </div>
                    <div class="product-content">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-meta">
                            <span class="product-rating">
                                <i class="ri-star-fill"></i>
                                ${product.rating}
                            </span>
                            <span class="product-stock">${product.stock}</span>
                        </div>
                        <div class="price-row">
                            <span class="sale-price">${formatCurrency(product.price)}</span>
                            <span class="original-price">${formatCurrency(product.originalPrice)}</span>
                            <span class="savings-text">Save ${product.discount}%</span>
                        </div>
                        <p class="product-description">${product.tagline}</p>
                        <div class="product-actions">
                            <button class="primary-btn add-to-cart-btn" data-product-id="${product.id}">
                                <i class="ri-shopping-bag-3-line"></i>
                                Add to Cart
                            </button>
                            <button class="wishlist-btn" data-wishlist-id="${product.id}" aria-label="Save ${product.name}">
                                <i class="ri-heart-3-line"></i>
                            </button>
                        </div>
                    </div>
                </article>
            `
        )
        .join("");
}

function getProductById(productId) {
    return medicineCatalog.find((item) => item.id === productId);
}

function addToCart(productId) {
    const existingProduct = cart.find((item) => item.id === productId);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();

    const selectedProduct = getProductById(productId);
    showToast("Added to cart", `${selectedProduct.name} has been added to your Mediswift cart.`, "success");
}

function updateCartQuantity(productId, change) {
    cart = cart
        .map((item) => {
            if (item.id !== productId) {
                return item;
            }

            return {
                ...item,
                quantity: item.quantity + change
            };
        })
        .filter((item) => item.quantity > 0);

    saveCart();
    updateCartUI();
}

function removeCartItem(productId) {
    const removedProduct = getProductById(productId);
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    updateCartUI();
    showToast("Removed from cart", `${removedProduct.name} was removed from your cart.`, "error");
}

function updateCartUI() {
    const cartEntries = cart
        .map((item) => {
            const product = getProductById(item.id);

            if (!product) {
                return null;
            }

            return {
                ...product,
                quantity: item.quantity,
                lineTotal: product.price * item.quantity
            };
        })
        .filter(Boolean);

    const totalItems = cartEntries.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartEntries.reduce((sum, item) => sum + item.lineTotal, 0);

    cartCount.textContent = totalItems;
    cartSubtotal.textContent = formatCurrency(subtotal);
    cartTotal.textContent = formatCurrency(subtotal);

    if (!cartEntries.length) {
        cartItems.innerHTML = "";
        cartEmptyState.classList.add("visible");
        return;
    }

    cartEmptyState.classList.remove("visible");
    cartItems.innerHTML = cartEntries
        .map(
            (item) => `
                <article class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div>
                        <h3>${item.name}</h3>
                        <span class="cart-category">${item.category}</span>
                        <span class="cart-price">${formatCurrency(item.lineTotal)}</span>
                        <div class="cart-item-actions">
                            <div class="qty-control">
                                <button data-qty-action="decrease" data-cart-id="${item.id}" aria-label="Decrease quantity">
                                    <i class="ri-subtract-line"></i>
                                </button>
                                <strong>${item.quantity}</strong>
                                <button data-qty-action="increase" data-cart-id="${item.id}" aria-label="Increase quantity">
                                    <i class="ri-add-line"></i>
                                </button>
                            </div>
                            <button class="remove-item" data-remove-id="${item.id}">
                                Remove
                            </button>
                        </div>
                    </div>
                </article>
            `
        )
        .join("");
}

function showToast(title, message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${type === "success" ? "ri-checkbox-circle-fill" : "ri-error-warning-fill"}"></i>
        <div>
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-8px)";
        setTimeout(() => toast.remove(), 260);
    }, 3200);
}

function openCart() {
    cartDrawer.classList.add("active");
    backdrop.classList.add("active");
    document.body.classList.add("modal-open");
    cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
    cartDrawer.classList.remove("active");
    if (!authModal.classList.contains("active")) {
        backdrop.classList.remove("active");
        document.body.classList.remove("modal-open");
    }
    cartDrawer.setAttribute("aria-hidden", "true");
}

function openAuthModal(mode = "login") {
    authModal.classList.add("active");
    backdrop.classList.add("active");
    document.body.classList.add("modal-open");
    authModal.setAttribute("aria-hidden", "false");
    activateAuthTab(mode === "signup" ? "signupForm" : "loginForm");
}

function closeAuthModal() {
    authModal.classList.remove("active");
    authModal.setAttribute("aria-hidden", "true");
    if (!cartDrawer.classList.contains("active")) {
        backdrop.classList.remove("active");
        document.body.classList.remove("modal-open");
    }
}

function activateAuthTab(formId) {
    authTabs.forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.authTab === formId);
    });

    document.querySelectorAll(".auth-form").forEach((form) => {
        form.classList.toggle("active", form.id === formId);
    });
}

function setFieldError(field, message) {
    const inputGroup = field.closest(".input-group");
    const errorText = inputGroup ? inputGroup.querySelector(".error-text") : null;

    if (inputGroup) {
        inputGroup.classList.add("error");
    }

    if (errorText) {
        errorText.textContent = message;
    }
}

function clearFieldError(field) {
    const inputGroup = field.closest(".input-group");
    const errorText = inputGroup ? inputGroup.querySelector(".error-text") : null;

    if (inputGroup) {
        inputGroup.classList.remove("error");
    }

    if (errorText) {
        errorText.textContent = "";
    }
}

function validateName(field, label) {
    const value = field.value.trim();

    if (!value) {
        setFieldError(field, `${label} is required.`);
        return false;
    }

    if (value.length < 2) {
        setFieldError(field, `${label} must be at least 2 characters.`);
        return false;
    }

    clearFieldError(field);
    return true;
}

function validateEmail(field) {
    const value = field.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
        setFieldError(field, "Email is required.");
        return false;
    }

    if (!emailPattern.test(value)) {
        setFieldError(field, "Enter a valid email address.");
        return false;
    }

    clearFieldError(field);
    return true;
}

function validatePassword(field, minimumLength = 6) {
    const value = field.value.trim();

    if (!value) {
        setFieldError(field, "Password is required.");
        return false;
    }

    if (value.length < minimumLength) {
        setFieldError(field, `Password must be at least ${minimumLength} characters.`);
        return false;
    }

    clearFieldError(field);
    return true;
}

function validatePhone(field) {
    const value = field.value.replace(/\D/g, "");

    if (!value) {
        setFieldError(field, "Phone number is required.");
        return false;
    }

    if (value.length !== 10) {
        setFieldError(field, "Enter a valid 10-digit mobile number.");
        return false;
    }

    clearFieldError(field);
    return true;
}

function validateSelect(field, label) {
    if (!field.value.trim()) {
        setFieldError(field, `Please select a ${label.toLowerCase()}.`);
        return false;
    }

    clearFieldError(field);
    return true;
}

function validateTextarea(field, label, minLength = 10) {
    const value = field.value.trim();

    if (!value) {
        setFieldError(field, `${label} is required.`);
        return false;
    }

    if (value.length < minLength) {
        setFieldError(field, `${label} must be at least ${minLength} characters.`);
        return false;
    }

    clearFieldError(field);
    return true;
}

function validateFile(field) {
    if (!field.files.length) {
        showToast("Upload needed", "Please attach a prescription file before submitting.", "error");
        return false;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowedTypes.includes(field.files[0].type)) {
        showToast("Invalid file", "Upload a PDF, JPG, or PNG prescription file.", "error");
        return false;
    }

    return true;
}

function highlightSection(selector) {
    const section = document.querySelector(selector);

    if (!section) {
        return;
    }

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    section.classList.add("pulse-highlight");
    setTimeout(() => section.classList.remove("pulse-highlight"), 1200);
}

function handleBackDropClose() {
    closeCart();
    closeAuthModal();
}

function handleProductGridClick(event) {
    const addToCartButton = event.target.closest(".add-to-cart-btn");
    const wishlistButton = event.target.closest("[data-wishlist-id]");

    if (addToCartButton) {
        addToCart(addToCartButton.dataset.productId);
    }

    if (wishlistButton) {
        const product = getProductById(wishlistButton.dataset.wishlistId);
        showToast("Saved for later", `${product.name} was added to your favorites list.`, "success");
    }
}

function handleCartActions(event) {
    const quantityButton = event.target.closest("[data-qty-action]");
    const removeButton = event.target.closest("[data-remove-id]");

    if (quantityButton) {
        const action = quantityButton.dataset.qtyAction;
        const cartId = quantityButton.dataset.cartId;
        updateCartQuantity(cartId, action === "increase" ? 1 : -1);
    }

    if (removeButton) {
        removeCartItem(removeButton.dataset.removeId);
    }
}

function handleFilterChange() {
    if (categoryFilter.value !== "all") {
        selectedQuickCategory = "all";
        renderQuickTags();
    }

    renderProducts();
}

function handleQuickTagSelection(event) {
    const button = event.target.closest("[data-quick-category]");

    if (!button) {
        return;
    }

    selectedQuickCategory = button.dataset.quickCategory;
    categoryFilter.value = "all";
    renderQuickTags();
    renderProducts();
}

function setupForms() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const contactForm = document.getElementById("contactForm");
    const newsletterForm = document.getElementById("newsletterForm");
    const prescriptionForm = document.getElementById("prescriptionForm");
    const consultancyForm = document.getElementById("consultancyForm");

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const emailField = document.getElementById("loginEmail");
        const passwordField = document.getElementById("loginPassword");

        const valid = [validateEmail(emailField), validatePassword(passwordField)].every(Boolean);

        if (!valid) {
            return;
        }

        loginForm.reset();
        clearFieldError(emailField);
        clearFieldError(passwordField);
        closeAuthModal();
        showToast("Login successful", "Frontend validation passed. Welcome back to Mediswift.", "success");
    });

    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const nameField = document.getElementById("signupName");
        const emailField = document.getElementById("signupEmail");
        const passwordField = document.getElementById("signupPassword");
        const confirmField = document.getElementById("signupConfirmPassword");

        const validations = [
            validateName(nameField, "Full name"),
            validateEmail(emailField),
            validatePassword(passwordField, 8)
        ];

        if (!confirmField.value.trim()) {
            setFieldError(confirmField, "Please confirm your password.");
            validations.push(false);
        } else if (confirmField.value !== passwordField.value) {
            setFieldError(confirmField, "Passwords do not match.");
            validations.push(false);
        } else {
            clearFieldError(confirmField);
            validations.push(true);
        }

        if (!validations.every(Boolean)) {
            return;
        }

        signupForm.reset();
        [nameField, emailField, passwordField, confirmField].forEach(clearFieldError);
        activateAuthTab("loginForm");
        showToast("Account created", "Your Mediswift signup form was validated successfully.", "success");
    });
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nameField = document.getElementById("contactName");
        const emailField = document.getElementById("contactEmail");
        const messageField = document.getElementById("contactMessage");

        // Run your existing frontend validation
        const valid = [
            validateName(nameField, "Name"),
            validateEmail(emailField),
            validateTextarea(messageField, "Message", 15)
        ].every(Boolean);

        if (!valid) return;

        // Package the data
        const formData = {
            name: nameField.value.trim(),
            email: emailField.value.trim(),
            message: messageField.value.trim()
        };

        try {
            // Send data to your custom backend
            const response = await fetch('http://localhost:5000/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                contactForm.reset();
                [nameField, emailField, messageField].forEach(clearFieldError);
                showToast("Message sent", "Your contact request has been securely saved to the database!", "success");
            } else {
                showToast("Error", result.message || "Failed to send message.", "error");
            }
        } catch (error) {
            showToast("Connection Error", "Could not connect to the backend server.", "error");
        }
    });

    newsletterForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const emailField = document.getElementById("newsletterEmail");
        const errorLabel = newsletterForm.querySelector(".error-text");

        if (!emailField.value.trim()) {
            newsletterForm.classList.add("newsletter-error");
            errorLabel.textContent = "Please enter your email.";
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value.trim())) {
            newsletterForm.classList.add("newsletter-error");
            errorLabel.textContent = "Please enter a valid email address.";
            return;
        }

        newsletterForm.classList.remove("newsletter-error");
        errorLabel.textContent = "";
        newsletterForm.reset();
        showToast("Subscribed", "You will now receive Mediswift updates and offer alerts.", "success");
    });
    prescriptionForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nameField = document.getElementById("prescriptionName");
        const phoneField = document.getElementById("prescriptionPhone");
        const notesField = document.getElementById("prescriptionNotes");

        const valid = [
            validateName(nameField, "Full name"),
            validatePhone(phoneField),
            validateTextarea(notesField, "Prescription notes", 10),
            validateFile(prescriptionFile)
        ].every(Boolean);

        if (!valid) {
            return;
        }

        // --- NEW: Package data for backend file upload ---
        const formData = new FormData();
        formData.append('patientName', nameField.value.trim());
        formData.append('phone', phoneField.value.trim());
        formData.append('notes', notesField.value.trim());
        formData.append('prescriptionFile', prescriptionFile.files[0]);

        try {
            const response = await fetch('http://localhost:5000/api/upload-prescription', {
                method: 'POST',
                // Note: Do NOT set Content-Type manually here; the browser handles it automatically for FormData
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                prescriptionForm.reset();
                filePreviewName.textContent = "No file selected";
                [nameField, phoneField, notesField].forEach(clearFieldError);
                showToast("Prescription received", "Your prescription was securely uploaded to our database.", "success");
            } else {
                showToast("Upload Failed", result.message || "Could not upload prescription.", "error");
            }
        } catch (error) {
            showToast("Connection Error", "Could not connect to the backend server.", "error");
        }
    });

    consultancyForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nameField = document.getElementById("doctorName");
        const emailField = document.getElementById("doctorEmail");
        const specialityField = document.getElementById("doctorSpeciality");
        const concernField = document.getElementById("doctorConcern");

        const valid = [
            validateName(nameField, "Your name"),
            validateEmail(emailField),
            validateSelect(specialityField, "Speciality"),
            validateTextarea(concernField, "Health concern", 12)
        ].every(Boolean);

        if (!valid) {
            return;
        }

        const selectedSpeciality = specialityField.value;

        // --- NEW: Send JSON payload to backend ---
        const payload = {
            name: nameField.value.trim(),
            email: emailField.value.trim(),
            speciality: selectedSpeciality,
            concern: concernField.value.trim()
        };

        try {
            const response = await fetch('http://localhost:5000/api/book-consultation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                consultancyForm.reset();
                [nameField, emailField, specialityField, concernField].forEach(clearFieldError);
                showToast(
                    "Consultation booked",
                    `Your ${selectedSpeciality} consultation request has been saved to the database.`,
                    "success"
                );
            } else {
                showToast("Booking Failed", "There was an error saving your appointment to the database.", "error");
            }
        } catch (error) {
            showToast("Connection Error", "Could not connect to the backend server.", "error");
        }
    });
}

function setupUploadPreview() {
    prescriptionFile.addEventListener("change", () => {
        const [file] = prescriptionFile.files;
        filePreviewName.textContent = file ? file.name : "No file selected";
    });

    ["dragenter", "dragover"].forEach((eventName) => {
        uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            uploadZone.classList.add("active");
        });
    });

    ["dragleave", "drop"].forEach((eventName) => {
        uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            uploadZone.classList.remove("active");
        });
    });
}

function setupNavigation() {
    navToggle.addEventListener("click", () => {
        const expanded = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!expanded));
        navToggle.classList.toggle("active");
        navLinksWrap.classList.toggle("active");
    });

    document.querySelectorAll(".nav-links a").forEach((link) => {
        link.addEventListener("click", () => {
            navToggle.classList.remove("active");
            navToggle.setAttribute("aria-expanded", "false");
            navLinksWrap.classList.remove("active");
        });
    });

    focusSearchBtn.addEventListener("click", () => {
        highlightSection("#medicines");
        setTimeout(() => medicineSearch.focus(), 250);
    });

    openConsultBtn.addEventListener("click", () => {
        highlightSection("#consultancy");
    });

    document.querySelectorAll("[data-scroll-target]").forEach((button) => {
        button.addEventListener("click", () => {
            highlightSection(button.dataset.scrollTarget);
        });
    });
}

function setupModalActions() {
    cartTrigger.addEventListener("click", openCart);
    closeCartBtn.addEventListener("click", closeCart);
    closeAuthBtn.addEventListener("click", closeAuthModal);
    backdrop.addEventListener("click", handleBackDropClose);

    authButtons.forEach((button) => {
        button.addEventListener("click", () => {
            openAuthModal(button.dataset.authTarget);
        });
    });

    authTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            activateAuthTab(tab.dataset.authTab);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeCart();
            closeAuthModal();
        }
    });
}

function setupDynamicListeners() {
    productGrid.addEventListener("click", handleProductGridClick);
    cartItems.addEventListener("click", handleCartActions);
    quickTags.addEventListener("click", handleQuickTagSelection);
}

function setupFilterListeners() {
    medicineSearch.addEventListener("input", renderProducts);
    categoryFilter.addEventListener("change", handleFilterChange);
    priceFilter.addEventListener("change", renderProducts);
    sortFilter.addEventListener("change", renderProducts);
}

function setupScrollFeatures() {
    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;
        navbar.classList.toggle("scrolled", scrollY > 20);
        scrollTopBtn.classList.toggle("visible", scrollY > 440);
    });

    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

function setupCheckout() {
    checkoutBtn.addEventListener("click", () => {
        if (!cart.length) {
            showToast("Cart is empty", "Add medicines before proceeding to checkout.", "error");
            return;
        }

        showToast("Checkout demo", "This frontend demo does not process payments, but your cart is ready.", "success");
    });
}

function initializeApp() {
    populateCategoryFilter();
    renderQuickTags();
    renderProducts();
    updateCartUI();
    setupNavigation();
    setupModalActions();
    setupDynamicListeners();
    setupFilterListeners();
    setupForms();
    setupUploadPreview();
    setupScrollFeatures();
    setupCheckout();
}

window.addEventListener("load", () => {
    initializeApp();

    setTimeout(() => {
        pageLoader.classList.add("hidden");
    }, 200);

    // Fallback for any delays
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => pageLoader.classList.add("hidden"), 1500);
    });
});
