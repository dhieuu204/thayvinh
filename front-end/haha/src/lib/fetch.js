import { API_URL } from "./api";

/**
 * fetchModel - GET request to the API.
 * @param {string} url - Relative API path (e.g. "/products")
 * @returns {Promise<any>} Parsed JSON or null on error
 */
function fetchModel(url) {
  return fetch(API_URL + url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("fetchModel error:", error.message);
      return null;
    });
}

export default fetchModel;
