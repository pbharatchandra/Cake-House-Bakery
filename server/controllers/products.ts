import { Request, Response } from "express";
import { db } from "../lib/db.js";

export const getProducts = async (req: Request, res: Response) => {
  try {
    let products = await db.product.findMany({
      include: {
        category: true,
      },
    });

    res.json({ products });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const defaultCategories = ['Offers', 'Drinks', 'Snacks', 'Regular Cakes', 'Special Cakes'];
    
    // Rename existing old categories if they exist
    const generalCat = await db.category.findUnique({ where: { name: 'General' } });
    if (generalCat) {
      await db.category.update({ where: { id: generalCat.id }, data: { name: 'Offers', description: 'Offers' } });
    }
    
    const breadsCat = await db.category.findUnique({ where: { name: 'Our Breads' } });
    if (breadsCat) {
      await db.category.update({ where: { id: breadsCat.id }, data: { name: 'Drinks', description: 'Drinks' } });
    }
    
    const pastriesCat = await db.category.findUnique({ where: { name: 'Pastries and Custom Cakes' } });
    if (pastriesCat) {
      await db.category.update({ where: { id: pastriesCat.id }, data: { name: 'Snacks', description: 'Snacks' } });
    }

    for (const name of defaultCategories) {
      const existing = await db.category.findUnique({ where: { name } });
      if (!existing) {
        await db.category.create({ data: { name, description: name } });
      }
    }

    const categories = await db.category.findMany();
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stockLevel, categoryId, image, isCustomizable } = req.body;
    
    let targetCategoryId = categoryId;
    if (!targetCategoryId) {
      const firstCategory = await db.category.findFirst();
      if (firstCategory) {
        targetCategoryId = firstCategory.id;
      } else {
        const newCat = await db.category.create({ data: { name: 'Offers', description: 'Offers' }});
        targetCategoryId = newCat.id;
      }
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        price: parseFloat(price) || 0,
        stockLevel: parseInt(stockLevel) || 0,
        categoryId: targetCategoryId,
        image: image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        isCustomizable: isCustomizable || false,
      },
      include: {
        category: true,
      }
    });

    res.json({ product });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await db.product.delete({
      where: { id },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { price, stockLevel, isCustomizable } = req.body;
    
    const updateData: any = {};
    if (price !== undefined) updateData.price = price;
    if (stockLevel !== undefined) updateData.stockLevel = stockLevel;
    if (isCustomizable !== undefined) updateData.isCustomizable = isCustomizable;

    const product = await db.product.update({
      where: { id },
      data: updateData,
    });

    res.json({ product });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
