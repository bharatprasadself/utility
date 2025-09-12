import axiosInstance from './axiosConfig';

export interface Blog {
    id: number;
    title: string;
    content: string;
    author: string;
    publishDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBlogRequest {
    title: string;
    content: string;
}

export interface BlogError {
    message: string;
    status?: number;
}

const blogService = {
    getAll: async (): Promise<Blog[]> => {
        try {
            console.log('Fetching blogs...');
            const response = await axiosInstance.get('/api/blogs');
            console.log('Blogs response:', response);

            // Check if response has data
            if (!response.data) {
                console.error('No data in response');
                throw new Error('No data received from server');
            }

            // If response contains an error message
            if (response.data.message) {
                console.error('Server error:', response.data.message);
                throw new Error(response.data.message);
            }

            // Validate the response is an array
            if (!Array.isArray(response.data)) {
                console.error('Invalid response format:', response.data);
                throw new Error('Invalid data format received from server');
            }

            // Validate each blog object
            const blogs = response.data.map(blog => {
                if (!blog.id || !blog.title || !blog.content) {
                    console.warn('Invalid blog data:', blog);
                }
                return {
                    id: blog.id,
                    title: blog.title || 'Untitled',
                    content: blog.content || 'No content',
                    author: blog.author || 'Unknown',
                    publishDate: blog.publishDate || new Date().toISOString(),
                    createdAt: blog.createdAt || new Date().toISOString(),
                    updatedAt: blog.updatedAt || new Date().toISOString()
                };
            });

            return blogs;
        } catch (error: any) {
            console.error('Error fetching blogs:', error);
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error('Failed to fetch blogs. Please try again later.');
            }
        }
    },

    get: async (id: number): Promise<Blog> => {
        try {
            const response = await axiosInstance.get<Blog>(`/api/blogs/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching blog:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch blog');
        }
    },

    create: async (blog: CreateBlogRequest): Promise<Blog> => {
        try {
            console.log('Creating blog:', blog);
            const response = await axiosInstance.post<Blog>('/api/blogs', blog);
            console.log('Blog created:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error creating blog:', error);
            console.error('Response:', error.response);
            throw new Error(error.response?.data?.message || 'Failed to create blog');
        }
    },

    update: async (id: number, blog: CreateBlogRequest): Promise<Blog> => {
        try {
            const response = await axiosInstance.put<Blog>(`/api/blogs/${id}`, blog);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 403) {
                throw new Error('You can only edit your own blogs');
            }
            throw new Error(error.response?.data?.message || 'Failed to update blog');
        }
    },

    delete: async (id: number): Promise<void> => {
        try {
            await axiosInstance.delete(`/api/blogs/${id}`);
        } catch (error: any) {
            if (error.response?.status === 403) {
                throw new Error('You can only delete your own blogs');
            }
            throw new Error(error.response?.data?.message || 'Failed to delete blog');
        }
    }
};

export default blogService;
