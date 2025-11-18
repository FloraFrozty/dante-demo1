import axios from 'axios';
import { URL_CONFIG } from '@/component/const/layout';

export const http = axios.create({
  baseURL: URL_CONFIG.url,
  withCredentials: true,
  timeout: 70000
});