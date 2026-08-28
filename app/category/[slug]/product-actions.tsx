"use client";
import type { StoreProduct } from "../../store-data";
import { useStore } from "../../storefront-context";
export function CategoryAddButton({product}:{product:StoreProduct}){const {add}=useStore();return <button onClick={()=>add(product)}>QUICK ADD <span>+</span></button>}

