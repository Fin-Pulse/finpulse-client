import { apiService } from './api';

export const leadsService = {
    async submitLead(leadData) {
        try {

            const response = await apiService.submitLead(leadData);
            return response;
        } catch (error) {
            console.error('Error submitting lead:', error);
            throw error;
        }
    }
};