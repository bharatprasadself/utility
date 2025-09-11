import axiosInstance from './axiosConfig';

export interface Blog {
    id: number;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBlogRequest {
    title: string;
    content: string;
}

const blogService = {
    getAll: async (): Promise<{ data: Blog[] }> => {
        const response = await axiosInstance.get<{ data: Blog[] }>('/api/blogs');
        return response.data;
    },

    get: async (id: number): Promise<Blog> => {
        const response = await axiosInstance.get(`/api/blogs/${id}`);
        return response.data;
    },

    create: async (blog: CreateBlogRequest): Promise<Blog> => {
        const response = await axiosInstance.post('/api/blogs', blog);
        return response.data;
    },

    update: async (id: number, blog: CreateBlogRequest): Promise<Blog> => {
        const response = await axiosInstance.put(`/api/blogs/${id}`, blog);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/blogs/${id}`);
    }
};

export default blogService;
