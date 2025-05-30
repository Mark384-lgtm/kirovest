import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://kirovest.org/api";
export const TOKEN_KEY = "auth_token";
export const ROLE_KEY = "user_role";

export interface LoginResponse {
    success: boolean;
    data?: {
        token: string;
        role_name: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    };
    message: string;
}

export interface ApiError {
    success: false;
    message: string;
}

export const getStoredToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        console.log("Retrieved token:", token ? "exists" : "null");
        return token;
    } catch (error) {
        console.error("Error getting stored token:", error);
        return null;
    }
};

export const clearAuthData = async () => {
    try {
        console.log("بدأنا")
        await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
        console.log("Successfully cleared auth data");
    } catch (error) {
        console.log('انتهينا')
        console.error("Error clearing auth data:", error);
        throw error;
    }
};

class ApiService {
    private static instance: ApiService;

    private constructor() {}

    static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const data = await response.json();
        if (!response.ok) {
            throw data as ApiError;
        }
        return data as T;
    }

    async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
        try {
            console.log("Attempting login for:", emailOrUsername);
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    email_or_username: emailOrUsername, 
                    password 
                }),
            });

            const data = await this.handleResponse<LoginResponse>(response);
            console.log("Login response received:", data.success);

            return data;
        } catch (error) {
            console.error("Login error:", error);
            if ((error as ApiError).message) {
                throw error;
            }
            throw {
                success: false,
                message: "Connection error with the server",
            } as ApiError;
        }
    }

    async getUserData(): Promise<any> {
        try {
            const token = await getStoredToken();
            if (!token) {
                throw {
                    success: false,
                    message: "User is not authenticated",
                } as ApiError;
            }

            const response = await fetch(`${BASE_URL}/user/data`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            return await this.handleResponse(response);
        } catch (error) {
            if ((error as ApiError).message) {
                throw error;
            }
            throw {
                success: false,
                message: "Failed to fetch user data",
            } as ApiError;
        }
    }
}

export default ApiService;
