
export const formatBackendError = (error, fallback = 'An error occurred. Please try again.') => {
    if (!error) return null;
    
    if (typeof error === 'string') return error;

    if (error.detail) {
        return typeof error.detail === 'string' ? error.detail : error.detail[0] || fallback;
    }
    if (error.error) {
        return typeof error.error === 'string' ? error.error : error.error[0] || fallback;
    }
    if (error.non_field_errors) {
        return Array.isArray(error.non_field_errors) ? error.non_field_errors[0] : error.non_field_errors;
    }
    if (error.message) {
        return typeof error.message === 'string' ? error.message : fallback;
    }

    if (typeof error === 'object') {
        const keys = Object.keys(error);
        if (keys.length > 0) {
            const firstKey = keys[0];
            const firstError = error[firstKey];
            
            const formattedKey = firstKey
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            if (Array.isArray(firstError) && firstError.length > 0) {
                return `${formattedKey}: ${firstError[0]}`;
            } else if (typeof firstError === 'string') {
                return `${formattedKey}: ${firstError}`;
            }
        }
    }

    return fallback;
};