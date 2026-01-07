import axios from 'axios';
import { integrationConfig } from '../../config/integration';

export const apiClient = axios.create({
  baseURL: integrationConfig.apiBaseUrl,
});
