// memeController.js
export async function getRandomMeme(req, res) {
    const { category } = req.query;
  
    const { data, error } = await supabase
      .from('memes')
      .select('*')
      .eq('category', category)
      .order('random()')
      .limit(1)
      .single();
  
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }
  