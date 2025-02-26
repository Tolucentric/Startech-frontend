import { createContext, useState, useEffect, useContext } from "react";
const EcomContext = createContext();
import useAlert from "../hooks/useAlert";
import AuthContext from "./AuthContext"

export const EcomProvider = ({ children }) => {
    const [product, setProduct] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [cartCount, setCartCount] = useState(0)
    const { alertInfo, showAndHide } = useAlert()
    const [state, dispatch] = useContext(AuthContext)
    const [order, setOrder] = useState(null)

    const isAuthenticated = state.accessToken !== null;

    useEffect(() => {
        fetchProduct();
        fetchCart();
    }, []);

    useEffect(() => {
        const count = cartItems.products?.reduce(
            (total, item) => total + item.quantity,
            0
        );

        let countItem = count ? count : 0

        setCartCount(countItem)
    }, [cartItems]);

    const fetchProduct = async () => {
        const res = await fetch("http://localhost:8000/api/product");
        const data = await res.json();
        setProduct(data)
    }

    const fetchCart = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/cart", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": `${localStorage.getItem("auth-token")}`,
                },
            });

            const data = await res.json();
            setCartItems(data);
        } catch (error) {
            console.log(error);
        }
    };


    const featured = product.filter((item) => item.featured === true)
    const topSelling = product.filter((item) => item.topSelling === true)


    const addToCart = async (productId) => {
        try {
            const res = await fetch("http://localhost:8000/api/add-to-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": `${localStorage.getItem("auth-token")}`
                },
                body: JSON.stringify({ productId, quantity: 1 })
            })

            const data = await res.json()
        
            setCartItems(data);
            showAndHide("success", "item added to cart")
        } catch (error) {
            console.log(error);
        }

        // const existingItemIndex = cartItems.findIndex((item)=> item._id === product._id);

        // if (existingItemIndex !== -1) {
        //     const updatedCart = [...cartItems]
        //     const itemToUpdate = updatedCart[existingItemIndex]
        //     itemToUpdate.quantity += product.quantity;
        //     itemToUpdate.amount = itemToUpdate.price * itemToUpdate.quantity;
        //     showAndHide("success", product.name +  "quantity updated")
        // }else {
        //     setCartItems([
        //         ...cartItems, {...product, amount: product.price * product.quantity}
        //     ]);
        //     showAndHide("success", "item added to cart")
        // }

    }
    const updateQuantity = async (productId, quantity) => {
        if (!quantity > 0) {
            showAndHide("error", "quantity cannot be less than 1")
            return;
        }
        try {
            const res = await fetch("http://localhost:8000/api/update-quantity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": `${localStorage.getItem("auth-token")}`,
                },
                body: JSON.stringify({ productId, quantity }),
            });
            if (res.ok) {
                const existingItemIndex = cartItems.products?.findIndex(
                    (item) => item.product._id === productId
                );
                const updatedCart = [...cartItems.products];
                const itemToUpdate = updatedCart[existingItemIndex];
                itemToUpdate.quantity = parseInt(quantity);
                itemToUpdate.amount = itemToUpdate.product.price * itemToUpdate.quantity;
            setCartItems({ ...cartItems, products: updatedCart });
            }
        } catch (error) {
            console.log(error);
        }
    };

    const totalAmount = () => {
        return cartItems.products?.reduce((acc, cur) => acc + cur.amount, 0)
    }
    const deleteItem = async (productId) => {
        try {
            const res = await fetch("http://localhost:8000/api/remove-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": `${localStorage.getItem("auth-token")}`,
                },
                body: JSON.stringify({ productId }),
            });
            const data = await res.json();
            if (res.ok) {
                showAndHide("success", "item has been removed");
                setCartItems(data);
            }else {
                console.error(data.msg || "failed to remove item")
            }
        } catch (error) {
            console.log(error);
        }
    };

    const createOrder = async(transaction_id, orderId)=>{
        try {
            const response = await fetch("http://localhost:8000/api/payment/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": `${localStorage.getItem("auth-token")}`
                },
                body: JSON.stringify({transaction_id, orderId}),
                credentials: "include"
            })

            const data = await response.json()
            if (response.ok) {
                setOrder(data.order)
                setCartItems([])
            } else {
                console.error(data.msg);
            }
        } catch (error) {
            console.log(error);
        }
    }



    return (
        <EcomContext.Provider value={{
            product,
            featured,
            topSelling,
            addToCart,
            showAndHide,
            alertInfo,
            cartItems,
            updateQuantity,
            totalAmount,
            deleteItem,
            createOrder,
            isAuthenticated,
            cartCount
        }}
        >
            {children}
        </EcomContext.Provider>
    );

}

export default EcomContext