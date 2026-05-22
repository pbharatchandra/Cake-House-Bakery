import { Router } from "express";
import { getProducts, updateProduct, createProduct, deleteProduct, getCategories } from "../controllers/products.js";

const productsRouter = Router();

productsRouter.get("/", getProducts as any);
productsRouter.get("/categories", getCategories as any);
productsRouter.post("/", createProduct as any);
productsRouter.patch("/:id", updateProduct as any);
productsRouter.delete("/:id", deleteProduct as any);

export default productsRouter;
