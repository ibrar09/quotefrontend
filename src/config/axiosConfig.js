import axios from 'axios';

// Maximum number of retries
const MAX_RETRIES = 3;

// Axios Response Interceptor
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const { config, response } = error;

        // Check if it's a 429 error and we haven't hit max retries
        if (response && response.status === 429) {
            config.__retryCount = config.__retryCount || 0;

            if (config.__retryCount < MAX_RETRIES) {
                config.__retryCount += 1;

                // Calculate delay with exponential backoff (1s, 2s, 4s...)
                const backoffDelay = (Math.pow(2, config.__retryCount) * 1000) + Math.random() * 1000;

                console.warn(`[Axios] 429 Too Many Requests detected. Retrying request... Attempt ${config.__retryCount}/${MAX_RETRIES} in ${backoffDelay.toFixed(0)}ms`);

                // Wait for the delay
                await new Promise(resolve => setTimeout(resolve, backoffDelay));

                // Retry the request
                return axios(config);
            }
        }

        return Promise.reject(error);
    }
);

console.log('✅ Global Axios 429 Retry Interceptor Configured');
