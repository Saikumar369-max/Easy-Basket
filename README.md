# Easy Basket 🛒

Easy Basket is an online grocery shopping platform where users can browse products from nearby shops, add items to their cart, and place orders easily. Shopkeepers can add products with images and manage their inventory.
---
## 🚀 Features

### User Features

* Browse products by category
* View products from different shops
* Add products to cart
* Remove products from cart
* Place orders
* View order details

### Shopkeeper Features

* Add new products
* Upload product images
* Manage product inventory
* Update product details
* Remove products

### System Features

* Image upload using Cloudinary
* Cart management system
* Stock availability check
* Organized product categories
* RESTful APIs

---
## 🛠️ Tech Stack

**Backend**

* Node.js
* Express.js

**Database**

* MongoDB

**Image Storage**

* Cloudinary

**Version Control**

* Git & GitHub

---

## 📁 Project Structure

```
easy-basket
│
├── controllers
├── models
├── routes
├── middleware
├── config
├── uploads
│
├── server.js
├── package.json
└── README.md
```

---

## ⚙️ Installation

Clone the repository

```
git clone https://github.com/your-username/easy-basket.git
```

Go to project directory

```
cd easy-basket
```

Install dependencies

```
npm install
```

Start the server

```
npm start
```

Server will run on:

```
http://localhost:5000
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory and add:

```
PORT=5000
MONGO_URI=your_mongodb_connection
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
---
## 📡 API Endpoints

### Products

| Method | Endpoint      | Description        |
| ------ | ------------- | ------------------ |
| GET    | /products     | Get all products   |
| GET    | /products/:id | Get single product |
| POST   | /products     | Add new product    |
| PUT    | /products/:id | Update product     |
| DELETE | /products/:id | Delete product     |

---

### Cart

| Method | Endpoint     | Description           |
| ------ | ------------ | --------------------- |
| POST   | /cart/add    | Add item to cart      |
| DELETE | /cart/remove | Remove item from cart |
| GET    | /cart        | View cart             |

---

### Orders

| Method | Endpoint     | Description        |
| ------ | ------------ | ------------------ |
| POST   | /order/place | Place order        |
| GET    | /order/:id   | View order details |

---

## ☁️ Deployment

Backend can be deployed using:

* Render
* Railway

Database can be hosted on:

* MongoDB Atlas

Images are stored using:

* Cloudinary

---

## 📌 Future Improvements

* Payment integration
* Real-time order tracking
* Microservices architecture
* Mobile app support
---
## 👨‍💻 Author

Developed by **Sai**

---

## 📄 License

This project is for educational purposes.
