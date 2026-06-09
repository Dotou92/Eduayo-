export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const event = req.body;
    console.log('Webhook FedaPay reçu:', JSON.stringify(event));

    const transaction = event.data?.transaction || event['v1/transaction'] || {};
    const eventName = event.name || '';

    if (eventName === 'transaction.approved' || transaction.status === 'approved') {
      const description = transaction.description || '';
      const amount = transaction.amount;
      const customerEmail = event.data?.customer?.email || transaction.customer?.email;

      if (!customerEmail) {
        console.log('Email client non trouvé dans le webhook');
        return res.status(200).json({ received: true });
      }

      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      };

      if (description.toLowerCase().includes('premium')) {
        // Activer Premium pour 1 mois
        const expireAt = new Date();
        expireAt.setMonth(expireAt.getMonth() + 1);

        await fetch(`${SUPABASE_URL}/rest/v1/profils?email=eq.${encodeURIComponent(customerEmail)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            plan: 'premium',
            premium_expire_at: expireAt.toISOString()
          })
        });

        console.log(`✅ Premium activé pour ${customerEmail}`);

      } else if (description.toLowerCase().includes('cr') ) {
        // Crédits — récupérer d'abord les crédits actuels
        let creditsToAdd = 0;
        if (amount >= 200) creditsToAdd = 12;
        else if (amount >= 100) creditsToAdd = 5;

        if (creditsToAdd > 0) {
          // Récupérer crédits actuels
          const getResp = await fetch(
            `${SUPABASE_URL}/rest/v1/profils?email=eq.${encodeURIComponent(customerEmail)}&select=credits`,
            { headers }
          );
          const profiles = await getResp.json();
          const currentCredits = profiles[0]?.credits || 0;

          // Mettre à jour
          await fetch(`${SUPABASE_URL}/rest/v1/profils?email=eq.${encodeURIComponent(customerEmail)}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ credits: currentCredits + creditsToAdd })
          });

          console.log(`✅ ${creditsToAdd} crédits ajoutés pour ${customerEmail}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch(e) {
    console.error('Webhook error:', e.message);
    res.status(500).json({ error: e.message });
  }
}      if (description.toLowerCase().includes('premium')) {
        // Calculer la date d'expiration (1 mois)
        const expireAt = new Date();
        expireAt.setMonth(expireAt.getMonth() + 1);

        await supabase
          .from('profils')
          .update({
            plan: 'premium',
            premium_expire_at: expireAt.toISOString()
          })
          .eq('email', customerEmail);

        console.log(`✅ Premium activé pour ${customerEmail} jusqu'au ${expireAt.toISOString()}`);

      } else if (description.toLowerCase().includes('crédit') || description.toLowerCase().includes('credit')) {
        // Calculer le nombre de crédits selon le montant
        let creditsToAdd = 0;
        if (amount >= 200) creditsToAdd = 12;
        else if (amount >= 100) creditsToAdd = 5;

        if (creditsToAdd > 0) {
          // Récupérer les crédits actuels
          const { data: profil } = await supabase
            .from('profils')
            .select('credits')
            .eq('email', customerEmail)
            .single();

          const currentCredits = profil?.credits || 0;

          await supabase
            .from('profils')
            .update({ credits: currentCredits + creditsToAdd })
            .eq('email', customerEmail);

          console.log(`✅ ${creditsToAdd} crédits ajoutés pour ${customerEmail}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch(e) {
    console.error('Webhook error:', e.message);
    res.status(500).json({ error: e.message });
  }
      }
