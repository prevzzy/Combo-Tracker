import { makeRequest } from './request'

export function getLatestUpdate() {
  return makeRequest('GET', 'version');
}
