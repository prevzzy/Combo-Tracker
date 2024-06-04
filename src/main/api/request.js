import { net } from 'electron';
import { getApiLink, getBearer, setupAuth } from './auth';

/**
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {string} endpoint - The endpoint URL (e.g., '/api/endpoint').
 * @param {Object} [headers={}] - Optional headers for the request.
 * @param {any} [payload] - Optional payload for the request.
 */

export async function makeRequest(method, endpoint, headers = {}, payload = null) {
  if (!getBearer()) {
    await setupAuth(netFetch)
  }

  return netFetch(method, endpoint, headers, payload)
}

async function netFetch(method, endpoint, headers = {}, payload = null) {
  return new Promise((resolve, reject) => {
    const bearer = getBearer();
    const request = net.request({
      method: method,
      protocol: 'https:',
      hostname: getApiLink(),
      path: endpoint,
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { 'Authorization': `Bearer ${getBearer()}` } : undefined),
        ...headers
      },
    });

    request.on('response', (response) => {
      let responseData = '';

      response.on('data', (chunk) => {
        responseData += chunk;
      });

      response.on('end', () => {
        const result = {
          statusCode: response.statusCode,
          headers: response.headers,
          body: responseData
        };

        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(result);
        } else {
          reject(new Error(`Request failed with status code ${response.statusCode} ${result ? JSON.stringify(result) : ''}`));
        }
      });
    });

    request.on('error', (error) => {
      console.error(`Request error: ${error}`);
      reject(error);
    });

    request.end(payload ? JSON.stringify(payload) : undefined);
  });
}

