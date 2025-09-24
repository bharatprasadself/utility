import type { AxiosResponse } from 'axios';
import api from './axiosConfig';
import publicApi from './publicApi';
import type { Article } from '@/types/Article';
import { ArticleCategory } from '@/types/Article';

const BASE_URL = '/api/articles';

export const ArticleService = {
  getAllArticles: async (): Promise<AxiosResponse<Article[]>> => {
    console.log('🔍 Fetching all articles...');
    try {
      const response = await publicApi.get(BASE_URL);
      console.log(`✅ Successfully fetched ${response.data.length} articles`);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch articles:', error);
      throw error;
    }
  },

  getArticleById: async (id: string): Promise<AxiosResponse<Article>> => {
    console.log(`🔍 Fetching article with ID: ${id}`);
    try {
      const response = await publicApi.get(`${BASE_URL}/${id}`);
      console.log(`✅ Successfully fetched article: "${response.data.title}"`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to fetch article with ID ${id}:`, error);
      throw error;
    }
  },

  getArticlesByCategory: async (category: ArticleCategory): Promise<AxiosResponse<Article[]>> => {
    // If category = ArticleCategory.SPRING_BOOT ("SPRING_BOOT")
    const key = Object.keys(ArticleCategory).find(
      k => ArticleCategory[k as keyof typeof ArticleCategory] === category
    );
    // key will be "SPRING_BOOT"
    const url = `${BASE_URL}/category/${key}`;
    console.log(`🔍 Fetching articles from: ${url}`);
    try {
      const response = await publicApi.get(url);
      console.log(`✅ Successfully fetched ${response.data.length} articles from ${url}`);
      return response;
    } catch (error: any) {
      console.error(`❌ Failed to fetch articles from ${url}:`, error);
      console.log('Response status:', error?.response?.status);
      console.log('Response data:', error?.response?.data);
      throw error;
    }
  },

  getArticlesByTag: async (tag: string): Promise<AxiosResponse<Article[]>> => {
    console.log(`🔍 Fetching articles with tag: ${tag}`);
    try {
      const response = await api.get(`${BASE_URL}/tag/${tag}`);
      console.log(`✅ Successfully fetched ${response.data.length} articles with tag ${tag}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to fetch articles with tag ${tag}:`, error);
      throw error;
    }
  },

  createArticle: async (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse<Article>> => {
    console.log('📝 Creating new article:', { title: article.title, category: article.category });
    try {
      const response = await api.post(BASE_URL, article);
      console.log(`✅ Successfully created article: "${response.data.title}"`);
      return response;
    } catch (error) {
      console.error('❌ Failed to create article:', error);
      throw error;
    }
  },

  updateArticle: async (id: string, article: Partial<Article>): Promise<AxiosResponse<Article>> => {
    console.log(`📝 Updating article with ID ${id}:`, article);
    try {
      const response = await api.put(`${BASE_URL}/${id}`, article);
      console.log(`✅ Successfully updated article: "${response.data.title}"`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to update article with ID ${id}:`, error);
      throw error;
    }
  },

  deleteArticle: async (id: string): Promise<AxiosResponse<void>> => {
    console.log(`🗑️ Deleting article with ID: ${id}`);
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      console.log(`✅ Successfully deleted article with ID ${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to delete article with ID ${id}:`, error);
      throw error;
    }
  }
};