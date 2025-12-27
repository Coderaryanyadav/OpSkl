import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, action } = req.body;

    if (!userId || !action) {
        return res.status(400).json({ error: 'Missing userId or action' });
    }

    // Initialize Supabase with Service Role Key for Admin privileges
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing Admin Key' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        let updateData = {};
        if (action === 'verify') {
            updateData = { verification_status: 'verified', trust_score: 100 };
        } else if (action === 'reject') {
            updateData = { verification_status: 'rejected' };
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select();

        if (error) throw error;

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Admin Action Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
