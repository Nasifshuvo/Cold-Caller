export const createOutboundCall = async (customerPhoneNumber: string) => {
    const response = await fetch("https://api.vapi.ai/call", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_VAPI_PRIVATE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: "US Foreclosure Solution",
            assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
            phoneNumberId: process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID,
            customer: {
                number: customerPhoneNumber.startsWith('+') ? customerPhoneNumber : `+${customerPhoneNumber}`
            },
            assistant: {},
            assistantOverrides: {}
        }),
    });

    return await response.json();
};