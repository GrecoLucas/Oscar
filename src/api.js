export const SUPABASE_URL = 'https://osreamejaugextpvahoa.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Qfzjj6a6n2xp_juduupR8A_MNX3-xfu';

// Initialize the Supabase client
export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loginUser(username, password) {
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

    if (error || !data) {
        throw new Error("Usuário ou senha incorretos.");
    }

    // Verify hashed password
    const passwordMatch = await dcodeIO.bcrypt.compare(password, data.password);

    if (!passwordMatch) {
        throw new Error("Usuário ou senha incorretos.");
    }

    return data;
}

export async function registerUser(username, password) {
    // Primeiro verificar se já existe
    const { data: existingUser } = await supabaseClient
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (existingUser) {
        throw new Error("Este usuário já está em uso.");
    }

    // Hash password
    const salt = await dcodeIO.bcrypt.genSalt(10);
    const hashedPassword = await dcodeIO.bcrypt.hash(password, salt);

    // Inserir
    const { data, error } = await supabaseClient
        .from('users')
        .insert([{ username, password: hashedPassword }])
        .select()
        .single();

    if (error) {
        console.error(error);
        throw new Error("Erro ao criar conta. Tente novamente.");
    }

    return data;
}

export async function fetchDashboardData() {
    const [categoriesRes, nomineesRes] = await Promise.all([
        supabaseClient.from('categories').select('*').order('id'),
        supabaseClient.from('nominees').select('*')
    ]);

    if (categoriesRes.error) throw categoriesRes.error;
    if (nomineesRes.error) throw nomineesRes.error;

    return {
        categories: categoriesRes.data,
        nominees: nomineesRes.data
    };
}

export async function fetchUserPredictions(userId) {
    const { data, error } = await supabaseClient
        .from('predictions')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data || [];
}

export async function fetchAllPredictions() {
    const { data, error } = await supabaseClient
        .from('predictions')
        .select(`
            *,
            users ( id, username ),
            nominees ( id, name, movie )
        `);

    if (error) throw error;
    return data || [];
}

export async function savePrediction(userId, categoryId, nomineeId) {
    // Check if prediction for this category already exists
    const { data: existing } = await supabaseClient
        .from('predictions')
        .select('id')
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .maybeSingle();

    if (existing) {
        // Update
        const { data, error } = await supabaseClient
            .from('predictions')
            .update({ nominee_id: nomineeId })
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        // Insert
        const { data, error } = await supabaseClient
            .from('predictions')
            .insert([{ user_id: userId, category_id: categoryId, nominee_id: nomineeId }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

export async function deletePrediction(userId, categoryId) {
    const { error } = await supabaseClient
        .from('predictions')
        .delete()
        .eq('user_id', userId)
        .eq('category_id', categoryId);

    if (error) throw error;
}
