import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants';

export const socket = io(API_BASE_URL, {
  // withCredentials: true,
  autoConnect: false,
  auth: cb => {
    cb({
      token: localStorage.getItem('token'),
    });
  },
});
