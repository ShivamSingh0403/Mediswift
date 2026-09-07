import { apiClient } from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, Product, Category } from '@/types';

export interface ProductQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  brand?: string;
  prescription_required?: boolean;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  in_stock?: boolean;
  featured?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  sort?: string;
  ordering?: string;
}

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>('/products/', { params });
    return response.data;
  },

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${slug}/`);
    return response.data;
  },

  async getRelatedProducts(slug: string): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(`/products/${slug}/related/`);
    return response.data;
  },

  async getCategories(): Promise<ApiResponse<PaginatedResponse<Category>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Category>>>('/products/categories/');
    return response.data;
  },
};
