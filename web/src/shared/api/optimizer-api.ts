import axios from 'axios';

import { OptimizationInput, OptimizationResult } from './optimizer.dto';

export const optimize = async (body: OptimizationInput) => {
  try {
    const url = `${process.env.NEXT_PUBLIC_OPTICUT_API_OPTIMIZER_URL}`;

    const response = await axios.post<OptimizationResult>(url, body, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_OPTICUT_API_KEY || '',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};
