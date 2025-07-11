export const API_BASE_URL = "http://localhost:8080/api"

/**
 * A wrapper around fetch() to make calling the API easier.
 * 
 * @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | string} method - HTTP Method
 * @param {string | null} route - API route starting with /
 * @param {object | null} body - Body data object 
 * @param {string | null} authKey - Optional authentication key header
 * @returns {Promise} Result of API fetch request
 * @throws {string} API fetch request error
 */
export async function fetchAPI(method, route, body, authKey) {
    const headers = {
        "Content-Type": "application/json",
    }

    if (authKey) {
        headers["x-auth-key"] = authKey
    }

    try {
        const response = await fetch(API_BASE_URL + route, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        })

        const status = response.status

        const responseBody = await response.json()

        return {
            status,
            body: responseBody
        }
    } catch (error) {
        throw String(error)
    }
}