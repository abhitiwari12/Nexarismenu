# Nexaris — Digital QR Menu Platform for Restaurants

Nexaris is a modern, lightweight digital menu platform designed for restaurants, cafes, food trucks, and bars. Restaurants sign up, create their menu sections and dishes, customize their branding, and receive an auto-generated QR code for customers to scan and view on their mobile phones.

---

## 🚀 Key Features

### 🔐 Authentication
- **Register Account**: Restaurant owners register with their name, email, password, and restaurant name.
- **Login & JWT**: Secure password hashing with `bcryptjs` and session tokens signed with `jsonwebtoken`.
- **Demo Mode**: One-click demo login (`demo@nexaris.com` / `password123`) pre-populated with Bella Italia Bistro sample data.

### 🏪 Restaurant Profile & Custom Branding
- Customize Restaurant Name, Owner Name, Phone Number, and Physical Address.
- Upload custom Logo and Header Cover Image with built-in high quality food & venue presets.
- Custom URL slug generation (e.g. `your-domain.com/#m/bella-italia`).

### 📂 Category Management
- Add, edit, and delete category sections (e.g., Starters, Woodfired Pizzas, Pastas, Drinks, Desserts).
- Real-time count of assigned dishes per category.

### 🍕 Menu Item Management
- Dish Name, Description, Price, Image URL, and Category assignment.
- **Veg / Non-Veg Badging**: Clear green and red dietary classification icons.
- **Stock Availability**: Instant toggle for "In Stock" vs "Out of Stock" (Sold Out).
- Full Search and Filter bar across dishes and ingredients.

### 📱 QR Code & Sharing
- Auto-generated scannable QR Code pointing directly to customer menu URL.
- One-click **Download PNG QR Code** for printing on table stands.
- One-click **Copy Menu Link** button.

### 📱 Customer Public Menu
- Mobile-responsive digital menu optimized for smartphone cameras.
- Restaurant banner, logo, direct phone dialer (`Call`), and Google Maps directions link (`Directions`).
- Category navigation bar, search bar, and Veg / Non-Veg preference toggle.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React Icons.
- **Backend**: Express.js REST API with JWT authentication.
- **QR Engine**: `qrcode` Node.js library.
- **Database**: JSON file store (`data/nexaris_db.json`) with persistent atomic writes.
- **Containerization**: Docker & Docker Compose.

---

## 📂 Project Structure

```
├── data/                      # Persistent database storage
│   └── nexaris_db.json
├── server.ts                  # Express REST API & Vite middleware entry
├── Dockerfile                 # Multi-stage Docker build config
├── docker-compose.yml         # Container orchestration spec
├── src/
│   ├── components/            # UI Components
│   │   ├── AuthModal.tsx
│   │   ├── CategoryManager.tsx
│   │   ├── DashboardOverview.tsx
│   │   ├── ImagePicker.tsx
│   │   ├── LandingPage.tsx
│   │   ├── MenuItemManager.tsx
│   │   ├── Navbar.tsx
│   │   ├── PublicMenuView.tsx
│   │   ├── RestaurantSettings.tsx
│   │   └── Sidebar.tsx
│   ├── context/
│   │   └── AuthContext.tsx    # JWT Authentication Provider
│   ├── server/
│   │   └── db.ts              # Database Engine (Users, Categories, MenuItems)
│   ├── App.tsx                # Main router and view manager
│   ├── main.tsx
│   └── types.ts               # TypeScript interfaces
├── package.json
└── README.md
```

---

## 💻 Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The application will boot on `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Start Production Server**:
   ```bash
   npm start
   ```

---

## 🐳 Docker Deployment

To build and launch the application using Docker:

```bash
# Build and run with Docker Compose
docker-compose up --build -d
```

The container binds to port `3000` with volume persistence mounted to `./data`.

---

## 🔌 REST API Specifications

### Auth Endpoints
- `POST /api/auth/register` — Register new restaurant account (`{ owner_name, email, password, restaurant_name }`).
- `POST /api/auth/login` — Login user (`{ email, password }`).
- `GET /api/auth/me` — Get active authenticated user profile.

### Restaurant Profile
- `PUT /api/restaurant/profile` — Update restaurant details (`{ restaurant_name, phone, address, logo_url, cover_url, slug }`).

### Categories
- `GET /api/categories` — Get user categories.
- `POST /api/categories` — Add new category (`{ name }`).
- `PUT /api/categories/:id` — Update category (`{ name }`).
- `DELETE /api/categories/:id` — Delete category.

### Menu Items
- `GET /api/menu-items` — Get user menu items.
- `POST /api/menu-items` — Create dish (`{ category_id, name, description, price, image_url, is_veg, is_available }`).
- `PUT /api/menu-items/:id` — Update dish.
- `DELETE /api/menu-items/:id` — Delete dish.

### Public Menu & QR Code
- `GET /api/public/menu/:slug` — Retrieve public menu data for customers.
- `GET /api/qr?url=...` — Generate base64 QR code image or download PNG (`format=png`).

---

## 📄 License
Apache-2.0
