export const getCall = async (callId: string) => {
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_VAPI_PRIVATE_API_KEY}`
        }
    });

    return await response.json();
}; 