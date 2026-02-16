Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('OPENAI_API_KEY');
        console.log('API Key exists:', !!apiKey);
        console.log('API Key starts with gsk_:', apiKey?.startsWith('gsk_'));

        const body = await req.json();
        console.log('Request body:', body);

        return new Response(
            JSON.stringify({
                message: 'Test successful',
                hasApiKey: !!apiKey,
                isGroq: apiKey?.startsWith('gsk_'),
                receivedQuestion: body.question
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
