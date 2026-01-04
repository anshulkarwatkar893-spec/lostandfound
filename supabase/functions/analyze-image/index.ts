import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed storage hosts for image URLs
const ALLOWED_HOSTS = [
  'jdixsgayrngyyeocqpck.supabase.co',
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);
    // ===== END AUTHENTICATION CHECK =====

    const { imageUrl } = await req.json();
    
    // ===== URL VALIDATION =====
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid image URL provided');
      return new Response(
        JSON.stringify({ error: 'Valid image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format and protocol
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      console.error('Malformed URL:', imageUrl);
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow https
    if (url.protocol !== 'https:') {
      console.error('Non-HTTPS URL rejected:', url.protocol);
      return new Response(
        JSON.stringify({ error: 'Only HTTPS URLs are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whitelist allowed domains (your storage bucket)
    if (!ALLOWED_HOSTS.some(host => url.hostname.endsWith(host))) {
      console.error('URL from non-allowed host:', url.hostname);
      return new Response(
        JSON.stringify({ error: 'Image URL must be from allowed storage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate path contains expected storage pattern (public or signed URLs)
    if (!url.pathname.includes('/storage/v1/object/') || !url.pathname.includes('item-images/')) {
      console.error('Invalid storage path:', url.pathname);
      return new Response(
        JSON.stringify({ error: 'Invalid image storage path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ===== END URL VALIDATION =====

    console.log('Processing image URL:', imageUrl);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Use Gemini to analyze the image and detect objects
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI that analyzes images of lost and found items. 
Your job is to:
1. Identify the main object(s) in the image
2. Provide descriptive labels for the items (like "blue backpack", "iPhone", "glasses", "keys", etc.)
3. Generate a brief, helpful description for a lost & found posting

Respond ONLY with valid JSON in this exact format:
{
  "labels": ["label1", "label2", "label3"],
  "description": "A brief 1-2 sentence description of the item for a lost & found posting"
}

Keep labels simple and searchable (1-3 words each). Include color, brand if visible, type of item.
The description should be helpful for someone trying to identify or find the item.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and identify the item(s) for a campus lost & found portal. Provide labels and a description.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response from the AI
    let result;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback response
      result = {
        labels: ['item'],
        description: 'An item was detected in the image.'
      };
    }

    console.log('Analysis complete for user:', user.id);

    return new Response(
      JSON.stringify({
        labels: result.labels || [],
        description: result.description || '',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while analyzing the image',
        labels: [],
        description: ''
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
