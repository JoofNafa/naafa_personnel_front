import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const API_BASE_URL = 'http://127.0.0.1:8000/api';
// export const STORAGE_BASE_URL = 'http://192.168.2.76:8000/storage';
export const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    // 'Content-Type': 'application/json',
    'Content-Type': 'multipart/form-data',
    Accept: 'application/json',
  },
});

// 🔐 Intercepteur de requête — injection du token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ❌ Intercepteur de réponse — gestion des erreurs
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Si le token est expiré ou invalide (401)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Rediriger vers la page de connexion seulement si on n'y est pas déjà
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Gestion des autres erreurs
    if (error.response?.status === 403) {
      console.error('Accès refusé - Permissions insuffisantes');
    }

    if (error.response?.status === 404) {
      console.error('Ressource non trouvée');
    }

    if (error.response?.status >= 500) {
      console.error('Erreur serveur');
    }

    return Promise.reject(error);
  }
);

// 📦 Méthodes HTTP avec gestion d'erreurs
const getData = async (url: string, params?: object) => {
  try {
    return await api.get(url, { params });
  } catch (error) {
    console.error(`Erreur GET ${url}:`, error);
    throw error;
  }
};

const postData = async (url: string, data?: object) => {
  try {
    return await api.post(url, data);
  } catch (error) {
    console.error(`Erreur POST ${url}:`, error);
    throw error;
  }
};

const putData = async (url: string, data?: object) => {
  try {
    console.log('URL:', url);
    console.log('Data avant envoi:', data);
    console.log('Data stringifié:', JSON.stringify(data));

    return await api.put(url, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(`Erreur PUT ${url}:`, error);
    throw error;
  }
};

const patchData = async (url: string, data?: object) => {
  try {
    return await api.patch(url, data);
  } catch (error) {
    console.error(`Erreur PATCH ${url}:`, error);
    throw error;
  }
};

const deleteData = async (url: string) => {
  try {
    return await api.delete(url);
  } catch (error) {
    console.error(`Erreur DELETE ${url}:`, error);
    throw error;
  }
};

// 🔑 Endpoints API
const ENDPOINTS = {
  login: '/login',
  changePassword: '/update-password',
  logout: '/logout',
  user: '/me',
  // ADMIN ROUTES
  departments: '/departments',


};

// 🛠️ Fonctions utilitaires pour les API calls
const authAPI = {
  login: (credentials: { login: string; password: string }) =>
    postData(ENDPOINTS.login, credentials),
    changePassword: (credentials: { password: string }) =>
    postData(ENDPOINTS.changePassword, credentials),
  logout: () => postData(ENDPOINTS.logout),
  getCurrentUser: () => getData(ENDPOINTS.user),
};

const managerAPI = {
  getAllDepartment: () => getData(ENDPOINTS.departments),
  getById: (id: number) => getData(`${ENDPOINTS.departments}/${id}`),
  addNewEmployee: (data: object) => postData('/users', data),
  employeeList: (page = 1, perPage = 6) => getData(`/users?page=${page}&per_page=${perPage}`),
  employeePermissions: () => getData(`/permissions`),
  approvePermission: (id: number) => postData(`/permissions/${id}/approve`),
  rejectPermission: (id: number) => postData(`/permissions/${id}/reject`),
  employeeShifts: () => getData(`/shifts`),
  update: (id: number, data: object) => putData(`${ENDPOINTS.departments}/${id}`, data),
  delete: (id: number) => deleteData(`${ENDPOINTS.departments}/${id}`),
  getAttendanceSummary: (params?: { period?: string; date?: string; page?: number; per_page?: number }) => {
    let query = '?';
    if (params?.period) query += `period=${params.period}&`;
    if (params?.date) query += `date=${params.date}&`;
    if (params?.page) query += `page=${params.page}&`;
    if (params?.per_page) query += `per_page=${params.per_page}&`;
    return getData(`/attendances/summary${query}`);
  },

  getRequestedLeaves: (page: number = 1, per_page: number = 5) => {
    return getData(`/leaves?page=${page}&per_page=${per_page}`);
  },

  approveLeave: (id: number) => postData(`/leaves/${id}/approve`),
  rejectLeave: (id: number) => postData(`/leaves/${id}/reject`),

  fillAllAttendances: (data: object) => postData('/attendances/auto-fill', data),
  employeeListForDayOff: () => getData(`/user-for-day-offs`),
  addNewDayOff: (data: object) => postData('/weekly-day-offs', data),
  getEmployeeDayOff: () => getData(`/weekly-day-offs`),
  deleteEmployeeDayOff: (id: number) => deleteData(`/weekly-day-offs/${id}}`),

  getAllUsersMonthlyStats: (month?: string) => {
    let query = '';
    if (month) query = `?month=${month}`;
    return getData(`/monthly-stats${query}`);
  },

  getMonthlyAttendanceSummary: (month?: string) => {
    let query = '';
    if (month) query = `?month=${month}`;
    return getData(`/monthly-attendance-summary${query}`);
  },

  todaySituation: () => getData(`/todaySituation`),
  getShift: () => getData(`/shifts`),
  newShift:(data: object) => postData('/shifts', data),
  updateShift: (id: number, data: object) => putData(`/shifts/${id}`, data),
  deleteShift: (id: number) => deleteData(`/shifts/${id}`),
};

const employeeAPI = {
  getMyAttendanceSummary: (params?: { period?: string; date?: string; page?: number; per_page?: number }) => {
    let query = '?';
    if (params?.period) query += `period=${params.period}&`;
    if (params?.date) query += `date=${params.date}&`;
    if (params?.page) query += `page=${params.page}&`;
    if (params?.per_page) query += `per_page=${params.per_page}&`;
    return getData(`/attendances/my-summary${query}`);
  },
  requestLeave: (data: object) => postData('/request-leaves', data),
  myLeave: () => getData(`/leaves/me`),
  requestPermission: (data: object) => postData('/permissions', data),
  getMyPermissions: (month?: string) => {
    let query = '';
    if (month) query = `?month=${month}`;
    return getData(`/my-permissions${query}`);
  },

};





export {
  api,
  getData,
  postData,
  putData,
  patchData,
  deleteData,
  ENDPOINTS,
  API_BASE_URL,
  authAPI,
  managerAPI,
  employeeAPI,



};