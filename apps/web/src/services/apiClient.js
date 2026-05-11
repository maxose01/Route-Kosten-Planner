const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
export const calculateRoute = async (payload) => {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/api/routes/calculate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    }
    catch (error) {
        if (error instanceof TypeError) {
            throw new Error(`Kan geen verbinding maken met de API (${API_BASE_URL}). Start de backend met 'npm run dev:api'.`);
        }
        throw error;
    }
    if (!response.ok) {
        const errorData = (await response.json().catch(() => null));
        throw new Error(errorData?.error?.message ?? "Routeberekening mislukt.");
    }
    return (await response.json());
};
